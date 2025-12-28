<?php
// actualizar_todos_precios.php
require "../../conexion.php";
require "../../api/coingecko.php";
require "../../api/python_prices.php";

header('Content-Type: application/json');

try {
    $resultados = [
        'criptomonedas' => ['actualizados' => 0, 'errores' => 0, 'detalles' => []],
        'acciones' => ['actualizados' => 0, 'errores' => 0, 'detalles' => []],
        'fondos' => ['actualizados' => 0, 'errores' => 0, 'detalles' => []]
    ];
    
    // 1. Actualizar criptomonedas
    $sqlCriptos = "SELECT ticker FROM criptomoneda";
    $stmtCriptos = $conexion->prepare($sqlCriptos);
    $stmtCriptos->execute();
    $criptos = $stmtCriptos->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($criptos as $cripto) {
        $ticker = $cripto['ticker'];
        $precioActual = obtenerValorActualCripto($ticker);
        
        if ($precioActual !== null) {
            $sqlUpdate = "UPDATE criptomoneda SET valor_actual = :precio WHERE ticker = :ticker";
            $stmtUpdate = $conexion->prepare($sqlUpdate);
            $stmtUpdate->bindParam(':precio', $precioActual);
            $stmtUpdate->bindParam(':ticker', $ticker);
            
            if ($stmtUpdate->execute()) {
                $resultados['criptomonedas']['actualizados']++;
                $resultados['criptomonedas']['detalles'][] = "$ticker: $" . number_format($precioActual, 2);
            } else {
                $resultados['criptomonedas']['errores']++;
            }
        } else {
            $resultados['criptomonedas']['errores']++;
        }
        usleep(100000); // 0.1 segundos
    }
    
    // 2. Actualizar acciones
    $sqlAcciones = "SELECT ticker FROM accion";
    $stmtAcciones = $conexion->prepare($sqlAcciones);
    $stmtAcciones->execute();
    $acciones = $stmtAcciones->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($acciones)) {
        $tickersAcciones = array_column($acciones, 'ticker');
        $preciosAcciones = obtenerValorActualPython($tickersAcciones);
        
        if ($preciosAcciones !== null) {
            foreach ($acciones as $accion) {
                $ticker = $accion['ticker'];
                
                if (isset($preciosAcciones[$ticker])) {
                    $precioActual = $preciosAcciones[$ticker];
                    
                    $sqlUpdate = "UPDATE accion SET valor_actual = :precio WHERE ticker = :ticker";
                    $stmtUpdate = $conexion->prepare($sqlUpdate);
                    $stmtUpdate->bindParam(':precio', $precioActual, PDO::PARAM_STR);
                    $stmtUpdate->bindParam(':ticker', $ticker, PDO::PARAM_STR);
                    
                    if ($stmtUpdate->execute()) {
                        $resultados['acciones']['actualizados']++;
                        $resultados['acciones']['detalles'][] = "$ticker: €" . number_format($precioActual, 2);
                    } else {
                        $resultados['acciones']['errores']++;
                    }
                } else {
                    $resultados['acciones']['errores']++;
                }
            }
        } else {
            $resultados['acciones']['errores'] = count($acciones);
        }
    }
    
    // 3. Actualizar fondos
    $sqlFondos = "SELECT isin, nombre FROM fondo";
    $stmtFondos = $conexion->prepare($sqlFondos);
    $stmtFondos->execute();
    $fondos = $stmtFondos->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($fondos as $fondo) {
        $isin = $fondo['isin'];
        $nombre = $fondo['nombre'];
        
        // Usar la función modificada para fondos
        $precios = obtenerValorActualPython($isin, 'fondo');
        
        if ($precios !== null && isset($precios[$isin])) {
            $precioActual = $precios[$isin];
            
            $sqlUpdate = "UPDATE fondo SET valor_actual = :precio WHERE isin = :isin";
            $stmtUpdate = $conexion->prepare($sqlUpdate);
            $stmtUpdate->bindParam(':precio', $precioActual, PDO::PARAM_STR);
            $stmtUpdate->bindParam(':isin', $isin, PDO::PARAM_STR);
            
            if ($stmtUpdate->execute()) {
                $resultados['fondos']['actualizados']++;
                $resultados['fondos']['detalles'][] = "$nombre: €" . number_format($precioActual, 2);
            } else {
                $resultados['fondos']['errores']++;
            }
        } else {
            $resultados['fondos']['errores']++;
        }
        usleep(200000); // 0.2 segundos
    }
    
    // Calcular totales
    $totalActualizados = $resultados['criptomonedas']['actualizados'] + 
                        $resultados['acciones']['actualizados'] + 
                        $resultados['fondos']['actualizados'];
    
    $totalErrores = $resultados['criptomonedas']['errores'] + 
                   $resultados['acciones']['errores'] + 
                   $resultados['fondos']['errores'];
    
    echo json_encode([
        'success' => true,
        'message' => "Actualización completada. Total: {$totalActualizados} activos actualizados, {$totalErrores} errores.",
        'resultados' => $resultados,
        'totalActualizados' => $totalActualizados,
        'totalErrores' => $totalErrores
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar precios: ' . $e->getMessage()
    ]);
}
?>