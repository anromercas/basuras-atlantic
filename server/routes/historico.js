const express = require('express');

let { verificaToken, verificaAdmin_Role } = require('../middlewares/autenticacion');

let app = express();

let Historico = require('../models/historico');


// =================================
// Mostrar todo los historicos
// =================================
app.get('/historico', verificaToken, (req, res) => {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    Historico.find({})
        .skip(desde)
        .limit(limite)
        .sort({ _id: -1 })
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
// Mostrar un historico por el resíduo
// =================================
app.get('/historico-residuo', verificaToken, (req, res) => {

    let residuo = req.query.residuo || '';
    console.log('Residuo: ' + residuo);

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 10;
    limite = Number(limite);

    Historico.find({ 'nombre': { $regex: residuo } })
        .skip(desde)
        .limit(limite)
        .sort({ _id: -1 })
        .exec((err, historicoDB) => {

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
                        message: 'El residuo no existe'
                    }
                });
            }

            Historico.countDocuments({ 'nombre': { $regex: residuo } }, (err, conteo) => {

                res.json({
                    ok: true,
                    historicos: historicoDB,
                    total: conteo
                });
            });
        });

});

// =================================
// Mostrar un historico por el codigo de basura
// =================================
app.get('/historico/:codigoContenedor', verificaToken, (req, res) => {

    let codigoContenedor = req.params.codigoContenedor;

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    Historico.find({ 'codigoContenedor': codigoContenedor })
        .skip(desde)
        .limit(limite)
        .sort({ _id: -1 })
        .exec((err, historicoDB) => {

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

            Historico.countDocuments({}, (err, conteo) => {

                res.json({
                    ok: true,
                    historicos: historicoDB,
                    total: conteo
                });
            });
        });

});

// =================================
// Mostrar un historico por tramo de fechas
// =================================

app.get('/historico-entre-fechas', (req, res) => {

    let fechaDesde = req.query.fechadesde;
    let fechaHasta = req.query.fechahasta;

  Historico.find( {$and: [{fecha: {$gte: new Date(fechaDesde)}}, {fecha: {$lt: new Date(fechaHasta)}}] } )
            .exec((err, historicos) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }
               
                Historico.countDocuments({$and: [{fecha: {$gte: new Date(fechaDesde)}}, {fecha: {$lt: new Date(fechaHasta)}}] }, (err, conteo) => {

                    res.json({
                        ok: true,
                        historicos,
                        total: conteo
                    });
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
        idBasura: body._id,
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