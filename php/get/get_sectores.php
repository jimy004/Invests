<?php
require "../../conexion.php";

header('Content-Type: application/json');

try {
    $sql = "SELECT nombre FROM sector ORDER BY nombre";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    
    $sectores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'sectores' => array_column($sectores, 'nombre')
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener sectores: ' . $e->getMessage()
    ]);
}
?>