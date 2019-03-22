// ==================
// PUERTO
// ==================
process.env.PORT = process.env.PORT || 3000;

// ==================
// ENTORNO
// ==================

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

// ==================
// Base de datos
// ==================

let urlDB;

if (process.env.NODE_ENV === 'dev') {
    urlDB = 'mongodb://localhost:27017/basuras';
} else {
    urlDB = 'mongodb+srv://anromercas:2tLTry6sLLMBmu6@cluster0-ugsm2.mongodb.net/basuras?retryWrites=true';
}

process.env.URLDB = urlDB;

// ==================
// vencimiento del token
// ==================
process.env.CADUCIDAD_TOKEN = "10h";

// ==================
// SEED de autenticación
// ==================

process.env.SEED = process.env.SEED || 'secret';