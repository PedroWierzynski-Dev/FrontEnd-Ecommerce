let currentProduct = null;
let currentImageIndex = 0;
let productImages = [];

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

async function loadProductDetail() {
    const productId = getUrlParameter('id');

    if (!productId) {
        showError();
        return;
    }

    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const products = await response.json();
        const product = products.find(p => p.id == productId);

        if (!product) {
            showError();
            return;
        }

        currentProduct = product;
        renderProductDetail(product);

    } catch (error) {
        console.error('Erro ao carregar produto:', error);
        showError();
    }
}

function renderProductDetail(product) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('product-detail').style.display = 'block';

    document.getElementById('breadcrumb-category').textContent = product.category;
    document.getElementById('breadcrumb-product').textContent = product.title;

    document.title = `${product.title} - Ecommerce Front-End`;

    document.getElementById('product-category').textContent = product.category;
    document.getElementById('product-title').textContent = product.title;
    document.getElementById('product-price').textContent = formatPrice(product.price);
    document.getElementById('product-description').textContent = product.description_full;

    generateProductImages(product);

    renderImageCarousel();

    updateMainImage(0);
}

function generateProductImages(product) {
    productImages = [product.image];

    if (product.image2) {
        productImages.push(product.image2);
    }

    if (product.image3) {
        productImages.push(product.image3);
    }

    if (productImages.length === 1) {
        productImages.push(product.image);
    }
}

function renderImageCarousel() {
    const carouselContainer = document.getElementById('carousel-images');

    const imagesHTML = productImages.map((image, index) => `
        <div class="carousel-image ${index === 0 ? 'active' : ''}" onclick="selectImage(${index})">
            <img src="${image}" 
                 alt="${currentProduct.title} - Imagem ${index + 1}" 
                 onerror="this.src='https://placehold.co/600x400.png'">
        </div>
    `).join('');

    carouselContainer.innerHTML = imagesHTML;

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (productImages.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    } else {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    }
}

function updateMainImage(index) {
    if (index < 0 || index >= productImages.length) return;

    currentImageIndex = index;
    const mainImage = document.getElementById('main-product-image');
    mainImage.src = productImages[index];
    mainImage.alt = `${currentProduct.title} - Imagem ${index + 1}`;

    mainImage.onerror = function () {
        this.src = 'https://placehold.co/600x400/e5e5e5/999999?text=Imagem+Indisponível';
    };

    document.querySelectorAll('.carousel-image').forEach(img => img.classList.remove('active'));

    const activeImage = document.querySelectorAll('.carousel-image')[index];
    if (activeImage) {
        activeImage.classList.add('active');
    }
}

function selectImage(index) {
    updateMainImage(index);
}

function previousImage() {
    if (productImages.length <= 1) return;
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : productImages.length - 1;
    updateMainImage(newIndex);
}

function nextImage() {
    if (productImages.length <= 1) return;
    const newIndex = currentImageIndex < productImages.length - 1 ? currentImageIndex + 1 : 0;
    updateMainImage(newIndex);
}

function showError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-container').style.display = 'block';
}

function formatPrice(price) {
    return price.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function toggleFavoriteDetail() {
    const favoriteBtn = document.getElementById('favorite-btn');
    const icon = favoriteBtn.querySelector('i');
    const isFavorited = favoriteBtn.classList.contains('favorited');

    if (isFavorited) {
        favoriteBtn.classList.remove('favorited');
        icon.classList.remove('fas');
        icon.classList.add('far');
        showAlert('success', 'Removido dos Favoritos', `${currentProduct.title} foi removido da sua lista de favoritos.`);
    } else {
        favoriteBtn.classList.add('favorited');
        icon.classList.remove('far');
        icon.classList.add('fas');
        showAlert('success', 'Adicionado aos Favoritos', `${currentProduct.title} foi adicionado à sua lista de favoritos!`);
    }
}

function shareProduct() {
    if (navigator.share && currentProduct) {
        navigator.share({
            title: currentProduct.title,
            text: currentProduct.description_small,
            url: window.location.href
        }).catch(console.error);
    } else {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            showAlert('success', 'Link Copiado', 'O link do produto foi copiado para a área de transferência!');
        }).catch(() => {
            showAlert('error', 'Erro', 'Não foi possível copiar o link.');
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {

    loadProductDetail();

    document.getElementById('prevBtn').addEventListener('click', previousImage);
    document.getElementById('nextBtn').addEventListener('click', nextImage);

    document.getElementById('favorite-btn').addEventListener('click', toggleFavoriteDetail);

    document.querySelector('.btn-add-cart').addEventListener('click', function () {
        showAlert('success', 'Adicionado ao Carrinho', `${currentProduct?.title || 'Produto'} foi adicionado ao carrinho!`);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
            previousImage();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        }
    });
});