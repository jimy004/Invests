<?php
require "../conexion.php";
require "../api/coingecko.php"; // Para usar la función obtenerValorActualCripto()

header('Content-Type: application/json');

try {
    // Obtener todas las criptomonedas de la base de datos
    $sql = "SELECT ticker FROM criptomoneda";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $criptos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $actualizados = 0;
    $errores = 0;
    
    foreach ($criptos as $cripto) {
        $ticker = $cripto['ticker'];
        
        // Obtener precio actual desde CoinGecko
        $precioActual = obtenerValorActualCripto($ticker);
        
        if ($precioActual !== null) {
            // Actualizar en la base de datos
            $sqlUpdate = "UPDATE criptomoneda SET valor_actual = :precio WHERE ticker = :ticker";
            $stmtUpdate = $conexion->prepare($sqlUpdate);
            $stmtUpdate->bindParam(':precio', $precioActual);
            $stmtUpdate->bindParam(':ticker', $ticker);
            
            if ($stmtUpdate->execute()) {
                $actualizados++;
            } else {
                $errores++;
            }
        } else {
            $errores++;
        }
        
        // Pequeña pausa para no sobrecargar la API de CoinGecko
        usleep(100000); // 0.1 segundos
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Precios actualizados: {$actualizados} criptomonedas. Errores: {$errores}",
        'actualizados' => $actualizados,
        'errores' => $errores
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar precios: ' . $e->getMessage()
    ]);
}
?>