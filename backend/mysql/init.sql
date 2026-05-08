CREATE DATABASE IF NOT EXISTS invests;
USE invests;

-- Tabla Moneda
CREATE TABLE Moneda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ticker VARCHAR(10),
    icono VARCHAR(255)
);

-- Seed monedas principales (idempotente)
INSERT INTO Moneda (nombre, ticker, icono)
SELECT v.nombre, v.ticker, NULL
FROM (
    SELECT 'Dolar estadounidense' AS nombre, 'USD' AS ticker
    UNION ALL SELECT 'Euro', 'EUR'
    UNION ALL SELECT 'Libra esterlina', 'GBP'
    UNION ALL SELECT 'Yen japones', 'JPY'
    UNION ALL SELECT 'Franco suizo', 'CHF'
    UNION ALL SELECT 'Dolar canadiense', 'CAD'
    UNION ALL SELECT 'Dolar australiano', 'AUD'
    UNION ALL SELECT 'Yuan chino', 'CNY'
    UNION ALL SELECT 'Corona sueca', 'SEK'
    UNION ALL SELECT 'Corona noruega', 'NOK'
    UNION ALL SELECT 'Dolar neozelandes', 'NZD'
    UNION ALL SELECT 'Dolar de Singapur', 'SGD'
    UNION ALL SELECT 'Peso mexicano', 'MXN'
    UNION ALL SELECT 'Real brasileno', 'BRL'
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM Moneda m WHERE UPPER(m.ticker) = UPPER(v.ticker)
);

-- Tabla Usuario
CREATE TABLE Usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    moneda_id int DEFAULT 1,
    FOREIGN KEY (moneda_id) REFERENCES Moneda(id)
);

-- Configuracion de snapshots por usuario
CREATE TABLE SnapshotConfig (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    enabled TINYINT(1) NOT NULL DEFAULT 0,
    interval_portafolio_minutes INT NOT NULL DEFAULT 1440,
    interval_posicion_minutes INT NOT NULL DEFAULT 1440,
    last_run_portafolio DATETIME NULL,
    last_run_posicion DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_snapshot_config_usuario (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
);

-- Notificaciones de usuario
CREATE TABLE Notificacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    leida TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    INDEX idx_notificacion_usuario_fecha (usuario_id, created_at),
    INDEX idx_notificacion_usuario_leida (usuario_id, leida),
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
);

-- Tabla Categoria
CREATE TABLE Categoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria VARCHAR(100),
    icono VARCHAR(255)
);

-- Tabla Portafolio
CREATE TABLE Portafolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(100),
    moneda_id INT,
    categoria_id INT,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id),
    FOREIGN KEY (moneda_id) REFERENCES Moneda(id),
    FOREIGN KEY (categoria_id) REFERENCES Categoria(id),
    INDEX idx_portafolio_usuario (usuario_id)
);

-- Tabla Activo
CREATE TABLE Activo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT,
    nombre VARCHAR(100),
    ticker VARCHAR(50),
    icono VARCHAR(255),
    FOREIGN KEY (categoria_id) REFERENCES Categoria(id),
    INDEX idx_activo_categoria (categoria_id),
    INDEX idx_activo_ticker (ticker)
);

-- Tabla Sector
CREATE TABLE Sector (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    icono VARCHAR(255),
    descripcion TEXT
);

-- Tabla Gestora
CREATE TABLE Gestora (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    icono VARCHAR(255),
    descripcion TEXT
);

-- Tabla Politica
CREATE TABLE Politica (
    id INT AUTO_INCREMENT PRIMARY KEY,
    politica VARCHAR(255)
);

-- Tabla Tipo
CREATE TABLE Tipo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100)
);

-- Tabla Geografia
CREATE TABLE Geografia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    geografia VARCHAR(100)
);

