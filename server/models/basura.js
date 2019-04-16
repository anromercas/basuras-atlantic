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
        //  required: [true, 'La calificación es necesaria']
    },
    estado: {
        type: String,
        required: false
    },
    zona: {
        type: String,
        required: [true, 'La zona es necesaria']
    },
    llenado: { // este campo hay que cambiarlo por un array de strings en el que se va a almacenar los objetos que se encuentran en el contenedor y no deberían estar.
        type: Number,
        //  required: [true, 'El llenado es necesario']
    },
    observaciones: {
        type: String,
        required: false
    },
    fecha: {
        type: String,
        //  required: [true, 'La fecha es necesaria']
    },
    img: {
        type: String,
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