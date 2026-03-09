import pool from "../db.js";

export const getAllActivos = () => pool.query(`
  SELECT a.*, c.categoria 
  FROM Activo a
  LEFT JOIN Categoria c ON a.categoria_id = c.id
`);

export const getActivoById = (id) => pool.query(`
  SELECT a.*, c.categoria 
  FROM Activo a
  LEFT JOIN Categoria c ON a.categoria_id = c.id
  WHERE a.id=?
`, [id]);

export const getActivosByCategoria = (categoria_id) => pool.query(`
  SELECT a.*, c.categoria 
  FROM Activo a
  LEFT JOIN Categoria c ON a.categoria_id = c.id
  WHERE a.categoria_id=?
`, [categoria_id]);

export const getActivoByTicker = (ticker) => pool.query(`
  SELECT a.*, c.categoria
  FROM Activo a
  LEFT JOIN Categoria c ON a.categoria_id = c.id
  WHERE UPPER(a.ticker)=UPPER(?)
`, [ticker]);

export const createActivo = ({ categoria_id = null, nombre, ticker = null, icono = null }) => pool.query(
  "INSERT INTO Activo(categoria_id, nombre, ticker, icono) VALUES(?,?,?,?)",
  [categoria_id, nombre, ticker, icono]
);

export const updateActivo = (id, { categoria_id, nombre, ticker, icono }) => pool.query(
  "UPDATE Activo SET categoria_id=?, nombre=?, ticker=?, icono=? WHERE id=?",
  [categoria_id, nombre, ticker, icono, id]
);

export const updateActivoCategoria = (id, categoria_id) => pool.query(
  "UPDATE Activo SET categoria_id=? WHERE id=?",
  [categoria_id, id]
);

export const updateActivoIcono = (id, icono) => pool.query(
  "UPDATE Activo SET icono=? WHERE id=?",
  [icono, id]
);

export const deleteActivo = (id) => pool.query(
  "DELETE FROM Activo WHERE id=?",
  [id]
);

export const deleteActivoCascade = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [activoRows] = await connection.query(
      "SELECT id FROM Activo WHERE id=? FOR UPDATE",
      [id]
    );
    if (!activoRows.length) {
      await connection.rollback();
      return [{ affectedRows: 0 }];
    }

    const [posiciones] = await connection.query(
      "SELECT id FROM Posicion WHERE activo_id=?",
      [id]
    );
    const posicionIds = posiciones.map((row) => Number(row.id)).filter((value) => Number.isInteger(value));

    if (posicionIds.length > 0) {
      const placeholders = posicionIds.map(() => "?").join(",");
      await connection.query(
        `DELETE FROM Orden WHERE posicion_id IN (${placeholders})`,
        posicionIds
      );
      await connection.query(
        `DELETE FROM PosicionSnapshot WHERE posicion_id IN (${placeholders})`,
        posicionIds
      );
    }

    await connection.query("DELETE FROM Posicion WHERE activo_id=?", [id]);
    await connection.query("DELETE FROM DetallesFondo WHERE activo_id=?", [id]);
    await connection.query("DELETE FROM DetallesAccion WHERE activo_id=?", [id]);
    const [deleteResult] = await connection.query("DELETE FROM Activo WHERE id=?", [id]);

    await connection.commit();
    return [deleteResult];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
