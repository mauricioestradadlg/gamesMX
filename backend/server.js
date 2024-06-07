
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database.');
});

app.post('/contacto', (req, res) => {
  const { nombre, correo, celular, mensaje } = req.body;
  const query = 'INSERT INTO formulario (nombre, correo, celular, mensaje) VALUES (?, ?, ?, ?)';
  
  connection.query(query, [nombre, correo, celular, mensaje], (err, result) => {
    if (err) {
      console.error('Error al registrar el contacto:', err);
      res.status(500).send('Error al registrar el contacto');
      return;
    }
    res.send('Contacto registrado con éxito');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


  