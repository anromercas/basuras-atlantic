const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let mailSchema = new Schema({
    zonaContenedor: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    nombreContenedor: {
        type: String,
        required: [true, 'El codigo del contenedor es necesario'],
        unique: true
    },
    numeroContenedor: {
        type: Number,
        required: [true, 'El número del contenedor es necesario']
    },
    accion: {
        type: String,
        required: [true, 'La acción es necesaria']
    },
    observaciones: {
        type: String,
        required: false,
    }

});

module.exports = mongoose.model('Mail', mailSchema);