-- Tabla DetallesFondo
CREATE TABLE DetallesFondo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activo_id INT,
    gestora_id INT,
    politica_id INT,
    tipo_id INT,
    geografia_id INT,
    sector_id INT,
    FOREIGN KEY (activo_id) REFERENCES Activo(id),
    FOREIGN KEY (gestora_id) REFERENCES Gestora(id),
    FOREIGN KEY (politica_id) REFERENCES Politica(id),
    FOREIGN KEY (tipo_id) REFERENCES Tipo(id),
    FOREIGN KEY (geografia_id) REFERENCES Geografia(id),
    FOREIGN KEY (sector_id) REFERENCES Sector(id),
    INDEX idx_detallesfondo_activo (activo_id)
);

-- Tabla Resumen
CREATE TABLE Resumen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    pesoObjetivo DECIMAL(10,2) DEFAULT 0,
    inversionInicial DECIMAL(15,2) DEFAULT 0,
    categoria_id INT,
    FOREIGN KEY (categoria_id) REFERENCES Categoria(id),
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id),
    INDEX idx_resumen_usuario (usuario_id)
);

-- Tabla CashFlow
CREATE TABLE CashFlow (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo enum('ingreso', 'gasto') NOT NULL,
    categoria VARCHAR(80) NOT NULL DEFAULT 'otros',
    moneda_id INT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    aporte DECIMAL(15,2) NOT NULL,
    observacion TEXT,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id),
    FOREIGN KEY (moneda_id) REFERENCES Moneda(id),
    INDEX idx_cashflow_usuario_fecha (usuario_id, fecha),
    INDEX idx_cashflow_tipo (tipo),
    INDEX idx_cashflow_categoria (categoria),
    INDEX idx_cashflow_moneda (moneda_id)
);
-- Tabla Posicion
CREATE TABLE Posicion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portafolio_id INT,
    activo_id INT,
    cantidad DECIMAL(15,4),
    preciopromedio DECIMAL(15,4),
    FOREIGN KEY (portafolio_id) REFERENCES Portafolio(id),
    FOREIGN KEY (activo_id) REFERENCES Activo(id),
    INDEX idx_posicion_portafolio (portafolio_id),
    INDEX idx_posicion_activo (activo_id)
);

-- Tabla Orden
CREATE TABLE Orden (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT AUTO_INCREMENT,
    tipo enum('compra', 'venta') NOT NULL,
    posicion_id INT,
    fecha DATE DEFAULT (CURRENT_DATE),
    cantidad DECIMAL(15,4) NOT NULL,
    precio DECIMAL(15,4) NOT NULL,
    comision DECIMAL(15,4) DEFAULT 0,
    observacion TEXT,
    FOREIGN KEY (posicion_id) REFERENCES Posicion(id),
    INDEX idx_orden_posicion (posicion_id),
    INDEX idx_orden_fecha (fecha),
    INDEX idx_orden_posicion_fecha (posicion_id, fecha)
);

-- Tabla PortfolioSnapshot
CREATE TABLE PortfolioSnapshot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portafolio_id INT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    valor DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (portafolio_id) REFERENCES Portafolio(id),
    INDEX idx_portfoliosnapshot_portafolio_fecha (portafolio_id, fecha)
);

-- Tabla PosicionSnapshot
CREATE TABLE PosicionSnapshot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    posicion_id INT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    valor DECIMAL(15,2) NOT NULL,
    cantidad DECIMAL(15,4),
    FOREIGN KEY (posicion_id) REFERENCES Posicion(id),
    INDEX idx_posicionsnapshot_posicion_fecha (posicion_id, fecha)
);

-- Tabla DetallesAccion (vacio, placeholder)
CREATE TABLE DetallesAccion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activo_id INT,
    sector_id INT,
    FOREIGN KEY (activo_id) REFERENCES Activo(id),
    FOREIGN KEY (sector_id) REFERENCES Sector(id),
    INDEX idx_detallesaccion_activo (activo_id)
);

-- Tabla ObjetivoFinanciero
CREATE TABLE IF NOT EXISTS ObjetivoFinanciero (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    monto_objetivo DECIMAL(15,2) NOT NULL,
    fecha_objetivo DATE NOT NULL,
    monto_inicial DECIMAL(15,2) DEFAULT 0,
    nota TEXT,
    portafolio_ids TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
    INDEX idx_objetivo_usuario (usuario_id)
);

