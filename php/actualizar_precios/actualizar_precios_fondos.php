<?php
require "../../conexion.php";
require "../../api/python_prices.php"; // Para usar la función obtenerValorActualPython()

header('Content-Type: application/json');

try {
    // Obtener todos los fondos de la base de datos
    $sql = "SELECT isin, nombre FROM fondo";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $fondos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($fondos)) {
        echo json_encode([
            'success' => true,
            'message' => 'No hay fondos para actualizar',
            'actualizados' => 0,
            'errores' => 0
        ]);
        exit;
    }
    
    $actualizados = 0;
    $errores = 0;
    
    // Actualizar cada fondo individualmente (Yahoo Finance funciona mejor con ISINs individuales)
    foreach ($fondos as $fondo) {
        $isin = $fondo['isin'];
        $nombre = $fondo['nombre'];
        
        // Obtener precio actual desde Yahoo Finance usando el ISIN
        $precios = obtenerValorActualPython($isin);
        
        if ($precios !== null && isset($precios[$isin])) {
            $precioActual = $precios[$isin];
            
            // Actualizar en la base de datos
            $sqlUpdate = "UPDATE fondo SET valor_actual = :precio WHERE isin = :isin";
            $stmtUpdate = $conexion->prepare($sqlUpdate);
            $stmtUpdate->bindParam(':precio', $precioActual, PDO::PARAM_STR);
            $stmtUpdate->bindParam(':isin', $isin, PDO::PARAM_STR);
            
            if ($stmtUpdate->execute()) {
                $actualizados++;
            } else {
                $errores++;
                error_log("Error al actualizar $isin: " . json_encode($stmtUpdate->errorInfo()));
            }
        } else {
            $errores++;
            error_log("Ticker $isin no encontrado en respuesta de Yahoo Finance");
        }
        
        // Pausa más larga para no sobrecargar Yahoo Finance
        usleep(50000); // 0.05 segundos
    }
    
    
    
    echo json_encode([
        'success' => true,
        'message' => $mensaje = "Precios actualizados: {$actualizados} fondos. Errores: {$errores}",
        'actualizados' => $actualizados,
        'errores' => $errores,
    ]);
    
} catch (Exception $e) {
    error_log('Error en actualizar_precios_fondos.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar precios: ' . $e->getMessage()
    ]);
}
?>