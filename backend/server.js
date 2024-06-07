const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51POmBWFJbxdvSPqZSSQNcPiO3gkLftDPfwPyFnLmdHLAAEDcY3UQ4l0QEkV3cuoYEvyGzNF7luLOUmBBpc2bCJqv00YhoG4yKq');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
}));

app.get('/', (req, res) => {
  res.send('Conexión exitosa entre React y Node JS');
});

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



app.get('/wallet-config', async (req, res) => {
  try {
    // Lógica para obtener la configuración del wallet desde Stripe
    const walletConfig = await stripe.welcomePortal.getElementsWalletConfig();
    res.json(walletConfig);
  } catch (error) {
    console.error('Error al obtener la configuración del wallet:', error);
    res.status(500).json({ error: 'Error al obtener la configuración del wallet' });
  }
});


app.post('/checkout-session', async (req, res) => {
  try {
      console.log('Solicitud POST recibida en /checkout-session');
      const { productos } = req.body;

      const lineItems = productos.map((producto) => ({
          price_data: {
              currency: 'mxn',
              product_data: {
                  name: producto.nombre,
              },
              unit_amount: producto.precio * 100,
          },
          quantity: 1,
      }));

      const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: 'http://localhost:3001/compraExitosa',
          cancel_url: 'http://localhost:3001/carrito',
      });

      const nombresProductos = productos.map(producto => producto.nombre).join(', ');
      const total = productos.reduce((total, producto) => total + producto.precio, 0);

      const query = 'INSERT INTO compras (productos, total) VALUES (?, ?)';
      connection.query(query, [nombresProductos, total], (err, result) => {
          if (err) {
              console.error('Error al guardar la compra en la base de datos:', err);
              res.status(500).json({ error: 'Error al guardar la compra en la base de datos' });
              return;
          }
          console.log('Compra guardada correctamente en la base de datos');
      });

      res.json({ sessionId: session.id });
  } catch (error) {
      console.error('Error al crear el checkout session:', error);
      res.status(500).json({ error: 'Error al crear el checkout session' });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});