const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');

const Usuario = require('../models/usuario');
const { verificaToken /* , verificaAdmin_Role */ } = require('../middlewares/autenticacion');

const app = express();


// =================================
// Mostrar todos los usuarios
// =================================
app.get('/usuario', verificaToken, (req, res) => {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    Usuario.find({}, 'nombre email role estado img twofactor')
        .skip(desde)
        .limit(limite)
        .exec((err, usuarios) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            Usuario.count({}, (err, conteo) => {

                res.json({
                    ok: true,
                    usuarios,
                    total: conteo
                });
            });

        });
});

// =================================
// Mostrar usuario por token
// =================================
app.get('/usuario-token', verificaToken, (req,res) => {
    const usuario = req.usuario;

    res.json({
        ok: true,
        message: 'usuario por token',
        usuario
    });
});


// =================================
// Crear usuario
// =================================
app.post('/usuario' /*, [verificaToken  , verificaAdmin_Role  ]*/ , (req, res) => {
    let body = req.body;
    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role,
        twofactor: null
    });

    console.log(usuario);

    usuario.save((err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        // usuarioDB.password = null;

        return res.json({
            ok: true,
            usuario: usuarioDB
        });
    });
});

// =================================
// Modificar usuario
// =================================
app.put('/usuario/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    let body = _.pick(req.body, ['nombre', 'email', 'img']);



    let options = {
        new: false,
        runValidators: true,
        context: 'query'
    };

    Usuario.findByIdAndUpdate(id, body, options, (err, usuarioDB) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            usuario: usuarioDB
        });

    });
});

// =================================
// Borrar usuario
// =================================
app.delete('/usuario/:id', verificaToken, (req, res) => {

    let id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }

        res.json({
            ok: true,
            usuario: usuarioBorrado
        });
    });
});

module.exports = app;