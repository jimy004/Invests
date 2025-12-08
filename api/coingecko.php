<?php
// Función para obtener el precio actual de una criptomoneda desde CoinGecko
function obtenerValorActualCripto($ticker) {
    $api_url = "https://api.coingecko.com/api/v3/simple/price?ids={$ticker}&vs_currencies=usd";

    $json = @file_get_contents($api_url);
    if ($json === false) {
        return null;
    }

    $data = json_decode($json, true);
    if (!isset($data[$ticker]['usd'])) {
        return null;
    }

    return $data[$ticker]['usd'];
}
?>
