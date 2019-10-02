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
//  Validar fecha realizado
// =================================
app.get('/basura/comprobar-fecha-realizado/:id', verificaToken, (req, res) => {

    let id = req.params.id;

    Basura.findById(id, (err, basuraDB) => {
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

        // logica de la comprobación

        // obtengo la fecha de la basura
        const fechaBasura = basuraDB.fecha;
        // convierto la fecha a DATE
        const fechaConvertida = new Date(fechaBasura);
        //obtengo el dia de la semana
        const diaSemana = fechaConvertida.getDay();
        //obtengo el dia de hoy
        const diaHoy = new Date();
        // Resto los días
        const resta = diaHoy - fechaConvertida;
        // convierto en dias la resta
        const restaEnDias = Math.round(resta/ (1000*60*60*24));
        // sumo el dia de la semana y la resta en dias 
        const sumaDias = diaSemana + restaEnDias;
        // si la suma da mas de 6 es la siguiente semana, si es menor a 7 no ha pasado la semana.
        if ( isNaN(diaSemana + restaEnDias) ) {
            res.json({
                ok: false,
                message: 'Error en fecha: No existe una fecha',
                fechaValida: false,
            });

        } else if ( diaSemana + restaEnDias > 6 ) {
            res.json({
                ok: true,
                message: 'validar Fecha calificacion realizada en semana',
                fechaValida: false,
                diaSemana,
                restaEnDias
            });
        } else if ( diaSemana + restaEnDias < 7 ) {
            res.json({
                ok: true,
                message: 'validar Fecha calificacion realizada en semana',
                fechaValida: true,
                diaSemana,
                restaEnDias
            });
        } 
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
        numeroContenedor: body.numeroContenedor,
        calificacion: body.calificacion,
        zona: body.zona,
        residuo: body.residuo,
        estado: body.estado,
        observaciones: body.observaciones,
        fecha: body.fecha
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