import * as Moneda from "../models/moneda.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await Moneda.getAllMonedas();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Moneda.getMonedaById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const [result] = await Moneda.createMoneda(req.body);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Moneda.updateMoneda(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Actualizada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Moneda.deleteMoneda(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
