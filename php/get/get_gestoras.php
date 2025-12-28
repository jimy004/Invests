<?php
require "../../conexion.php";

header('Content-Type: application/json');

try {
    $sql = "SELECT nombre FROM gestora ORDER BY nombre";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    
    $gestoras = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'gestoras' => array_column($gestoras, 'nombre')
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener gestoras: ' . $e->getMessage()
    ]);
}
?>