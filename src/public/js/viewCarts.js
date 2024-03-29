//Vista carrito
let cartProducts;

document.addEventListener('DOMContentLoaded', function () {
    const url = window.location.href;
    const parts = url.split('/');
    const cartId = parts[parts.length - 1];

    fetch(`/api/carts/${cartId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('No se puede obtener la información del carrito');
            }

            return response.json();
        })
        .then(cartData => {
            const cartItemsContainer = document.querySelector('.cart-items');
            cartProducts = cartData.products;
            cartData.products.forEach(cart => {
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');

                const cartItemInfo = document.createElement('div');
                cartItemInfo.classList.add('cart-item-info');

                const quantity = document.createElement('p');
                quantity.textContent = `Cantidad: ${cart.quantity}`;

                const removeButton = document.createElement('button');
                removeButton.classList.add('remove-item');
                removeButton.textContent = 'Eliminar';
            });

            fetch(`/api/carts/info/${cartId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('No se pueden obtener los detalles de los productos');
                    }
                    return response.json();
                })
                .then(productData => {

                    productData.forEach(product => {
                        cartProducts.forEach(data => {
                            if (product._id === data.productId) {
                                product.quantity = data.quantity
                            }
                        })
                    });

                    const productsTableBody = document.querySelector('tbody');
                    productData.forEach(product => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                    <td>${product.title}</td>
                    <td>${product.price * product.quantity}</td>
                    <td>${product.quantity}</td>
                    <td><button id="${product._id}" data-cart-id="${cartId}" data-product-id="${product._id}" class="remove-item">Eliminar</button></td>
                `
                        productsTableBody.appendChild(row);
                    })

                    const removeButtons = document.querySelectorAll('.remove-item');
                    removeButtons.forEach(button => {
                        console.log(button)
                        button.addEventListener('click', function () {
                            const cartId = this.getAttribute('data-cart-id');
                            const productId = this.getAttribute('data-product-id');
                            fetch(`/api/carts/${cartId}/products/${productId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            })
                                .then(response => {

                                    if (!response.ok) {
                                        throw new Error('No se puede eliminar el producto del carrito');
                                    }
                                    location.reload();
                                })
                                .catch(error => {
                                    console.error('Error al eliminar el producto del carrito:', error);
                                });
                        });
                    });

                    const arrayOfAmountByProduct = productData.map(product => product.price * product.quantity)
                    const finalAmount = arrayOfAmountByProduct.reduce((accum, currenteValue) => accum + currenteValue, 0);

                    const finalAmountElement = document.getElementById('final-amount')
                    finalAmount.innerHTML = finalAmount.toString()

                    finalAmountElement.append(finalAmount)

                    //Botón comprar
                    const buyButton = document.createElement('button');
                    buyButton.textContent = 'Comprar';
                    buyButton.classList.add('buy-button');

                    buyButton.addEventListener('click', function () {
                        console.log(cartId)
                        console.log(cartData)
                        fetch(`/api/carts/${cartId}/purchase`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                cart: cartData
                            }),
                        })
                            .then(response => {
                                if (response.ok) {
                                    return response.json()
                                } else {
                                    console.error('Su orden no se pudo llevar a cabo');
                                }
                            })
                            .then(data => {
                                console.log('Orden exitosa', data);
                                setTimeout(() => {
                                    window.location.href = `/api/orders/view/${cartId}`;
                                }, 3000);
                            })
                            .catch(error => {
                                console.error('Error al hacer su orden', error);
                            });
                    });

                    const buyContainer = document.getElementById('buy-container');
                    buyContainer.appendChild(buyButton);

                })
                .catch(error => {
                    console.error('Error al obtener los detalles de los productos:', error);
                });
        })
        .catch(error => {
            console.error('Error al obtener la información del carrito:', error);
        });
});