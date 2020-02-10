const express = require("express");
const moment = require("moment");
const BASURAS = require('../data/data.basuras');
let Basura = require('../models/basura');

let {
  verificaToken,
  verificaSuper_Admin_Role
} = require("../middlewares/autenticacion");

let app = express();

let Historico = require("../models/historico");

// =================================
// Mostrar todo los historicos
// =================================
app.get("/historico", verificaToken, (req, res) => {
  let desde = req.query.desde || 0;
  desde = Number(desde);

  let limite = req.query.limite || 5;
  limite = Number(limite);

  Historico.find({})
    .skip(desde)
    .limit(limite)
    .sort({ _id: -1 })
    .exec((err, historicos) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          err
        });
      }
      Historico.countDocuments({}, (err, conteo) => {
        res.json({
          ok: true,
          historicos,
          total: conteo
        });
      });
    });
});

// =================================
// Mostrar un historico por el resíduo
// =================================
app.get("/historico-residuo", verificaToken, (req, res) => {
  let residuo = req.query.residuo || "";

  let fechaDesde = req.query.fechadesde || new Date();
  let fechaHasta = req.query.fechahasta || new Date();

  Historico.find({
    nombre: { $regex: residuo },
    $and: [
      { fecha: { $gte: new Date(fechaDesde) } },
      { fecha: { $lt: new Date(fechaHasta) } }
    ]
  })
    .sort({ _id: -1 })
    .exec((err, historicoDB) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err
        });
      }

      if (!historicoDB) {
        return res.status(500).json({
          ok: false,
          err: {
            message: "El residuo no existe"
          }
        });
      }

      Historico.countDocuments(
        {
          nombre: { $regex: residuo },
          $and: [
            { fecha: { $gte: new Date(fechaDesde) } },
            { fecha: { $lt: new Date(fechaHasta) } }
          ]
        },
        (err, conteo) => {
          res.json({
            ok: true,
            historicos: historicoDB,
            total: conteo
          });
        }
      );
    });
});

// =================================
// Mostrar todos los históricos de una zona
// =================================
app.get('/historicosPorZona', verificaToken, (req, res) => {

  let zona = req.query.zona || '';

  Historico.find({ 'zona': { $regex: zona } })
      .sort('numeroContenedor')
      .exec((err, historicos) => {
          if (err) {
              return res.status(400).json({
                  ok: false,
                  err
              });
          }
          Historico.countDocuments({ 'zona': { $regex: zona } }, (err, conteo) => {

              res.json({
                  ok: true,
                  historicos,
                  total: conteo
              });
          });
      });

});

// =================================
// Mostrar un historico por el codigo de basura
// =================================
app.get("/historico/:codigoContenedor", verificaToken, (req, res) => {
  let codigoContenedor = req.params.codigoContenedor;

  let desde = req.query.desde || 0;
  desde = Number(desde);

  let limite = req.query.limite || 5;
  limite = Number(limite);

  Historico.find({ codigoContenedor: codigoContenedor })
    .skip(desde)
    .limit(limite)
    .sort({ _id: -1 })
    .exec((err, historicoDB) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err
        });
      }

      if (!historicoDB) {
        return res.status(500).json({
          ok: false,
          err: {
            message: "El id no existe"
          }
        });
      }

      Historico.countDocuments({}, (err, conteo) => {
        res.json({
          ok: true,
          historicos: historicoDB,
          total: conteo
        });
      });
    });
});


// =================================
// Eliminar historicos repetidos V2
// =================================

app.get("/historicos-repetidos", verificaToken, (req, res) => {

  let arrayHistoricosRepe = [];

  Historico.find({})
              .sort({ _id: -1 })
              .exec((err, historicoDB) => {
                if (err) {
                  return res.status(500).json({
                    ok: false,
                    err
                  });
                }

                if (!historicoDB) {
                  return res.status(500).json({
                    ok: false,
                    err: {
                      message: "El id no existe"
                    }
                  });
                }
                let historico = historicoDB.slice(0, historicoDB.length -1);

                let historico2 = historicoDB.slice(1);       

                historicoDB.forEach( h => {
                  historicoDB.forEach( (h2, index) => {
                    let repe = arrayHistoricosRepe.filter( repe => repe.id === h2.id);
                    console.log(repe);
                    if( !repe ) {
                      let f1 = moment(h.fecha).format('YYYY MM DD');
                      let f2 = moment(h2.fecha).format('YYYY MM DD');
                      let cod1 = h.codigoContenedor;
                      let cod2 = h2.codigoContenedor;
                      if( f1 === f2 && cod1 === cod2 && h.id !== h2.id){
                        console.log(`Fecha1: ${f1} y Fecha2: ${f2} && cod1: ${cod1} y cod2: ${cod2} && ${h.id} y ${h2.id}`);
                        arrayHistoricosRepe.push(h2);
                        historico2.splice(index, 1);
                      }
                    }
                  });
                });

                
                 /* arrayHistoricosRepe.forEach( repe => {
                  Historico.findByIdAndDelete({_id: repe._id}).exec(( err, repetido ) => {
                    console.log(repetido);
                  });
                }); */

                res.json({
                  ok: true,
                  message: 'Historicos repetidos borrados',
                  historicos: arrayHistoricosRepe
                });
                
              });

});


