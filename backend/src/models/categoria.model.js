import pool from "../db.js";

export const getAllCategorias = () => pool.query("SELECT * FROM Categoria");
export const getCategoriaById = (id) => pool.query("SELECT * FROM Categoria WHERE id=?", [id]);
export const createCategoria = ({ categoria, icono = null }) => pool.query(
  "INSERT INTO Categoria(categoria, icono) VALUES(?,?)",
  [categoria, icono]
);
export const updateCategoria = (id, { categoria, icono }) => pool.query(
  "UPDATE Categoria SET categoria=?, icono=? WHERE id=?",
  [categoria, icono, id]
);
export const deleteCategoria = (id) => pool.query(
  "DELETE FROM Categoria WHERE id=?",
  [id]
);