console.log("opfs.js cargado");

const SUPABASE_URL = "https://sbgtegbmdtabdabgwzls.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8DU3x2BmGAu2Mmg7SSCq2Q_Ri0FNkbM";
const BUCKET_NAME = "sgg-backups";

const supabaseClient = (typeof supabase !== "undefined" && SUPABASE_URL.startsWith("http"))
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function obtenerNombreArchivoNube(email) {
  const emailLimpio = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
  return `sgg_${emailLimpio}.sqlite`;
}

async function subirBaseANube(email, datosBinarios) {
  if (!supabaseClient || !email) return;

  const nombreArchivo = obtenerNombreArchivoNube(email);
  const blob = new Blob([datosBinarios], { type: "application/x-sqlite3" });

  try {
    const { error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(nombreArchivo, blob, {
        contentType: "application/x-sqlite3",
        upsert: true
      });

    if (error) throw error;
    console.log("Respaldo .sqlite sincronizado en Supabase Storage:", nombreArchivo);
  } catch (err) {
    console.warn("Sin conexión a la nube, operando en modo Offline-First:", err.message);
  }
}

async function descargarBaseDesdeNube(email) {
  if (!supabaseClient || !email) return false;

  const nombreArchivo = obtenerNombreArchivoNube(email);

  try {
    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .download(nombreArchivo);

    if (error) {
      console.log("Sin respaldo previo en la nube:", error.message);
      return false;
    }

    const arrayBuffer = await data.arrayBuffer();
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle("sgg.sqlite", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(new Uint8Array(arrayBuffer));
    await writable.close();

    console.log("Base SQLite descargada desde la nube e instalada en OPFS");
    return true;
  } catch (err) {
    console.warn("Error descargando respaldo (continuando offline):", err.message);
    return false;
  }
}

async function guardarBaseEnOPFS() {
  const data = db.export();
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle("sgg.sqlite", { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();

  console.log("Base SQLite guardada en OPFS");

  const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
  if (usuario) {
    await subirBaseANube(usuario.email, data);
  }
}

async function cargarBaseDesdeOPFS(SQL) {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle("sgg.sqlite");
    const file = await fileHandle.getFile();
    const buffer = await file.arrayBuffer();

    db = new SQL.Database(new Uint8Array(buffer));
    console.log("Base SQLite cargada desde OPFS");
  } catch (error) {
    console.log("No existe base previa, creando nueva.");
    db = new SQL.Database();
  }
}