import pool from "../db.js";

export const getAllUsuarios = () => pool.query("SELECT * FROM Usuario");
export const getUsuarioById = (id) => pool.query("SELECT * FROM Usuario WHERE id=?", [id]);
export const getUsuarioByNombre = (nombre) => pool.query("SELECT * FROM Usuario WHERE nombre=?", [nombre]);
export const createUsuario = ({ nombre, password, moneda_id = 1 }) => pool.query(
  "INSERT INTO Usuario(nombre, password, moneda_id) VALUES(?,?,?)",
  [nombre, password, moneda_id]
);
export const updateUsuarioPassword = (id, password) => pool.query(
  "UPDATE Usuario SET password=? WHERE id=?",
  [password, id]
);
export const updateUsuario = (id, { nombre, password, moneda_id }) => pool.query(
  "UPDATE Usuario SET nombre=?, password=?, moneda_id=? WHERE id=?",
  [nombre, password, moneda_id, id]
);
export const deleteUsuario = (id) => pool.query(
  "DELETE FROM Usuario WHERE id=?",
  [id]
);
