console.log("database.js cargado");

let db;
let SQL;

async function initDatabase() {

    SQL = await initSqlJs({
        locateFile: file =>
            `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    await cargarBaseDesdeOPFS(SQL);

    db.run(`
        CREATE TABLE IF NOT EXISTS movimientos (
            id INTEGER PRIMARY KEY,
            descripcion TEXT,
            categoria TEXT,
            monto REAL,
            fecha TEXT,
            tipo_movimiento TEXT,
            url_comprobante TEXT,
            activo INTEGER DEFAULT 1
        );
    `);

    console.log("SQLite inicializado");

    return db;
}

// NUEVO

function insertarMovimiento(
    descripcion,
    categoria,
    monto,
    fecha,
    tipo
) {

    db.run(`
        INSERT INTO movimientos
        (
            descripcion,
            categoria,
            monto,
            fecha,
            tipo_movimiento
        )
        VALUES (?, ?, ?, ?, ?)
    `, [
        descripcion,
        categoria,
        monto,
        fecha,
        tipo
    ]);

    console.log("Movimiento guardado en SQLite");
}

// NUEVO

function verMovimientos() {

    const resultado = db.exec(`
        SELECT *
        FROM movimientos
    `);

    console.log(resultado);

    return resultado;
}

function insertarMovimientoCompleto(movimiento) {

    console.log("INSERT SQLITE", movimiento);

    console.log("DB:", db);


    db.run(`
        INSERT INTO movimientos
        (
            id,
            descripcion,
            categoria,
            monto,
            fecha,
            tipo_movimiento,
            activo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        movimiento.id,
        movimiento.descripcion,
        movimiento.categoria,
        movimiento.monto,
        movimiento.fecha,
        movimiento.tipo_movimiento,
        movimiento.estado_activo ? 1 : 0
    ]);

    //guardarBaseEnOPFS();

}

function obtenerMovimientos() {

    const resultado = db.exec(`
        SELECT *
        FROM movimientos
        WHERE activo = 1
    `);

    if (resultado.length === 0) {
        return [];
    }

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

function listarMovimientosSQLite() {

    const resultado = db.exec(`
        SELECT *
        FROM movimientos
    `);

    console.log("RESULTADO SQL:", resultado);

    if (resultado.length === 0) {
        return [];
    }

    console.log("VALUES:", resultado[0].values);

    return resultado[0].values;
}


function eliminarMovimientoSQLite(id) {

    db.run(`
        UPDATE movimientos
        SET activo = 0
        WHERE id = ?
    `,[id]);

    console.log("Movimiento desactivado:", id);
}