// =================================
// Eliminar historicos repetidos 
// =================================
app.get("/historicos-repetidos/:codigoContenedor", verificaToken, (req, res) => {

        let codigoContenedor = req.params.codigoContenedor;


            Historico.find({ codigoContenedor: codigoContenedor })
              .sort({ _id: -1 })
              .exec((err, historicoDB) => {
                if (err) {
                  return res.status(500).json({
                    ok: false,
                    err
                  });
                }

                if (!historicoDB) {
                  return res.status(500).json({
                    ok: false,
                    err: {
                      message: "El id no existe"
                    }
                  });
                }
                let historico = historicoDB.slice(0, historicoDB.length -1);

                let historico2 = historicoDB.slice(1);

                let arrayHistoricosRepe = [];

                historico.forEach( h => {
                  historico2.forEach( h2 => {
                    if(moment(h.fecha).format('YYYY MM DD') === moment(h2.fecha).format('YYYY MM DD')){
                      arrayHistoricosRepe.push(h2);
                      historico2.shift();
                    }
                  });
                });

                
                /*  arrayHistoricosRepe.forEach( repe => {
                  Historico.findByIdAndDelete({_id: repe._id}).exec(( err, repetido ) => {
                    console.log(repetido);
                  });
                }); */
                
              });
              Historico.countDocuments({ codigoContenedor: codigoContenedor }, (err, conteo) => {
                res.json({
                  ok: true,
                  total: conteo,
                  message: 'Historicos repetidos borrados',
                  // historicos: arrayHistoricosRepe
                });
              });
            });

// =================================
// Mostrar un historico por tramo de fechas
// =================================

app.get("/historico-entre-fechas", verificaToken , (req, res) => {
  let fechaDesde = req.query.fechadesde;
  let fechaHasta = req.query.fechahasta;

  Historico.find({
    $and: [
      { fecha: { $gte: new Date(fechaDesde) } },
      { fecha: { $lt: new Date(fechaHasta) } }
    ]
  }).exec((err, historicos) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err
      });
    }

    Historico.countDocuments(
      {
        $and: [
          { fecha: { $gte: new Date(fechaDesde) } },
          { fecha: { $lt: new Date(fechaHasta) } }
        ]
      },
      (err, conteo) => {
        res.json({
          ok: true,
          historicos,
          total: conteo
        });
      }
    );
  });
});

// =================================
// Progreso semana
// =================================
app.get("/progreso-semana", verificaToken , (req, res) => {
  let hoy = moment.now();

  const inicio = moment(hoy)
    .startOf("week").add(1, "d");
  const fin = moment(hoy).endOf("week").add(1, "d");

  Historico.find({
      $and: [
        { fecha: { $gte: new Date(inicio) } },
        { fecha: { $lt: new Date(fin) } }
      ]
  })
  .sort({ _id: -1 })
  .exec((err, historicos) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err
        });
      }

      Historico.countDocuments({
        $and: [
          { fecha: { $gte: new Date(inicio) } },
          { fecha: { $lt: new Date(fin) } }
        ]
      }, (err, conteo) => {
        res.json({
          ok: true,
          total: conteo,
          inicio,
          fin,
          historicos
        });
      });

  });

});


// =================================
// Zona mejor Segregada mes
// =================================
app.get("/zona-mejor-segregada-mes", verificaToken , (req, res) => {
  let hoy = moment.now();

  const inicio = moment(hoy)
    .startOf("month")
    .add(1, "h");
  const fin = moment(hoy).endOf("month");
  let basurasDeZona = [];
  let maximo = 0;
  let mejorZona;
  var zonasArray;

  

  Historico.find({
    $and: [
      { fecha: { $gte: new Date(inicio) } },
      { fecha: { $lt: new Date(fin) } }
    ]
  }).exec((err, historicos) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err
      });
    }

    Basura.find({})
          .sort('zona')
          .exec((err, basuras) => {
              if (err) {
                  return res.status(400).json({
                      ok: false,
                      err
                  });
              }
              const zonasSet = new Set(
                basuras.filter(x => x.zona !== '').map(x => x.zona)
              );

              zonasArray = Array.from(zonasSet);
              
              zonasArray.forEach( zona => {
              const sumaSet = new Set( basuras.filter(x => x.zona === zona ) );
              sumaArray = Array.from(sumaSet);
              basurasDeZona.push({zona: zona, contenedores: sumaArray.length, sumaCalificacion: 0});
            });

            basurasDeZona.forEach( basura => {
              historicos.forEach( historico => {
                const zona = historico.zona;

                if(zona.includes(basura.zona)){
                  basura.sumaCalificacion = (basura.sumaCalificacion + historico.calificacion) / basura.contenedores;
                }

              });

            });

            basurasDeZona.forEach( basura => {
              if ( maximo < basura.sumaCalificacion ) {
                maximo = basura.sumaCalificacion;
                mejorZona = basura.zona;
              }
            });
        
            res.json({
              ok: true,
              puntuacion: maximo,
              mejorZona,
              basurasDeZona
            });
          });
          });

});


