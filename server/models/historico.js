const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let historicoSchema = new Schema({
    idBasura: {
        type: String,
        required: false
    },
    nombre: {
        type: String,
        required: false
    },
    codigoContenedor: {
        type: String,
        required: false
    },
    numeroContenedor: {
        type: Number,
        required: false
    },
    calificacion: {
        type: Number,
        required: false
    },
    estado: {
        type: String,
        required: false
    },
    zona: {
        type: String,
        required: false
    },
    residuo: {
        type: String,
        required: false
    },
    observaciones: {
        type: String,
        required: false
    },
    fecha: {
        type: Date,
        required: false
    },
    img: {
        type: String,
        required: false
    },
    imgContenedor: {
        type: String,
        required: false
    },
    imgDetalle: {
        type: String,
        required: false
    }

});

module.exports = mongoose.model('Historico', historicoSchema);