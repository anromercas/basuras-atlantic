const express = require('express');
const app = express();


app.use(require('./usuario'));
app.use(require('./login'));
app.use(require('./basura'));
app.use(require('./historico'));
app.use(require('./upload'));
app.use(require('./imagenes'));
app.use(require('./mail'));

app.get('/', (req, res) => {
    res.json({
        ok: true,
        message: 'Api rest Residuos Urbanos Atlactic'
    });
});

module.exports = app;