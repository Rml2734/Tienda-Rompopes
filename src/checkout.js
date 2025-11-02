import { loadStripe } from '@stripe/stripe-js';

// **¡SOLUCIÓN DE ENTORNO AUTOMÁTICA!**
// Si el frontend está en localhost, usa localhost.
// Si el frontend está en Railway, usa la URL de producción de Railway.
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BACKEND_URL = IS_LOCAL
    ? 'http://localhost:3001' // Para desarrollo
    : 'https://tienda-rompopes-backend-production.up.railway.app'; // Para producción en Railway

document.addEventListener('DOMContentLoaded', async function() {
    // Cargar Stripe con tu clave pública
    // Reemplaza 'TU_CLAVE_PUBLICA_DE_STRIPE' con la clave que se muestra en la captura de pantalla (la que empieza con 'pk_test_...')
    const stripe = await loadStripe('pk_test_51S5dJU8FJ9ygvYVrnk9yFPAxkcONQBBcf4g6Al2dywMhWqgoE7Iy7ibwu5nowje5yfYXsPsoHwRQ4bVIRuDXgNS500onrVltlx');
    const elements = stripe.elements();

    // Crear el elemento de la tarjeta
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');

    const checkoutForm = document.getElementById('checkout-form');
    const orderItemsContainer = document.getElementById('order-items');
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');
    const cardErrorsElement = document.getElementById('card-errors');

    // Cargar los productos del carrito desde localStorage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    let subtotal = 0;

    // Mostrar productos en el resumen
    if (cartItems.length === 0) {
        orderItemsContainer.innerHTML = '<p class="empty-message">No hay productos en el carrito</p>';
    } else {
        cartItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.innerHTML = `
                <span class="order-item-name">${item.name} x${item.quantity}</span>
                <span class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
            `;
            orderItemsContainer.appendChild(itemElement);

            subtotal += item.price * item.quantity;
        });
    }

    // Calcular totales
    const shipping = 5.00;
    const total = subtotal + shipping;

    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    totalElement.textContent = `$${total.toFixed(2)}`;

    // Manejar cambio de método de pago
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const cardFormContainer = document.getElementById('card-element');

    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            if (this.value === 'credit-card') {
                cardFormContainer.style.display = 'block';
            } else {
                cardFormContainer.style.display = 'none';
            }
        });
    });

    // Manejar envío del formulario
    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        document.getElementById('loading-spinner').style.display = 'flex';

        // Recopilar datos del formulario
        const customerData = {
            customer_name: document.getElementById('name').value,
            customer_email: document.getElementById('email').value,
            customer_phone: document.getElementById('phone').value,
            customer_address: document.getElementById('address').value,
            customer_city: document.getElementById('city').value,
            customer_postal_code: document.getElementById('postalCode').value,
        };

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        let orderData = {
            ...customerData,
            items: cartItems,
            subtotal: subtotal,
            shipping: shipping,
            total: total,
            payment_method: paymentMethod
        };
        
        // Si el pago es con tarjeta, usar Stripe
        if (paymentMethod === 'credit-card') {
            try {
                // Crear una intención de pago en el backend
                const response = await fetch(`${BACKEND_URL}/api/orders/create-payment-intent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: Math.round(total * 100) }) // El total en centavos
                });

                const paymentIntentResult = await response.json();

                if (paymentIntentResult.error) {
                    throw new Error(paymentIntentResult.error);
                }

                const clientSecret = paymentIntentResult.clientSecret;

                // Confirmar el pago en el frontend
                const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: customerData.customer_name,
                            email: customerData.customer_email,
                        },
                    },
                });

                if (error) {
                    console.error('Error de confirmación de pago:', error);
                    cardErrorsElement.textContent = error.message;
                    document.getElementById('loading-spinner').style.display = 'none';
                    return;
                }

                if (paymentIntent.status === 'succeeded') {
                    console.log('Pago exitoso:', paymentIntent.id);
                    orderData.payment_intent_id = paymentIntent.id; // Agregar el ID de la transacción
                    // Continuar con el envío del pedido al backend
                    submitOrderToBackend(orderData);
                } else {
                    console.warn('Pago no exitoso, estado:', paymentIntent.status);
                    document.getElementById('loading-spinner').style.display = 'none';
                    alert('El pago no se pudo completar. Por favor, intenta de nuevo.');
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('loading-spinner').style.display = 'none';
                alert('Ocurrió un error con el pago. Por favor, intenta nuevamente.');
            }
        } else {
            // Si el pago es contra entrega, enviar el pedido directamente
            submitOrderToBackend(orderData);
        }
    });

    async function submitOrderToBackend(data) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            document.getElementById('loading-spinner').style.display = 'none';

            if (response.ok) {
                const result = await response.json();
                document.getElementById('checkout-main-content').style.display = 'none';

                const orderConfirmation = document.getElementById('order-confirmation');
                orderConfirmation.style.display = 'flex';
                orderConfirmation.innerHTML = `
                    <div class="confirmation-box">
                        <i class='bx bx-check-circle'></i>
                        <h2>¡Pedido realizado con éxito! 🎉</h2>
                        <p>Tu pedido ha sido procesado correctamente.</p>
                        <p>El número de tu pedido es: <strong>${result.order.id}</strong></p>
                        <p>Recibirás un correo electrónico de confirmación en breve.</p>
                        <a href="/src/tracking.html?orderId=${result.order.id}" class="tracking-link">
                            Seguir mi pedido <i class='bx bx-right-arrow-alt'></i>
                        </a>
                        <a href="/" class="home-link">Volver a la tienda</a>
                    </div>
                `;

                localStorage.removeItem('cartItems');
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            document.getElementById('loading-spinner').style.display = 'none';
            console.error('Error:', error);
            alert('Error de conexión. Por favor, intenta nuevamente.');
        }
    }
});
