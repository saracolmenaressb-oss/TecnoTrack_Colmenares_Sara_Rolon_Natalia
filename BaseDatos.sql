CREATE DATABASE TecnoTrack;

USE TecnoTrack;





CREATE TABLE IF NOT EXISTS equipos (
    id VARCHAR(30) PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    marca VARCHAR(100),
    sistema_operativo VARCHAR(100),
    ubicacion VARCHAR(100),
    estado ENUM(
        'DISPONIBLE',
        'PRESTADO',
        'DANADO',
        'INHABILITADO'
    ) NOT NULL DEFAULT 'DISPONIBLE',
    prestable BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS prestamos (
    id VARCHAR(30) PRIMARY KEY,
    equipo_id VARCHAR(30) NOT NULL,
    responsable VARCHAR(150) NOT NULL,
    fecha_prestamo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion DATETIME NULL,
    estado ENUM('ACTIVO', 'DEVUELTO')
        NOT NULL DEFAULT 'ACTIVO',
    FOREIGN KEY (equipo_id) REFERENCES equipos(id)
);

CREATE TABLE IF NOT EXISTS movimientos (
    id VARCHAR(30) PRIMARY KEY,
    tipo ENUM('PRESTAMO', 'DEVOLUCION') NOT NULL,
    equipo_id VARCHAR(30) NOT NULL,
    responsable VARCHAR(150) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacion VARCHAR(500),
    FOREIGN KEY (equipo_id) REFERENCES equipos(id)
);

SHOW TABLES;
USE TecnoTrack;

SELECT * FROM equipos;
SELECT * FROM prestamos;
SELECT * FROM movimientos;
