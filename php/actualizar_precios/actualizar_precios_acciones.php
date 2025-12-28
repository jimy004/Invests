<?php
require "../../conexion.php";
require "../../api/python_prices.php";
require "../../api/usd_eur.php"; 

header('Content-Type: application/json');

try {
    // Obtener todas las acciones de la base de datos
    $sql = "SELECT ticker FROM accion";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $acciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($acciones)) {
        echo json_encode([
            'success' => true,
            'message' => 'No hay acciones para actualizar',
            'actualizados' => 0,
            'errores' => 0
        ]);
        exit;
    }
    
    // Extraer los tickers
    $tickers = array_column($acciones, 'ticker');
    
    // Obtener precios actuales desde Yahoo Finance usando Python
    $precios = obtenerValorActualPython($tickers);
    
    if ($precios === null || empty($precios)) {
        echo json_encode([
            'success' => false,
            'message' => 'No se pudieron obtener los precios de Yahoo Finance'
        ]);
        exit;
    }
    
    $actualizados = 0;
    $errores = 0;
    
    // Actualizar cada acción en la base de datos
    foreach ($acciones as $accion) {
        $ticker = $accion['ticker'];
        
        // Verificar si el ticker existe en los datos obtenidos
        if (isset($precios[$ticker])) {
            $precioActual = $precios[$ticker];
            $conversion = usd_to_eur();
            $precioActual = round($precioActual * $conversion, 2);
            
            // Actualizar en la base de datos
            $sqlUpdate = "UPDATE accion SET valor_actual = :precio WHERE ticker = :ticker";
            $stmtUpdate = $conexion->prepare($sqlUpdate);
            $stmtUpdate->bindParam(':precio', $precioActual, PDO::PARAM_STR);
            $stmtUpdate->bindParam(':ticker', $ticker, PDO::PARAM_STR);
            
            if ($stmtUpdate->execute()) {
                $actualizados++;
            } else {
                $errores++;
                error_log("Error al actualizar $ticker: " . json_encode($stmtUpdate->errorInfo()));
            }
        } else {
            $errores++;
            error_log("Ticker $ticker no encontrado en respuesta de Yahoo Finance");
        }
        
        // Pequeña pausa para no sobrecargar
        usleep(50000); // 0.05 segundos
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Precios actualizados: {$actualizados} acciones. Errores: {$errores}",
        'actualizados' => $actualizados,
        'errores' => $errores
    ]);
    
} catch (Exception $e) {
    error_log('Error en actualizar_precios_acciones.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar precios: ' . $e->getMessage()
    ]);
}
?>