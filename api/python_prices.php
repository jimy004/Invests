<?php
function obtenerValorActualPython($tickers) {
    // Acepta un string o un array
    if (is_array($tickers)) {
        $tickers_str = implode(",", $tickers);
    } else {
        $tickers_str = $tickers;
    }

    // Escapar para la línea de comandos
    $tickers_str = escapeshellarg($tickers_str);

    // Llamar al script Python
    $cmd = "python C:/xampp/htdocs/Invests/api/yahoo.py $tickers_str";
    $output = shell_exec($cmd);

    if (!$output) return null;

    $data = json_decode($output, true);
    return $data; // Devuelve todos los tickers como array asociativo
}
