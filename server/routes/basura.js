const express = require('express');

let { verificaToken, verificaAdmin_Role } = require('../middlewares/autenticacion');

let app = express();

let Basura = require('../models/basura');


// =================================
// Mostrar todas las basuras
// =================================
app.get('/basura', verificaToken, (req, res) => {

    Basura.find({})
        .sort('numeroContenedor')
        .exec((err, basuras) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            Basura.countDocuments({}, (err, conteo) => {

                res.json({
                    ok: true,
                    basuras,
                    total: conteo
                });
            });
        });

});

// =================================
// Mostrar una basura por ID
// =================================
app.get('/basura/:id', verificaToken, (req, res) => {

    let id = req.params.id;

    Basura.findById(id, (err, basuraDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!basuraDB) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'El id no existe'
                }
            });
        }

        res.json({
            ok: true,
            basura: basuraDB
        });
    });

});

// =================================
// Crear nueva basura 
// =================================
app.post('/basura', verificaToken, (req, res) => {
    // regresa la nueva basura
    let body = req.body;

    let basura = new Basura({
        nombre: body.nombre,
        codigoContenedor: body.codigoContenedor,
        numeroContenedor: body.numeroContenedor,
        calificacion: body.calificacion,
        estado: body.estado,
        zona: body.zona,
        residuo: body.residuo,
        observaciones: body.observaciones,
        fecha: body.fecha,
        img: body.img,
        imgContenedor: body.imgContenedor,
        imgDetalle: body.imgDetalle
    });

    basura.save((err, basuraDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!basuraDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            basura: basuraDB
        });

    });
});


// =================================
// Actualizar basura
// =================================
app.put('/basura/:id', verificaToken, (req, res) => {

    let id = req.params.id;
    let body = req.body;

    let options = {
        new: true,
        runValidators: true,
        context: 'query'
    };

    let basura = {
        nombre: body.nombre,
        // codigoContenedor: body.codigoContenedor,
        numeroContenedor: body.numeroContenedor,
        calificacion: body.calificacion,
        zona: body.zona,
        llenado: body.llenado,
        observaciones: body.observaciones,
        fecha: body.fecha,
        img: body.img,
        imgContenedor: body.imgContenedor,
        imgDetalle: body.imgDetalle
    };

    Basura.findByIdAndUpdate(id, basura, options, (err, basuraDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!basuraDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            basura: basuraDB
        });
    });

});

// =================================
// Borrar una basura
// =================================
app.delete('/basura/:id', [verificaToken, verificaAdmin_Role], (req, res) => {
    // solo un administrador puede borrar una basura
    let id = req.params.id;

    Basura.findByIdAndRemove(id, (err, basuraDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!basuraDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El id no existe'
                }
            });
        }

        res.json({
            ok: true,
            message: 'Basura Borrada',
            basura: basuraDB
        });
    });
});


module.exports = app;