/**
 * Enhanced Utils Manager - Sistema otimizado de utilidades, favoritos e loaders
 * @author Pedro Wierzynski
 * @version 2.0.0
 */

class EnhancedUtilsManager {
    constructor() {
        this.favoritesList = new Set();
        this.searchTimeout = null;
        this.observers = new Map();
        this.cache = new Map();
        this.isInitialized = false;

        // Bind methods para manter contexto
        this.handleDOMContentLoaded = this.handleDOMContentLoaded.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleSearchSubmit = this.handleSearchSubmit.bind(this);
        this.handleClearSearch = this.handleClearSearch.bind(this);

        this.init();
    }

    // ============================================
    // INICIALIZAÇÃO E CONFIGURAÇÃO
    // ============================================

    init() {
        if (this.isInitialized) return;

        document.addEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
        this.setupIntersectionObserver();
        this.loadFavoritesFromStorage();

        this.isInitialized = true;
    }

    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            const observerConfig = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            this.observers.set('animation', new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-on-scroll', 'fade-in');
                    }
                });
            }, observerConfig));
        }
    }

    // ============================================
    // SISTEMA DE FAVORITOS OTIMIZADO
    // ============================================

    loadFavoritesFromStorage() {
        try {
            const stored = localStorage.getItem('userFavorites');
            if (stored) {
                const favorites = JSON.parse(stored);
                this.favoritesList = new Set(Array.isArray(favorites) ? favorites : []);
            }
        } catch (error) {
            console.warn('Erro ao carregar favoritos do localStorage:', error);
            this.favoritesList = new Set();
        }
    }

    saveFavoritesToStorage() {
        try {
            const favoritesArray = Array.from(this.favoritesList);
            localStorage.setItem('userFavorites', JSON.stringify(favoritesArray));
        } catch (error) {
            console.warn('Erro ao salvar favoritos no localStorage:', error);
        }
    }

    toggleFavorite(button, productId, productName) {
        if (!button || !productId) {
            console.warn('Parâmetros inválidos para toggleFavorite');
            return false;
        }

        const icon = button.querySelector('i');
        const isFavorited = this.favoritesList.has(productId);

        if (isFavorited) {
            // Remove dos favoritos
            this.favoritesList.delete(productId);
            this.updateFavoriteButton(button, false);
            this.showAlert('info', 'Removido dos Favoritos',
                `${productName} foi removido da sua lista de favoritos.`);
        } else {
            // Adiciona aos favoritos
            this.favoritesList.add(productId);
            this.updateFavoriteButton(button, true);
            this.showAlert('success', 'Adicionado aos Favoritos',
                `${productName} foi adicionado à sua lista de favoritos!`);
        }

        this.saveFavoritesToStorage();
        return !isFavorited;
    }

    updateFavoriteButton(button, isFavorited) {
        const icon = button.querySelector('i');

        if (isFavorited) {
            button.classList.add('favorited');
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            button.classList.remove('favorited');
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    }

    initializeFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.btn-favorite');

        favoriteButtons.forEach(button => {
            const productCard = button.closest('.product-card');
            if (!productCard) return;

            const productId = productCard.dataset.productId;
            if (productId && this.favoritesList.has(productId)) {
                this.updateFavoriteButton(button, true);
            }
        });
    }

    // ============================================
    // SISTEMA DE ALERTAS OTIMIZADO
    // ============================================

    showAlert(type = 'info', title = 'Notificação', message = '', duration = 4000) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            console.warn('Container de alertas não encontrado');
            return null;
        }

        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-triangle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const alertHTML = this.createAlertHTML(alertId, type, title, message, iconMap[type] || iconMap.info);

        // Usar insertAdjacentHTML para melhor performance
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);

        const alertElement = document.getElementById(alertId);

        // Animação de entrada
        requestAnimationFrame(() => {
            alertElement.classList.add('show');
        });

        // Auto-remove com cleanup
        const timeoutId = setTimeout(() => {
            this.closeAlert(alertId);
        }, duration);

        // Armazenar timeout para possível cancelamento
        alertElement.dataset.timeoutId = timeoutId;

        return alertElement;
    }

    createAlertHTML(alertId, type, title, message, iconClass) {
        return `
            <div class="custom-alert ${type}" id="${alertId}">
                <div class="alert-content">
                    <div class="alert-icon">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="alert-text">
                        <div class="alert-title">${this.sanitizeHTML(title)}</div>
                        <p class="alert-message">${this.sanitizeHTML(message)}</p>
                    </div>
                    <button class="alert-close" 
                            onclick="window.utilsManager.closeAlert('${alertId}')"
                            aria-label="Fechar alerta">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    closeAlert(alertId) {
        const alert = document.getElementById(alertId);
        if (!alert) return;

        // Cancelar timeout se existir
        const timeoutId = alert.dataset.timeoutId;
        if (timeoutId) {
            clearTimeout(parseInt(timeoutId));
        }

        alert.classList.remove('show');

        // Usar transitionend para cleanup mais eficiente
        const handleTransitionEnd = () => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
            alert.removeEventListener('transitionend', handleTransitionEnd);
        };

        alert.addEventListener('transitionend', handleTransitionEnd);

        // Fallback timeout caso a transição não dispare
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 500);
    }

    // ============================================
    // SISTEMA DE BUSCA OTIMIZADO
    // ============================================

    initializeSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const clearBtn = document.getElementById('clearBtn');

        if (!searchInput || !searchBtn || !clearBtn) {
            console.warn('Elementos de busca não encontrados');
            return;
        }

        // Configurar event listeners com debounce
        searchInput.addEventListener('input', this.handleSearchInput);
        searchBtn.addEventListener('click', this.handleSearchSubmit);
        clearBtn.addEventListener('click', this.handleClearSearch);

        // Enter key handler
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSearchSubmit();
            }
        });

        console.log('Sistema de busca inicializado');
    }

    initializeSearchDetail() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const clearBtn = document.getElementById('clearBtn');

        if (!searchInput || !searchBtn || !clearBtn) return;

        const navigateToSearch = () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // Usar navigation loader se disponível
                if (window.navigationLoader) {
                    window.navigationLoader.show();
                }
                window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`;
            }
        };

        searchBtn.addEventListener('click', navigateToSearch);

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                navigateToSearch();
            }
        });

        searchInput.addEventListener('input', (e) => {
            const hasValue = e.target.value.trim().length > 0;
            clearBtn.style.display = hasValue ? 'block' : 'none';
        });

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
        });
    }

    handleSearchInput(event) {
        const searchTerm = event.target.value.trim();
        const clearBtn = document.getElementById('clearBtn');

        if (clearBtn) {
            clearBtn.style.display = searchTerm ? 'block' : 'none';
        }

        // Debounce para melhor performance
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(() => {
            if (window.productsManager) {
                window.productsManager.search(searchTerm);
            }
        }, 300);
    }

    handleSearchSubmit() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.trim();

        // Cancelar timeout pendente
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (window.productsManager) {
            window.productsManager.search(searchTerm);
        }
    }

    handleClearSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearBtn');

        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }

        if (clearBtn) {
            clearBtn.style.display = 'none';
        }

        if (window.productsManager) {
            window.productsManager.search('');
        }
    }

    // ============================================
    // UTILITÁRIOS GERAIS
    // ============================================

    sanitizeHTML(str) {
        if (typeof str !== 'string') return '';

        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    async copyToClipboard(text) {
        if (!text) return false;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback para navegadores mais antigos
                return this.fallbackCopyToClipboard(text);
            }
        } catch (error) {
            console.warn('Erro ao copiar para clipboard:', error);
            return this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';

            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            return successful;
        } catch (error) {
            console.warn('Fallback copy também falhou:', error);
            return false;
        }
    }

    isDetailPage() {
        return window.location.pathname.includes('product-detail.html');
    }

    observeElements(selector) {
        const animationObserver = this.observers.get('animation');
        if (!animationObserver) return;

        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            animationObserver.observe(element);
        });
    }

    // ============================================
    // INICIALIZAÇÃO PRINCIPAL
    // ============================================

    async handleDOMContentLoaded() {
        try {
            // Inicializar loaders se disponíveis
            if (window.interactiveLoader) {
                window.interactiveLoader.show();
                await window.interactiveLoader.simulateLoading(3000);
            }

            // Configurar busca baseado na página
            if (this.isDetailPage()) {
                this.initializeSearchDetail();
            } else {
                this.initializeSearch();
            }

            // Inicializar botões de favorito
            this.initializeFavoriteButtons();

            // Observar elementos para animações
            this.observeElements('.product-card, .animate-on-scroll');

            // Setup de event listeners globais
            this.setupGlobalEventListeners();

            console.log('✅ UtilsManager inicializado com sucesso');

        } catch (error) {
            console.error('Erro na inicialização do UtilsManager:', error);
        }
    }

    setupGlobalEventListeners() {
        // Event delegation para botões de favorito
        document.addEventListener('click', (event) => {
            if (event.target.closest('.btn-favorite')) {
                const button = event.target.closest('.btn-favorite');
                const productCard = button.closest('.product-card');

                if (productCard) {
                    const productId = productCard.dataset.productId;
                    const productName = productCard.querySelector('.product-title')?.textContent || 'Produto';

                    this.toggleFavorite(button, productId, productName);
                }
            }
        });

        // Cleanup de navegação
        window.addEventListener('load', () => {
            if (window.navigationLoader) {
                window.navigationLoader.hide();
            }
        });

        window.addEventListener('beforeunload', () => {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
        });
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    /**
     * Método público para mostrar alerta
     */
    alert(type, title, message, duration) {
        return this.showAlert(type, title, message, duration);
    }

    /**
     * Método público para verificar se produto é favorito
     */
    isFavorite(productId) {
        return this.favoritesList.has(productId);
    }

    /**
     * Método público para obter lista de favoritos
     */
    getFavorites() {
        return Array.from(this.favoritesList);
    }

    /**
     * Método público para copiar texto
     */
    async copy(text) {
        const success = await this.copyToClipboard(text);
        if (success) {
            this.showAlert('success', 'Copiado!', 'Texto copiado para a área de transferência.', 2000);
        } else {
            this.showAlert('error', 'Erro', 'Não foi possível copiar o texto.', 3000);
        }
        return success;
    }

    /**
     * Método público para obter estatísticas
     */
    getStats() {
        return {
            favoritesCount: this.favoritesList.size,
            observersCount: this.observers.size,
            cacheSize: this.cache.size,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Método público para limpar cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Cache do UtilsManager limpo');
    }
}

// ============================================
// CLASSES DE LOADER OTIMIZADAS
// ============================================

class InteractiveLoader {
    constructor() {
        this.loader = document.getElementById('interactiveLoader');
        this.progressBar = document.getElementById('interactiveProgressBar');
        this.progressPercentage = document.getElementById('interactiveProgressPercentage');
        this.loadingMessage = document.getElementById('interactiveLoadingMessage');
        this.progress = 0;
        this.isLoading = false;
        this.animationFrame = null;

        this.messages = [
            'Inicializando sistema...',
            'Carregando componentes...',
            'Preparando produtos...',
            'Configurando interface...',
            'Finalizando carregamento...',
            'Pronto!'
        ];
    }

    updateProgress(percentage, customMessage = null) {
        this.progress = Math.min(100, Math.max(0, percentage));

        // Usar RAF para animações suaves
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.animationFrame = requestAnimationFrame(() => {
            if (this.progressBar) {
                this.progressBar.style.width = `${this.progress}%`;
            }

            if (this.progressPercentage) {
                this.progressPercentage.textContent = `${Math.round(this.progress)}%`;
            }

            if (customMessage && this.loadingMessage) {
                this.loadingMessage.textContent = customMessage;
            } else {
                this.updateMessage();
            }
        });
    }

    updateMessage() {
        if (!this.loadingMessage) return;

        const messageIndex = Math.min(
            Math.floor((this.progress / 100) * (this.messages.length - 1)),
            this.messages.length - 1
        );

        this.loadingMessage.textContent = this.messages[messageIndex];
    }

    show() {
        if (this.loader && !this.isLoading) {
            this.loader.classList.remove('hidden');
            this.updateProgress(0);
            this.isLoading = true;
        }
    }

    hide() {
        if (this.loader && this.isLoading) {
            this.updateProgress(100, 'Concluído!');

            setTimeout(() => {
                if (this.loader) {
                    this.loader.classList.add('hidden');
                }
                this.isLoading = false;

                if (this.animationFrame) {
                    cancelAnimationFrame(this.animationFrame);
                }
            }, 800);
        }
    }

    async simulateLoading(duration = 3000) {
        if (!this.isLoading) return Promise.resolve();

        return new Promise((resolve) => {
            let progress = 0;
            const startTime = Date.now();

            const updateProgress = () => {
                const elapsed = Date.now() - startTime;
                const baseProgress = (elapsed / duration) * 100;

                // Adicionar variação natural
                if (progress < 90) {
                    progress = baseProgress + (Math.sin(elapsed * 0.01) * 2);
                } else {
                    progress += (100 - progress) * 0.05; // Slow down near end
                }

                this.updateProgress(Math.min(progress, 99));

                if (elapsed < duration && progress < 99) {
                    requestAnimationFrame(updateProgress);
                } else {
                    this.updateProgress(100, 'Concluído!');
                    setTimeout(() => {
                        this.hide();
                        resolve();
                    }, 500);
                }
            };

            requestAnimationFrame(updateProgress);
        });
    }
}

class NavigationLoader {
    constructor() {
        this.loader = document.getElementById('navigationLoader');
        this.isShowing = false;
        this.hideTimeout = null;
    }

    show() {
        if (this.loader && !this.isShowing) {
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }

            this.loader.classList.add('show');
            this.isShowing = true;
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        if (this.loader && this.isShowing) {
            // Pequeno delay para evitar flicker
            this.hideTimeout = setTimeout(() => {
                if (this.loader) {
                    this.loader.classList.remove('show');
                }
                this.isShowing = false;
                document.body.style.overflow = '';
                this.hideTimeout = null;
            }, 100);
        }
    }
}

// ============================================
// INICIALIZAÇÃO GLOBAL
// ============================================

// Instâncias globais
window.utilsManager = new EnhancedUtilsManager();
window.interactiveLoader = new InteractiveLoader();
window.navigationLoader = new NavigationLoader();

// Funções globais para compatibilidade (se necessário)
window.toggleFavorite = (button, productName) => {
    const productCard = button.closest('.product-card');
    if (productCard) {
        const productId = productCard.dataset.productId;
        window.utilsManager.toggleFavorite(button, productId, productName);
    }
};

window.showAlert = (type, title, message) => window.utilsManager.showAlert(type, title, message);
window.copyToClipboard = (text) => window.utilsManager.copy(text);
