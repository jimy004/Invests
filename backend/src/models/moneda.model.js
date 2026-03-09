import pool from "../db.js";

export const getAllMonedas = () => pool.query("SELECT * FROM Moneda");
export const getMonedaById = (id) => pool.query("SELECT * FROM Moneda WHERE id=?", [id]);
export const createMoneda = ({ nombre, ticker, icono }) => pool.query(
  "INSERT INTO Moneda(nombre,ticker,icono) VALUES(?,?,?)",
  [nombre, ticker, icono]
);
export const updateMoneda = (id, { nombre, ticker, icono }) => pool.query(
  "UPDATE Moneda SET nombre=?, ticker=?, icono=? WHERE id=?",
  [nombre, ticker, icono, id]
);
export const deleteMoneda = (id) => pool.query(
  "DELETE FROM Moneda WHERE id=?",
  [id]
);
