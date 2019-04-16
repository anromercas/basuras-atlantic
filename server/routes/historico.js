const express = require('express');

let { verificaToken, verificaAdmin_Role } = require('../middlewares/autenticacion');

let app = express();

let Historico = require('../models/historico');


// =================================
// Mostrar todo los historicos
// =================================
app.get('/historico', verificaToken, (req, res) => {

    Historico.find({})
        .sort('fecha')
        .exec((err, historicos) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            Historico.countDocuments({}, (err, conteo) => {

                res.json({
                    ok: true,
                    historicos,
                    total: conteo
                });
            });
        });

});

// =================================
// Mostrar un historico por codigo de basura
// =================================
app.get('/historico/:codigoContenedor', verificaToken, (req, res) => {

    let codigoContenedor = req.params.codigoContenedor;

    // esto tengo que cambiarlo por find y buscar el codigoBasura
    Historico.find({ 'codigoContenedor': codigoContenedor }, (err, historicoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!historicoDB) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'El id no existe'
                }
            });
        }

        res.json({
            ok: true,
            historico: historicoDB
        });
    });

});

// =================================
// Crear nuevo historico 
// =================================
app.post('/historico', verificaToken, (req, res) => {
    // regresa la nueva basura
    let body = req.body;

    let historico = new Historico({
        nombre: body.nombre,
        codigoContenedor: body.codigoContenedor,
        numeroContenedor: body.numeroContenedor,
        calificacion: body.calificacion,
        estado: body.estado,
        zona: body.zona,
        llenado: body.llenado,
        observaciones: body.observaciones,
        fecha: body.fecha,
        img: body.img,
        imgContenedor: body.imgContenedor,
        imgDetalle: body.imgDetalle,
    });

    historico.save((err, historicoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!historicoDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            basura: historicoDB
        });

    });
});


module.exports = app;