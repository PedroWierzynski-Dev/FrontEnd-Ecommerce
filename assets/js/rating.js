/**
 * Ratings Manager - Sistema completo de avaliações de produtos
 * @author Desenvolvedor Pedro Wierzynski
 * @version 2.0.0
 */

class RatingsManager {
    constructor() {
        this.selectedRating = 0;
        this.hasUserRated = false;
        this.currentProductId = null;
        this.cache = new Map();

        // Configurações
        this.config = {
            CACHE_DURATION: 60 * 1000, // 1 minuto
            MAX_RATING: 5,
            MIN_RATING: 1,
            STORAGE_KEYS: {
                ALL_RATINGS: 'productRatings',
                USER_RATINGS: 'userRatings'
            },
            RATING_LABELS: [
                'Clique para avaliar',
                'Muito ruim',
                'Ruim',
                'Regular',
                'Bom',
                'Excelente'
            ],
            SUCCESS_TIMEOUT: 3000
        };

        // Bind methods para manter contexto
        this.handleStarClick = this.handleStarClick.bind(this);
        this.handleStarMouseEnter = this.handleStarMouseEnter.bind(this);
        this.handleStarMouseLeave = this.handleStarMouseLeave.bind(this);
        this.handleSubmitRating = this.handleSubmitRating.bind(this);
    }

    // ============================================
    // GERENCIAMENTO DE DADOS E CACHE
    // ============================================

