/*
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Sirve los archivos estáticos generados por Vite
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Tienda Rompopes corriendo en puerto ${port}`);
});
*/

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Sirve los archivos estáticos generados por Vite
app.use(express.static(path.join(__dirname, "dist")));

// ✅ RUTAS ESPECÍFICAS PARA CADA PÁGINA
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/checkout", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "checkout.html"));
});

app.get("/tracking", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "tracking.html"));
});

// Para cualquier otra ruta no definida, redirigir al inicio
app.get("*", (req, res) => {
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`🚀 Tienda Rompopes corriendo en puerto ${port}`);
});