-- Tabla PrecioAlerta
CREATE TABLE IF NOT EXISTS PrecioAlerta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    activo_id INT NOT NULL,
    tipo ENUM('mayor','menor') NOT NULL,
    precio_objetivo DECIMAL(15,4) NOT NULL,
    activa TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (activo_id) REFERENCES Activo(id),
    INDEX idx_precioalerta_usuario (usuario_id)
);

-- Tabla Watchlist
CREATE TABLE IF NOT EXISTS Watchlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    activo_id INT NOT NULL,
    nota TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_watchlist_usuario_activo (usuario_id, activo_id),
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (activo_id) REFERENCES Activo(id)
);

-- Tabla Dividendo
CREATE TABLE IF NOT EXISTS Dividendo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    posicion_id INT NOT NULL,
    fecha DATE NOT NULL,
    importe DECIMAL(15,4) NOT NULL,
    moneda_id INT,
    observacion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posicion_id) REFERENCES Posicion(id) ON DELETE CASCADE,
    FOREIGN KEY (moneda_id) REFERENCES Moneda(id),
    INDEX idx_dividendo_posicion (posicion_id)
);

-- Seed categorias base (idempotente)
INSERT INTO Categoria (categoria, icono)
SELECT 'Criptomonedas', NULL
WHERE NOT EXISTS (SELECT 1 FROM Categoria WHERE categoria = 'Criptomonedas');

INSERT INTO Categoria (categoria, icono)
SELECT 'Acciones', NULL
WHERE NOT EXISTS (SELECT 1 FROM Categoria WHERE categoria = 'Acciones');

INSERT INTO Categoria (categoria, icono)
SELECT 'ETFs', NULL
WHERE NOT EXISTS (SELECT 1 FROM Categoria WHERE categoria = 'ETFs');

INSERT INTO Categoria (categoria, icono)
SELECT 'Renta fija', NULL
WHERE NOT EXISTS (SELECT 1 FROM Categoria WHERE categoria = 'Renta fija');

INSERT INTO Categoria (categoria, icono)
SELECT 'Liquidez', NULL
WHERE NOT EXISTS (SELECT 1 FROM Categoria WHERE categoria = 'Liquidez');

INSERT INTO Categoria (categoria, icono)
SELECT 'Inmobiliario', NULL
WHERE NOT EXISTS (SELECT 1 FROM Categoria WHERE categoria = 'Inmobiliario');

INSERT INTO Categoria (categoria, icono)
SELECT 'Materias primas', NULL
WHERE NOT EXISTS (SELECT 1 FROM Categoria WHERE categoria = 'Materias primas');

INSERT INTO Categoria (categoria, icono)
SELECT 'Derivados', NULL
WHERE NOT EXISTS (SELECT 1 FROM Categoria WHERE categoria = 'Derivados');

INSERT INTO Categoria (categoria, icono)
SELECT 'Otros', NULL
WHERE NOT EXISTS (SELECT 1 FROM Categoria WHERE categoria = 'Otros');

-- Seed gestoras base (idempotente)
INSERT INTO Gestora (nombre, icono, descripcion)
SELECT v.nombre, NULL, NULL
FROM (
    SELECT 'Vanguard Group' AS nombre
    UNION ALL SELECT 'BlackRock'
    UNION ALL SELECT 'Amundi'
    UNION ALL SELECT 'Fidelity Investments'
    UNION ALL SELECT 'J.P. Morgan Asset Management'
    UNION ALL SELECT 'Pictet Group'
    UNION ALL SELECT 'UBS Asset Management'
    UNION ALL SELECT 'BNP Paribas Asset Management'
    UNION ALL SELECT 'DWS Group'
    UNION ALL SELECT 'Schroders'
    UNION ALL SELECT 'Invesco'
    UNION ALL SELECT 'Franklin Templeton'
    UNION ALL SELECT 'AXA Investment Managers'
    UNION ALL SELECT 'State Street Global Advisors'
    UNION ALL SELECT 'HSBC Asset Management'
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM Gestora g WHERE g.nombre = v.nombre
);

