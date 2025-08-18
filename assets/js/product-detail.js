/**
 * Product Detail Manager - Gerenciador de detalhes do produto com cache e otimizações
 * @author Pedro Wierzynski
 * @version 2.0.0
 */

class ProductDetailManager {
    constructor() {
        this.currentProduct = null;
        this.currentImageIndex = 0;
        this.productImages = [];
        this.cache = new Map();
        this.observer = null;

        // Bind methods para manter contexto
        this.handleDOMContentLoaded = this.handleDOMContentLoaded.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.previousImage = this.previousImage.bind(this);
        this.nextImage = this.nextImage.bind(this);
        this.toggleFavoriteDetail = this.toggleFavoriteDetail.bind(this);
        this.addToCart = this.addToCart.bind(this);

        this.init();
    }

    // ============================================
    // INICIALIZAÇÃO E CONFIGURAÇÃO
    // ============================================

    init() {
        document.addEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                    }
                });
            }, { threshold: 0.1 });
        }
    }

    // ============================================
    // CARREGAMENTO E CACHE DE DADOS
    // ============================================

    async loadProducts() {
        const CACHE_KEY = 'products_data';
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

        // Verificar cache primeiro
        if (this.cache.has(CACHE_KEY)) {
            const cached = this.cache.get(CACHE_KEY);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.data;
            }
        }

        try {
            const response = await fetch('products.json');

            if (!response.ok) {
                throw new Error(`Falha na requisição: ${response.status} ${response.statusText}`);
            }

            const products = await response.json();

            if (!Array.isArray(products)) {
                throw new Error('Formato de dados inválido');
            }

            // Salvar no cache
            this.cache.set(CACHE_KEY, {
                data: products,
                timestamp: Date.now()
            });

            return products;

        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.handleError('Erro ao carregar produto. Tente novamente mais tarde.');
            return [];
        }
    }

    async loadProductById(productId) {
        if (!productId) {
            throw new Error('ID do produto não fornecido');
        }

        const products = await this.loadProducts();
        const product = products.find(p => String(p.id) === String(productId));

        if (!product) {
            throw new Error('Produto não encontrado');
        }

        return product;
    }

    // ============================================
    // UTILIDADES E FORMATAÇÃO
    // ============================================

    getUrlParameter(name) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name)?.trim() || '';
        } catch (error) {
            console.warn('Erro ao ler parâmetros da URL:', error);
            return '';
        }
    }

    formatPrice(price) {
        if (typeof price !== 'number' || isNaN(price)) {
            console.warn('Preço inválido:', price);
            return '0,00';
        }

        return price.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    sanitizeString(str) {
        return str ? str.replace(/'/g, "\\'").replace(/"/g, '\\"') : '';
    }

    // ============================================
    // SISTEMA DE AVALIAÇÕES
    // ============================================

    getRatingsStorage() {
        try {
            const ratings = localStorage.getItem('productRatings');
            return ratings ? JSON.parse(ratings) : {};
        } catch (error) {
            console.warn('Erro ao ler avaliações do localStorage:', error);
            return {};
        }
    }

    getProductRatings(productId) {
        const allRatings = this.getRatingsStorage();
        return allRatings[productId] || [];
    }

    calculateAverageRating(productId) {
        const ratings = this.getProductRatings(productId);

        if (!ratings.length) return 0;

        const validRatings = ratings.filter(rating =>
            typeof rating === 'number' && rating >= 1 && rating <= 5
        );

        if (!validRatings.length) return 0;

        const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
        return sum / validRatings.length;
    }

    initializeRating(productId) {
        if (typeof window.initializeRating === 'function') {
            window.initializeRating(productId);
        }
    }

    // ============================================
    // GERENCIAMENTO DE IMAGENS
    // ============================================

    generateProductImages(product) {
        if (!product) return;

        this.productImages = [product.image];

        // Adicionar imagens adicionais se existirem
        ['image2', 'image3'].forEach(imageKey => {
            if (product[imageKey]) {
                this.productImages.push(product[imageKey]);
            }
        });

        // Se só há uma imagem, duplicar para permitir navegação
        if (this.productImages.length === 1) {
            this.productImages.push(product.image);
        }
    }

    renderImageCarousel() {
        const carouselContainer = document.getElementById('carousel-images');
        if (!carouselContainer) return;

        // Usar DocumentFragment para melhor performance
        const fragment = document.createDocumentFragment();

        this.productImages.forEach((image, index) => {
            const imageDiv = document.createElement('div');
            imageDiv.className = `carousel-image ${index === 0 ? 'active' : ''}`;
            imageDiv.addEventListener('click', () => this.selectImage(index));

            const img = document.createElement('img');
            img.src = image;
            img.alt = `${this.currentProduct.title} - Imagem ${index + 1}`;
            img.loading = 'lazy';
            img.onerror = function () {
                this.src = 'https://placehold.co/600x400/e5e5e5/999999?text=Sem+Imagem';
            };

            imageDiv.appendChild(img);
            fragment.appendChild(imageDiv);
        });

        carouselContainer.innerHTML = '';
        carouselContainer.appendChild(fragment);

        // Controlar visibilidade dos botões de navegação
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        const shouldShowButtons = this.productImages.length > 1;

        if (prevBtn) prevBtn.style.display = shouldShowButtons ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = shouldShowButtons ? 'flex' : 'none';
    }

    updateMainImage(index) {
        if (index < 0 || index >= this.productImages.length || !this.currentProduct) return;

        this.currentImageIndex = index;
        const mainImage = document.getElementById('main-product-image');

        if (!mainImage) return;

        mainImage.src = this.productImages[index];
        mainImage.alt = `${this.currentProduct.title} - Imagem ${index + 1}`;

        mainImage.onerror = function () {
            this.src = 'https://placehold.co/600x400/e5e5e5/999999?text=Imagem+Indisponível';
        };

        // Atualizar carousel
        document.querySelectorAll('.carousel-image').forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
    }

    selectImage(index) {
        this.updateMainImage(index);
    }

    previousImage() {
        if (this.productImages.length <= 1) return;
        const newIndex = this.currentImageIndex > 0
            ? this.currentImageIndex - 1
            : this.productImages.length - 1;
        this.updateMainImage(newIndex);
    }

    nextImage() {
        if (this.productImages.length <= 1) return;
        const newIndex = this.currentImageIndex < this.productImages.length - 1
            ? this.currentImageIndex + 1
            : 0;
        this.updateMainImage(newIndex);
    }

    // ============================================
    // RENDERIZAÇÃO DO PRODUTO
    // ============================================

    showLoading(show = true) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    showProductDetail(show = true) {
        const productDetail = document.getElementById('product-detail');
        if (productDetail) {
            productDetail.style.display = show ? 'block' : 'none';
        }
    }

    showError(show = true) {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.style.display = show ? 'block' : 'none';
        }
    }

    handleError(message) {
        this.showLoading(false);
        this.showProductDetail(false);
        this.showError(true);

        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
        }

        console.error(message);
    }

    updatePageTitle(productTitle) {
        if (productTitle) {
            document.title = `${productTitle} - Ecommerce Front-End`;
        }
    }

    updateBreadcrumb(product) {
        const categoryElement = document.getElementById('breadcrumb-category');
        const productElement = document.getElementById('breadcrumb-product');

        if (categoryElement) categoryElement.textContent = product.category || 'Categoria';
        if (productElement) productElement.textContent = product.title || 'Produto';
    }

    updateProductInfo(product) {
        const elements = {
            'product-category': product.category || 'Categoria não informada',
            'product-title': product.title || 'Produto sem nome',
            'product-price': this.formatPrice(product.price || 0),
            'product-description': product.description_full || product.description_small || 'Descrição não disponível'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    renderProductDetail(product) {
        if (!product) {
            this.handleError('Produto não encontrado');
            return;
        }

        this.currentProduct = product;

        try {
            this.showLoading(false);
            this.showError(false);
            this.showProductDetail(true);

            // Atualizar informações do produto
            this.updatePageTitle(product.title);
            this.updateBreadcrumb(product);
            this.updateProductInfo(product);

            // Gerenciar imagens
            this.generateProductImages(product);
            this.renderImageCarousel();
            this.updateMainImage(0);

            // Inicializar avaliações
            this.initializeRating(product.id);

            // Observar elementos para animações
            this.observeElements();

            console.log(`✅ Produto "${product.title}" carregado com sucesso`);

        } catch (error) {
            console.error('Erro ao renderizar produto:', error);
            this.handleError('Erro ao exibir produto');
        }
    }

    observeElements() {
        if (this.observer) {
            const elementsToObserve = document.querySelectorAll('.product-detail-content, .product-images');
            elementsToObserve.forEach(element => this.observer.observe(element));
        }
    }

    // ============================================
    // FUNCIONALIDADES INTERATIVAS
    // ============================================

    toggleFavoriteDetail() {
        const favoriteBtn = document.getElementById('favorite-btn');
        if (!favoriteBtn || !this.currentProduct) return;

        const icon = favoriteBtn.querySelector('i');
        const isFavorited = favoriteBtn.classList.contains('favorited');

        if (isFavorited) {
            favoriteBtn.classList.remove('favorited');
            icon.classList.remove('fas');
            icon.classList.add('far');
            this.showAlert('success', 'Removido dos Favoritos',
                `${this.currentProduct.title} foi removido da sua lista de favoritos.`);
        } else {
            favoriteBtn.classList.add('favorited');
            icon.classList.remove('far');
            icon.classList.add('fas');
            this.showAlert('success', 'Adicionado aos Favoritos',
                `${this.currentProduct.title} foi adicionado à sua lista de favoritos!`);
        }
    }

    addToCart() {
        if (!this.currentProduct) return;

        this.showAlert('success', 'Adicionado ao Carrinho',
            `${this.currentProduct.title} foi adicionado ao carrinho!`);
    }

    async shareProduct() {
        if (!this.currentProduct) return;

        const shareData = {
            title: this.currentProduct.title,
            text: this.currentProduct.description_small || this.currentProduct.title,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                this.showAlert('success', 'Link Copiado',
                    'O link do produto foi copiado para a área de transferência!');
            }
        } catch (error) {
            console.warn('Erro ao compartilhar:', error);
            this.showAlert('error', 'Erro', 'Não foi possível compartilhar o produto.');
        }
    }

    showAlert(type, title, message) {
        if (typeof window.showAlert === 'function') {
            window.showAlert(type, title, message);
        } else {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }

    // ============================================
    // EVENTOS E NAVEGAÇÃO
    // ============================================

    handleKeyDown(event) {
        if (event.key === 'ArrowLeft') {
            this.previousImage();
        } else if (event.key === 'ArrowRight') {
            this.nextImage();
        } else if (event.key === 'Escape') {
            // Opcional: voltar para página anterior
            if (window.history.length > 1) {
                window.history.back();
            }
        }
    }

    setupEventListeners() {
        // Navegação de imagens
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) prevBtn.addEventListener('click', this.previousImage);
        if (nextBtn) nextBtn.addEventListener('click', this.nextImage);

        // Botões de ação
        const favoriteBtn = document.getElementById('favorite-btn');
        const addCartBtn = document.querySelector('.btn-add-cart');
        const shareBtn = document.getElementById('share-btn');

        if (favoriteBtn) favoriteBtn.addEventListener('click', this.toggleFavoriteDetail);
        if (addCartBtn) addCartBtn.addEventListener('click', this.addToCart);
        if (shareBtn) shareBtn.addEventListener('click', () => this.shareProduct());

        // Navegação por teclado
        document.addEventListener('keydown', this.handleKeyDown);
    }

    // ============================================
    // CARREGAMENTO PRINCIPAL
    // ============================================

    async loadProductDetail() {
        const productId = this.getUrlParameter('id');

        if (!productId) {
            this.handleError('ID do produto não encontrado na URL');
            return;
        }

        try {
            this.showLoading(true);
            this.showError(false);

            const product = await this.loadProductById(productId);
            this.renderProductDetail(product);

        } catch (error) {
            console.error('Erro ao carregar detalhes do produto:', error);
            this.handleError(error.message || 'Erro ao carregar produto');
        }
    }

    async handleDOMContentLoaded() {
        try {
            await this.loadProductDetail();
            this.setupEventListeners();
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.handleError('Erro ao inicializar a aplicação');
        }
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    /**
     * Método público para recarregar produto
     */
    async reload() {
        this.cache.clear();
        await this.loadProductDetail();
    }

    /**
     * Método público para obter produto atual
     */
    getCurrentProduct() {
        return this.currentProduct;
    }

    /**
     * Método público para obter estatísticas
     */
    getStats() {
        return {
            currentProduct: this.currentProduct?.id || null,
            imagesCount: this.productImages.length,
            currentImageIndex: this.currentImageIndex,
            cacheSize: this.cache.size
        };
    }
}

// ============================================
// INICIALIZAÇÃO GLOBAL
// ============================================

// Instância global do gerenciador
window.productDetailManager = new ProductDetailManager();

// Funções globais para compatibilidade (se necessário)
window.loadProductDetail = () => window.productDetailManager.reload();
window.toggleFavoriteDetail = () => window.productDetailManager.toggleFavoriteDetail();
window.shareProduct = () => window.productDetailManager.shareProduct();
window.previousImage = () => window.productDetailManager.previousImage();
window.nextImage = () => window.productDetailManager.nextImage();
window.selectImage = (index) => window.productDetailManager.selectImage(index);
