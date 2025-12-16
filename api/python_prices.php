<?php
function obtenerValorActualPython($tickers) {
    if (is_array($tickers)) {
        $tickers_str = implode(",", $tickers);
    } else {
        $tickers_str = $tickers;
    }
    
    $tickers_str = escapeshellarg($tickers_str);
    
    // Usar DOCUMENT_ROOT para construir la ruta
    $ruta_script = $_SERVER['DOCUMENT_ROOT'] . "/Invests/api/yahoo.py";
    
    // Convertir para Windows si es necesario
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        $ruta_script = str_replace('/', '\\', $ruta_script);
    }
    
    $cmd = "python \"" . $ruta_script . "\" " . $tickers_str;
    $output = shell_exec($cmd);
    
    if (!$output) return null;
    
    $data = json_decode($output, true);
    return $data;
}