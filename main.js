const header = document.querySelector('header');
const menu = document.querySelector('#menu-icon');
const navlist = document.querySelector('.navlist');
const cartIcon = document.querySelector('#cart-icon');
const cartModal = document.querySelector('#cart-modal');
const closeCart = document.querySelector('#close-cart');
const overlay = document.querySelector('#overlay');
const cartItemsContainer = document.querySelector('#cart-items');
const cartTotal = document.querySelector('#cart-total');
const contactForm = document.querySelector('#contactForm');
let cartItemsData = JSON.parse(localStorage.getItem('cartItems')) || [];

// ==========================
// Funciones generales
// ==========================
window.addEventListener('scroll', () => {
    header.classList.toggle('sticky', window.scrollY > 80);
});

menu.onclick = () => {
    menu.classList.toggle('bx-x');
    navlist.classList.toggle('open');
};

document.querySelectorAll('.navlist a').forEach(link => {
    link.addEventListener('click', () => {
        menu.classList.remove('bx-x');
        navlist.classList.remove('open');
    });
});

window.onscroll = () => {
    menu.classList.remove('bx-x');
    navlist.classList.remove('open');
};

// ==========================
// Funcionalidad del carrito
// ==========================
cartIcon.addEventListener('click', (e) => {
    e.preventDefault();
    cartModal.classList.add('open');
    overlay.classList.add('active');
});

closeCart.addEventListener('click', () => {
    cartModal.classList.remove('open');
    overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
    cartModal.classList.remove('open');
    overlay.classList.remove('active');
});

function saveCartToLocalStorage() {
    localStorage.setItem('cartItems', JSON.stringify(cartItemsData));
}

function updateCartDOM() {
    cartItemsContainer.innerHTML = '';
    
    if (cartItemsData.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-cart-message';
        emptyMsg.textContent = 'Su carrito está vacío';
        cartItemsContainer.appendChild(emptyMsg);
    } else {
        cartItemsData.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    <div class="quantity">
                        <button class="minus" data-index="${index}">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="plus" data-index="${index}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-index="${index}"><i class="bx bx-trash"></i></button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
        attachCartEventListeners();
    }
}

function attachCartEventListeners() {
    document.querySelectorAll('.minus').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            if (cartItemsData[index] && cartItemsData[index].quantity > 1) {
                cartItemsData[index].quantity--;
                saveCartToLocalStorage();
                updateCartDOM();
                updateCartTotal();
            }
        });
    });
    
    document.querySelectorAll('.plus').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            if (cartItemsData[index]) {
                cartItemsData[index].quantity++;
                saveCartToLocalStorage();
                updateCartDOM();
                updateCartTotal();
            }
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.remove-item').getAttribute('data-index'));
            if (cartItemsData[index]) {
                cartItemsData.splice(index, 1);
                saveCartToLocalStorage();
                updateCartDOM();
                updateCartTotal();
            }
        });
    });
}

function updateCartTotal() {
    let total = 0;
    cartItemsData.forEach(item => {
        total += item.price * item.quantity;
    });
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

function setupAddToCartListeners() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const name = button.getAttribute('data-name');
            const price = parseFloat(button.getAttribute('data-price'));
            const img = button.getAttribute('data-img');
            const quantity = parseInt(button.closest('.row').querySelector('.quantity span').textContent);
            
            const existingItemIndex = cartItemsData.findIndex(item => item.name === name);
            
            if (existingItemIndex !== -1) {
                cartItemsData[existingItemIndex].quantity += quantity;
            } else {
                cartItemsData.push({
                    name: name,
                    price: price,
                    img: img,
                    quantity: quantity
                });
            }
            
            saveCartToLocalStorage();
            updateCartDOM();
            updateCartTotal();
            
            cartModal.classList.add('open');
            overlay.classList.add('active');
            
            button.closest('.row').querySelector('.quantity span').textContent = '1';
        });
    });
}

