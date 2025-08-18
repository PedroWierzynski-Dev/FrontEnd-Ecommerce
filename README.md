# FrontEnd E-commerce 

Este é um projeto de **Frontend para um E-commerce**, desenvolvido com HTML, CSS, JavaScript e PHP simples para simular o carregamento de produtos. Ele pode rodar tanto localmente quanto dentro de containers Docker.

---

## Funcionalidades

* Página inicial com listagem de produtos (`index.html`)
* Página de detalhes de um produto (`product-detail.html`)
* Arquivo `products.json` para simular catálogo de produtos
* Script PHP (`load-products.php`) para consumir o catálogo
* Configuração com **Docker** e **Docker Compose**

---

## Estrutura do Projeto

```
FrontEnd-Ecommerce/
├── index.html              # Página inicial da loja
├── product-detail.html     # Página de detalhes de produto
├── products.json           # Lista de produtos em JSON
├── load-products.php       # Script PHP para carregar produtos
├── Dockerfile              # Configuração Docker
├── docker-compose.yml      # Orquestração com Docker Compose
└── README.md               # Documentação do projeto
```

---

## Como rodar o projeto

###  Rodar localmente (sem Docker)

1. Clone este repositório:

   ```bash
   git clone https://github.com/PedroWierzynski-Dev/FrontEnd-Ecommerce
   ```
2. Abra o projeto em um servidor local (exemplo com PHP embutido):

   ```bash
   php -S localhost:8000
   ```
3. Acesse no navegador:

   ```
   http://localhost:8000
   ```

###  Rodar com Docker

1. Build da imagem:

   ```bash
   docker build -t frontend-ecommerce .
   ```
2. Subir com Docker Compose:

   ```bash
   docker-compose up -d
   ```
3. Acesse no navegador:

   ```
   http://localhost:8080
   ```

---

## Pré-requisitos

* Navegador atualizado
* PHP instalado (se rodar localmente)
* Docker e Docker Compose (se rodar com containers)


---

Desenvolvido por **Pedro Wierzynski**
