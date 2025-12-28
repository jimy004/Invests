<?php
require "../../conexion.php";

$sql = "SELECT SUM(valor_actual * cantidad) as total FROM fondo";
$stmt = $conexion->prepare($sql);
$stmt->execute();
$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo number_format($result['total'] ?? 0, 2);
?>