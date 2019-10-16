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

    Usuario.find({}, 'nombre email role img twofactor habilitada fechaPass arrayPass primerAcceso')
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
        twofactor: null,
        fechaPass: new Date(),
        arrayPass: [bcrypt.hashSync(body.password, 10)],
        habilitada: true,
        primerAcceso: true,
    });

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
// Habilitar cuenta de usuario
// =================================
app.put('/usuario/habilita-usuario/:id', verificaToken, (req, res) => {

    let id = req.params.id;

    let options = {
        new: true,
        runValidators: true,
        context: 'query'
    };

    Usuario.findByIdAndUpdate(id, {habilitada: true}, options, (err, usuarioDB) => {

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
// Modificar usuario
// =================================
app.put('/usuario/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    let body = _.pick(req.body, ['nombre', 'email', 'img', 'habilitada', 'primerAcceso', 'arrayPass', 'fechaPass', 'role', 'intentos']);

    let options = {
        new: true,
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
// Cambiar Contraseña
// =================================
app.put('/usuario/cambiar-passwd/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    let body = req.body;

    let options = {
        new: true,
        runValidators: true,
        context: 'query',
        upsert: true
    };

    let pass = bcrypt.hashSync(body.password, 10);

    Usuario.findById(id, (err, usuarioDB) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if(!usuarioDB.arrayPass) {
            return res.status(400).json({
                ok: false,
                message: 'No hay array de contraseñas',
                err
            });
        }

        // busco en el array si las contraseñas se han usado antes
        let arrayPass = usuarioDB.arrayPass;

        for (let i = 0; i < arrayPass.length ; i++) {
            
            if ( bcrypt.compareSync(body.password, arrayPass[i]) ) {
                return res.status(400).json({
                    ok: false,
                    message: 'La contraseña ya ha sido usada',
                   // usuario: usuarioDB
                });
            }
        }
        // guardo la contraseña en el campo password y en el array
        usuarioDB.password = pass;
        if( arrayPass.length === 10 ) {
            usuarioDB.arrayPass.shift();
        }
        usuarioDB.arrayPass.push(pass);
        // actualizo el campo fechaPass
        usuarioDB.fechaPass = new Date();

        usuarioDB.save(( err ) => {

            if(err) {
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