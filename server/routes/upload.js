const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

const Basura = require('../models/basura');
const Usuario = require('../models/usuario');

const fs = require('fs');
const path = require('path');
const { verificaToken } = require('../middlewares/autenticacion');

app.use(fileUpload({ useTempFiles: true }));

// =================================
// Sube la imagen y la vincula a su documento dependiendo del tipo
// =================================
app.put('/upload/:tipo/:id', verificaToken, function(req, res) {

    let tipo = req.params.tipo;
    let id = req.params.id;

    if (Object.keys(req.files).length == 0) {
        return res.status(400)
            .json({
                ok: false,
                err: {
                    message: 'Nose ha seleccionado ningún archivo'
                }
            });
    }

    // Valida Tipo
    let tiposValidos = ['basuras', 'usuarios', 'imgcontenedor', 'imgdetalle'];
    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Los tipos permitidas son ' + tiposValidos.join(', ')
            }
        });
    }

    let img = req.files.img;
    let nombreCortado = img.name.split('.');
    let extension = nombreCortado[nombreCortado.length - 1];


    // Extensiones permitidas
    let extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    if (extensionesValidas.indexOf(extension) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Las extensiones permitidas son ' + extensionesValidas.join(', '),
                estension: extension
            }
        });
    }

    // cambiar nombre al archivo
    let nombreArchivo = `${id}-${ new Date().getMilliseconds() }.${extension}`;

    img.mv(`./uploads/${tipo}/${nombreArchivo}`, (err) => {
        if (err)
            return res.status(500).json({
                ok: false,
                err
            });

        // Aqui, imagen cargada
        switch (tipo) {
            case 'basuras':
                imagenBasura(id, res, nombreArchivo);
                break;
            case 'usuarios':
                imagenUsuario(id, res, nombreArchivo);
                break;
            case 'imgcontenedor':
                imagenContenedor(id, res, nombreArchivo);
                break;
            case 'imgdetalle':
                imagenDetalle(id, res, nombreArchivo);
                break;
        }

    });
});


function imagenBasura(id, res, nombreArchivo) {
    Basura.findById(id, (err, basuraDB) => {
        if (err) {
            borraArchivo(nombreArchivo, 'basuras');
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!basuraDB) {
            borraArchivo(nombreArchivo, 'basuras');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No existe la Basura'
                }
            });
        }

        //    borraArchivo(basuraDB.img, 'basuras');

        basuraDB.img = nombreArchivo;

        basuraDB.save((err, basuraGuardada) => {
            res.json({
                ok: true,
                basura: basuraGuardada,
                img: nombreArchivo
            });
        });
    });
}

function imagenUsuario(id, res, nombreArchivo) {
    Usuario.findById(id, (err, usuarioDB) => {
        if (err) {
            borraArchivo(nombreArchivo, 'usuarios');
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            borraArchivo(nombreArchivo, 'usuarios');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No existe el usuario'
                }
            });
        }

        borraArchivo(usuarioDB.img, 'usuarios');

        usuarioDB.img = nombreArchivo;

        usuarioDB.save((err, usuarioGuardado) => {
            res.json({
                ok: true,
                basura: usuarioGuardado,
                imgContenedor: nombreArchivo
            });
        });
    });
}

function imagenContenedor(id, res, nombreArchivo) {
    Basura.findById(id, (err, basuraDB) => {
        if (err) {
            borraArchivo(nombreArchivo, 'imgcontenedor');
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!basuraDB) {
            borraArchivo(nombreArchivo, 'imgcontenedor');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No existe la Basura'
                }
            });
        }

        borraArchivo(basuraDB.imgContenedor, 'imgcontenedor');

        basuraDB.imgContenedor = nombreArchivo;

        basuraDB.save((err, basuraGuardada) => {
            res.json({
                ok: true,
                basura: basuraGuardada,
                img: nombreArchivo
            });
        });
    });
}

function imagenDetalle(id, res, nombreArchivo) {
    Basura.findById(id, (err, basuraDB) => {
        if (err) {
            borraArchivo(nombreArchivo, 'imgdetalle');
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!basuraDB) {
            borraArchivo(nombreArchivo, 'imgdetalle');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No existe la Basura'
                }
            });
        }

        borraArchivo(basuraDB.imgDetalle, 'imgdetalle');

        basuraDB.imgDetalle = nombreArchivo;

        basuraDB.save((err, basuraGuardada) => {
            res.json({
                ok: true,
                basura: basuraGuardada,
                img: nombreArchivo
            });
        });
    });
}

function borraArchivo(nombreImagen, tipo) {
    let pathImagen = path.resolve(__dirname, `../../uploads/${ tipo }/${ nombreImagen }`);

    if (fs.existsSync(pathImagen)) {
        fs.unlinkSync(pathImagen);
    }
}

module.exports = app;