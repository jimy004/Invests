<?php
require "../conexion.php";

header('Content-Type: application/json');

// Obtener datos del formulario
$accion = $_POST['accion'] ?? '';
$fecha = $_POST['fecha'] ?? '';
$valor = $_POST['valor'] ?? null;

$response = ['success' => false, 'message' => ''];

try {
    switch ($accion) {
        case 'insertar':
            if (empty($fecha) || $valor === null) {
                $response['message'] = 'Fecha y valor son requeridos para insertar';
                break;
            }
            
            // Validar que el valor sea positivo
            if ($valor <= 0) {
                $response['message'] = 'El valor debe ser mayor que 0';
                break;
            }
            
            // Verificar si ya existe una entrada para esa fecha
            $checkStmt = $conexion->prepare("SELECT fecha FROM historialacciones WHERE fecha = :fecha");
            $checkStmt->bindParam(':fecha', $fecha);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                $response['message'] = 'Ya existe un registro para esta fecha';
                break;
            }
            
            $sql = "INSERT INTO historialacciones (fecha, valor) 
                    VALUES (:fecha, :valor)";
            $stmt = $conexion->prepare($sql);
            $stmt->bindParam(':fecha', $fecha);
            $stmt->bindParam(':valor', $valor);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Registro de historial insertado correctamente';
            } else {
                $response['message'] = 'Error al insertar registro';
            }
            break;

        case 'modificar':
            if (empty($fecha)) {
                $response['message'] = 'Fecha es requerida para modificar';
                break;
            }
            
            // Verificar si el registro existe
            $checkStmt = $conexion->prepare("SELECT fecha FROM historialacciones WHERE fecha = :fecha");
            $checkStmt->bindParam(':fecha', $fecha);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                $response['message'] = 'No existe un registro para esta fecha';
                break;
            }
            
            if ($valor === null) {
                $response['message'] = 'El valor es requerido para modificar';
                break;
            }
            
            // Validar que el valor sea positivo
            if ($valor <= 0) {
                $response['message'] = 'El valor debe ser mayor que 0';
                break;
            }
            
            $sql = "UPDATE historialacciones SET valor = :valor WHERE fecha = :fecha";
            $stmt = $conexion->prepare($sql);
            $stmt->bindParam(':fecha', $fecha);
            $stmt->bindParam(':valor', $valor);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Registro modificado correctamente';
            } else {
                $response['message'] = 'Error al modificar registro';
            }
            break;

        case 'eliminar':
            if (empty($fecha)) {
                $response['message'] = 'Fecha es requerida para eliminar';
                break;
            }
            
            // Verificar si el registro existe
            $checkStmt = $conexion->prepare("SELECT fecha FROM historialacciones WHERE fecha = :fecha");
            $checkStmt->bindParam(':fecha', $fecha);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                $response['message'] = 'No existe un registro para esta fecha';
                break;
            }
            
            $sql = "DELETE FROM historialacciones WHERE fecha = :fecha";
            $stmt = $conexion->prepare($sql);
            $stmt->bindParam(':fecha', $fecha);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Registro eliminado correctamente';
            } else {
                $response['message'] = 'Error al eliminar registro';
            }
            break;

        default:
            $response['message'] = 'Acción no válida';
            break;
    }
} catch (PDOException $e) {
    $response['message'] = 'Error de base de datos: ' . $e->getMessage();
}

echo json_encode($response);
?>