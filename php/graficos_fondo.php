<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require __DIR__ . "/../conexion.php";

// --- 1️⃣ Distribución de activos (fondos) ---
$sql = "SELECT nombre, valor_actual, cantidad FROM fondo";
$stmt = $conexion->prepare($sql);
$stmt->execute();
$fondos = $stmt->fetchAll(PDO::FETCH_ASSOC);

$distribucion = [];
foreach ($fondos as $f) {
    $valor_total = $f['valor_actual'] * $f['cantidad'];
    $distribucion[] = ['name' => $f['nombre'], 'y' => $valor_total];
}

// --- 2️⃣ y 3️⃣ Historial de fondos ---
$sql = "SELECT fecha, valor FROM historialfondos ORDER BY fecha ASC";
$stmt = $conexion->prepare($sql);
$stmt->execute();
$historial = $stmt->fetchAll(PDO::FETCH_ASSOC);

$evolucionTotal = [];
$valoresPorMes = [];

// Preparar datos para evolución y rentabilidad mensual
foreach ($historial as $h) {
    $valorTotal = $h['valor'];
    $evolucionTotal[] = ['x' => $h['fecha'], 'y' => $valorTotal];

    $mes = date('Y-m', strtotime($h['fecha']));
    if (!isset($valoresPorMes[$mes])) {
        $valoresPorMes[$mes] = ['primero' => $valorTotal, 'ultimo' => $valorTotal];
    } else {
        $valoresPorMes[$mes]['ultimo'] = $valorTotal;
    }
}

// Calcular rentabilidad mensual
$meses = array_keys($valoresPorMes);
sort($meses);

$rentabilidades = [];
$ultimoMesAnterior = null;

foreach ($meses as $mes) {
    $ultimoMesActual = $valoresPorMes[$mes]['ultimo'];

    if ($ultimoMesAnterior !== null && $ultimoMesAnterior != 0) {
        // rentabilidad respecto al mes anterior
        $rentabilidades[] = round((($ultimoMesActual - $ultimoMesAnterior) / $ultimoMesAnterior) * 100, 2);
    } else {
        // primer mes: rentabilidad respecto al primer registro del mismo mes
        $primeroMesActual = $valoresPorMes[$mes]['primero'];
        if ($primeroMesActual != 0) {
            $rentabilidades[] = round((($ultimoMesActual - $primeroMesActual) / $primeroMesActual) * 100, 2);
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
