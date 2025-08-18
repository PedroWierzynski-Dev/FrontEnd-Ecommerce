<?php
function loadProducts()
{
    $jsonFile = 'products.json';

    if (!file_exists($jsonFile)) {
        return ['error' => 'Arquivo products.json não encontrado!'];
    }
    $jsonData = file_get_contents($jsonFile);

    if ($jsonData === false) {
        return ['error' => 'Erro ao ler o arquivo products.json'];
    }

    $products = json_decode($jsonData, true);

    if ($products === null) {
        return ['error' => 'JSON inválido no arquivo products.json'];
    }
    return $products;
}

function formatPrice($price)
{
    return number_format($price, 2, ',', '.');
}

function getCategoryClass($category)
{
    return strtolower(str_replace([' ', 'ç', 'ã', 'õ'], ['-', 'c', 'a', 'o'], $category));
}

$produtos = loadProducts();

if (isset($produtos['error'])) {
    die('<div class="alert alert-danger">' . $produtos['error'] . '</div>');
}
