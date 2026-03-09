import pool from "../db.js";

export const getAllSectores = () => pool.query("SELECT * FROM Sector");
export const getSectorById = (id) => pool.query("SELECT * FROM Sector WHERE id=?", [id]);
export const createSector = ({ nombre, icono = null, descripcion = null }) => pool.query(
  "INSERT INTO Sector(nombre, icono, descripcion) VALUES(?,?,?)",
  [nombre, icono, descripcion]
);
export const updateSector = (id, { nombre, icono, descripcion }) => pool.query(
  "UPDATE Sector SET nombre=?, icono=?, descripcion=? WHERE id=?",
  [nombre, icono, descripcion, id]
);
export const deleteSector = (id) => pool.query(
  "DELETE FROM Sector WHERE id=?",
  [id]
);