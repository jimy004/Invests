<?php
header('Content-Type: application/json');

// Incluir la conexión
include '../conexion.php'; // Asegúrate que conexion.php está en la misma carpeta
require "../api/usd_eur.php";

try {
    // Función para obtener suma de valor_actual * cantidad
    function obtener_valores($conexion, $tabla, $col_valor='valor_actual', $col_cantidad='cantidad') {
        $stmt = $conexion->query("SELECT SUM($col_valor * $col_cantidad) as total FROM $tabla");
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return floatval($fila['total']);
    }

    // Función para inversión inicial
    function obtener_inv_inicial($conexion, $tipo) {
        $stmt = $conexion->prepare("SELECT SUM(cantidad) as total FROM inversiones WHERE tipo=:tipo");
        $stmt->execute(['tipo' => $tipo]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return floatval($fila['total']);
    }

    // Valores actuales
    $tipo_cambio = usd_to_eur();
    $usd_criptos = obtener_valores($conexion, 'criptomoneda');
    $eur_acciones = obtener_valores($conexion, 'accion');
    $eur_fondos = obtener_valores($conexion, 'fondo');
    $eur_liquidez = obtener_inv_inicial($conexion, 'euros');

    $eur_criptos = $usd_criptos * $tipo_cambio;
    $usd_liquidez = $eur_liquidez / $tipo_cambio;
    $usd_acciones = $eur_acciones / $tipo_cambio;
    $usd_fondos = $eur_fondos / $tipo_cambio;

    // Inversión inicial por tipo
    $inv_inicial_criptos = obtener_inv_inicial($conexion, 'criptomoneda');
    $inv_inicial_acciones = obtener_inv_inicial($conexion, 'accion');
    $inv_inicial_fondos = obtener_inv_inicial($conexion, 'fondo');
    $inv_inicial_liquidez =  obtener_inv_inicial($conexion, 'euros');

    // Función para calcular cada fila del resumen
    function calcularFila($nombre, $usd, $eur, $inv_inicial) {
        $usd = floatval($usd);
        $eur = floatval($eur);
        $inv_inicial = floatval($inv_inicial);

        $rent = $inv_inicial != 0 ? (($eur - $inv_inicial)/$inv_inicial*100) : 0;
        $dif  = $eur - $inv_inicial;

        return [
            'nombre' => $nombre,
            'usd' => round($usd, 2),
            'eur' => round($eur, 2),
            'inv_inicial' => round($inv_inicial, 2),
            'rentabilidad' => round($rent, 2).'%',
            'diferencia' => round($dif, 2),
            'peso' => 0 // se calculará luego
        ];
    }

    $resumen = [];
    $resumen[] = calcularFila('Criptomonedas', $usd_criptos, $eur_criptos, $inv_inicial_criptos);
    $resumen[] = calcularFila('Acciones', $usd_acciones, $eur_acciones, $inv_inicial_acciones);
    $resumen[] = calcularFila('Fondos', $usd_fondos, $eur_fondos, $inv_inicial_fondos);
    $resumen[] = calcularFila('Liquidez', $usd_liquidez, $eur_liquidez, $inv_inicial_liquidez);

    // Total
    $total_usd = $usd_criptos + $usd_acciones + $usd_fondos + $usd_liquidez;
    $total_eur = $eur_criptos + $eur_acciones + $eur_fondos + $eur_liquidez;
    $inv_inicial_total = $inv_inicial_criptos + $inv_inicial_acciones + $inv_inicial_fondos + $inv_inicial_liquidez;
    $resumen[] = calcularFila('Total', $total_usd, $total_eur, $inv_inicial_total);

    // Calcular peso de cada fila sobre el total de forma segura
    foreach($resumen as &$fila){
        $fila['peso'] = $total_usd != 0 ? round($fila['usd'] / $total_usd * 100, 2).'%' : '0%';
    }

    echo json_encode($resumen);

} catch (Exception $e) {
    echo json_encode(['error' => 'Error al generar el resumen: ' . $e->getMessage()]);
}
