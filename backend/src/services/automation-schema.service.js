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
}
