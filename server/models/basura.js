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
    },
    calificacion: {
        type: Number,
        required: false
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
    },
    usuario: {
        type:Schema.ObjectId, 
        ref: 'Usuario'
    }

});

basuraSchema.plugin(uniqueValidator, { message: '{PATH} debe de ser único' });

module.exports = mongoose.model('Basura', basuraSchema);