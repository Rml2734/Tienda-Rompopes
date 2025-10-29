// tracking.js
document.addEventListener('DOMContentLoaded', function() {
    const trackingForm = document.getElementById('tracking-form');
    const orderDetails = document.getElementById('order-details');
    
    trackingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const orderId = document.getElementById('order-id').value;
        const email = document.getElementById('email').value;
        
        const url = `http://localhost:3001/api/orders/${orderId}`;
        console.log('Realizando solicitud a:', url); // <-- Añade esta línea
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Pedido no encontrado');
                }
                return response.json();
            })
            .then(order => {
                // Verificar que el email coincida
                if (order.customer_email !== email) {
                    throw new Error('El email no coincide con el pedido');
                }
                
                // Mostrar detalles del pedido
                displayOrderDetails(order);
            })
            .catch(error => {
                 console.error('Error en la solicitud:', error); // <-- Añade esta línea
                alert(error.message);
            });
    });
    
    function displayOrderDetails(order) {
        // Actualizar información general
        document.getElementById('order-number').textContent = order.id;
        
        const orderDate = new Date(order.created_at);
        document.getElementById('order-date').textContent = orderDate.toLocaleDateString();
        
        document.getElementById('order-total').textContent = `$${order.total}`;
        document.getElementById('order-payment').textContent = order.payment_method;
        
        // Actualizar información del cliente
        document.getElementById('customer-name').textContent = order.customer_name;
        document.getElementById('customer-address').textContent = order.customer_address;
        document.getElementById('customer-city').textContent = order.customer_city;
        document.getElementById('customer-phone').textContent = order.customer_phone || 'No proporcionado';
        
        // Actualizar productos
        const productsTable = document.getElementById('products-table').querySelector('tbody');
        productsTable.innerHTML = '';
        
        order.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>$${item.price}</td>
                <td>${item.quantity}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            `;
            productsTable.appendChild(row);
        });
        
        // Actualizar línea de tiempo de estado
        updateStatusTimeline(order.status);
        
        // Mostrar detalles
        orderDetails.style.display = 'block';
    }
    
    function updateStatusTimeline(status) {
        // Resetear todos los estados
        document.querySelectorAll('.timeline-step').forEach(step => {
            step.classList.remove('active', 'completed');
        });
        
        // Estados en orden
        const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
        const currentStatusIndex = statusOrder.indexOf(status);
        
        // Marcar todos los estados hasta el actual como completados
        for (let i = 0; i <= currentStatusIndex; i++) {
            const step = document.querySelector(`.timeline-step.${statusOrder[i]}`);
            if (step) {
                if (i < currentStatusIndex) {
                    step.classList.add('completed');
                } else {
                    step.classList.add('active');
                }
            }
        }
    }
});