function setupProductQuantityButtons() {
    document.querySelectorAll('.row .quantity button').forEach(button => {
        button.addEventListener('click', () => {
            const span = button.parentElement.querySelector('span');
            let quantity = parseInt(span.textContent);
            
            if (button.classList.contains('minus') && quantity > 1) {
                span.textContent = quantity - 1;
            } else if (button.classList.contains('plus')) {
                span.textContent = quantity + 1;
            }
        });
    });
}

// ==========================
// Lógica del Carrusel de Reseñas
// ==========================

// El array de reseñas ahora estará vacío al inicio porque lo llenaremos desde el backend
const reviews = [];
const reviewsContent = document.querySelector("#reviews-content");
const prevReview = document.querySelector("#prev-review");
const nextReview = document.querySelector("#next-review");
let currentIndex = 0;
let selectedRating = 0;
//const backendUrl = 'http://localhost:3001';

// 💡 ¡CAMBIO AQUÍ! Definición de la URL del Backend según el entorno
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const backendUrl = IS_LOCAL
    ? 'http://localhost:3001'
    : 'https://tienda-rompopes-backend-production.up.railway.app';

// Función para obtener las reseñas del backend
// Variable para saber cuántas reseñas hay en el conjunto original
let originalReviewCount = 0;

// La función loadReviewsFromServer() debe guardar la cantidad de reseñas originales
async function loadReviewsFromServer() {
    try {
        const response = await fetch(`${backendUrl}/api/reviews`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar las reseñas');
        }
        const fetchedReviews = await response.json();
        
        // Guardamos la cantidad de reseñas originales
        originalReviewCount = fetchedReviews.length;
        
        // Limpiamos el array y lo llenamos con los datos del servidor
        reviews.length = 0; 
        reviews.push(...fetchedReviews); 
        
        renderReviews(); 
    } catch (error) {
        console.error("Error al cargar las reseñas:", error);
    }
}

// Mueve el carrusel a la siguiente reseña.
function nextSlide() {
    if (reviews.length === 0) return;

    // Primero, incrementamos el índice normalmente
    currentIndex++;

    // La transición se ejecuta solo si el índice está dentro del array duplicado
    updateCarousel();

    // Cuando el carrusel llega al final de las reseñas originales,
    // lo reseteamos instantáneamente a la posición de la primera reseña duplicada
    if (currentIndex >= originalReviewCount) {
        setTimeout(() => {
            reviewsContent.style.transition = 'none'; // Desactivamos la transición
            currentIndex = 0; // Volvemos al inicio del array "original"
            updateCarousel();
            setTimeout(() => {
                reviewsContent.style.transition = 'transform 0.5s ease'; // Reactivamos la transición
            }, 50); // Un pequeño retraso para asegurar que el cambio de transición se aplique
        }, 500); // Este tiempo debe coincidir con la duración de la transición en CSS
    }
}

// Mueve el carrusel a la reseña anterior.
function prevSlide() {
    if (reviews.length === 0) return;

    // Lógica para retroceder
    if (currentIndex === 0) {
        reviewsContent.style.transition = 'none'; // Desactivamos la transición
        currentIndex = originalReviewCount; // Saltamos al inicio de la segunda copia
        updateCarousel(); // Movemos a la posición de la copia
        
        setTimeout(() => {
            reviewsContent.style.transition = 'transform 0.5s ease'; // Reactivamos la transición
            currentIndex--; // Retrocedemos un paso
            updateCarousel(); // Aplicamos la animación
        }, 50);
    } else {
        currentIndex--;
        updateCarousel();
    }
}


// Actualiza la vista del carrusel.
function updateCarousel() {
    if (reviewsContent.children.length === 0) return;
    // Debemos calcular el ancho de una reseña. El CSS debe definir esto para que funcione bien.
    const itemWidth = reviewsContent.children[0].offsetWidth; 
    const gap = 20; // El espacio entre reseñas
    reviewsContent.style.transform = `translateX(${-currentIndex * (itemWidth + gap)}px)`;
}