-- Seed politicas base (idempotente)
INSERT INTO Politica (politica)
SELECT v.politica
FROM (
    SELECT 'Growth' AS politica
    UNION ALL SELECT 'Value'
    UNION ALL SELECT 'Blend'
    UNION ALL SELECT 'Income'
    UNION ALL SELECT 'Capital Preservation'
    UNION ALL SELECT 'ESG / Sostenible'
    UNION ALL SELECT 'ISR'
    UNION ALL SELECT 'Impact Investing'
    UNION ALL SELECT 'Quality'
    UNION ALL SELECT 'Small Cap'
    UNION ALL SELECT 'Mid Cap'
    UNION ALL SELECT 'Large Cap'
    UNION ALL SELECT 'Thematic'
    UNION ALL SELECT 'Dividend Aristocrats'
    UNION ALL SELECT 'Long/Short'
    UNION ALL SELECT 'Absolute Return'
    UNION ALL SELECT 'Global Macro'
    UNION ALL SELECT 'Multi-Asset'
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM Politica p WHERE p.politica = v.politica
);

-- Seed tipos base (idempotente)
INSERT INTO Tipo (tipo)
SELECT v.tipo
FROM (
    SELECT 'Fondo de renta variable' AS tipo
    UNION ALL SELECT 'Fondo de renta fija'
    UNION ALL SELECT 'Fondo mixto'
    UNION ALL SELECT 'Fondo monetario'
    UNION ALL SELECT 'Fondo indexado'
    UNION ALL SELECT 'ETF'
    UNION ALL SELECT 'Fondo sectorial'
    UNION ALL SELECT 'Fondo tematico'
    UNION ALL SELECT 'Fondo garantizado'
    UNION ALL SELECT 'Fondo de retorno absoluto'
    UNION ALL SELECT 'Fondo inmobiliario'
    UNION ALL SELECT 'Fondo de materias primas'
    UNION ALL SELECT 'Fondo alternativo'
    UNION ALL SELECT 'Fondo de fondos'
    UNION ALL SELECT 'Hedge Fund'
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM Tipo t WHERE t.tipo = v.tipo
);

-- Seed geografias base (idempotente)
INSERT INTO Geografia (geografia)
SELECT v.geografia
FROM (
    SELECT 'Globales' AS geografia
    UNION ALL SELECT 'Global'
    UNION ALL SELECT 'Developed Markets'
    UNION ALL SELECT 'Emerging Markets'
    UNION ALL SELECT 'Frontier Markets'
    UNION ALL SELECT 'Norteamerica'
    UNION ALL SELECT 'Europa'
    UNION ALL SELECT 'Asia-Pacifico'
    UNION ALL SELECT 'Latinoamerica'
    UNION ALL SELECT 'Oriente Medio'
    UNION ALL SELECT 'Africa'
    UNION ALL SELECT 'Estados Unidos'
    UNION ALL SELECT 'China'
    UNION ALL SELECT 'India'
    UNION ALL SELECT 'Japon'
    UNION ALL SELECT 'Alemania'
    UNION ALL SELECT 'Francia'
    UNION ALL SELECT 'Reino Unido'
    UNION ALL SELECT 'Espana'
    UNION ALL SELECT 'Suiza'
    UNION ALL SELECT 'Brasil'
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM Geografia g WHERE g.geografia = v.geografia
);

-- Seed sectores base (idempotente)
INSERT INTO Sector (nombre, icono, descripcion)
SELECT v.nombre, NULL, NULL
FROM (
    SELECT 'Tecnologia' AS nombre
    UNION ALL SELECT 'Salud'
    UNION ALL SELECT 'Financiero'
    UNION ALL SELECT 'Consumo discrecional'
    UNION ALL SELECT 'Consumo basico'
    UNION ALL SELECT 'Energia'
    UNION ALL SELECT 'Industria'
    UNION ALL SELECT 'Materiales'
    UNION ALL SELECT 'Utilities'
    UNION ALL SELECT 'Telecomunicaciones'
    UNION ALL SELECT 'Inmobiliario'
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM Sector s WHERE s.nombre = v.nombre
);
