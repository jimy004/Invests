<?php
function usd_to_eur() {
    // Cargar XML del BCE
    $xml = simplexml_load_file("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml");

    if (!$xml) {
        return 0; // Error cargando el XML
    }

    $usd_rate = 0;

    foreach ($xml->Cube->Cube->Cube as $rate) {
        if ((string)$rate['currency'] === "USD") {
            // El valor del BCE es EUR → USD, así que invertimos
            $usd_rate = 1 / floatval($rate['rate']);
            break;
        }
    }

    return $usd_rate;
}
?>
