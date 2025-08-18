/**
 * Products Manager - Gerenciador de produtos com busca e avaliações
 * @author Pedro Wierzynski
 * @version 2.0.1 - Correção do sistema de favoritos
 */

class ProductsManager {
    constructor() {
        this.products = [];
        this.currentSearchTerm = '';
        this.observer = null;
        this.cache = new Map();

        // Bind methods para manter contexto
        this.handleSeeMore = this.handleSeeMore.bind(this);
        this.handleDOMContentLoaded = this.handleDOMContentLoaded.bind(this);

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
            this.handleError('Erro ao carregar produtos. Tente novamente mais tarde.');
            return [];
        }
    }

    // ============================================
    // FORMATAÇÃO E UTILIDADES
    // ============================================

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

    getCategoryClass(category) {
        if (!category || typeof category !== 'string') {
            return 'categoria-padrao';
        }

        return category.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[çÇ]/g, 'c')
            .replace(/[ãÃ]/g, 'a')
            .replace(/[õÕ]/g, 'o')
            .replace(/[áÁàÀâÂ]/g, 'a')
            .replace(/[éÉêÊ]/g, 'e')
            .replace(/[íÍîÎ]/g, 'i')
            .replace(/[óÓôÔ]/g, 'o')
            .replace(/[úÚûÛ]/g, 'u')
            .replace(/[^a-z0-9-]/g, '');
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

    generateStarsHTML(rating, showEmpty = true) {
        const safeRating = Math.max(0, Math.min(5, rating || 0));
        const fullStars = Math.floor(safeRating);
        const hasHalfStar = safeRating % 1 >= 0.5;
        const emptyStars = showEmpty ? 5 - fullStars - (hasHalfStar ? 1 : 0) : 0;

        let starsHTML = '';

        // Estrelas preenchidas
        starsHTML += '<i class="fas fa-star star filled"></i>'.repeat(fullStars);

        // Meia estrela
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt star filled"></i>';
        }

        // Estrelas vazias
        if (showEmpty && emptyStars > 0) {
            starsHTML += '<i class="far fa-star star"></i>'.repeat(emptyStars);
        }

        return starsHTML;
    }

    createRatingHTML(productId) {
        const averageRating = this.calculateAverageRating(productId);
        const ratingsCount = this.getProductRatings(productId).length;

        if (averageRating > 0) {
            return `
                <div class="product-rating">
                    <div class="stars-display">
                        ${this.generateStarsHTML(averageRating)}
                    </div>
                    <span class="rating-info">
                        ${averageRating.toFixed(1)} (${ratingsCount} avaliação${ratingsCount !== 1 ? 'ões' : ''})
                    </span>
                </div>
            `;
        }

        return `
            <div class="product-rating">
                <div class="stars-display">
                    ${this.generateStarsHTML(0)}
                </div>
                <span class="rating-info">Sem avaliações</span>
            </div>
        `;
    }

    // ============================================
    // SISTEMA DE FAVORITOS
    // ============================================

    getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('favoriteProducts') || '[]');
        } catch (error) {
            console.warn('Erro ao ler favoritos do localStorage:', error);
            return [];
        }
    }

    isProductFavorited(productId) {
        const favorites = this.getFavorites();
        return favorites.some(fav => fav.id === productId);
    }

    initializeFavoritesState() {
        try {
            const favorites = this.getFavorites();

            // Atualizar todos os botões de favorito
            document.querySelectorAll('.btn-favorite').forEach(button => {
                const productId = button.closest('.product-card').getAttribute('data-product-id');
                const isFavorited = favorites.some(fav => fav.id === productId);

                const heartIcon = button.querySelector('i');

                if (isFavorited) {
                    heartIcon.className = 'fas fa-heart';
                    button.classList.add('favorited');
                    button.title = 'Remover dos favoritos';
                    button.setAttribute('aria-label', 'Remover dos favoritos');
                } else {
                    heartIcon.className = 'far fa-heart';
                    button.classList.remove('favorited');
                    button.title = 'Favoritar';
                    button.setAttribute('aria-label', 'Adicionar aos favoritos');
                }
            });

        } catch (error) {
            console.error('Erro ao inicializar estado dos favoritos:', error);
        }
    }

    // ============================================
    // CRIAÇÃO DE HTML DOS PRODUTOS
    // ============================================

    createProductHTML(product) {
        if (!product || !product.id) {
            console.warn('Produto inválido:', product);
            return '';
        }

        const {
            id = '',
            image = 'https://placehold.co/600x400.png',
            title = 'Produto sem nome',
            category = 'Geral',
            description_small = 'Sem descrição',
            price = 0
        } = product;

        const sanitizedTitle = this.sanitizeString(title);
        const categoryClass = this.getCategoryClass(category);
        const formattedPrice = this.formatPrice(price);
        const ratingHTML = this.createRatingHTML(id);

        // Verificar se produto está favoritado
        const isFavorited = this.isProductFavorited(id);
        const heartClass = isFavorited ? 'fas fa-heart' : 'far fa-heart';
        const favoritedClass = isFavorited ? 'favorited' : '';
        const favoriteTitle = isFavorited ? 'Remover dos favoritos' : 'Favoritar';
        const favoriteAriaLabel = isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos';

        return `
            <div class="col-lg-3 col-md-6 col-sm-12">
                <div class="card product-card border-0 shadow-sm" data-product-id="${id}">
                    <div class="card-image-container">
                        <img
                            src="${image}"
                            class="card-img-top product-image"
                            alt="${sanitizedTitle}"
                            loading="lazy"
                            onerror="this.src='https://placehold.co/600x400.png'">
                        <div class="card-actions">
                            <button class="btn-favorite ${favoritedClass}"
                                data-product-id="${id}"
                                data-product-title="${sanitizedTitle}"
                                title="${favoriteTitle}"
                                aria-label="${favoriteAriaLabel}">
                                <i class="${heartClass}"></i>
                            </button>
                        </div>
                        <span class="badge-destaque ${categoryClass}">
                            ${category}
                        </span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="product-title">${title}</h5>
                        ${ratingHTML}
                        <p class="product-description">${description_small}</p>
                        <div class="price mb-3" aria-label="Preço do produto">
                            R$ <span class="price-value">${formattedPrice}</span>
                        </div>
                        <button class="btn btn-primary btn-see-more mt-auto" 
                                data-product-id="${id}"
                                aria-label="Ver mais detalhes do produto">
                            Ver Mais
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // FILTRAGEM E BUSCA
    // ============================================

    filterProducts(products, searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            return products;
        }

        const normalizedSearch = searchTerm.toLowerCase().trim();

        return products.filter(product => {
            const searchableText = [
                product.title || '',
                product.description_small || '',
                product.category || ''
            ].join(' ').toLowerCase();

            return searchableText.includes(normalizedSearch);
        });
    }

    // ============================================
    // RENDERIZAÇÃO E UI
    // ============================================

    showLoading(show = true) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    hideError() {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    handleError(message) {
        this.showLoading(false);

        const errorContainer = document.getElementById('error-container');
        const errorMessage = document.getElementById('error-message');

        if (errorContainer && errorMessage) {
            errorMessage.textContent = message;
            errorContainer.style.display = 'block';
        } else {
            console.error(message);
        }
    }

    renderNoResults(searchTerm) {
        const container = document.getElementById('products-container');
        if (!container) return;

        container.innerHTML = `
            <div class="col-12">
                <div class="no-results">
                    <i class="fas fa-search" aria-hidden="true"></i>
                    <h3>Nenhum produto encontrado</h3>
                    <p>Não encontramos produtos que correspondam à sua busca: "<strong>${this.sanitizeString(searchTerm)}</strong>"</p>
                    <p>Tente buscar por outros termos ou navegue por todos os produtos.</p>
                </div>
            </div>
        `;
        container.style.display = 'flex';
    }

    async renderProducts(searchTerm = '') {
        try {
            this.showLoading(true);
            this.hideError();
            this.currentSearchTerm = searchTerm;

            // Carregar produtos se necessário
            if (this.products.length === 0) {
                this.products = await this.loadProducts();

                if (!this.products.length) {
                    this.handleError('Nenhum produto encontrado.');
                    return;
                }
            }

            this.showLoading(false);

            // Filtrar produtos
            const filteredProducts = this.filterProducts(this.products, searchTerm);

            // Verificar se não há resultados
            if (searchTerm && filteredProducts.length === 0) {
                this.renderNoResults(searchTerm);
                return;
            }

            // Renderizar produtos
            const container = document.getElementById('products-container');
            if (!container) {
                throw new Error('Container de produtos não encontrado');
            }

            // Usar DocumentFragment para melhor performance
            const fragment = document.createDocumentFragment();
            const tempDiv = document.createElement('div');

            const productsHTML = filteredProducts
                .map(product => this.createProductHTML(product))
                .join('');

            tempDiv.innerHTML = productsHTML;

            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            container.innerHTML = '';
            container.appendChild(fragment);
            container.style.display = 'flex';

            // Observar animações
            this.observeProductCards();

            // Inicializar estado dos favoritos
            setTimeout(() => this.initializeFavoritesState(), 100);

            console.log(`✅ ${filteredProducts.length} produtos exibidos${searchTerm ? ` (filtrados por: "${searchTerm}")` : ''}`);

        } catch (error) {
            console.error('Erro ao renderizar produtos:', error);
            this.handleError('Erro ao carregar produtos. Tente novamente mais tarde.');
        }
    }

    observeProductCards() {
        if (this.observer) {
            const cards = document.querySelectorAll('.product-card');
            cards.forEach(card => this.observer.observe(card));
        }
    }

    // ============================================
    // NAVEGAÇÃO E EVENTOS
    // ============================================

    getSearchFromUrl() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('search')?.trim() || '';
        } catch (error) {
            console.warn('Erro ao ler parâmetros da URL:', error);
            return '';
        }
    }

    handleSeeMore(event) {
        const productId = event.target.getAttribute('data-product-id');

        if (!productId) {
            console.warn('ID do produto não encontrado');
            return;
        }

        try {
            // Mostrar loader antes da navegação
            if (typeof navigationLoader !== 'undefined') {
                navigationLoader.show();
            }

            // Adicionar um pequeno delay para garantir que o loader seja visível
            setTimeout(() => {
                window.location.href = `product-detail.html?id=${encodeURIComponent(productId)}`;
            }, 100);

        } catch (error) {
            console.error('Erro ao navegar para detalhes do produto:', error);
            if (typeof navigationLoader !== 'undefined') {
                navigationLoader.hide(); // Esconder loader em caso de erro
            }
        }
    }

    handleToggleFavorite(event) {
        // Prevenir event bubbling
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const button = event.currentTarget;
        const productId = button.getAttribute('data-product-id');
        const productTitle = button.getAttribute('data-product-title');

        if (!productId || !productTitle) {
            console.warn('Dados do produto não encontrados');
            return;
        }

        try {
            const heartIcon = button.querySelector('i');
            let favorites = this.getFavorites();

            // Verificar se já está favoritado
            const isFavorited = favorites.some(fav => fav.id === productId);

            if (isFavorited) {
                // Remover dos favoritos
                favorites = favorites.filter(fav => fav.id !== productId);

                // Atualizar visual
                heartIcon.className = 'far fa-heart';
                button.classList.remove('favorited');
                button.title = 'Favoritar';
                button.setAttribute('aria-label', 'Adicionar aos favoritos');

                // Mostrar feedback
                this.showToast(`${productTitle} removido dos favoritos`, 'info');

            } else {
                // Adicionar aos favoritos
                favorites.push({
                    id: productId,
                    title: productTitle,
                    timestamp: Date.now()
                });

                // Atualizar visual
                heartIcon.className = 'fas fa-heart';
                button.classList.add('favorited');
                button.title = 'Remover dos favoritos';
                button.setAttribute('aria-label', 'Remover dos favoritos');

                // Mostrar feedback
                this.showToast(`${productTitle} adicionado aos favoritos`, 'success');
            }

            // Salvar no localStorage
            localStorage.setItem('favoriteProducts', JSON.stringify(favorites));

            // Disparar evento personalizado para outros componentes
            document.dispatchEvent(new CustomEvent('favoritesChanged', {
                detail: { productId, isFavorited: !isFavorited, favorites }
            }));

        } catch (error) {
            console.error('Erro ao processar favorito:', error);
            this.showToast('Erro ao processar favorito. Tente novamente.', 'error');
        }
    }

    showToast(message, type = 'info') {
        // Remover toast anterior se existir
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Criar elemento de toast
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;

        // Adicionar estilos CSS se não existirem
        if (!document.querySelector('#toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #fff;
                    border-radius: 8px;
                    padding: 12px 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 250px;
                    animation: slideInRight 0.3s ease-out;
                    border-left: 4px solid #007bff;
                }
                
                .toast-success { border-left-color: #28a745; color: #28a745; }
                .toast-error { border-left-color: #dc3545; color: #dc3545; }
                .toast-info { border-left-color: #17a2b8; color: #17a2b8; }
                
                .btn-favorite.favorited i {
                    color: #dc3545;
                }
                
                .btn-favorite {
                    background: rgba(255, 255, 255, 0.9);
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .btn-favorite:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: scale(1.1);
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Adicionar ao DOM
        document.body.appendChild(toast);

        // Remover após 3 segundos
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    setupEventListeners() {
        // Event delegation para botões "Ver Mais" e "Favoritar"
        document.addEventListener('click', (event) => {
            // Verificar se clicou no botão "Ver Mais"
            if (event.target.classList.contains('btn-see-more')) {
                event.preventDefault();
                event.stopPropagation();
                this.handleSeeMore(event);
                return;
            }

            // Verificar se clicou no botão de favoritar
            if (event.target.classList.contains('btn-favorite') ||
                event.target.closest('.btn-favorite')) {

                const button = event.target.classList.contains('btn-favorite')
                    ? event.target
                    : event.target.closest('.btn-favorite');

                // Criar um evento personalizado para o botão
                const customEvent = Object.create(event);
                customEvent.currentTarget = button;

                this.handleToggleFavorite(customEvent);
                return;
            }
        }, true); // Usar capture phase para garantir que seja executado primeiro
    }

    // ============================================
    // INICIALIZAÇÃO PRINCIPAL
    // ============================================

    async handleDOMContentLoaded() {
        try {
            const searchTerm = this.getSearchFromUrl();

            // Configurar input de busca se existir
            if (searchTerm) {
                this.updateSearchInput(searchTerm);
            }

            // Renderizar produtos
            await this.renderProducts(searchTerm);

            // Configurar event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.handleError('Erro ao inicializar a aplicação.');
        }
    }

    updateSearchInput(searchTerm) {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearBtn');

        if (searchInput) {
            searchInput.value = searchTerm;
        }

        if (clearBtn) {
            clearBtn.style.display = searchTerm ? 'block' : 'none';
        }
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    /**
     * Método público para buscar produtos
     * @param {string} searchTerm - Termo de busca
     */
    async search(searchTerm) {
        await this.renderProducts(searchTerm);
    }

    /**
     * Método público para recarregar produtos
     */
    async reload() {
        this.products = [];
        this.cache.clear();
        await this.renderProducts(this.currentSearchTerm);
    }

    /**
     * Método público para obter estatísticas
     */
    getStats() {
        return {
            totalProducts: this.products.length,
            currentSearch: this.currentSearchTerm,
            cacheSize: this.cache.size,
            favoritesCount: this.getFavorites().length
        };
    }

    /**
     * Método público para obter favoritos
     */
    getFavoriteProducts() {
        const favorites = this.getFavorites();
        return this.products.filter(product =>
            favorites.some(fav => fav.id === product.id)
        );
    }
}

// ============================================
// FUNÇÕES GLOBAIS PARA COMPATIBILIDADE
// ============================================

/**
 * Função global de compatibilidade para favoritar (caso seja necessária)
 * @param {HTMLElement} button - O botão de favoritar clicado
 * @param {string} productTitle - Título do produto
 */
function toggleFavorite(button, productTitle) {
    // Esta função agora é tratada pelo event delegation na classe
    // Manter aqui apenas para compatibilidade com código legado
    if (window.productsManager) {
        const customEvent = {
            preventDefault: () => { },
            stopPropagation: () => { },
            stopImmediatePropagation: () => { },
            currentTarget: button
        };
        window.productsManager.handleToggleFavorite(customEvent);
    }
}

// ============================================
// INICIALIZAÇÃO GLOBAL
// ============================================

// Instância global do gerenciador
window.productsManager = new ProductsManager();

// Funções globais para compatibilidade
window.renderProducts = (searchTerm) => window.productsManager.search(searchTerm);
window.reloadProducts = () => window.productsManager.reload();
window.getStats = () => window.productsManager.getStats();
window.getFavoriteProducts = () => window.productsManager.getFavoriteProducts();