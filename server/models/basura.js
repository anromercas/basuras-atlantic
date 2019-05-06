const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let Schema = mongoose.Schema;

let basuraSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    codigoContenedor: {
        type: String,
        required: [true, 'El codigo del contenedor es necesario'],
        unique: true
    },
    numeroContenedor: {
        type: Number,
        required: [true, 'El número del contenedor es necesario']
    },
    calificacion: {
        type: Number,
        required: false,
        //  required: [true, 'La calificación es necesaria']
    },
    estado: {
        type: String,
        required: false,
    },
    zona: {
        type: String,
        required: [true, 'La zona es necesaria']
    },
    residuo: {
        type: String,
        required: false,
        //  required: [true, 'El llenado es necesario']
    },
    observaciones: {
        type: String,
        required: false
    },
    fecha: {
        type: Date,
        required: false,
        //  required: [true, 'La fecha es necesaria']
    },
    img: {
        type: String,
        required: false,
        //   required: [true, 'La imagen es necesaria']
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

basuraSchema.plugin(uniqueValidator, { message: '{PATH} debe de ser único' });

module.exports = mongoose.model('Basura', basuraSchema);