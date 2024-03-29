const { Router } = require('express');
const { cartsService, ordersService, productsService } = require('../repositories/index.js');
const { passportCall } = require('../auth/passport.config.js');
const { authorizationMiddleware } = require('../auth/authMiddleware.js');
const { generateOrderCode } = require('../helpers/generateCode.js');
const { generateAddCartErrorInfo } = require('../services/errors/info.js');
const { productsModel } = require('../dao/mongo/models/products.model.js');

const router = Router();

router.post('/', async (req, res) => {
    try {
        let carts = req.body;
        const result = await cartsService.create(carts);
        res.send(result);
    } catch (error) {
        console.error('Error al intentar crear el carrito:', error);
        res.status(500).send({ success: false, error: 'Error al crear el carrito' });
    }
})

router.post('/:cartId/products/:productId', async (req, res) => {
    try {
        let productId = req.params.productId;
        let cartId = req.params.cartId;
        let newQuantity = req.body.quantity;

        let existingCartItem = await cartsService.findCartItem(cartId, productId, newQuantity);

        if (existingCartItem) {
            let updatedCartItem = await cartsService.updateProductInCart(productId, cartId, newQuantity);
            res.status(200).json({ message: 'Cantidad del producto actualizada en el carrito' });
        } else {
            let addedCartItem = await cartsService.addCart(cartId, productId, newQuantity);
            res.status(201).json({ message: 'Producto agregado al carrito correctamente' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:cartId/purchase', async (req, res) => {
    
    const cartId = req.params.cartId;
    
    try {
        const cart = await cartsService.getById(cartId);
        console.log(cart)

        const productsNotProcessed = [];
        const orderDetails = [];
        let orderTotalAmount = 0;
        
        for (const product of cart.products) {
            const productData = await productsService.getById(product.productId);

            if (productData && productData.stock >= product.quantity) {
                productData.stock -= product.quantity;

                const productAmount = product.quantity * productData.price;
                orderTotalAmount += productAmount;

                orderDetails.push({
                    productId: product.productId,
                    title: productData.title,
                    quantity: product.quantity,
                    amount: productAmount,
                });

                await productData.save();
            } else {
                productsNotProcessed.push(product.productId);
            }
        }

        if (orderDetails.length > 0) {
            const orderCode = generateOrderCode();

            const order = await ordersService.createOrder({
                cartId: cartId,
                cart: cart,
                details: orderDetails,
                amount: orderTotalAmount,
                code: orderCode,
            });

            await order.save();
        }

        cart.products = cart.products.filter(product => !productsNotProcessed.includes(product.productId));
        await cart.save();

        res.send({ success: true, productsNotProcessed, orderDetails });
    } catch (error) {
        console.error('Error al procesar la compra:', error);
        res.status(500).send({ success: false, error: 'Error al procesar la compra' });
    }
});

router.get('/info/:cartId', async (req, res) => {
    try {
        const cartId = req.params.cartId;
        const cart = await cartsService.getById(cartId);
        
        if (!cart) {
            return res.status(404).json({ error: 'El carrito no fue encontrado' });
        }

        const productIds = cart.products.map(product => product.productId);

        const requestedProducts = await productsModel.find({ _id: { $in: productIds } });

        res.json(requestedProducts);
    } catch (error) {
        console.error('Error al obtener información de productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/view/:cartId', async (req, res) => {
    try {
        const id = req.params.cartId;
        let cartsData = await cartsService.getById(id)
        res.render('viewCarts', { cartsData })
    } catch (error) {
        console.error('Error al traer el carrito por ID:', error);
        res.status(500).send({ success: false, error: 'Error al traer el carrito' });
    }
});

router.get('/:cid', async (req, res) => {
    try {
        let { cid } = req.params;
        res.send(await cartsService.getById(cid));
    } catch (error) {
        console.error('Error al traer el carrito por ID:', error);
        res.status(500).send({ success: false, error: 'Error al procesar la compra' });
    }
});

router.put('/:cartId', passportCall('jwt'), authorizationMiddleware(['user', 'premium']), async (req, res) => {
    try {
        let cartId = req.params.cartId;
        let newProduct = req.body;
        const result = await cartsService.addCart(cartId, newProduct);

        if (result.error) {
            const errorInfo = generateAddCartErrorInfo(result.error);
            return res.status(400).json({ error: errorInfo });
        }

        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.put('/:cid/products/:pid', async (req, res) => {
    try {
        let prodId = req.params.pid;
        let cartId = req.params.cid;
        let newQuantity = req.body;
        res.send(await cartsService.updateProductInCart(prodId, cartId, newQuantity));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.delete('/:cartId/products/:productId', async (req, res) => {
    try {
        let cartId = req.params.cartId;
        let productId = req.params.productId;
        await cartsService.deleteProduct(productId, cartId)
        res.send('Eliminado');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.delete('/:cid', async (req, res) => {
    try {
        let cartId = req.params.cid;
        res.send(await cartsService.deleteAllProducts(cartId));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router