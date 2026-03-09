import pool from "../db.js";

export const getAllPortafolios = () => pool.query(`
  SELECT p.*, u.nombre as usuario_nombre, m.nombre as moneda_nombre, c.categoria 
  FROM Portafolio p
  LEFT JOIN Usuario u ON p.usuario_id = u.id
  LEFT JOIN Moneda m ON p.moneda_id = m.id
  LEFT JOIN Categoria c ON p.categoria_id = c.id
`);

export const getPortafolioById = (id) => pool.query(`
  SELECT p.*, u.nombre as usuario_nombre, m.nombre as moneda_nombre, c.categoria 
  FROM Portafolio p
  LEFT JOIN Usuario u ON p.usuario_id = u.id
  LEFT JOIN Moneda m ON p.moneda_id = m.id
  LEFT JOIN Categoria c ON p.categoria_id = c.id
  WHERE p.id=?
`, [id]);

export const getPortafoliosByUsuario = (usuario_id) => pool.query(`
  SELECT p.*, u.nombre as usuario_nombre, m.nombre as moneda_nombre, c.categoria 
  FROM Portafolio p
  LEFT JOIN Usuario u ON p.usuario_id = u.id
  LEFT JOIN Moneda m ON p.moneda_id = m.id
  LEFT JOIN Categoria c ON p.categoria_id = c.id
  WHERE p.usuario_id=?
`, [usuario_id]);

export const createPortafolio = ({ usuario_id, nombre, moneda_id = null, categoria_id = null }) => pool.query(
  "INSERT INTO Portafolio(usuario_id, nombre, moneda_id, categoria_id) VALUES(?,?,?,?)",
  [usuario_id, nombre, moneda_id, categoria_id]
);

export const updatePortafolio = (id, { usuario_id, nombre, moneda_id, categoria_id }) => pool.query(
  "UPDATE Portafolio SET usuario_id=?, nombre=?, moneda_id=?, categoria_id=? WHERE id=?",
  [usuario_id, nombre, moneda_id, categoria_id, id]
);

export const deletePortafolio = (id) => pool.query(
  "DELETE FROM Portafolio WHERE id=?",
  [id]
);

export const deletePortafolioCascade = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [portafolioRows] = await connection.query(
      "SELECT id, usuario_id, categoria_id FROM Portafolio WHERE id=? FOR UPDATE",
      [id]
    );
    if (!portafolioRows.length) {
      await connection.rollback();
      return [{ affectedRows: 0 }];
    }
    const portafolio = portafolioRows[0];
    const usuarioId = Number(portafolio.usuario_id);
    const categoriaId =
      portafolio.categoria_id === null || portafolio.categoria_id === undefined
        ? null
        : Number(portafolio.categoria_id);

    const [posiciones] = await connection.query(
      "SELECT id FROM Posicion WHERE portafolio_id=?",
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

    await connection.query("DELETE FROM Posicion WHERE portafolio_id=?", [id]);
    await connection.query("DELETE FROM PortfolioSnapshot WHERE portafolio_id=?", [id]);
    const [deleteResult] = await connection.query("DELETE FROM Portafolio WHERE id=?", [id]);

    if (categoriaId !== null) {
      const [remainingRows] = await connection.query(
        `SELECT COUNT(*) AS total
         FROM Portafolio
         WHERE usuario_id=? AND categoria_id=?`,
        [usuarioId, categoriaId]
      );
      const remainingCount = Number(remainingRows?.[0]?.total || 0);
      if (remainingCount === 0) {
        await connection.query(
          "DELETE FROM Resumen WHERE usuario_id=? AND categoria_id=?",
          [usuarioId, categoriaId]
        );
      }
    }

    await connection.commit();
    return [deleteResult];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
