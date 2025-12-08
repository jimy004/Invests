<?php
require "../conexion.php";

// Obtener todas las acciones
$sql = "SELECT * FROM accion";
$stmt = $conexion->prepare($sql);
$stmt->execute();
$acciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Generar tabla HTML
$html = '<table border="1" cellpadding="10" cellspacing="0" class="tabla-acciones" id="tablaAccionesData">
            <thead>
                <tr>
                    <th data-col="logo">Logo</th>
                    <th data-col="nombre">Nombre</th>
                    <th data-col="valor_actual">Valor actual (€)</th>
                    <th data-col="cantidad">Cantidad</th>
                    <th data-col="precio_promedio">Precio promedio (€)</th>
                    <th data-col="valor_total">Valor total (€)</th>
                </tr>
            </thead>
            <tbody>';

foreach ($acciones as $a) {
    $valor_total = $a['valor_actual'] * $a['cantidad'];
    
    // Crear contenido para el hover-card - usar comillas dobles para atributos HTML
    $hover_content = '<div class="hover-card-content">
                        <h4>' . htmlspecialchars($a['nombre'], ENT_QUOTES) . '</h4>
                        <p><strong>Ticker:</strong> ' . htmlspecialchars($a['ticker'], ENT_QUOTES) . '</p>
                        <p><strong>Sector:</strong> ' . htmlspecialchars($a['sector'], ENT_QUOTES) . '</p>
                        <p><strong>Dividendos:</strong> ' . ($a['dividendos'] ? "Sí" : "No") . '</p>
                      </div>';

    $html .= '<tr class="fila-accion fila-con-hover accion-row"
                data-ticker="' . htmlspecialchars($a['ticker'], ENT_QUOTES) . '"
                data-nombre="' . htmlspecialchars($a['nombre'], ENT_QUOTES) . '"
                data-sector="' . htmlspecialchars($a['sector'], ENT_QUOTES) . '"
                data-valor_actual="' . $a['valor_actual'] . '"
                data-cantidad="' . $a['cantidad'] . '"
                data-precio_promedio="' . $a['precio_promedio'] . '"
                data-dividendos="' . ($a['dividendos'] ? '1' : '0') . '"
                data-tipo-fila="accion"
                data-hover-content="' . htmlspecialchars($hover_content, ENT_QUOTES) . '"
                style="cursor: pointer;">
                <td>' . (!empty($a['logo']) ? '<img src="../img/acciones/' . $a['logo'] . '" width="30">' : '') . '</td>
                <td>' . htmlspecialchars($a['nombre'], ENT_QUOTES) . '</td>
                <td>' . number_format($a['valor_actual'], 2) . '</td>
                <td>' . number_format($a['cantidad'], 4) . '</td>
                <td>' . number_format($a['precio_promedio'], 2) . '</td>
                <td>' . number_format($valor_total, 2) . '</td>
              </tr>';
}

$html .= '</tbody></table>';

echo $html;