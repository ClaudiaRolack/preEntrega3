const { cartsModel } = require('./models/carts.model.js');

class CartsMongo {

    create = async (carts) => {
        try {
            let newCart = await cartsModel(carts);
            const savedCart = await newCart.save();
            return savedCart;
        } catch (error) {
            console.log(error)
            return null
        }
    }

    addCart = async (cartId, productId, quantity) => {
        try {
            const newCartItem = new cartsModel({
                cart: cartId,
                product: productId,
                quantity: quantity
            });
            await newCartItem.save();
            return newCartItem;
        } catch (error) {
            console.error('Error al agregar el producto al carrito:', error);
            throw new Error('Error al agregar el producto al carrito');
        }
    }

    get = async () => {
        try {
            let cartsData = await cartsModel.find();
            return cartsData;
        } catch (error) {
            console.log(error)
            return null
        }
    }

    findCartItem = async (cartId, productId) => {
        try {
            const cartItem = await cartsModel.findOne({ cart: cartId, product: productId });
            return cartItem;
        } catch (error) {
            console.error('Error al buscar el elemento del carrito:', error);
            throw new Error('Error al buscar el elemento del carrito');
        }
    }

    getById = async (id) => {
        try {
            let cid = id;
            let cartsById = await cartsModel.findById(cid);
            if (!cartsById) {
                return 'El ID no existe';
            } else {
                return cartsById;
            }
        } catch (error) {
            console.log(error)
            return null
        }
    }

    updateProductInCart = async (productId, cartId, newQuantity) => {
        try {
            const cartItem = await cartsModel.findOneAndUpdate(
                { cart: cartId, product: productId },
                { quantity: newQuantity },
                { new: true }
            );
            return cartItem;
        } catch (error) {
            console.error('Error al actualizar la cantidad del producto en el carrito:', error);
            throw new Error('Error al actualizar la cantidad del producto en el carrito');
        }
    }

    deleteProduct = async (prodId, cartId) => {
        try {
            const carts = await cartsModel.findById(cartId);
            if (!carts) { return 'Carrito no encontrado' };
            const updateCart = carts.products.filter(product => product._id != prodId);
            carts.products = updateCart;
            await carts.save();
            return 'Producto eliminado exitosamente';
        } catch (error) {
            console.log(error)
            return null
        }
    }

    deleteAllProducts = async (cartId) => {
        try {
            const carts = await cartsModel.findById(cartId);
            if (!carts) { return 'Carrito no encontrado' };
            carts.products = [];
            await carts.save();
            return 'Todos los productos han sido eliminados del carrito';
        } catch (error) {
            console.log(error)
            return null
        }
    }

}

module.exports = { CartsMongo }