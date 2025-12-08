<?php
require "../conexion.php";

// Obtener todos los fondos
$sql = "SELECT * FROM fondo";
$stmt = $conexion->prepare($sql);
$stmt->execute();
$fondos = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Generar tabla HTML
$html = '<table border="1" cellpadding="10" cellspacing="0" class="tabla-fondos" id="tablaFondosData">
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

foreach ($fondos as $f) {
    $valor_total = $f['valor_actual'] * $f['cantidad'];
    
    // Crear contenido para el hover-card - usar comillas dobles
    $hover_content = '<div class="hover-card-content">
                        <h4>' . htmlspecialchars($f['nombre'], ENT_QUOTES) . '</h4>
                        <p><strong>ISIN:</strong> ' . htmlspecialchars($f['isin'], ENT_QUOTES) . '</p>
                        <p><strong>Gestora:</strong> ' . htmlspecialchars($f['gestora'], ENT_QUOTES) . '</p>
                        <p><strong>Riesgo:</strong> ' . htmlspecialchars($f['riesgo'], ENT_QUOTES) . '</p>
                        <p><strong>Moneda:</strong> ' . htmlspecialchars($f['moneda'], ENT_QUOTES) . '</p>
                        <p><strong>Política:</strong> ' . htmlspecialchars($f['politica'], ENT_QUOTES) . '</p>
                        <p><strong>Tipo:</strong> ' . htmlspecialchars($f['tipo'], ENT_QUOTES) . '</p>
                        <p><strong>Geografía:</strong> ' . htmlspecialchars($f['geografia'], ENT_QUOTES) . '</p>
                      </div>';

    $html .= '<tr class="fila-fondo fila-con-hover fondo-row"
                data-isin="' . htmlspecialchars($f['isin'], ENT_QUOTES) . '"
                data-nombre="' . htmlspecialchars($f['nombre'], ENT_QUOTES) . '"
                data-cantidad="' . $f['cantidad'] . '"
                data-precio_promedio="' . $f['precio_promedio'] . '"
                data-moneda="' . htmlspecialchars($f['moneda'], ENT_QUOTES) . '"
                data-riesgo="' . htmlspecialchars($f['riesgo'], ENT_QUOTES) . '"
                data-politica="' . htmlspecialchars($f['politica'], ENT_QUOTES) . '"
                data-tipo="' . htmlspecialchars($f['tipo'], ENT_QUOTES) . '"
                data-gestora="' . htmlspecialchars($f['gestora'], ENT_QUOTES) . '"
                data-geografia="' . htmlspecialchars($f['geografia'], ENT_QUOTES) . '"
                data-tipo-fila="fondo"
                data-hover-content="' . htmlspecialchars($hover_content, ENT_QUOTES) . '"
                style="cursor: pointer;">
                <td>' . (!empty($f['logo']) ? '<img src="../img/gestoras/' . $f['logo'] . '" width="30">' : '') . '</td>
                <td>' . htmlspecialchars($f['nombre'], ENT_QUOTES) . '</td>
                <td>' . number_format($f['valor_actual'], 2) . '</td>
                <td>' . number_format($f['cantidad'], 4) . '</td>
                <td>' . number_format($f['precio_promedio'], 2) . '</td>
                <td>' . number_format($valor_total, 2) . '</td>
              </tr>';
}

$html .= '</tbody></table>';

echo $html;