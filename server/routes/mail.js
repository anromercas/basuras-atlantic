const express = require('express');

var nodemailer = require('nodemailer');

let app = express();

let Mail = require('../models/mail');


app.post('/nueva-basura-email', (req, res) => {
    // graba los datos y manda el email

    console.log(req.body);
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'csafety6@gmail.com',
            pass: 'cornersafety6?'
        },
        tls:{
            rejectUnauthorized: false
        }
    });

    let body = req.body;
    let bodyMail = new Mail ({
        zonaContenedor: body.zonaContenedor,
        nombreContenedor: body.nombreContenedor,
        accion: body.accion,
        observaciones: body.observaciones,
        numeroContenedor: body.numeroContenedor,
    });

    let mailOptions = {
        // cuenta de correo a la que se va a enviar el correo
        to: 'nuria@cornersafety.com',
        subject: 'Añadir/Modificar Contenedor',
        text: JSON.stringify(bodyMail)
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            return console.log(err);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
    res.json({
        ok: true,
        message: 'Mensaje enviado'
    });

  });





module.exports = app;