// ========================================
// FAVORITE FUNCTIONALITY
// ========================================
function toggleFavorite(button, productName) {
    const icon = button.querySelector('i');
    const isFavorited = button.classList.contains('favorited');

    if (isFavorited) {
        // Remove dos favoritos
        button.classList.remove('favorited');
        icon.classList.remove('fas');
        icon.classList.add('far');
        showAlert('success', 'Removido dos Favoritos', `${productName} foi removido da sua lista de favoritos.`);
    } else {
        // Adiciona aos favoritos
        button.classList.add('favorited');
        icon.classList.remove('far');
        icon.classList.add('fas');
        showAlert('success', 'Adicionado aos Favoritos', `${productName} foi adicionado a  sua lista de favoritos!`);
    }
}

// ========================================
// ALERT SYSTEM
// ========================================
function showAlert(type, title, message) {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert_' + Date.now();

    const alertHtml = `
                <div class="custom-alert ${type}" id="${alertId}">
                    <div class="alert-content">
                        <div class="alert-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="alert-text">
                            <div class="alert-title">${title}</div>
                            <p class="alert-message">${message}</p>
                        </div>
                        <button class="alert-close" onclick="closeAlert('${alertId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;

    alertContainer.insertAdjacentHTML('beforeend', alertHtml);

    // Mostra o alerta
    setTimeout(() => {
        document.getElementById(alertId).classList.add('show');
    }, 100);

    // Auto remove apÃ³s 4 segundos
    setTimeout(() => {
        closeAlert(alertId);
    }, 4000);
}

function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.classList.remove('show');
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 400);
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (!searchInput || !searchBtn || !clearBtn) return;

    let searchTimeout;
    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.trim();

        if (searchTerm) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearchTerm = searchTerm;
            renderProducts(searchTerm);
        }, 300);
    });

    searchBtn.addEventListener('click', function () {
        const searchTerm = searchInput.value.trim();
        currentSearchTerm = searchTerm;
        renderProducts(searchTerm);
    });

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            currentSearchTerm = searchTerm;
            renderProducts(searchTerm);
        }
    });

    clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        this.style.display = 'none';
        currentSearchTerm = '';
        renderProducts('');
        searchInput.focus();
    });
}


function initializeSearchDetail() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (!searchInput || !searchBtn || !clearBtn) return;

    searchBtn.addEventListener('click', function () {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`;
        }
    });

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.trim();
        if (searchTerm) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
    });

    clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        this.style.display = 'none';
        searchInput.focus();
    });
}

function isDetailPage() {
    return window.location.pathname.includes('product-detail.html');
}

// ========================================
// INTERACTIVE LOADER - VERSÃO CORRIGIDA
// ========================================
class InteractiveLoader {
    constructor() {
        this.loader = document.getElementById('interactiveLoader');
        this.progressBar = document.getElementById('interactiveProgressBar');
        this.progressPercentage = document.getElementById('interactiveProgressPercentage');
        this.loadingMessage = document.getElementById('interactiveLoadingMessage');
        this.progress = 0;
        this.isLoading = false;
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
    }

    updateMessage() {
        if (!this.loadingMessage) return;

        const messageIndex = Math.min(
            Math.floor((this.progress / 100) * (this.messages.length - 1)),
            this.messages.length - 1
        );

        if (this.messages[messageIndex]) {
            this.loadingMessage.textContent = this.messages[messageIndex];
        }
    }

    hide() {
        if (this.loader && this.isLoading) {
            this.updateProgress(100, 'Concluído!');
            setTimeout(() => {
                this.loader.classList.add('hidden');
                this.isLoading = false;
            }, 800);
        }
    }

    show() {
        if (this.loader) {
            this.loader.classList.remove('hidden');
            this.updateProgress(0);
            this.isLoading = true;
        }
    }

    simulateLoading(duration = 3000) {
        if (!this.isLoading) return Promise.resolve();

        return new Promise((resolve) => {
            let progress = 0;
            const totalSteps = duration / 100; // 100ms intervals
            const baseIncrement = 100 / totalSteps;
            let currentStep = 0;

            const interval = setInterval(() => {
                currentStep++;

                // Smooth progress with some randomization
                if (progress < 90) {
                    progress += baseIncrement + (Math.random() * 3);
                } else {
                    progress += (100 - progress) * 0.1; // Slow down near the end
                }

                this.updateProgress(Math.min(progress, 99));

                if (currentStep >= totalSteps || progress >= 99) {
                    clearInterval(interval);
                    this.updateProgress(100, 'Concluído!');
                    setTimeout(() => {
                        this.hide();
                        resolve();
                    }, 500);
                }
            }, 100);
        });
    }
}

// Instância global do loader
const interactiveLoader = new InteractiveLoader();

class NavigationLoader {
    constructor() {
        this.loader = document.getElementById('navigationLoader');
        this.isShowing = false;
    }

    show() {
        if (this.loader && !this.isShowing) {
            this.loader.classList.add('show');
            this.isShowing = true;
            // Previne scroll durante o loading
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        if (this.loader && this.isShowing) {
            this.loader.classList.remove('show');
            this.isShowing = false;
            // Restaura o scroll
            document.body.style.overflow = '';
        }
    }
}

// Instância global do navigation loader
const navigationLoader = new NavigationLoader();


document.addEventListener('DOMContentLoaded', function () {
    interactiveLoader.show();

    interactiveLoader.simulateLoading(4000).then(() => {
        console.log('Carregamento concluído!');
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-on-scroll');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.product-card').forEach(card => {
        observer.observe(card);
    });

    if (isDetailPage()) {
        initializeSearchDetail();
    } else {
        initializeSearch();
    }

    window.addEventListener('load', function () {
        if (navigationLoader) {
            navigationLoader.hide();
        }
    });

    window.addEventListener('beforeunload', function () {
        if (navigationLoader) {
            navigationLoader.hide();
        }
    });
});
