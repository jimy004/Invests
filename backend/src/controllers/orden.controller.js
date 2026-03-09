import * as Orden from "../models/orden.model.js";
import pool from "../db.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await Orden.getOrdenesByUsuario(req.authUserId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Orden.getOrdenById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByPosicion = async (req, res) => {
  try {
    const [rows] = await Orden.getOrdenesByPosicion(req.params.posicion_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByPortafolio = async (req, res) => {
  try {
    const [rows] = await Orden.getOrdenesByPortafolio(req.params.portafolio_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await Orden.getOrdenesByUsuario(req.params.usuario_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByActivo = async (req, res) => {
  try {
    const [rows] = await Orden.getOrdenesByActivo(req.params.activo_id);
    const filtered = rows.filter((row) => Number(row?.usuario_id || 0) === req.authUserId);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (tipo !== "compra" && tipo !== "venta") {
      return res.status(400).json({
        message: "Tipo debe ser 'compra' o 'venta'"
      });
    }

    const [rows] = await Orden.getOrdenesByTipo(tipo);
    const filtered = rows.filter((row) => Number(row?.usuario_id || 0) === req.authUserId);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByPeriodo = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        message: "fecha_inicio y fecha_fin son requeridos"
      });
    }

    const [rows] = await Orden.getOrdenesByPeriodo(fecha_inicio, fecha_fin);
    const filtered = rows.filter((row) => Number(row?.usuario_id || 0) === req.authUserId);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResumenByPortafolio = async (req, res) => {
  try {
    const [rows] = await Orden.getResumenOrdenesPortafolio(req.params.portafolio_id);
    if (!rows.length) return res.status(404).json({ message: "No se encontraron ordenes para este portafolio" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResumenByUsuario = async (req, res) => {
  try {
    const [rows] = await Orden.getResumenOrdenesUsuario(req.params.usuario_id);
    if (!rows.length) return res.status(404).json({ message: "No se encontraron ordenes para este usuario" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUltimoNumero = async (req, res) => {
  try {
    const [rows] = await Orden.getUltimoNumeroOrden();
    res.json({ ultimo_numero: rows[0].ultimo_numero });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { numero, tipo, posicion_id, fecha, cantidad, precio, comision = 0, observacion } = req.body;

    if (!tipo || !posicion_id || cantidad === undefined || precio === undefined) {
      return res.status(400).json({
        message: "tipo, posicion_id, cantidad y precio son requeridos"
      });
    }

    if (tipo !== "compra" && tipo !== "venta") {
      return res.status(400).json({
        message: "Tipo debe ser 'compra' o 'venta'"
      });
    }

    if (cantidad <= 0 || precio <= 0) {
      return res.status(400).json({
        message: "cantidad y precio deben ser numeros positivos"
      });
    }

    if (comision < 0) {
      return res.status(400).json({
        message: "La comision no puede ser negativa"
      });
    }

    const [result] = await Orden.createOrden({
      numero,
      tipo,
      posicion_id,
      fecha,
      cantidad,
      precio,
      comision,
      observacion
    });

    const [ordenCreada] = await Orden.getOrdenById(result.insertId);
    res.status(201).json({
      id: result.insertId,
      ...ordenCreada[0],
      message: "Orden creada exitosamente"
    });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        message: "La posicion especificada no existe"
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const ejecutarCompra = async (req, res) => {
  try {
    const { posicion_id, cantidad, precio, comision = 0, observacion } = req.body;

    if (!posicion_id || cantidad === undefined || precio === undefined) {
      return res.status(400).json({
        message: "posicion_id, cantidad y precio son requeridos"
      });
    }

    if (cantidad <= 0 || precio <= 0) {
      return res.status(400).json({
        message: "cantidad y precio deben ser numeros positivos"
      });
    }

    const result = await Orden.ejecutarOrdenCompra(posicion_id, cantidad, precio, comision, observacion);
    const [ordenCreada] = await Orden.getOrdenById(result.ordenId);

    res.status(201).json({
      id: result.ordenId,
      ...ordenCreada[0],
      message: "Orden de compra ejecutada exitosamente y posicion actualizada"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const ejecutarVenta = async (req, res) => {
  try {
    const { posicion_id, cantidad, precio, comision = 0, observacion } = req.body;

    if (!posicion_id || cantidad === undefined || precio === undefined) {
      return res.status(400).json({
        message: "posicion_id, cantidad y precio son requeridos"
      });
    }

    if (cantidad <= 0 || precio <= 0) {
      return res.status(400).json({
        message: "cantidad y precio deben ser numeros positivos"
      });
    }

    const result = await Orden.ejecutarOrdenVenta(posicion_id, cantidad, precio, comision, observacion);
    const [ordenCreada] = await Orden.getOrdenById(result.ordenId);

    const mensaje = result.eliminada
      ? "Orden de venta ejecutada exitosamente y posicion actualizada (cantidad llego a cero)"
      : "Orden de venta ejecutada exitosamente y posicion actualizada";

    res.status(201).json({
      id: result.ordenId,
      ...ordenCreada[0],
      eliminada: result.eliminada,
      message: mensaje
    });
  } catch (err) {
    if (String(err?.message || "").includes("Cantidad insuficiente")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  let connection = null;
  try {
    const ordenId = Number(req.params.id);
    const [rows] = await Orden.getOrdenById(ordenId);
    if (!rows.length) return res.status(404).json({ message: "No encontrada" });

    const ordenActual = rows[0];
    const tipo = String(req.body.tipo ?? ordenActual.tipo ?? "").toLowerCase();
    if (tipo !== "compra" && tipo !== "venta") {
      return res.status(400).json({
        message: "Tipo debe ser 'compra' o 'venta'"
      });
    }

    const posicionId = Number(req.body.posicion_id ?? ordenActual.posicion_id);
    if (!Number.isInteger(posicionId) || posicionId <= 0) {
      return res.status(400).json({
        message: "posicion_id invalido"
      });
    }

    const cantidad = Number(req.body.cantidad ?? ordenActual.cantidad);
    const precio = Number(req.body.precio ?? ordenActual.precio);
    const comision = Number(req.body.comision ?? ordenActual.comision ?? 0);
    if (!Number.isFinite(cantidad) || cantidad <= 0 || !Number.isFinite(precio) || precio <= 0) {
      return res.status(400).json({
        message: "cantidad y precio deben ser numeros positivos"
      });
    }
    if (!Number.isFinite(comision) || comision < 0) {
      return res.status(400).json({
        message: "La comision no puede ser negativa"
      });
    }

    const numeroRaw = req.body.numero ?? ordenActual.numero;
    const numero =
      numeroRaw === null || numeroRaw === undefined || numeroRaw === ""
        ? null
        : Number(numeroRaw);
    if (numero !== null && (!Number.isInteger(numero) || numero <= 0)) {
      return res.status(400).json({
        message: "numero invalido"
      });
    }

    const fechaRaw = req.body.fecha ?? ordenActual.fecha;
    const fecha = String(fechaRaw || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({
        message: "fecha invalida"
      });
    }

    const observacion =
      req.body.observacion === undefined
        ? ordenActual.observacion
        : String(req.body.observacion || "").trim() || null;

    const posicionOriginalId = Number(ordenActual.posicion_id || 0);
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `UPDATE Orden
       SET numero=?, tipo=?, posicion_id=?, fecha=?, cantidad=?, precio=?, comision=?, observacion=?
       WHERE id=?`,
      [numero, tipo, posicionId, fecha, cantidad, precio, comision, observacion, ordenId]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "No encontrada" });
    }

    if (Number.isInteger(posicionOriginalId) && posicionOriginalId > 0) {
      await Orden.recalcularPosicionDesdeOrdenes(connection, posicionOriginalId);
    }
    if (posicionId !== posicionOriginalId) {
      await Orden.recalcularPosicionDesdeOrdenes(connection, posicionId);
    }

    await connection.commit();
    connection.release();
    connection = null;

    const [ordenActualizada] = await Orden.getOrdenById(ordenId);
    res.json({
      ...ordenActualizada[0],
      message: "Orden actualizada"
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // no-op
      }
      connection.release();
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        message: "La posicion especificada no existe"
      });
    }
    if (String(err?.message || "").toLowerCase().includes("historial de ordenes invalido")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  let connection = null;
  try {
    const ordenId = Number(req.params.id);
    const [rows] = await Orden.getOrdenById(ordenId);
    if (!rows.length) return res.status(404).json({ message: "No encontrada" });

    const posicionId = Number(rows[0]?.posicion_id || 0);
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query("DELETE FROM Orden WHERE id=?", [ordenId]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "No encontrada" });
    }

    if (Number.isInteger(posicionId) && posicionId > 0) {
      await Orden.recalcularPosicionDesdeOrdenes(connection, posicionId);
    }

    await connection.commit();
    connection.release();
    connection = null;

    res.json({ message: "Orden eliminada" });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // no-op
      }
      connection.release();
    }
    res.status(500).json({ error: err.message });
  }
};
