<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require __DIR__ . "/../../conexion.php";

// --- 1️⃣ Distribución de activos ---
$sql = "SELECT nombre, valor_actual, cantidad FROM accion";
$stmt = $conexion->prepare($sql);
$stmt->execute();
$acciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

$distribucion = [];
foreach ($acciones as $a) {
    $valor_total = $a['valor_actual'] * $a['cantidad'];
    $distribucion[] = ['name' => $a['nombre'], 'y' => $valor_total];
}

// --- 2️⃣ y 3️⃣ Historial ---
$sql = "SELECT fecha, valor FROM historialacciones ORDER BY fecha ASC";
$stmt = $conexion->prepare($sql);
$stmt->execute();
$historial = $stmt->fetchAll(PDO::FETCH_ASSOC);

$evolucionTotal = [];
$valoresPorMes = [];

foreach ($historial as $h) {
    $valorTotal = $h['valor'];
    $evolucionTotal[] = ['x' => $h['fecha'], 'y' => $valorTotal];

    $mes = date('Y-m', strtotime($h['fecha']));
    if (!isset($valoresPorMes[$mes])) {
        $valoresPorMes[$mes] = $valorTotal;
    } else {
        // usar el valor máximo del mes como referencia
        $valoresPorMes[$mes] = max($valoresPorMes[$mes], $valorTotal);
    }
}

// Calcular rentabilidad mensual segura
$valoresPorMes = []; // ['2025-01' => ['primero'=>x, 'ultimo'=>y] ]

foreach ($historial as $registro) {
    $mes = date('Y-m', strtotime($registro['fecha']));
    
    if (!isset($valoresPorMes[$mes])) {
        $valoresPorMes[$mes] = ['primero' => $registro['valor'], 'ultimo' => $registro['valor']];
    } else {
        $valoresPorMes[$mes]['ultimo'] = $registro['valor'];
    }
}

$meses = array_keys($valoresPorMes);
sort($meses);

$rentabilidades = [];
$ultimoMesAnterior = null;

foreach ($meses as $mes) {
    $ultimoMesActual = $valoresPorMes[$mes]['ultimo'];

    if ($ultimoMesAnterior !== null && $ultimoMesAnterior != 0) {
        // rentabilidad respecto al mes anterior
        $rentabilidades[] = round((($ultimoMesActual - $ultimoMesAnterior)/$ultimoMesAnterior)*100, 2);
    } else {
        // primer mes: rentabilidad respecto al primer registro del mismo mes
        $primeroMesActual = $valoresPorMes[$mes]['primero'];
        if ($primeroMesActual != 0) {
            $rentabilidades[] = round((($ultimoMesActual - $primeroMesActual)/$primeroMesActual)*100, 2);
        } else {
            $rentabilidades[] = 0;
        }
    }

    $ultimoMesAnterior = $ultimoMesActual;
}

// Devolver datos JSON
echo json_encode([
    'distribucion' => $distribucion,
    'rentabilidad' => ['meses' => $meses, 'valores' => $rentabilidades],
    'evolucion' => $evolucionTotal
]);
