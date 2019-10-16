const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let rolesValidos = {
    values: ['ADMIN_ROLE', 'USER_ROLE', 'SUPER_ADMIN_ROLE'],
    message: '{VALUE} no es un rol válido'
};

let Schema = mongoose.Schema;

let usuarioSchema = new Schema({
    nombre: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: [true, ' El correo es necesario'],
        unique: true
    },
    password: {
        type: String,
        required: [true, ' La contraseña es obligatoria']
    },
    img: {
        type: String,
        required: false
    },
    role: {
        type: String,
        default: 'USER_ROLE',
        enum: rolesValidos
    },
    twofactor: {
        type:
        {
            secret: String,
            tempSecret: String,
            dataURL: String,
            otpURL: String
        },
        default: null
    },
    fechaPass: { // Fecha de la ultima actualizacion de la contraseña ( cada contraseña hay que modificarla cada 6 meses )
        type: Date
    },
    arrayPass: { // ultimas 10 contraseñas guardadas
        type: [String],
        default: [],
        length: 10
    },
    habilitada: { // La cuenta se deshabilita si se ha introducido mal 3 veces la contraseña en el login
        type: Boolean,
        default: true
    },
    primerAcceso: { // Al crear el usuario es true, cuando acceda por primera vez habrá que pedirle que cambie la contraseña y ponerlo false
        type: Boolean,
        default: true
    },
    intentos: {
        type: Number,
        default: 0
    }

});

usuarioSchema.methods.toJSON = function() {

    let user = this;
    let userObject = user.toObject();
    delete userObject.password;
    delete userObject.arrayPass;
    return userObject;
};

usuarioSchema.plugin(uniqueValidator, { message: '{PATH} debe de ser único' });

module.exports = mongoose.model('Usuario', usuarioSchema);