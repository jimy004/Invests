<?php
require "../conexion.php";

// Página actual enviada por GET
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = 5; // registros por página
$offset = ($page - 1) * $limit;

// Contar total de registros
$countStmt = $conexion->prepare("SELECT COUNT(*) as total FROM historialacciones");
$countStmt->execute();
$total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
$totalPages = ceil($total / $limit);

// Obtener registros paginados (los más recientes primero)
$sql = "SELECT * FROM historialacciones ORDER BY fecha DESC LIMIT :limit OFFSET :offset";
$stmt = $conexion->prepare($sql);
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$registros = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Generar HTML de la tabla
$html = '<table border="1" cellpadding="10" cellspacing="0">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Valor (€)</th>
                </tr>
            </thead>
            <tbody>';

foreach ($registros as $r) {
    $html .= "<tr>
                <td>{$r['fecha']}</td>
                <td>" . number_format($r['valor'], 2) . "</td>
              </tr>";
}

$html .= '</tbody></table>';

// Botones de navegación
$html .= '<div style="margin-top:10px;">';
if ($page > 1) {
    $html .= '<button onclick="cargarHistorialAcc(' . ($page - 1) . ')">⬅ Anterior</button> ';
}
if ($page < $totalPages) {
    $html .= '<button onclick="cargarHistorialAcc(' . ($page + 1) . ')">Siguiente ➡</button>';
}
$html .= '</div>';

echo $html;
