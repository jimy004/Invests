<?php
header('Content-Type: application/json');
include '../../conexion.php';

try {
    $stmt = $conexion->query("SELECT id, tipo FROM inversiones");
    $inversiones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($inversiones);

} catch(Exception $e){
    echo json_encode(['error' => $e->getMessage()]);
}
?>