// Renderiza todas las reseñas en el DOM.
function renderReviews() {
    reviewsContent.innerHTML = '';
    
    // Si no hay reseñas, muestra un mensaje y no intentes duplicar
    if (reviews.length === 0) {
        reviewsContent.innerHTML = '<p class="empty-reviews-message">No hay reseñas para mostrar.</p>';
        return;
    }

    // Volvemos a duplicar las reseñas para que el carrusel se vea infinito
    const reviewsToRender = [...reviews, ...reviews];
    
    reviewsToRender.forEach(review => {
        const reviewCard = document.createElement("div");
        reviewCard.classList.add("review-card");
        
        const starsHtml = generateStarRating(review.calificacion || review.rating);
        
        reviewCard.innerHTML = `
            <img src="${review.imagen || review.image}" alt="Foto de perfil de ${review.nombre || review.name}" class="profile">
            <h3>${review.nombre || review.name}</h3>
            <p>"${review.texto || review.text}"</p>
            <div class="star-rating">
                ${starsHtml}
            </div>
            <p class="role">Cliente</p>
        `;
        reviewsContent.appendChild(reviewCard);
    });
    
    updateCarousel();
}

// Maneja la creación de estrellas.
function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="bx ${i <= rating ? 'bxs-star' : 'bx-star'}" data-value="${i}"></i>`;
    }
    return stars;
}

// Maneja el envío del formulario de reseñas.
async function addNewReviewFromForm(e) {
    e.preventDefault();
    const nombre = document.getElementById("reviewerName").value;
    const texto = document.getElementById("reviewText").value;
    
    if (selectedRating === 0 || !nombre.trim() || !texto.trim()) {
        alert("Por favor completa todos los campos y selecciona una calificación.");
        return;
    }
    
    const newReview = {
        nombre: nombre,
        texto: texto,
        calificacion: selectedRating,
    };

    try {
        const response = await fetch(`${backendUrl}/api/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newReview),
        });

        if (!response.ok) {
            throw new Error('No se pudo guardar la reseña');
        }

        const savedReview = await response.json();
        
        // Después de guardar, recarga las reseñas para incluir la nueva
        await loadReviewsFromServer();

        alert('¡Reseña enviada con éxito!');
        
        // Limpia el formulario y las estrellas
        document.getElementById("addReviewForm").reset();
        const stars = document.querySelectorAll("#addReviewForm .star-rating i");
        stars.forEach(star => {
            star.classList.remove("bxs-star");
            star.classList.add("bx-star");
        });
        selectedRating = 0; 
    } catch (error) {
        console.error("Error al enviar la reseña:", error);
        alert("Ocurrió un error al enviar tu reseña. Inténtalo de nuevo más tarde.");
    }
}

// Maneja los clics en las estrellas para el formulario.
function setupStarRatingForm() {
    const stars = document.querySelectorAll("#addReviewForm .star-rating i");
    stars.forEach((star, index) => {
        star.setAttribute('data-value', index + 1);
        star.addEventListener('click', (e) => {
            const value = parseInt(e.target.getAttribute("data-value"));
            stars.forEach((s, i) => {
                s.classList.toggle("bxs-star", i < value);
                s.classList.toggle("bx-star", i >= value);
            });
            selectedRating = value; 
        });
    });
}


// ==========================
// Contact form submission
// ==========================
//const backendUrl = 'http://localhost:3001'; // Ya lo tienes, solo asegúrate de que esté disponible aquí

// ==========================
// Formulario de Contacto en Footer
// ==========================
function setupContactFormFooter() {
    const contactFormFooter = document.getElementById('contactForm');
    if (!contactFormFooter) return;

    contactFormFooter.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = contactFormFooter.querySelector('input[name="nombre"]').value;
        const email = contactFormFooter.querySelector('input[name="email"]').value;
        const mensaje = contactFormFooter.querySelector('textarea[name="mensaje"]').value;

        // Validaciones básicas
        if (!nombre || !email || !mensaje) {
            showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Por favor ingresa un correo válido', 'error');
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre, email, mensaje }),
            });

            if (!response.ok) {
                throw new Error('No se pudo enviar el mensaje');
            }

            showNotification('¡Gracias por tu mensaje! Te contactaremos pronto.', 'success');
            contactFormFooter.reset();
        } catch (error) {
            console.error('Error al enviar el formulario de contacto:', error);
            showNotification('Ocurrió un error al enviar tu mensaje. Por favor, inténtalo de nuevo más tarde.', 'error');
        }
    });
}
//===========================
// Define la ruta de checkout según el entorno
/*
const CHECKOUT_PATH = IS_LOCAL
    ? '/src/checkout.html'  // Ruta en desarrollo '/src/checkout.html'
    : '/checkout.html';     // Ruta en producción
*/
const CHECKOUT_PATH = '/checkout.html';
//===========================
function redirectToCheckout() {
    if (cartItemsData.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de proceder al pago.');
        return;
    }
    window.location.href = CHECKOUT_PATH;
    //window.location.href = '/src/checkout.html';
}

