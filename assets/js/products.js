async function loadProducts() {
    try {
        const response = await fetch('products.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const produtos = await response.json();
        return produtos;
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        return null;
    }
}

function formatPrice(price) {
    return price.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getCategoryClass(category) {
    return category.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/ç/g, 'c')
        .replace(/ã/g, 'a')
        .replace(/õ/g, 'o');
}

function createProductHTML(produto) {
    return `
        <div class="col-lg-3 col-md-6 col-sm-12">
            <div class="card product-card border-0 shadow-sm">
                <div class="card-image-container">
                    <img
                        src="${produto.image}"
                        class="card-img-top product-image"
                        alt="${produto.title}"
                        onerror="this.src=https://placehold.co/600x400.png'">
                    <div class="card-actions">
                        <button class="btn-favorite"
                            onclick="toggleFavorite(this, '${produto.title.replace(/'/g, "\\'")}')"
                            title="Favoritar">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                    <span class="badge-destaque ${getCategoryClass(produto.category)}">
                        ${produto.category}
                    </span>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="product-title">${produto.title}</h5>
                    <p class="product-description">${produto.description_small}</p>
                    <div class="price mb-3">
                        R$ <span class="price-value">${formatPrice(produto.price)}</span>
                    </div>
                    <button class="btn btn-primary btn-see-more mt-auto" 
                            data-product-id="${produto.id}">
                        Ver Mais
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function renderProducts() {
    const loading = document.getElementById('loading');
    const container = document.getElementById('products-container');
    const errorContainer = document.getElementById('error-container');

    try {
        const produtos = await loadProducts();

        if (loading) loading.style.display = 'none';

        if (!produtos || produtos.length === 0) {
            if (errorContainer) {
                errorContainer.style.display = 'block';
                const errorMessage = document.getElementById('error-message');
                if (errorMessage) {
                    errorMessage.textContent = 'Nenhum produto encontrado.';
                }
            }
            return;
        }

        const productsHTML = produtos.map(produto => createProductHTML(produto)).join('');

        if (container) {
            container.innerHTML = productsHTML;
            container.style.display = 'flex';
        }

        if (typeof window.observer !== 'undefined') {
            document.querySelectorAll('.product-card').forEach(card => {
                window.observer.observe(card);
            });
        }

        console.log(`${produtos.length} produtos carregados com sucesso!`);

    } catch (error) {
        console.error('Erro ao renderizar produtos:', error);

        if (loading) loading.style.display = 'none';
        if (errorContainer) {
            errorContainer.style.display = 'block';
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.textContent = 'Erro ao carregar produtos. Tente novamente mais tarde.';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    renderProducts();
});