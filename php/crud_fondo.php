<?php
require "../conexion.php";
require "../api/python_prices.php";

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $accion = $_POST["accion"] ?? '';
    $isin = $_POST["isin"] ?? '';
    
    $response = ['success' => false, 'message' => ''];

    try {
        // Verificar que se haya proporcionado una acción
        if (empty($accion)) {
            $response['message'] = 'No se especificó ninguna acción';
            echo json_encode($response);
            exit();
        }

        // Verificar que se haya proporcionado un ISIN
        if (empty($isin)) {
            $response['message'] = 'ISIN es requerido';
            echo json_encode($response);
            exit();
        }

        if ($accion === "insertar") {
            // Validar campos requeridos
            $campos_requeridos = ['nombre', 'cantidad', 'precio_promedio', 'moneda', 'riesgo', 'politica', 'tipo', 'gestora', 'geografia'];
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
            
            // Verificar si ya existe el ISIN
            $checkStmt = $conexion->prepare("SELECT isin FROM fondo WHERE isin = :isin");
            $checkStmt->bindParam(':isin', $isin);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                $response['message'] = 'Ya existe un fondo con este ISIN';
                echo json_encode($response);
                exit();
            }

            // Obtener valor actual desde invest.py
            $precios = obtenerValorActualPython($isin);
            $valor_actual = $precios[$isin] ?? 0;

            if ($valor_actual === 0) {
                $response['message'] = "No se pudo obtener el valor actual de $isin";
                echo json_encode($response);
                exit();
            }

            $sql = "INSERT INTO fondo
                    (nombre, isin, logo, valor_actual, cantidad, precio_promedio, moneda, riesgo, politica, tipo, gestora, geografia)
                    VALUES (:nombre, :isin, :logo, :valor_actual, :cantidad, :precio_promedio, :moneda, :riesgo, :politica, :tipo, :gestora, :geografia)";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([
                ":nombre" => $_POST["nombre"],
                ":isin" => $isin,
                ":logo" => $_POST["gestora"] . ".svg",
                ":valor_actual" => $valor_actual,
                ":cantidad" => $_POST["cantidad"],
                ":precio_promedio" => $_POST["precio_promedio"],
                ":moneda" => $_POST["moneda"],
                ":riesgo" => $_POST["riesgo"],
                ":politica" => $_POST["politica"],
                ":tipo" => $_POST["tipo"],
                ":gestora" => $_POST["gestora"],
                ":geografia" => $_POST["geografia"]
            ]);
            
            $response['success'] = true;
            $response['message'] = 'Fondo insertado correctamente';
            
        } elseif ($accion === "modificar") {
            // Validar campos requeridos
            $campos_requeridos = ['nombre', 'cantidad', 'precio_promedio', 'moneda', 'riesgo', 'politica', 'tipo', 'gestora', 'geografia'];
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
            
            // Verificar si existe el ISIN
            $checkStmt = $conexion->prepare("SELECT isin FROM fondo WHERE isin = :isin");
            $checkStmt->bindParam(':isin', $isin);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                $response['message'] = 'No existe un fondo con este ISIN';
                echo json_encode($response);
                exit();
            }

            // Obtener valor actual desde invest.py
            $precios = obtenerValorActualPython($isin);
            $valor_actual = $precios[$isin] ?? 0;

            if ($valor_actual === 0) {
                $response['message'] = "No se pudo obtener el valor actual de $isin";
                echo json_encode($response);
                exit();
            }

            $sql = "UPDATE fondo SET
                    nombre = :nombre,
                    logo = :logo,
                    valor_actual = :valor_actual,
                    cantidad = :cantidad,
                    precio_promedio = :precio_promedio,
                    moneda = :moneda,
                    riesgo = :riesgo,
                    politica = :politica,
                    tipo = :tipo,
                    gestora = :gestora,
                    geografia = :geografia
                    WHERE isin = :isin";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([
                ":isin" => $isin,
                ":nombre" => $_POST["nombre"],
                ":logo" => $_POST["gestora"] . ".svg",
                ":valor_actual" => $valor_actual,
                ":cantidad" => $_POST["cantidad"],
                ":precio_promedio" => $_POST["precio_promedio"],
                ":moneda" => $_POST["moneda"],
                ":riesgo" => $_POST["riesgo"],
                ":politica" => $_POST["politica"],
                ":tipo" => $_POST["tipo"],
                ":gestora" => $_POST["gestora"],
                ":geografia" => $_POST["geografia"]
            ]);
            
            $response['success'] = true;
            $response['message'] = 'Fondo modificado correctamente';
            
        } elseif ($accion === "eliminar") {
            // Verificar si existe el ISIN
            $checkStmt = $conexion->prepare("SELECT isin FROM fondo WHERE isin = :isin");
            $checkStmt->bindParam(':isin', $isin);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                $response['message'] = 'No existe un fondo con este ISIN';
                echo json_encode($response);
                exit();
            }

            $sql = "DELETE FROM fondo WHERE isin = :isin";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([":isin" => $isin]);
            
            $response['success'] = true;
            $response['message'] = 'Fondo eliminado correctamente';
            
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