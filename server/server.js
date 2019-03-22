require('./config/config');
const express = require('express');
var mongoose = require('mongoose');
const app = express();

const bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// configuración global de rutas
app.use(require('./routes/index'));

const port = process.env.PORT || 3000;


mongoose.connect('mongodb://localhost:27017/basuras', { useNewUrlParser: true, useCreateIndex: true }, (err, res) => {
    if (err) throw err;

    console.log('base de datos ONLINE');
});

app.listen(port, () => {
    console.log(`Escuchando en el puerto: ${port}`);
});