// =================================
// Resíduo mejor Segregado mes
// =================================
app.get("/residuo-mejor-segregado-mes", verificaToken, (req, res) => {
  let hoy = moment.now();

  const inicio = moment(hoy)
    .startOf("month")
    .add(1, "h");
  const fin = moment(hoy).endOf("month");
  let maximo = 0;
  let mejorResiduo;
  let basuras = BASURAS.slice();

  Historico.find({
    $and: [
      { fecha: { $gte: new Date(inicio) } },
      { fecha: { $lt: new Date(fin) } }
    ]
  }).exec((err, historicos) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err
      });
    }

    if( !historicos ) {
      return res.status(400).json({
        ok: false,
        message: 'No existen historicos en este mes'
      });
    }

    // tengo el historico entre fechas

    historicos.forEach(historico => {

      // le quito las palabas contenedor, arcon o cuba a los nombres de los resíduos
      if( historico.nombre.includes('Contenedor')) {
        historico.nombre = historico.nombre.replace('Contenedor ', '');
      } else if ( historico.nombre.includes('Arcón para')) {
        historico.nombre =  historico.nombre.replace('Arcón para ', '');
      } else if ( historico.nombre.includes('Papeleras')) {
        historico.nombre =  historico.nombre.replace('Papeleras ', '');
      } else if ( historico.nombre.includes('Jaula')) {
        historico.nombre =  historico.nombre.replace('Jaula ', '');
      } else if ( historico.nombre.includes('Cuba')) {
        historico.nombre =  historico.nombre.replace('Cuba ', '');
      } else if( historico.nombre.includes('Contenedor de')) {
        historico.nombre =  historico.nombre.replace('Contenedor de ', '');
      }

      basuras.forEach( basura => {
        
        if ( basura.nombre === historico.nombre ) {
          basura.suma = basura.suma + historico.calificacion;
        }
      });

    });

    basuras.forEach( basura => {
      if( maximo < basura.suma ) {
        maximo = basura.suma;
        mejorResiduo = basura.nombre;
      }
    });

    basuras.forEach( basura => {
      basura.suma = 0;
    });

    res.json({
      ok: true,
      puntuacion: maximo,
      mejorResiduo
    });
  });
});

// =================================
// Crear nuevo historico
// =================================
app.post("/historico", verificaToken, (req, res) => {
  // regresa la nueva basura
  let body = req.body;

  let historico = new Historico({
    idBasura: body._id,
    nombre: body.nombre,
    codigoContenedor: body.codigoContenedor,
    numeroContenedor: body.numeroContenedor,
    calificacion: body.calificacion,
    estado: body.estado,
    zona: body.zona,
    residuo: body.residuo,
    observaciones: body.observaciones,
    fecha: body.fecha,
    img: body.img,
    imgContenedor: body.imgContenedor,
    imgDetalle: body.imgDetalle,
    usuario: req.usuario._id
  });

  historico.save((err, historicoDB) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err
      });
    }

    if (!historicoDB) {
      return res.status(400).json({
        ok: false,
        err
      });
    }

    res.json({
      ok: true,
      basura: historicoDB
    });
  });
});

// =================================
// Actualizar historico por id
// =================================
app.put("/historico/:id", verificaToken, (req, res) => {
  let id = req.params.id;
  let body = req.body;

  let options = {
    new: true,
    runValidators: true,
    context: "query"
  };

  Historico.findByIdAndUpdate(id, body, options, (err, historicoDB) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err
      });
    }

    if (!historicoDB) {
      return res.status(400).json({
        ok: false,
        err
      });
    }

    res.json({
      ok: true,
      historico: historicoDB
    });
  });
});

// =================================
// Purgar Historico
// =================================
app.delete(
  "/purgar-historico",
  [verificaToken, verificaSuper_Admin_Role],
  (req, res) => {
    Historico.deleteMany({}, (err, historicos) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err
        });
      }

      res.json({
        ok: true,
        message: "historicos Borrados",
        historicos: historicos
      });
    });
  }
);

// =================================
// Borrar Historico por id
// =================================
app.delete("/historico/:id", verificaToken, (req, res) => {
  let id = req.params.id;

  Historico.findByIdAndRemove(id, (err, historicos) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err
      });
    }

    res.json({
      ok: true,
      historicos
    });
  });
});

// =================================
// Borrar Historicos que no tenga img ni calificacion
// =================================
app.delete("/borrar-historico", verificaToken, (req, res) => {
  Historico.deleteMany(
    {
      $or: [
        { img: "" },
        { img: null },
        { calificacion: "" },
        { calificacion: null }
      ]
    },
    (err, historicos) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err
        });
      }

      res.json({
        ok: true,
        message: "historicos Borrados",
        historicos: historicos
      });
    }
  );
});

module.exports = app;
