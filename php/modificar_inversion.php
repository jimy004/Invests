<?php
header('Content-Type: application/json');
include '../conexion.php';

try {
    if(isset($_POST['id'], $_POST['cantidad'])){
        $id = intval($_POST['id']);
        $cantidad = floatval($_POST['cantidad']);

        $stmt = $conexion->prepare("UPDATE inversiones SET cantidad=? WHERE id=?");
        $stmt->execute([$cantidad, $id]);

        echo json_encode(['success' => true, 'mensaje' => 'Inversión actualizada correctamente.']);
    } else {
        echo json_encode(['success' => false, 'mensaje' => 'Datos incompletos.']);
    }
} catch(Exception $e){
    echo json_encode(['success' => false, 'mensaje' => $e->getMessage()]);
}

// No cerrar la conexión con PDO
?>
