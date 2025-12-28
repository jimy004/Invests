<?php
require "../../conexion.php";

$sql = "SELECT * FROM criptomoneda";
$stmt = $conexion->prepare($sql);
$stmt->execute();
$criptos = $stmt->fetchAll(PDO::FETCH_ASSOC);

$html = '<table border="1" cellpadding="10" cellspacing="0" class="tabla-criptos" id="tablaCriptosData">
            <thead>
                <tr>
                    <th data-col="icono">Icono</th>
                    <th data-col="nombre">Nombre</th>
                    <th data-col="valor_actual">Valor actual ($)</th>
                    <th data-col="cantidad">Cantidad</th>
                    <th data-col="precio_promedio">Precio promedio ($)</th>
                    <th data-col="rentabilidad">Rentabilidad (%)</th>
                    <th data-col="valor_total">Valor total ($)</th>
                </tr>
            </thead>
            <tbody>';

foreach ($criptos as $cripto) {
    $valor_total = $cripto['valor_actual'] * $cripto['cantidad'];
    
    // Calcular rentabilidad
    $rentabilidad = 0;
    if ($cripto['precio_promedio'] > 0) {
        $rentabilidad = (($cripto['valor_actual'] - $cripto['precio_promedio']) / $cripto['precio_promedio']) * 100;
    }
    
    // Determinar clase CSS según si es positiva o negativa
    $clase_rentabilidad = '';
    if ($rentabilidad > 0) {
        $clase_rentabilidad = 'rentabilidad-positiva';
    } elseif ($rentabilidad < 0) {
        $clase_rentabilidad = 'rentabilidad-negativa';
    }

    $html .= '<tr class="fila-cripto fila-con-hover"
                data-nombre="' . htmlspecialchars($cripto['nombre'], ENT_QUOTES) . '"
                data-ticker="' . htmlspecialchars($cripto['ticker'], ENT_QUOTES) . '"
                data-cantidad="' . $cripto['cantidad'] . '"
                data-precio_promedio="' . $cripto['precio_promedio'] . '"
                data-valor_actual="' . $cripto['valor_actual'] . '"
                style="cursor: pointer;">
                <td>' . (!empty($cripto['icono']) ? "<img src='../img/cripto/{$cripto['icono']}' width='30'>" : '') . '</td>
                <td>' . $cripto['nombre'] . '</td>
                <td>' . number_format($cripto['valor_actual'], 2) . '</td>
                <td>' . number_format($cripto['cantidad'], 4) . '</td>
                <td>' . number_format($cripto['precio_promedio'], 2) . '</td>
                <td class="' . $clase_rentabilidad . '">' . number_format($rentabilidad, 2) . '%</td>
                <td>' . number_format($valor_total, 2) . '</td>
              </tr>';
}

$html .= '</tbody></table>';

echo $html;
?>