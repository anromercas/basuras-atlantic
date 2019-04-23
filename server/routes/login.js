const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const app = express();


let { verificaToken } = require('../middlewares/autenticacion');

// ===========================================
// Renovación de token
// ===========================================
app.get('/login/renuevatoken', (req, res) => {

    var token = jwt.sign({ usuario: req.usuario }, process.env.SEED, { expiresIn: 14400 }) // 4 horas

    res.status(200).json({
        ok: true,
        token: token
    });

});



// ===========================================
// Login de usuario
// ===========================================
app.post('/login', (req, res) => {

    let body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: '(Usuario) o contraseña incorrectos'
                }
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario o (contraseña) incorrectos'
                }
            });
        }

        let token = jwt.sign({
            usuario: usuarioDB
        }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN }); // caducidad en middleware autenticacion


        res.json({
            ok: true,
            usuario: usuarioDB,
            token
        });
    });
});




module.exports = app;