    /**
     * Obtém dados do localStorage com tratamento de erro
     */
    getStorageData(key, defaultValue = {}) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.warn(`Erro ao ler dados do localStorage (${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * Salva dados no localStorage com tratamento de erro
     */
    setStorageData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Erro ao salvar dados no localStorage (${key}):`, error);
            return false;
        }
    }

    /**
     * Limpa cache de um produto específico
     */
    clearProductCache(productId) {
        const keysToRemove = Array.from(this.cache.keys())
            .filter(key => key.includes(productId));

        keysToRemove.forEach(key => this.cache.delete(key));
    }

    // ============================================
    // OPERAÇÕES DE AVALIAÇÃO
    // ============================================

    /**
     * Salva a avaliação do usuário
     */
    saveRating(productId, rating) {
        if (!this.isValidProductId(productId) || !this.isValidRating(rating)) {
            console.error('Parâmetros inválidos para salvar avaliação:', { productId, rating });
            return false;
        }

        try {
            const allRatings = this.getStorageData(this.config.STORAGE_KEYS.ALL_RATINGS);
            const userRatings = this.getStorageData(this.config.STORAGE_KEYS.USER_RATINGS);

            // Remove avaliação anterior se existir
            if (userRatings[productId]) {
                this.removeOldRating(allRatings, productId, userRatings[productId]);
            }

            // Adiciona nova avaliação
            if (!allRatings[productId]) {
                allRatings[productId] = [];
            }

            allRatings[productId].push(rating);
            userRatings[productId] = rating;

            // Salva no localStorage
            const saveSuccess = this.setStorageData(this.config.STORAGE_KEYS.ALL_RATINGS, allRatings) &&
                this.setStorageData(this.config.STORAGE_KEYS.USER_RATINGS, userRatings);

            if (saveSuccess) {
                this.clearProductCache(productId);
                return true;
            }

            return false;

        } catch (error) {
            console.error('Erro ao salvar avaliação:', error);
            return false;
        }
    }

    /**
     * Remove avaliação anterior do usuário
     */
    removeOldRating(allRatings, productId, oldRating) {
        if (!allRatings[productId]) return;

        const productRatings = allRatings[productId];
        const index = productRatings.indexOf(oldRating);

        if (index > -1) {
            productRatings.splice(index, 1);
            allRatings[productId] = productRatings;
        }
    }

    /**
     * Verifica se o usuário já avaliou o produto
     */
    hasUserRatedProduct(productId) {
        if (!this.isValidProductId(productId)) return false;

        const cacheKey = `hasRated_${productId}`;

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.CACHE_DURATION) {
                return cached.data;
            }
        }

        const userRatings = this.getStorageData(this.config.STORAGE_KEYS.USER_RATINGS);
        const hasRated = userRatings[productId] !== undefined;

        this.cache.set(cacheKey, {
            data: hasRated,
            timestamp: Date.now()
        });

        return hasRated;
    }

    /**
     * Obtém a avaliação do usuário para o produto
     */
    getUserRating(productId) {
        if (!this.isValidProductId(productId)) return 0;

        const userRatings = this.getStorageData(this.config.STORAGE_KEYS.USER_RATINGS);
        const rating = userRatings[productId] || 0;

        return this.isValidRating(rating) ? rating : 0;
    }

    /**
     * Obtém todas as avaliações de um produto
     */
    getProductRatings(productId) {
        if (!this.isValidProductId(productId)) return [];

        const cacheKey = `ratings_${productId}`;

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.CACHE_DURATION) {
                return cached.data;
            }
        }

        const allRatings = this.getStorageData(this.config.STORAGE_KEYS.ALL_RATINGS);
        const ratings = (allRatings[productId] || []).filter(rating => this.isValidRating(rating));

        this.cache.set(cacheKey, {
            data: ratings,
            timestamp: Date.now()
        });

        return ratings;
    }

    // ============================================
    // CÁLCULOS E ESTATÍSTICAS
    // ============================================

    /**
     * Calcula a média das avaliações
     */
    calculateAverageRating(productId) {
        const ratings = this.getProductRatings(productId);

        if (ratings.length === 0) return 0;

        const sum = ratings.reduce((acc, rating) => acc + rating, 0);
        const average = sum / ratings.length;

        return Math.round(average * 10) / 10; // Arredonda para 1 casa decimal
    }

    /**
     * Calcula a distribuição das avaliações
     */
    calculateRatingDistribution(productId) {
        const ratings = this.getProductRatings(productId);
        const distribution = new Array(this.config.MAX_RATING).fill(0);

        ratings.forEach(rating => {
            if (this.isValidRating(rating)) {
                distribution[rating - 1]++;
            }
        });

        return distribution;
    }

    /**
     * Obtém estatísticas completas do produto
     */
    getProductStats(productId) {
        const ratings = this.getProductRatings(productId);
        const distribution = this.calculateRatingDistribution(productId);

        return {
            totalRatings: ratings.length,
            averageRating: this.calculateAverageRating(productId),
            distribution,
            hasUserRated: this.hasUserRatedProduct(productId),
            userRating: this.getUserRating(productId)
        };
    }

    // ============================================
    // GERAÇÃO DE HTML
    // ============================================

    /**
     * Gera HTML das estrelas
     */
    generateStarsHTML(rating, interactive = false) {
        const safeRating = Math.max(0, Math.min(this.config.MAX_RATING, rating || 0));
        const fullStars = Math.floor(safeRating);
        const hasHalfStar = safeRating % 1 >= 0.5;
        const emptyStars = this.config.MAX_RATING - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';

        // Estrelas preenchidas
        for (let i = 0; i < fullStars; i++) {
            starsHTML += `<i class="fas fa-star star filled${interactive ? ' interactive' : ''}" data-rating="${i + 1}"></i>`;
        }

        // Meia estrela
        if (hasHalfStar) {
            starsHTML += `<i class="fas fa-star-half-alt star filled${interactive ? ' interactive' : ''}" data-rating="${fullStars + 1}"></i>`;
        }

        // Estrelas vazias
        for (let i = 0; i < emptyStars; i++) {
            const rating = fullStars + (hasHalfStar ? 1 : 0) + i + 1;
            starsHTML += `<i class="far fa-star star${interactive ? ' interactive' : ''}" data-rating="${rating}"></i>`;
        }

        return starsHTML;
    }

    /**
     * Renderiza a distribuição de avaliações
     */
    renderRatingDistribution(productId) {
        const container = document.getElementById('rating-distribution');
        if (!container) return;

        const distribution = this.calculateRatingDistribution(productId);
        const total = distribution.reduce((sum, count) => sum + count, 0);

        if (total === 0) {
            container.innerHTML = '<p class="no-ratings">Ainda não há avaliações para este produto.</p>';
            return;
        }

        let distributionHTML = `
            <h5 class="distribution-title">
                Distribuição das avaliações:
            </h5>
        `;

        // Renderizar do maior para o menor (5 para 1 estrelas)
        for (let i = this.config.MAX_RATING - 1; i >= 0; i--) {
            const count = distribution[i];
            const percentage = (count / total) * 100;
            const stars = i + 1;

            distributionHTML += `
                <div class="distribution-item" data-stars="${stars}">
                    <div class="distribution-stars">
                        <span class="star-number">${stars}</span>
                        <i class="fas fa-star star filled"></i>
                    </div>
                    <div class="distribution-bar">
                        <div class="distribution-fill" 
                             style="width: ${percentage}%" 
                             title="${percentage.toFixed(1)}%"></div>
                    </div>
                    <div class="distribution-count">${count}</div>
                </div>
            `;
        }

        container.innerHTML = distributionHTML;
    }

    // ============================================
    // ATUALIZAÇÃO DA INTERFACE
    // ============================================

    /**
     * Atualiza o display das avaliações
     */
    updateRatingDisplay(productId) {
        const stats = this.getProductStats(productId);

        this.updateCurrentStars(stats.averageRating);
        this.updateRatingAverage(stats.averageRating);
        this.updateRatingCount(stats.totalRatings);
        this.renderRatingDistribution(productId);
    }

    /**
     * Atualiza as estrelas principais
     */
    updateCurrentStars(averageRating) {
        const container = document.getElementById('current-stars');
        if (container) {
            container.innerHTML = this.generateStarsHTML(averageRating);
        }
    }

    /**
     * Atualiza a média das avaliações
     */
    updateRatingAverage(averageRating) {
        const element = document.getElementById('rating-average');
        if (element) {
            element.textContent = averageRating > 0 ? averageRating.toFixed(1) : '0.0';
        }
    }

    /**
     * Atualiza o contador de avaliações
     */
    updateRatingCount(count) {
        const element = document.getElementById('rating-count');
        if (!element) return;

        if (count === 0) {
            element.textContent = 'Nenhuma avaliação';
        } else {
            element.textContent = `${count} avaliação${count !== 1 ? 'ões' : ''}`;
        }
    }

    /**
     * Atualiza as estrelas interativas
     */
    updateInteractiveStars(rating) {
        const stars = document.querySelectorAll('#rating-stars .star');
        const label = document.getElementById('rating-label');
        const submitBtn = document.getElementById('submit-rating');

        stars.forEach((star, index) => {
            const starRating = index + 1;
            if (starRating <= rating) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });

        this.updateRatingLabel(rating, label);
        this.updateSubmitButton(rating, submitBtn);
    }

    /**
     * Atualiza o label da avaliação
     */
    updateRatingLabel(rating, labelElement) {
        if (!labelElement) return;

        const safeRating = Math.max(0, Math.min(this.config.RATING_LABELS.length - 1, rating));
        labelElement.textContent = this.config.RATING_LABELS[safeRating];
    }

    /**
     * Atualiza o botão de envio
     */
    updateSubmitButton(rating, submitBtn) {
        if (!submitBtn) return;

        submitBtn.disabled = !this.isValidRating(rating);

        if (this.hasUserRated) {
            submitBtn.innerHTML = '<i class="fas fa-edit"></i> Atualizar Avaliação';
        } else {
            submitBtn.innerHTML = '<i class="fas fa-star"></i> Enviar Avaliação';
        }
    }

    // ============================================
    // MANIPULADORES DE EVENTOS
    // ============================================

    /**
     * Manipula clique nas estrelas
     */
    handleStarClick(event) {
        const rating = parseInt(event.target.getAttribute('data-rating'));
        if (this.isValidRating(rating)) {
            this.selectedRating = rating;
            this.updateInteractiveStars(rating);
        }
    }

    /**
     * Manipula hover nas estrelas
     */
    handleStarMouseEnter(event) {
        if (this.hasUserRated) return;

        const rating = parseInt(event.target.getAttribute('data-rating'));
        if (this.isValidRating(rating)) {
            this.updateInteractiveStars(rating);
        }
    }

    /**
     * Manipula saída do mouse das estrelas
     */
    handleStarMouseLeave() {
        this.updateInteractiveStars(this.selectedRating);
    }

    /**
     * Manipula envio da avaliação
     */
    async handleSubmitRating() {
        if (!this.isValidRating(this.selectedRating)) {
            this.showAlert('error', 'Erro', 'Por favor, selecione uma avaliação válida.');
            return;
        }

        try {
            const success = this.saveRating(this.currentProductId, this.selectedRating);

            if (success) {
                this.updateRatingDisplay(this.currentProductId);
                this.showRatingSuccess();
                this.updateUserRatedState();
                this.showAlert('success', 'Avaliação Enviada', 'Obrigado por avaliar este produto!');
            } else {
                throw new Error('Falha ao salvar avaliação');
            }

        } catch (error) {
            console.error('Erro ao enviar avaliação:', error);
            this.showAlert('error', 'Erro', 'Não foi possível salvar sua avaliação. Tente novamente.');
        }
    }

    /**
     * Atualiza o estado após avaliação do usuário
     */
    updateUserRatedState() {
        this.hasUserRated = true;

        const rateSection = document.querySelector('.rate-product h4');
        if (rateSection) {
            rateSection.textContent = 'Sua avaliação:';
        }

        const submitBtn = document.getElementById('submit-rating');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-edit"></i> Atualizar Avaliação';
        }
    }

    // ============================================
    // CONFIGURAÇÃO DE EVENTOS
    // ============================================

    /**
     * Configura os eventos das estrelas interativas
     */
    setupStarEvents() {
        const starsContainer = document.getElementById('rating-stars');
        if (!starsContainer) return;

        // Event delegation para as estrelas
        starsContainer.addEventListener('click', this.handleStarClick);
        starsContainer.addEventListener('mouseover', this.handleStarMouseEnter);
        starsContainer.addEventListener('mouseleave', this.handleStarMouseLeave);
    }

    /**
     * Configura o evento do botão de envio
     */
    setupSubmitEvent() {
        const submitBtn = document.getElementById('submit-rating');
        if (submitBtn) {
            submitBtn.addEventListener('click', this.handleSubmitRating);
        }
    }

    /**
     * Remove todos os event listeners
     */
    removeEventListeners() {
        const starsContainer = document.getElementById('rating-stars');
        if (starsContainer) {
            starsContainer.removeEventListener('click', this.handleStarClick);
            starsContainer.removeEventListener('mouseover', this.handleStarMouseEnter);
            starsContainer.removeEventListener('mouseleave', this.handleStarMouseLeave);
        }

        const submitBtn = document.getElementById('submit-rating');
        if (submitBtn) {
            submitBtn.removeEventListener('click', this.handleSubmitRating);
        }
    }

    // ============================================
    // FEEDBACK E NOTIFICAÇÕES
    // ============================================

    /**
     * Mostra mensagem de sucesso
     */
    showRatingSuccess() {
        const successElement = document.getElementById('rating-success');
        if (!successElement) return;

        successElement.classList.add('show');

        setTimeout(() => {
            successElement.classList.remove('show');
        }, this.config.SUCCESS_TIMEOUT);
    }

    /**
     * Mostra alerta personalizado
     */
    showAlert(type, title, message) {
        // Implementação básica - pode ser expandida conforme necessário
        if (typeof window.showAlert === 'function') {
            window.showAlert(type, title, message);
        } else {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }

    // ============================================
    // VALIDAÇÃO E UTILITÁRIOS
    // ============================================

    /**
     * Valida se o rating está dentro dos limites
     */
    isValidRating(rating) {
        return typeof rating === 'number' &&
            rating >= this.config.MIN_RATING &&
            rating <= this.config.MAX_RATING;
    }

    /**
     * Valida se o ID do produto é válido
     */
    isValidProductId(productId) {
        return productId && (typeof productId === 'string' || typeof productId === 'number');
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    /**
     * Inicializa o sistema de avaliações para um produto
     */
    initializeRating(productId) {
        if (!this.isValidProductId(productId)) {
            console.error('ID do produto inválido:', productId);
            return false;
        }

        try {
            this.currentProductId = productId;
            this.hasUserRated = this.hasUserRatedProduct(productId);

            // Atualizar display
            this.updateRatingDisplay(productId);

            // Configurar estrelas interativas
            if (this.hasUserRated) {
                this.selectedRating = this.getUserRating(productId);
                this.updateInteractiveStars(this.selectedRating);
                this.updateUserRatedState();
            } else {
                this.selectedRating = 0;
                this.updateInteractiveStars(0);
            }

            // Configurar eventos
            this.removeEventListeners(); // Remove listeners antigos
            this.setupStarEvents();
            this.setupSubmitEvent();

            return true;

        } catch (error) {
            console.error('Erro ao inicializar avaliações:', error);
            return false;
        }
    }

    /**
     * Limpa todos os dados de avaliações
     */
    clearAllRatings() {
        try {
            localStorage.removeItem(this.config.STORAGE_KEYS.ALL_RATINGS);
            localStorage.removeItem(this.config.STORAGE_KEYS.USER_RATINGS);
            this.cache.clear();
            return true;
        } catch (error) {
            console.error('Erro ao limpar avaliações:', error);
            return false;
        }
    }

    /**
     * Exporta dados de avaliações
     */
    exportRatings() {
        return {
            allRatings: this.getStorageData(this.config.STORAGE_KEYS.ALL_RATINGS),
            userRatings: this.getStorageData(this.config.STORAGE_KEYS.USER_RATINGS),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Obtém estatísticas gerais
     */
    getGeneralStats() {
        const allRatings = this.getStorageData(this.config.STORAGE_KEYS.ALL_RATINGS);
        const userRatings = this.getStorageData(this.config.STORAGE_KEYS.USER_RATINGS);

        const totalProducts = Object.keys(allRatings).length;
        const totalRatings = Object.values(allRatings).reduce((sum, ratings) => sum + ratings.length, 0);
        const userRatedProducts = Object.keys(userRatings).length;

        return {
            totalProducts,
            totalRatings,
            userRatedProducts,
            cacheSize: this.cache.size
        };
    }

    /**
     * Destrói a instância e limpa recursos
     */
    destroy() {
        this.removeEventListeners();
        this.cache.clear();
        this.currentProductId = null;
        this.selectedRating = 0;
        this.hasUserRated = false;
    }
}

// ============================================
// INICIALIZAÇÃO GLOBAL
// ============================================

// Instância global do gerenciador
window.ratingsManager = new RatingsManager();

// Funções globais para compatibilidade
window.initializeRating = (productId) => window.ratingsManager.initializeRating(productId);
window.calculateAverageRating = (productId) => window.ratingsManager.calculateAverageRating(productId);
window.getProductRatings = (productId) => window.ratingsManager.getProductRatings(productId);
window.generateStarsHTML = (rating, interactive) => window.ratingsManager.generateStarsHTML(rating, interactive);