const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', redirectToCheckout);
}

// ==========================
// ScrollReveal animations
// ==========================
if (typeof ScrollReveal !== 'undefined') {
    const sr = ScrollReveal({
        origin: 'top',
        distance: '85px',
        duration: 2500,
        reset: false,
        // Deshabilitar en móviles
        //mobile: false // ← ESTA LÍNEA ES IMPORTANTE
    });

    sr.reveal('.home-text', { delay: 300 });
    sr.reveal('.home-img', { delay: 400 });
    sr.reveal('.container', { delay: 400 });

    sr.reveal('.about-img', {});
    sr.reveal('.about-text', { delay: 300 });

    sr.reveal('.middle-text', {});
    sr.reveal('.row-btn,.shop-content', { delay: 300 });

    sr.reveal('.reviews,.contact', { delay: 300 });
}

// ==========================
// Control del botón de scroll
// ==========================
function setupScrollButton() {
    const scrollButton = document.querySelector('.scroll');
    if (!scrollButton) return;

    // Función para mostrar/ocultar el botón
    function toggleScrollButton() {
        if (window.scrollY > 300) { // Aparece después de 300px de scroll
            scrollButton.classList.remove('hidden');
        } else {
            scrollButton.classList.add('hidden');
        }
    }

    // Event listener para el scroll
    window.addEventListener('scroll', toggleScrollButton);
    
    // Verificar estado inicial al cargar la página
    toggleScrollButton();

    // Click del botón para subir al inicio
    scrollButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ==========================
// Formulario de Newsletter (usa tu ruta existente de contact)
// ==========================
function setupNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) return;

    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        const submitButton = newsletterForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        const email = emailInput.value.trim();

        if (!email) {
            showNotification('Por favor ingresa tu correo electrónico', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Por favor ingresa un correo válido', 'error');
            return;
        }

        // Mostrar loading
        submitButton.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i>';
        submitButton.disabled = true;

        try {
            const response = await fetch(`${backendUrl}/api/contact/newsletter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });

            const result = await response.json();

            if (result.success) {
                showNotification(result.message, 'success');
                emailInput.value = '';
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            console.error('Error en suscripción:', error);
            showNotification(error.message || 'Error al suscribirse. Intenta nuevamente.', 'error');
        } finally {
            // Restaurar botón
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    });
}

// Función auxiliar para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para mostrar notificaciones
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==========================
// Inicializar todo
// ==========================
document.addEventListener('DOMContentLoaded', () => {
    // La carga inicial de reseñas ahora se hace desde el backend
    loadReviewsFromServer();
    
    // Y el resto de la lógica sigue igual
    prevReview.addEventListener('click', prevSlide);
    nextReview.addEventListener('click', nextSlide);
    
    document.getElementById("addReviewForm").addEventListener("submit", addNewReviewFromForm);
    setupStarRatingForm();
    
    setInterval(nextSlide, 5000);
    
    setupAddToCartListeners();
    setupProductQuantityButtons();
    updateCartDOM();
    updateCartTotal();

    // 👇 AGREGAR ESTA LÍNEA
    setupScrollButton(); // Control del botón de scroll
    setupNewsletterForm(); // 👈 Agregar esta línea
    setupContactFormFooter();
});

//BORRAR DESPUES DE PRUEBAS - MODO ESTRICTO 
