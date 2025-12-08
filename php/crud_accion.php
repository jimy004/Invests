<?php
require "../conexion.php";
require "../api/python_prices.php";
require "../api/usd_eur.php";

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

        // Verificar que se haya proporcionado un ticker (excepto en algunas validaciones)
        if (empty($ticker) && $accion !== 'eliminar') {
            $response['message'] = 'Ticker es requerido';
            echo json_encode($response);
            exit();
        }

        // Obtener valor actual desde Yahoo Finance (excepto para eliminar)
        if ($accion !== 'eliminar') {
            $precios = obtenerValorActualPython($ticker);
            $valor_actual = $precios[$ticker] ?? 0;

            if ($valor_actual === 0) {
                $response['message'] = "No se pudo obtener el valor actual de $ticker";
                echo json_encode($response);
                exit();
            }

            $conversion = usd_to_eur();
            $valor_actual = round($valor_actual * $conversion, 2);
        }

        if ($accion === "insertar") {
            // Validar campos requeridos
            $campos_requeridos = ['nombre', 'sector', 'cantidad', 'precio_promedio'];
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
            $checkStmt = $conexion->prepare("SELECT ticker FROM accion WHERE ticker = :ticker");
            $checkStmt->bindParam(':ticker', $ticker);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                $response['message'] = 'Ya existe una acción con este ticker';
                echo json_encode($response);
                exit();
            }

            $sql = "INSERT INTO accion
                    (nombre, ticker, logo, sector, valor_actual, cantidad, precio_promedio, dividendos)
                    VALUES (:nombre, :ticker, :logo, :sector, :valor_actual, :cantidad, :precio_promedio, :dividendos)";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([
                ":nombre" => $_POST["nombre"],
                ":ticker" => $ticker,
                ":logo" =>  $ticker . ".svg",
                ":sector" => $_POST["sector"],
                ":valor_actual" => $valor_actual,
                ":cantidad" => $_POST["cantidad"],
                ":precio_promedio" => $_POST["precio_promedio"],
                ":dividendos" => isset($_POST["dividendos"]) ? 1 : 0
            ]);
            
            $response['success'] = true;
            $response['message'] = 'Acción insertada correctamente';
            
        } elseif ($accion === "modificar") {
            // Validar campos requeridos
            $campos_requeridos = ['nombre', 'sector', 'cantidad', 'precio_promedio'];
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
            $checkStmt = $conexion->prepare("SELECT ticker FROM accion WHERE ticker = :ticker");
            $checkStmt->bindParam(':ticker', $ticker);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                $response['message'] = 'No existe una acción con este ticker';
                echo json_encode($response);
                exit();
            }

            $sql = "UPDATE accion SET
                    nombre = :nombre,
                    logo = :logo,
                    sector = :sector,
                    valor_actual = :valor_actual,
                    cantidad = :cantidad,
                    precio_promedio = :precio_promedio,
                    dividendos = :dividendos
                    WHERE ticker = :ticker";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([
                ":ticker" => $ticker,
                ":nombre" => $_POST["nombre"],
                ":logo" => $ticker . ".svg",
                ":sector" => $_POST["sector"],
                ":valor_actual" => $valor_actual,
                ":cantidad" => $_POST["cantidad"],
                ":precio_promedio" => $_POST["precio_promedio"],
                ":dividendos" => isset($_POST["dividendos"]) ? 1 : 0
            ]);
            
            $response['success'] = true;
            $response['message'] = 'Acción modificada correctamente';
            
        } elseif ($accion === "eliminar") {
            // Verificar si existe el ticker
            $checkStmt = $conexion->prepare("SELECT ticker FROM accion WHERE ticker = :ticker");
            $checkStmt->bindParam(':ticker', $ticker);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                $response['message'] = 'No existe una acción con este ticker';
                echo json_encode($response);
                exit();
            }

            $sql = "DELETE FROM accion WHERE ticker = :ticker";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([":ticker" => $ticker]);
            
            $response['success'] = true;
            $response['message'] = 'Acción eliminada correctamente';
            
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