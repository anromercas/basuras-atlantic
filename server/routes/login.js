const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const app = express();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode'); //required for converting otp-url to dataUrl
const path = require('path');
const _ = require('underscore');


let { verificaToken } = require('../middlewares/autenticacion');


// ===========================================
// 2fa setup
// ===========================================
app.post('/login/twofactor/setup/:id', (req, res) => {

    let body = _.pick(req.body, ['nombre', 'email', 'img', 'estado', 'twofactor']);
    let id = req.params.id;

    let options = {
        new: true,
        runValidators: true,
        context: 'query'
    };

    // 2fa setup
    const secret = speakeasy.generateSecret({length: 20});
    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
        // guardar en el usuario logeado
        body.twofactor = {
            secret: "",
            tempSecret: secret.base32,
            dataURL: data_url,
            otpURL: secret.otpauth_url
        };

   
        Usuario.findByIdAndUpdate(id, body, options, (err, usuarioDB) => {
    
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
    
            res.json({
                ok: true,
                usuario: usuarioDB
            });
    
        });
    });
     
});

//get 2fa details
app.get('/login/twofactor/setup/:id', function(req, res){

    let id = req.params.id;

    Usuario.findById( id, (err, userDB) => {
        if ( err ) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!userDB) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'El id no existe'
                }
            });
        }
        res.json({
            ok: true,
            usuario: userDB
        });
    });
});

//disable 2fa
app.put('/login/twofactor/setup/:id', function(req, res){
    
    let id = req.params.id;
    let body = req.body;

    body.twofactor = null;
    
    Usuario.findByIdAndUpdate(id, body, (err, userDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!userDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            message: 'two factor Borrado',
            usuario: userDB
        });
    
   
    });

});


// verify 2fa
app.post('/login/twofactor/verify/:id', function(req, res){
    
    let id = req.params.id;

    Usuario.findById(id)
    .exec( async (err, userDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!userDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        var verified = speakeasy.totp.verify({
            secret: userDB.twofactor.tempSecret, //secret of the logged in user
            encoding: 'base32',
            token: req.body.tokenOTP
        });

        console.log(verified);

        if(verified){
            userDB.twofactor.secret = userDB.twofactor.tempSecret;//set secret, confirm 2fa
            await userDB.updateOne(userDB);
            return res.json({
                ok: true,
                message: 'Two-factor auth enabled',
                usuario: userDB
            });
            
        }
        return res.status(400).send('Invalid token, verification failed');
    });

});




// ===========================================
// Renovación de token
// ===========================================
app.get('/login/renuevatoken', (req, res) => {

    var token = jwt.sign({ usuario: req.usuario }, process.env.SEED, { expiresIn: 14400 }) // 4 horas

    res.status(200).json({
        ok: true,
        token: token
    });

});

// ===========================================
// Login de usuario sin OTP
// ===========================================
app.post('/loginApp', (req, res) => {

    let body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: '(Usuario) o contraseña incorrectos'
                }
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario o (contraseña) incorrectos'
                }
            });
        }

        let token = jwt.sign({
            usuario: usuarioDB
        }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN }); // caducidad en middleware autenticacion

        return res.json({
            ok: true,
            usuario: usuarioDB,
            token
        });
    });

});



// ===========================================
// Login de usuario con OTP
// ===========================================
app.post('/login', (req, res) => {

    let body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: '(Usuario) o contraseña incorrectos'
                }
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario o (contraseña) incorrectos'
                }
            });
        }

        if( usuarioDB.twofactor === null ) { // 2fa no está habilitado por el usuario
    
            res.status(205).json({
                ok: false,
                err: {
                    message: 'Debe configurar el 2FA antes de continuar'
                },
                usuario: usuarioDB
            });
            
        } else { // 2FA habilitado
            // verificar si se ha pasado otp por las cabeceras, si no preguntar por OTP
            if ( !req.headers['x-otp']) {
                return res.status(206).json({
                    ok: false,
                    err: {
                        message: 'Introducir OTP para continuar'
                    },
                    usuario: usuarioDB
                });
            }
            // validar OTP
            var verificar = speakeasy.totp.verify({
                secret: usuarioDB.twofactor.secret,
                encoding: 'base32',
                token: req.headers['x-otp']
            });
            if ( verificar ) {

                //usuario autenticado
                let token = jwt.sign({
                    usuario: usuarioDB
                }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN }); // caducidad en middleware autenticacion

                return res.json({
                    ok: true,
                    message: 'usuario con OTP',
                    usuario: usuarioDB,
                    token
                });
            } else {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'OTP no válido'
                    }
                });
            }
        }
    });

});




module.exports = app;