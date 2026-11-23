console.log("opfs.js cargado");

async function guardarBaseEnOPFS() {

    const data = db.export();

    const root = await navigator.storage.getDirectory();

    const fileHandle = await root.getFileHandle(
        "sgg.sqlite",
        { create: true }
    );

    const writable = await fileHandle.createWritable();

    await writable.write(data);

    await writable.close();

    console.log("Base SQLite guardada en OPFS");
}

async function cargarBaseDesdeOPFS(SQL) {

    try {

        const root = await navigator.storage.getDirectory();

        const fileHandle = await root.getFileHandle(
            "sgg.sqlite"
        );

        const file = await fileHandle.getFile();

        const buffer = await file.arrayBuffer();

        db = new SQL.Database(
            new Uint8Array(buffer)
        );

        console.log("Base SQLite cargada desde OPFS");

    } catch (error) {

        console.log(
            "No existe base previa, creando nueva."
        );

        db = new SQL.Database();
    }
}
