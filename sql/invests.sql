CREATE DATABASE investsdb;
USE investsdb;

CREATE TABLE inversiones(
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(32) NOT NULL,
    foto VARCHAR(32),
    cantidad DOUBLE NOT NULL
)ENGINE=InnoDB;

CREATE TABLE criptomoneda(
    nombre VARCHAR(32) NOT NULL,
    ticker VARCHAR(32) PRIMARY KEY,
    icono VARCHAR(32),
    valor_actual DOUBLE NOT NULL,
    cantidad DOUBLE NOT NULL,
    precio_promedio DOUBLE NOT NULL
)ENGINE=InnoDB;


CREATE TABLE sector(
    nombre VARCHAR(64) PRIMARY KEY,
    descripcion VARCHAR(128)
)ENGINE=InnoDB;

CREATE TABLE gestora(
    nombre VARCHAR(64) PRIMARY KEY,
    foto VARCHAR(32)
)ENGINE=InnoDB;

CREATE TABLE accion(
    nombre VARCHAR(32) NOT NULL,
    ticker VARCHAR(32) PRIMARY KEY,
    logo VARCHAR(32),
    sector VARCHAR(64) NOT NULL,
    valor_actual DOUBLE NOT NULL,
    cantidad DOUBLE NOT NULL,
    precio_promedio DOUBLE NOT NULL,
    dividendos BOOLEAN NOT NULL,
    FOREIGN KEY (sector) REFERENCES sector(nombre)
)ENGINE=InnoDB;

CREATE TABLE fondo(
    nombre VARCHAR(32) NOT NULL,
    isin VARCHAR(32) PRIMARY KEY,
    logo VARCHAR(32),
    valor_actual DOUBLE NOT NULL,
    cantidad DOUBLE NOT NULL,
    precio_promedio DOUBLE NOT NULL,
    moneda VARCHAR(8) NOT NULL,
    riesgo INT NOT NULL,
    politica enum('Acumulación','Distribución') NOT NULL,
    tipo enum ('Índice','Mixto','Renta Fija','Renta Variable') NOT NULL,
    gestora VARCHAR(64) NOT NULL,
    geografia VARCHAR(64) NOT NULL,
    FOREIGN KEY (gestora) REFERENCES gestora(nombre)
)ENGINE=InnoDB;

CREATE TABLE historialcriptos(
    fecha DATE PRIMARY KEY,
    valor DOUBLE NOT NULL,
    cantidadBTC DOUBLE
)ENGINE=InnoDB;

CREATE TABLE historialacciones(
    fecha DATE PRIMARY KEY,
    valor DOUBLE NOT NULL
)ENGINE=InnoDB;

CREATE TABLE historialfondos(
    fecha DATE PRIMARY KEY,
    valor DOUBLE NOT NULL
)ENGINE=InnoDB;

CREATE TABLE historialinversiones(
    fecha DATE PRIMARY KEY,
    valor DOUBLE NOT NULL
)ENGINE=InnoDB;


INSERT INTO sector (`nombre`, `descripcion`) VALUES
('Tecnología', 'Empresas de software, hardware, semiconductores y servicios IT'),
('Salud', 'Farmacéuticas, biotecnología y equipamiento médico'),
('Finanzas', 'Bancos, aseguradoras y servicios financieros'),
('Consumo Discrecional', 'Retail, automoción, ocio y bienes no esenciales'),
('Consumo Básico', 'Alimentos, bebidas y productos del hogar'),
('Energía', 'Petróleo, gas y energías relacionadas'),
('Industriales', 'Manufactura, transporte, infraestructura y servicios industriales'),
('Materiales', 'Minería, químicos y materiales de construcción'),
('Servicios de Comunicación', 'Telecomunicaciones, medios y entretenimiento'),
('Inmobiliario', 'REITs y empresas del sector inmobiliario'),
('Utilities', 'Electricidad, agua, gas y servicios públicos');

INSERT INTO gestora (`nombre`, `foto`) VALUES
('Fidelity', 'fidelity.svg'),
('Vanguard', 'vanguard.svg'),
('BlackRock', 'blackrock.svg'),
('Amundi', 'amundi.svg'),
('State Street', 'statestreet.svg'),
('Invesco', 'invesco.svg'),
('Pictet', 'pictet.svg');

INSERT INTO `inversiones` (`id`, `tipo`, `cantidad`,`foto`) VALUES
(1, 'criptomoneda', 0,NULL),
(2, 'accion', 0,NULL),
(3, 'fondo', 0,NULL),
(4, 'euros', 0,NULL);