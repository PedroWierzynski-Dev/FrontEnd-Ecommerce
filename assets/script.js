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
        showAlert('success', 'Adicionado aos Favoritos', `${productName} foi adicionado à sua lista de favoritos!`);
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

    // Auto remove após 4 segundos
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
});
