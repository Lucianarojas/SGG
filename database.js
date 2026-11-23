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

  initTablaUsuarios();

  await guardarBaseEnOPFS();
  console.log("SQLite inicializado y persistido en OPFS");
  return db;
}

function initTablaUsuarios() {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL
    );
  `);

  const defaults = [
    { email: "usuario1@gmail.com", password: "Usuario.1", name: "Usuario 1" },
    { email: "usuario2@gmail.com", password: "Usuario.2", name: "Usuario 2" }
  ];

  defaults.forEach(u => {
    db.run(`
      INSERT OR IGNORE INTO usuarios (email, password, name)
      VALUES (?, ?, ?);
    `, [u.email.toLowerCase(), u.password, u.name]);
  });
}

function obtenerUsuarioPorEmail(email) {
  const res = db.exec(`
    SELECT id, email, password, name
    FROM usuarios
    WHERE LOWER(email) = LOWER(?)
    LIMIT 1;
  `, [email.trim()]);

  if (!res.length || !res[0].values.length) return null;

  const [id, mail, password, name] = res[0].values[0];
  return { id, email: mail, password, name };
}

async function registrarUsuarioSQLite({ email, password, name }) {
  const emailNormalizado = email.trim().toLowerCase();
  if (obtenerUsuarioPorEmail(emailNormalizado)) {
    return { ok: false, error: "Este correo electrónico ya se encuentra registrado." };
  }

  db.run(`
    INSERT INTO usuarios (email, password, name)
    VALUES (?, ?, ?);
  `, [emailNormalizado, password, name.trim()]);

  await guardarBaseEnOPFS();
  return { ok: true };
}

async function actualizarPasswordUsuarioSQLite(email, nuevaPassword) {
  const emailNormalizado = email.trim().toLowerCase();
  db.run(`
    UPDATE usuarios
    SET password = ?
    WHERE LOWER(email) = LOWER(?);
  `, [nuevaPassword, emailNormalizado]);

  await guardarBaseEnOPFS();
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