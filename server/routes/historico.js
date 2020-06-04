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
  let estado = req.query.estado || '';

  let fechaDesde = req.query.fechadesde || new Date();
  let fechaHasta = req.query.fechahasta || new Date();

  let _residuo = residuo;

  if( _residuo === 'Envases Plásticos/Metálicos Contaminados') {
    _residuo = 'Plástico/envases Contaminados';
  }

  console.log(_residuo);

  Historico.find({
    'nombre': { $regex: _residuo },
    'estado': { $regex: estado },
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

      let _historicoDB = historicoDB;


      if( _residuo !== residuo ) {
        _historicoDB = historicoDB.map( h => {return {...h, nombre: residuo }})
      }
      
      res.json({
        ok: true,
        historicos: _historicoDB,
        total: _historicoDB.length
      });


      /* Historico.countDocuments(
        {
          'nombre': { $regex: residuo },
          'estado': { $regex: estado },
          $and: [
            { fecha: { $gte: new Date(fechaDesde) } },
            { fecha: { $lt: new Date(fechaHasta) } }
          ]
        },
        (err, conteo) => {
          res.json({
            ok: true,
            historicos: _historicoDB,
            total: conteo
          });
        }
      ); */
    });
});

// =================================
// Mostrar todos los históricos de una zona
// =================================
app.get('/historicosPorZona', verificaToken, (req, res) => {

  let zona = req.query.zona || '';
  let estado = req.query.estado || '';

  let fechaDesde = req.query.fechadesde || new Date();
  let fechaHasta = req.query.fechahasta || new Date();

  Historico.find({  'zona': { $regex: zona }, 
                    'estado': { $regex: estado },
                    $and: [
                      { fecha: { $gte: new Date(fechaDesde) } },
                      { fecha: { $lt: new Date(fechaHasta) } }
                    ] })
      .sort('numeroContenedor')
      .exec((err, historicos) => {
          if (err) {
              return res.status(400).json({
                  ok: false,
                  err
              });
          }
          Historico.countDocuments({ 'zona': { $regex: zona }, 
          'estado': { $regex: estado },
          $and: [
            { fecha: { $gte: new Date(fechaDesde) } },
            { fecha: { $lt: new Date(fechaHasta) } }
          ] }, (err, conteo) => {

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

                let arrayHistoricosRepe = [];
                let reverse = historicoDB.slice();

                historicoDB.forEach( (h, index) => {
                  reverse.forEach( (h2, i) => {
                    let fecha1 = moment(h.fecha).format('L');
                    let fecha2 = moment(h2.fecha).format('L');
                    if(fecha1 === fecha2 && h.codigoContenedor === h2.codigoContenedor && h.id !== h2.id ) {

                      console.log(`Fecha1: ${fecha1} y Fecha2: ${fecha2} && cod1: ${h.codigoContenedor} y cod2: ${h2.codigoContenedor}`);
                      arrayHistoricosRepe.push(h2);
                      reverse.splice(i, 1);
                      historicoDB.splice(i, 1);
                    }
                  });
                });

                arrayHistoricosRepe.forEach( repe => {
                  Historico.findByIdAndDelete({_id: repe._id}).exec(( err, repetido ) => {
                    console.log(repetido);
                  });
                });

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

                let arrayHistoricosRepe = [];
                let reverse = historicoDB.reverse();

                historicoDB.forEach( (h, index) => {
                  reverse.forEach( (h2, i) => {
                    let fecha1 = moment(h.fecha).format('L');
                    let fecha2 = moment(h2.fecha).format('L');
                    if(fecha1 === fecha2 ) {
                      arrayHistoricosRepe.push(h2);
                      reverse.splice(i, 1);
                    }
                  });
                });
                                
                /*  arrayHistoricosRepe.forEach( repe => {
                  Historico.findByIdAndDelete({_id: repe._id}).exec(( err, repetido ) => {
                    console.log(repetido);
                  });
                }); */
                
                Historico.countDocuments({ codigoContenedor: codigoContenedor }, (err, conteo) => {
                  res.json({
                    ok: true,
                    total: conteo,
                    message: 'Historicos repetidos borrados',
                    historicos: arrayHistoricosRepe
                  });
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
// Problemas por zonas
// =================================
app.get("/problemas-por-zonas", verificaToken , async (req, res) => {
  const hoy = moment();
  const week = moment().subtract(1, 'week');
  const month = moment().subtract(1, 'months');
  const year = moment().subtract(1, 'months');

  const semana = await Historico.find({
    $and: [
      { fecha: { $gte: new Date(week) } },
      { fecha: { $lt: new Date(hoy) } }
    ]
  });

  const mes = await Historico.find({
    $and: [
      { fecha: { $gte: new Date(month) } },
      { fecha: { $lt: new Date(hoy) } }
    ]
  });

  const anio = await Historico.find({
    $and: [
      { fecha: { $gte: new Date(year) } },
      { fecha: { $lt: new Date(hoy) } }
    ]
  });

  const arrZonas = ['Zona 1 -','Zona 2', 'Zona 3', 'Zona 4', 'Zona 5', 'Zona 6', 'Zona 7', 'Zona 8', 'Zona 9', 'Zona 10', 'Zona 11', ];
    let zonaArrSem = [];
    let zonaArrMes = [];
    let zonaArrAnio = [];
    let sumaSemana = [];
    let sumaMes = [];
    let sumaAnio = [];
    arrZonas.forEach( (zona, index) => {
      zonaArrSem[index] = semana.filter(h => h.zona.includes(zona));
      zonaArrMes[index] = mes.filter(h => h.zona.includes(zona));
      zonaArrAnio[index] = anio.filter(h => h.zona.includes(zona));
      sumaSemana.push({ 
        'zona': arrZonas[index],
        'Total Contenedores Semana': zonaArrSem[index].length,
        'Bueno': zonaArrSem[index].filter( x => x.estado.includes('Bueno')).length,
        'Roto': zonaArrSem[index].filter( x => x.estado.includes('Roto')).length,
        'Sucio': zonaArrSem[index].filter( x => x.estado.includes('Sucio')).length,
        'Fuera de sitio': zonaArrSem[index].filter( x => x.estado.includes('Fuera de sitio')).length,
        'Exceso de carga': zonaArrSem[index].filter( x => x.estado.includes('Exceso de carga')).length,
        'Muy vacío': zonaArrSem[index].filter( x => x.estado.includes('Muy vacío')).length,
        'Otros': zonaArrSem[index].filter( x => x.estado.includes('Otros')).length
      });

      sumaMes.push({ 
        'zona': arrZonas[index],
        'Total Contenedores Mes': zonaArrMes[index].length,
        'Puntuación Mensual': {
          'Bueno': (zonaArrMes[index].filter( x => x.estado.includes('Bueno')).length * 5) / zonaArrMes[index].length,
          'Roto': (zonaArrMes[index].filter( x => x.estado.includes('Roto')).length * 5) / zonaArrMes[index].length,
          'Sucio': (zonaArrMes[index].filter( x => x.estado.includes('Sucio')).length * 5) / zonaArrMes[index].length,
          'Fuera de sitio': (zonaArrMes[index].filter( x => x.estado.includes('Fuera de sitio')).length * 5) / zonaArrMes[index].length,
          'Exceso de carga': (zonaArrMes[index].filter( x => x.estado.includes('Exceso de carga')).length * 5) / zonaArrMes[index].length,
          'Muy vacío': (zonaArrMes[index].filter( x => x.estado.includes('Muy vacío')).length * 5) / zonaArrMes[index].length,
          'Otros': (zonaArrMes[index].filter( x => x.estado.includes('Otros')).length * 5) / zonaArrMes[index].length
        },
        'Calidad Segregación': (zonaArrMes[index].reduce((prev, current) => prev + current.calificacion, 0) * 5) / (zonaArrMes[index].length * 5),
        'Bueno': zonaArrMes[index].filter( x => x.estado.includes('Bueno')).length,
        'Roto': zonaArrMes[index].filter( x => x.estado.includes('Roto')).length,
        'Sucio': zonaArrMes[index].filter( x => x.estado.includes('Sucio')).length,
        'Fuera de sitio': zonaArrMes[index].filter( x => x.estado.includes('Fuera de sitio')).length,
        'Exceso de carga': zonaArrMes[index].filter( x => x.estado.includes('Exceso de carga')).length,
        'Muy vacío': zonaArrMes[index].filter( x => x.estado.includes('Muy vacío')).length,
        'Otros': zonaArrMes[index].filter( x => x.estado.includes('Otros')).length
      });

      sumaAnio.push({ 
        'zona': arrZonas[index],
        'Total Contenedores Año': zonaArrAnio[index].length,
        'Bueno': zonaArrAnio[index].filter( x => x.estado.includes('Bueno')).length,
        'Roto': zonaArrAnio[index].filter( x => x.estado.includes('Roto')).length,
        'Sucio': zonaArrAnio[index].filter( x => x.estado.includes('Sucio')).length,
        'Fuera de sitio': zonaArrAnio[index].filter( x => x.estado.includes('Fuera de sitio')).length,
        'Exceso de carga': zonaArrAnio[index].filter( x => x.estado.includes('Exceso de carga')).length,
        'Muy vacío': zonaArrAnio[index].filter( x => x.estado.includes('Muy vacío')).length,
        'Otros': zonaArrAnio[index].filter( x => x.estado.includes('Otros')).length
      });
    })
  
  
  res.json({
    ok: true,
    semana: sumaSemana,
    mes: sumaMes,
    año: sumaAnio
  });
});

// =================================
// Problemas por resíduos
// =================================
app.get("/problemas-por-residuos", verificaToken , async (req, res) => {

  const hoy = moment();
  const week = moment().subtract(1, 'week');
  const month = moment().subtract(1, 'months');
  const year = moment().subtract(1, 'months');

  const semana = await Historico.find({
    $and: [
      { fecha: { $gte: new Date(week) } },
      { fecha: { $lt: new Date(hoy) } }
    ]
  });

  const mes = await Historico.find({
    $and: [
      { fecha: { $gte: new Date(month) } },
      { fecha: { $lt: new Date(hoy) } }
    ]
  });

  const anio = await Historico.find({
    $and: [
      { fecha: { $gte: new Date(year) } },
      { fecha: { $lt: new Date(hoy) } }
    ]
  });

    const arrResiduos = BASURAS;
    let arrSem = [];
    let arrMes = [];
    let arrAnio = [];
    let sumaSemana = [];
    let sumaMes = [];
    let sumaAnio = [];
    arrResiduos.forEach( (residuo, index) => {


      let flag = false;
      if( residuo.nombre === 'Envases Plásticos/Metálicos Contaminados') {
        flag = true;
        residuo.nombre = 'Plástico/envases Contaminados';
      }
          
      arrSem[index] = semana.filter(h => h.nombre.includes(residuo.nombre));
      arrMes[index] = mes.filter(h => h.nombre.includes(residuo.nombre));
      arrAnio[index] = anio.filter(h => h.nombre.includes(residuo.nombre));

      if( flag ) {
        residuo.nombre = 'Envases Plásticos/Metálicos Contaminados';
      }
      sumaSemana.push({ 
        'Resíduo': arrResiduos[index].nombre,
        'Bueno': arrSem[index].filter( x => x.estado.includes('Bueno')).length,
        'Roto': arrSem[index].filter( x => x.estado.includes('Roto')).length,
        'Sucio': arrSem[index].filter( x => x.estado.includes('Sucio')).length,
        'Fuera de sitio': arrSem[index].filter( x => x.estado.includes('Fuera de sitio')).length,
        'Exceso de carga': arrSem[index].filter( x => x.estado.includes('Exceso de carga')).length,
        'Muy vacío': arrSem[index].filter( x => x.estado.includes('Muy vacío')).length,
        'Otros': arrSem[index].filter( x => x.estado.includes('Otros')).length
      });

      sumaMes.push({ 
        'Resíduo': arrResiduos[index].nombre,
        'Total Contenedores Mes': arrMes[index].length,
        'Puntuación Mensual': {
          'Bueno': (arrMes[index].filter( x => x.estado.includes('Bueno')).length * 5) / arrMes[index].length,
          'Roto': (arrMes[index].filter( x => x.estado.includes('Roto')).length * 5) / arrMes[index].length,
          'Sucio': (arrMes[index].filter( x => x.estado.includes('Sucio')).length * 5) / arrMes[index].length,
          'Fuera de sitio': (arrMes[index].filter( x => x.estado.includes('Fuera de sitio')).length * 5) / arrMes[index].length,
          'Exceso de carga': (arrMes[index].filter( x => x.estado.includes('Exceso de carga')).length * 5) / arrMes[index].length,
          'Muy vacío': (arrMes[index].filter( x => x.estado.includes('Muy vacío')).length * 5) / arrMes[index].length,
          'Otros': (arrMes[index].filter( x => x.estado.includes('Otros')).length * 5) / arrMes[index].length
        },
        'Calidad Segregación': (arrMes[index].reduce((prev, current) => prev + current.calificacion, 0) * 5) / (arrMes[index].length * 5),
        'Bueno': arrMes[index].filter( x => x.estado.includes('Bueno')).length,
        'Roto': arrMes[index].filter( x => x.estado.includes('Roto')).length,
        'Sucio': arrMes[index].filter( x => x.estado.includes('Sucio')).length,
        'Fuera de sitio': arrMes[index].filter( x => x.estado.includes('Fuera de sitio')).length,
        'Exceso de carga': arrMes[index].filter( x => x.estado.includes('Exceso de carga')).length,
        'Muy vacío': arrMes[index].filter( x => x.estado.includes('Muy vacío')).length,
        'Otros': arrMes[index].filter( x => x.estado.includes('Otros')).length
      });

      sumaAnio.push({ 
        'Resíduo': arrResiduos[index].nombre,
        'Bueno': arrAnio[index].filter( x => x.estado.includes('Bueno')).length,
        'Roto': arrAnio[index].filter( x => x.estado.includes('Roto')).length,
        'Sucio': arrAnio[index].filter( x => x.estado.includes('Sucio')).length,
        'Fuera de sitio': arrAnio[index].filter( x => x.estado.includes('Fuera de sitio')).length,
        'Exceso de carga': arrAnio[index].filter( x => x.estado.includes('Exceso de carga')).length,
        'Muy vacío': arrAnio[index].filter( x => x.estado.includes('Muy vacío')).length,
        'Otros': arrAnio[index].filter( x => x.estado.includes('Otros')).length
      });
    })
  
  
  res.json({
    ok: true,
    semana: sumaSemana,
    mes: sumaMes,
    año: sumaAnio
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
  const inicio = moment().subtract(1, 'months');
  const fin = moment();
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
  const inicio = moment().subtract(1, 'months');
  const fin = moment();
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
