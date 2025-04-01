// Variables globales
let products = [];
let cart = [];
let selectedProduct = null;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
});

// Configuración de event listeners
function setupEventListeners() {
    // Búsqueda de productos
    document.getElementById('searchInput').addEventListener('input', filterProducts);
    
    // Botones de cantidad
    document.getElementById('decrease-quantity').addEventListener('click', () => updateQuantity('decrease'));
    document.getElementById('increase-quantity').addEventListener('click', () => updateQuantity('increase'));
    
    // Botón de añadir al carrito
    document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);
    
    // Botón de checkout
    document.getElementById('checkout-btn').addEventListener('click', showPaymentModal);
    
    // Botón de procesar pago
    document.getElementById('process-payment-btn').addEventListener('click', processPayment);
}

// Obtener productos de la API
async function fetchProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('product-list').innerHTML = '<p class="text-center">Error al cargar los productos. Por favor, intente más tarde.</p>';
    }
}

// Mostrar productos en la página
function displayProducts(productsToShow) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = productsToShow.map(product => `
        <div class="col-md-4 col-lg-3">
            <div class="card product-card">
                <img src="${product.image}" class="card-img-top" alt="${product.title}">
                <div class="card-body">
                    <h5 class="card-title">${product.title.substring(0, 50)}${product.title.length > 50 ? '...' : ''}</h5>
                    <p class="card-text">$${product.price.toFixed(2)}</p>
                    <button class="btn btn-primary" onclick="showQuantityModal(${product.id})">
                        Añadir al Carrito
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtrar productos
function filterProducts(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts);
}

// Mostrar modal de cantidad
function showQuantityModal(productId) {
    selectedProduct = products.find(p => p.id === productId);
    document.getElementById('quantity-input').value = '1';
    new bootstrap.Modal(document.getElementById('quantityModal')).show();
}

// Actualizar cantidad
function updateQuantity(action) {
    const input = document.getElementById('quantity-input');
    let value = parseInt(input.value);
    
    if (action === 'increase' && value < 10) {
        input.value = value + 1;
    } else if (action === 'decrease' && value > 1) {
        input.value = value - 1;
    }
}

// Añadir al carrito
function addToCart() {
    const quantity = parseInt(document.getElementById('quantity-input').value);
    
    const existingItem = cart.find(item => item.product.id === selectedProduct.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            product: selectedProduct,
            quantity: quantity
        });
    }
    
    updateCartCount();
    bootstrap.Modal.getInstance(document.getElementById('quantityModal')).hide();
}

// Actualizar contador del carrito
function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

// Mostrar modal de pago
function showPaymentModal() {
    updateCartModal();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
    new bootstrap.Modal(document.getElementById('paymentModal')).show();
}

// Actualizar modal del carrito
function updateCartModal() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.product.image}" alt="${item.product.title}">
            <div>
                <h6>${item.product.title}</h6>
                <p>Cantidad: ${item.quantity} x $${item.product.price.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
}

// Procesar pago y generar PDF
function processPayment() {
    const cardName = document.getElementById('cardName').value;
    if (!validatePaymentForm()) {
        alert('Por favor, complete todos los campos correctamente.');
        return;
    }
    
    generatePDF(cardName);
    resetCart();
    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
    alert('¡Gracias por su compra! Se ha generado su factura en PDF.');
}

// Validar formulario de pago
function validatePaymentForm() {
    const form = document.getElementById('payment-form');
    return form.checkValidity();
}

// Generar PDF
function generatePDF(customerName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFontSize(20);
    doc.text('Factura de Compra', 20, 20);
    
    // Datos del cliente
    doc.setFontSize(12);
    doc.text(`Cliente: ${customerName}`, 20, 40);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 50);
    
    // Productos
    doc.text('Productos:', 20, 70);
    let y = 80;
    cart.forEach(item => {
        doc.text(`${item.product.title.substring(0, 40)}...`, 20, y);
        doc.text(`${item.quantity} x $${item.product.price.toFixed(2)}`, 150, y);
        y += 10;
    });
    
    // Total
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    doc.setFontSize(14);
    doc.text(`Total: $${total.toFixed(2)}`, 150, y + 20);
    
    // Guardar PDF
    doc.save('factura.pdf');
}

// Resetear carrito
function resetCart() {
    cart = [];
    updateCartCount();
}