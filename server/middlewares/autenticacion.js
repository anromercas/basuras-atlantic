const jwt = require('jsonwebtoken');


// ==================
// Verificar Token
// ==================

let verificaToken = (req, res, next) => {

    let token = req.query.token ? req.query.token : req.get('token');

    jwt.verify(token, process.env.SEED, (err, decoded) => {

        if (err) {
            return res.status(401).json({
                ok: false,
                err: {
                    message: 'Token no válido'
                }
            });
        }

        req.usuario = decoded.usuario;
        next();
    });

};

// ==================
// Verifica ADMIN_ROLE
// ==================

let verificaAdmin_Role = (req, res, next) => {

    let usuario = req.usuario;

    if (usuario.role === 'ADMIN_ROLE') {
        next();
    } else {
        return res.json({
            ok: false,
            err: {
                message: 'El usuario no es administrador'
            }
        });
    }
};

// ==================
// Verifica SUPER_ADMIN_ROLE
// ==================

let verificaSuper_Admin_Role = (req, res, next) => {

    let usuario = req.usuario;

    if (usuario.role === 'SUPER_ADMIN_ROLE') {
        next();
    } else {
        return res.json({
            ok: false,
            err: {
                message: 'El usuario no es SUPER administrador'
            }
        });
    }
};



module.exports = {
    verificaToken,
    verificaAdmin_Role,
    verificaSuper_Admin_Role
}