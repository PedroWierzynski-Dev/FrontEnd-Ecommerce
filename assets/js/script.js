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


document.addEventListener('DOMContentLoaded', function () {
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
});