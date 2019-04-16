require('./config/config');
const express = require('express');
var mongoose = require('mongoose');
const app = express();
var cors = require('cors');

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configurar cabeceras y cors
app.use(cors());


// configuración global de rutas
app.use(require('./routes/index'));


mongoose.connect(process.env.URLDB, { useNewUrlParser: true, useCreateIndex: true }, (err, res) => {
    if (err) throw err;

    console.log('base de datos ONLINE');
});

app.listen(process.env.PORT, () => {
    console.log(`Escuchando en el puerto: ${process.env.PORT}`);
});