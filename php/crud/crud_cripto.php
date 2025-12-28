<?php
require "../../conexion.php";
require "../../api/coingecko.php";

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $accion = $_POST["accion"] ?? '';
    $ticker = $_POST["ticker"] ?? '';
    
    $response = ['success' => false, 'message' => ''];

    try {
        // Verificar que se haya proporcionado una acción
        if (empty($accion)) {
            $response['message'] = 'No se especificó ninguna acción';
            echo json_encode($response);
            exit();
        }

        // Verificar que se haya proporcionado un ticker
        if (empty($ticker)) {
            $response['message'] = 'Ticker es requerido';
            echo json_encode($response);
            exit();
        }

        if ($accion === "insertar") {
            // Validar campos requeridos
            $campos_requeridos = ['nombre', 'cantidad', 'precio_promedio'];
            foreach ($campos_requeridos as $campo) {
                if (empty($_POST[$campo])) {
                    $response['message'] = "El campo $campo es requerido";
                    echo json_encode($response);
                    exit();
                }
            }
            
            // Validar que cantidad y precio promedio sean positivos
            if ($_POST["cantidad"] <= 0) {
                $response['message'] = 'La cantidad debe ser mayor que 0';
                echo json_encode($response);
                exit();
            }
            
            if ($_POST["precio_promedio"] <= 0) {
                $response['message'] = 'El precio promedio debe ser mayor que 0';
                echo json_encode($response);
                exit();
            }
            
            // Verificar si ya existe el ticker
            $checkStmt = $conexion->prepare("SELECT ticker FROM criptomoneda WHERE ticker = :ticker");
            $checkStmt->bindParam(':ticker', $ticker);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                $response['message'] = 'Ya existe una criptomoneda con este ticker';
                echo json_encode($response);
                exit();
            }

            // Obtener valor actual desde CoinGecko
            $valor_actual = obtenerValorActualCripto($ticker);
            if ($valor_actual === null || $valor_actual <= 0) {
                $response['message'] = "No se pudo obtener el valor actual de $ticker";
                echo json_encode($response);
                exit();
            }

            $sql = "INSERT INTO criptomoneda
                    (nombre, ticker, icono, valor_actual, cantidad, precio_promedio)
                    VALUES (:nombre, :ticker, :icono, :valor_actual, :cantidad, :precio_promedio)";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([
                ":nombre" => $_POST["nombre"],
                ":ticker" => $ticker,
                ":icono" => $ticker . ".svg",
                ":valor_actual" => $valor_actual,
                ":cantidad" => $_POST["cantidad"],
                ":precio_promedio" => $_POST["precio_promedio"]
            ]);
            
            $response['success'] = true;
            $response['message'] = 'Criptomoneda insertada correctamente';
            
        } elseif ($accion === "modificar") {
            // Validar campos requeridos
            $campos_requeridos = ['nombre', 'cantidad', 'precio_promedio'];
            foreach ($campos_requeridos as $campo) {
                if (empty($_POST[$campo])) {
                    $response['message'] = "El campo $campo es requerido";
                    echo json_encode($response);
                    exit();
                }
            }
            
            // Validar que cantidad y precio promedio sean positivos
            if ($_POST["cantidad"] <= 0) {
                $response['message'] = 'La cantidad debe ser mayor que 0';
                echo json_encode($response);
                exit();
            }
            
            if ($_POST["precio_promedio"] <= 0) {
                $response['message'] = 'El precio promedio debe ser mayor que 0';
                echo json_encode($response);
                exit();
            }
            
            // Verificar si existe el ticker
            $checkStmt = $conexion->prepare("SELECT ticker FROM criptomoneda WHERE ticker = :ticker");
            $checkStmt->bindParam(':ticker', $ticker);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                $response['message'] = 'No existe una criptomoneda con este ticker';
                echo json_encode($response);
                exit();
            }

            // Obtener valor actual desde CoinGecko
            $valor_actual = obtenerValorActualCripto($ticker);
            if ($valor_actual === null || $valor_actual <= 0) {
                $response['message'] = "No se pudo obtener el valor actual de $ticker";
                echo json_encode($response);
                exit();
            }

            $sql = "UPDATE criptomoneda SET
                    nombre = :nombre,
                    icono = :icono,
                    valor_actual = :valor_actual,
                    cantidad = :cantidad,
                    precio_promedio = :precio_promedio
                    WHERE ticker = :ticker";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([
                ":ticker" => $ticker,
                ":nombre" => $_POST["nombre"],
                ":icono" => $ticker . ".svg",
                ":valor_actual" => $valor_actual,
                ":cantidad" => $_POST["cantidad"],
                ":precio_promedio" => $_POST["precio_promedio"]
            ]);
            
            $response['success'] = true;
            $response['message'] = 'Criptomoneda modificada correctamente';
            
        } elseif ($accion === "eliminar") {
            // Verificar si existe el ticker
            $checkStmt = $conexion->prepare("SELECT ticker FROM criptomoneda WHERE ticker = :ticker");
            $checkStmt->bindParam(':ticker', $ticker);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                $response['message'] = 'No existe una criptomoneda con este ticker';
                echo json_encode($response);
                exit();
            }

            $sql = "DELETE FROM criptomoneda WHERE ticker = :ticker";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([":ticker" => $ticker]);
            
            $response['success'] = true;
            $response['message'] = 'Criptomoneda eliminada correctamente';
            
        } else {
            $response['message'] = 'Acción no válida';
        }

    } catch (PDOException $e) {
        $response['message'] = 'Error de base de datos: ' . $e->getMessage();
    }

    echo json_encode($response);
    exit();
}
?>