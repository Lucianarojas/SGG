console.log("database.js cargado");

let db;
let SQL;

async function initDatabase() {
  SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
  });

  await cargarBaseDesdeOPFS(SQL);

  db.run(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY,
      email_usuario TEXT,
      descripcion TEXT,
      categoria TEXT,
      monto REAL,
      fecha TEXT,
      tipo_movimiento TEXT,
      url_comprobante TEXT,
      activo INTEGER DEFAULT 1
    );
  `);

  await guardarBaseEnOPFS();
  console.log("SQLite inicializado y persistido en OPFS");
  return db;
}

async function insertarMovimientoCompleto(movimiento) {
  db.run(`
    INSERT INTO movimientos
    (id, email_usuario, descripcion, categoria, monto, fecha, tipo_movimiento, url_comprobante, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    movimiento.id,
    movimiento.email_usuario,
    movimiento.descripcion,
    movimiento.categoria,
    movimiento.monto,
    movimiento.fecha,
    movimiento.tipo_movimiento,
    movimiento.url_comprobante || null,
    1
  ]);

  await guardarBaseEnOPFS();
}

function obtenerMovimientos(emailUsuario) {
  const resultado = db.exec(`
    SELECT id, descripcion, categoria, monto, fecha, tipo_movimiento, url_comprobante, activo
    FROM movimientos
    WHERE activo = 1 AND email_usuario = ?
    ORDER BY fecha DESC
  `, [emailUsuario]);

  if (resultado.length === 0) return [];

  return resultado[0].values.map(row => ({
    id: row[0],
    descripcion: row[1],
    categoria: row[2],
    monto: row[3],
    fecha: row[4],
    tipo_movimiento: row[5],
    url_comprobante: row[6],
    estado_activo: row[7]
  }));
}

async function editarMovimientoSQLite(movimiento) {
  db.run(`
    UPDATE movimientos
    SET monto = ?, fecha = ?, categoria = ?, descripcion = ?
    WHERE id = ?
  `, [
    movimiento.monto,
    movimiento.fecha,
    movimiento.categoria,
    movimiento.descripcion,
    movimiento.id
  ]);

  await guardarBaseEnOPFS();
}

async function eliminarMovimientoSQLite(id) {
  db.run(`
    UPDATE movimientos
    SET activo = 0
    WHERE id = ?
  `, [id]);

  await guardarBaseEnOPFS();
  console.log("Borrado lógico ejecutado en SQLite:", id);
}

// Consultas de agregación SQL para Chart.js
function obtenerTotalesPorTipoSQL(emailUsuario) {
  const res = db.exec(`
    SELECT tipo_movimiento, SUM(monto) as total
    FROM movimientos
    WHERE activo = 1 AND email_usuario = ?
    GROUP BY tipo_movimiento
  `, [emailUsuario]);

  const totales = { ingreso: 0, egreso: 0 };
  if (res.length > 0) {
    res[0].values.forEach(([tipo, total]) => {
      if (tipo === "ingreso" || tipo === "egreso") {
        totales[tipo] = total;
      }
    });
  }
  return totales;
}

function obtenerEgresosPorCategoriaSQL(emailUsuario) {
  const res = db.exec(`
    SELECT categoria, SUM(monto) as total
    FROM movimientos
    WHERE activo = 1 AND email_usuario = ? AND tipo_movimiento = 'egreso'
    GROUP BY categoria
  `, [emailUsuario]);

  if (res.length === 0) return { labels: [], data: [] };

  return {
    labels: res[0].values.map(row => row[0]),
    data: res[0].values.map(row => row[1])
  };
}