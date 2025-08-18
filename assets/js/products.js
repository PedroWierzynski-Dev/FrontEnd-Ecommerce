let allProducts = [];
let currentSearchTerm = '';

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

async function renderProducts(searchTerm = '') {
    const loading = document.getElementById('loading');
    const container = document.getElementById('products-container');
    const errorContainer = document.getElementById('error-container');

    try {
        if (allProducts.length === 0) {
            const produtos = await loadProducts();
            if (!produtos || produtos.length === 0) {
                if (loading) loading.style.display = 'none';
                if (errorContainer) {
                    errorContainer.style.display = 'block';
                    const errorMessage = document.getElementById('error-message');
                    if (errorMessage) {
                        errorMessage.textContent = 'Nenhum produto encontrado.';
                    }
                }
                return;
            }
            allProducts = produtos;
        }

        if (loading) loading.style.display = 'none';

        let filteredProducts = allProducts;
        if (searchTerm) {
            filteredProducts = allProducts.filter(produto =>
                produto.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                produto.description_small.toLowerCase().includes(searchTerm.toLowerCase()) ||
                produto.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (searchTerm && filteredProducts.length === 0) {
            if (container) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="no-results">
                            <i class="fas fa-search"></i>
                            <h3>Nenhum produto encontrado</h3>
                            <p>Não encontramos produtos que correspondam à sua busca: "<strong>${searchTerm}</strong>"</p>
                            <p>Tente buscar por outros termos ou navegue por todos os produtos.</p>
                        </div>
                    </div>
                `;
                container.style.display = 'flex';
            }
            return;
        }

        const productsHTML = filteredProducts.map(produto => createProductHTML(produto)).join('');

        if (container) {
            container.innerHTML = productsHTML;
            container.style.display = 'flex';
        }

        if (typeof window.observer !== 'undefined') {
            document.querySelectorAll('.product-card').forEach(card => {
                window.observer.observe(card);
            });
        }

        console.log(`${filteredProducts.length} produtos exibidos${searchTerm ? ` (filtrados por: "${searchTerm}")` : ''}!`);

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

function getSearchFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('search') || '';
}

function setupProductNavigation() {

    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-see-more')) {
            const productId = e.target.getAttribute('data-product-id');
            if (productId) {
                window.location.href = `product-detail.html?id=${productId}`;
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const searchTerm = getSearchFromUrl();

    if (searchTerm) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = searchTerm;
            const clearBtn = document.getElementById('clearBtn');
            if (clearBtn) {
                clearBtn.style.display = 'block';
            }
        }
        renderProducts(searchTerm);
    } else {
        renderProducts();
    }

    setupProductNavigation();
});