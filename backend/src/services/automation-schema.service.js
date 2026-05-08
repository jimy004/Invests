import pool from "../db.js";

async function ensureSnapshotFechaDateTime(tableName) {
  const [rows] = await pool.query(
    `SELECT DATA_TYPE AS data_type
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = 'fecha'
      LIMIT 1`,
    [tableName]
  );

  if (!rows.length) return;
  if (String(rows[0].data_type || "").toLowerCase() === "datetime") return;

  await pool.query(
    `ALTER TABLE ${tableName}
      MODIFY COLUMN fecha DATETIME NULL DEFAULT CURRENT_TIMESTAMP`
  );
}

async function ensureCashFlowCategoriaColumn() {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'CashFlow'
        AND COLUMN_NAME = 'categoria'
      LIMIT 1`
  );
  if (rows.length) return;

  await pool.query(
    `ALTER TABLE CashFlow
      ADD COLUMN categoria VARCHAR(80) NOT NULL DEFAULT 'otros' AFTER tipo`
  );
  await pool.query(
    `ALTER TABLE CashFlow
      ADD INDEX idx_cashflow_categoria (categoria)`
  );
}

async function ensureCashFlowMonedaColumn() {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'CashFlow'
        AND COLUMN_NAME = 'moneda_id'
      LIMIT 1`
  );
  if (!rows.length) {
    await pool.query(
      `ALTER TABLE CashFlow
        ADD COLUMN moneda_id INT NULL AFTER categoria`
    );
  }

  const [idxRows] = await pool.query(
    `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'CashFlow'
        AND INDEX_NAME = 'idx_cashflow_moneda'
      LIMIT 1`
  );
  if (!idxRows.length) {
    await pool.query(
      `ALTER TABLE CashFlow
        ADD INDEX idx_cashflow_moneda (moneda_id)`
    );
  }
}

async function ensurePosicionNotaColumn() {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Posicion' AND COLUMN_NAME = 'nota' LIMIT 1`
  );
  if (!rows.length) {
    await pool.query(`ALTER TABLE Posicion ADD COLUMN nota TEXT NULL`);
  }
}

async function ensurePrecioAlertaTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS PrecioAlerta (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      activo_id INT NOT NULL,
      tipo ENUM('mayor','menor') NOT NULL,
      precio_objetivo DECIMAL(15,4) NOT NULL,
      activa TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_precioalerta_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
      CONSTRAINT fk_precioalerta_activo FOREIGN KEY (activo_id) REFERENCES Activo(id) ON DELETE CASCADE,
      INDEX idx_precioalerta_usuario (usuario_id),
      INDEX idx_precioalerta_activa (activa)
    )
  `);
}

async function ensureWatchlistTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Watchlist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      activo_id INT NOT NULL,
      nota TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_watchlist (usuario_id, activo_id),
      CONSTRAINT fk_watchlist_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
      CONSTRAINT fk_watchlist_activo FOREIGN KEY (activo_id) REFERENCES Activo(id) ON DELETE CASCADE
    )
  `);
}

async function ensureObjetivoFinancieroTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ObjetivoFinanciero (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      nombre VARCHAR(150) NOT NULL,
      monto_objetivo DECIMAL(15,2) NOT NULL,
      fecha_objetivo DATE NOT NULL,
      monto_inicial DECIMAL(15,2) NOT NULL DEFAULT 0,
      nota TEXT,
      portafolio_ids TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_objetivo_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
      INDEX idx_objetivo_usuario (usuario_id)
    )
  `);
  const [[{ cnt }]] = await pool.query(`SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ObjetivoFinanciero' AND COLUMN_NAME='portafolio_ids'`);
  if (!cnt) await pool.query(`ALTER TABLE ObjetivoFinanciero ADD COLUMN portafolio_ids TEXT`);
}

async function ensureDividendoTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Dividendo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      posicion_id INT NOT NULL,
      fecha DATE NOT NULL,
      importe DECIMAL(15,4) NOT NULL,
      moneda_id INT NULL,
      observacion TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_dividendo_posicion FOREIGN KEY (posicion_id) REFERENCES Posicion(id) ON DELETE CASCADE,
      CONSTRAINT fk_dividendo_moneda FOREIGN KEY (moneda_id) REFERENCES Moneda(id),
      INDEX idx_dividendo_posicion (posicion_id),
      INDEX idx_dividendo_fecha (fecha)
    )
  `);
}

export async function ensureAutomationSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS SnapshotConfig (
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
      CONSTRAINT fk_snapshot_config_usuario
        FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Notificacion (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      tipo VARCHAR(50) NOT NULL,
      mensaje TEXT NOT NULL,
      leida TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME NULL,
      INDEX idx_notificacion_usuario_fecha (usuario_id, created_at),
      INDEX idx_notificacion_usuario_leida (usuario_id, leida),
      CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
    )
  `);

  await ensureSnapshotFechaDateTime("PortfolioSnapshot");
  await ensureSnapshotFechaDateTime("PosicionSnapshot");
  await ensureCashFlowCategoriaColumn();
  await ensureCashFlowMonedaColumn();
  await ensurePosicionNotaColumn();
  await ensurePrecioAlertaTable();
  await ensureWatchlistTable();
  await ensureObjetivoFinancieroTable();
  await ensureDividendoTable();
}
