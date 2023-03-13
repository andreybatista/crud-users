const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
var cors = require("cors");

const app = express();
const port = 3000;

const db = new sqlite3.Database(":memory:");

db.serialize(function () {
  db.run(
    "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone text, city text)"
  );
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  app.use(cors());
  next();
});

app.get("/users", function (req, res) {
  db.all("SELECT * FROM users", function (err, rows) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

app.get("/users/:id", (req, res) => {
  const id = req.params.id;
  const query = `SELECT * FROM users WHERE id = ?`;
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .send({ error: "Ocorreu um erro ao buscar o usuário." });
    }
    if (!row) {
      return res.status(404).send({ error: "Usuário não encontrado." });
    }
    res.send(row);
  });
});

app.post("/users", function (req, res) {
  const { name, email, phone, city } = req.body;
  if (!name || !email || !phone || !city) {
    return res
      .status(400)
      .json({ error: "Name, email, phone and city are required" });
  }
  var number = phone.replace(/\D/g, "");

  const stmt = db.prepare(
    "INSERT INTO users (name, email, phone, city) VALUES (?, ?, ?, ?)"
  );
  stmt.run(name, email, number, city, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ id: this.lastID, name, email, number, city });
  });
});

app.put("/users/:id", function (req, res) {
  const { name, email, phone, city } = req.body;
  if (!name || !email || !phone || !city) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  var number = phone.replace(/\D/g, "");
  const stmt = db.prepare(
    "UPDATE users SET name = ?, email = ?, phone = ?, city = ? WHERE id = ?"
  );
  stmt.run(name, email, number, city, req.params.id, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ id: req.params.id, name, email, number, city });
  });
});

app.delete("/users/:id", function (req, res) {
  db.run("DELETE FROM users WHERE id = ?", req.params.id, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ id: req.params.id });
  });
});

app.get("/search", (req, res) => {
  const query = req.query.q;
  const page = parseInt(req.query.page) || 1;
  const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;

  if (page < 1) {
    return res.status(400).send("Página inválida");
  }

  const sql = `SELECT * FROM users WHERE name LIKE ?`;
  const params = [`%${query}%`];

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).send("Erro ao buscar dados do banco de dados");
    }

    const totalItems = rows.length;
    const qytPages = Math.ceil(totalItems / itemsPerPage);

    const itemSlice = page * itemsPerPage;

    const dataItems = rows.slice(itemSlice - itemsPerPage, itemSlice);

    const data = {
      totalItems: totalItems,
      itemsPerPage: itemsPerPage,
      currentPage: page,
      totalPages: qytPages,
      data: dataItems,
    };
    res.json(data);
  });
});

app.listen(port, function () {
  console.log(`Server listening on port ${port}`);
});
