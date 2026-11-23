let usuarioActual = null;
let graficoBalance = null;
let graficoCategorias = null;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Verificar sesión
  usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
  if (!usuarioActual) {
    window.location.href = "index.html";
    return;
  }

  // 2. Inicializar SQLite + OPFS antes de tocar la UI
  await initDatabase();

  // 3. Referencias DOM
  const form = document.getElementById("formGasto");
  const tablaBody = document.querySelector("#tablaGastos tbody");
  const totalBox = document.getElementById("totalGastado");
  const modalEliminar = document.getElementById("modalEliminar");
  const btnCancelarEliminar = document.getElementById("btnCancelarEliminar");
  const btnConfirmarEliminar = document.getElementById("btnConfirmarEliminar");
  const modalEditar = document.getElementById("modalEditar");
  const formEditar = document.getElementById("formEditar");
  const btnCancelarEditar = document.getElementById("btnCancelarEditar");
  let gastoAEliminar = null;
  let gastoEditando = null;

  // --- Persistencia de tema ---
  const htmlElement = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("sgg_theme") || "light";
  htmlElement.setAttribute("data-theme", savedTheme);
  document.body.classList.remove("dark-mode", "light-mode");
  document.body.classList.add(savedTheme === "dark" ? "dark-mode" : "light-mode");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = htmlElement.getAttribute("data-theme");
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      htmlElement.setAttribute("data-theme", nextTheme);
      document.body.classList.remove("dark-mode", "light-mode");
      document.body.classList.add(nextTheme === "dark" ? "dark-mode" : "light-mode");
      localStorage.setItem("sgg_theme", nextTheme);
    });
  }

  // 4. Renderizar movimientos desde SQLite
  function renderGastos() {
    const movimientos = obtenerMovimientos(usuarioActual.email);
    tablaBody.innerHTML = "";

    movimientos.forEach(g => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${g.fecha}</td>
        <td>${g.categoria}</td>
        <td>${g.tipo_movimiento}</td>
        <td>$${g.monto}</td>
        <td>${g.descripcion}</td>
        <td>
          ${g.url_comprobante ? `<a href="${g.url_comprobante}" target="_blank">Ver</a>` : "-"}
          <button class="link-btn" data-id="${g.id}" data-action="edit">Editar</button>
          <button class="link-btn" data-id="${g.id}" data-action="delete">Eliminar</button>
        </td>`;
      tablaBody.appendChild(tr);
    });

    // Balance calculado desde la consulta SQL de agregación
    const totales = obtenerTotalesPorTipoSQL(usuarioActual.email);
    const balance = totales.ingreso - totales.egreso;
    totalBox.textContent = `$${balance}`;
  }

  function actualizarTodo() {
    renderGastos();
    crearGraficoBalance();
    crearGraficoCategorias();
  }

  // 5. Crear movimiento
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const monto = parseFloat(document.getElementById("gastoMonto").value);
    const fecha = document.getElementById("gastoFecha").value;
    const categoria = document.getElementById("gastoCategoria").value;
    const descripcion = document.getElementById("gastoDescripcion").value.trim();
    const tipoMovimiento = document.getElementById("tipoMovimiento").value;

    document.getElementById("errMonto").textContent = "";

    if (!monto || monto <= 0) {
      document.getElementById("errMonto").textContent = "El monto debe ser mayor a 0.";
      return;
    }
    if (!fecha || !categoria || !descripcion || !tipoMovimiento) {
      alert("Todos los campos son obligatorios.");
      return;
    }

   const btnSubmit = form.querySelector('button[type="submit"]');
    const inputComprobante = document.getElementById("comprobante");
    const archivo = inputComprobante.files[0];

    btnSubmit.disabled = true;
    btnSubmit.textContent = archivo ? "Subiendo comprobante..." : "Guardando...";

    let urlComprobante = null;
    if (archivo) {
      urlComprobante = await subirComprobante(archivo);
    }

    const nuevo = {
      id: Date.now(),
      email_usuario: usuarioActual.email,
      monto,
      fecha,
      categoria,
      descripcion,
      tipo_movimiento: tipoMovimiento,
      url_comprobante: urlComprobante
    };

    await insertarMovimientoCompleto(nuevo);

    btnSubmit.disabled = false;
    btnSubmit.textContent = "Guardar Gasto";

    form.reset();
    actualizarTodo();
  });

  // 6. Acciones de tabla (Editar / Eliminar)
  tablaBody.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const movimientos = obtenerMovimientos(usuarioActual.email);
    const g = movimientos.find(x => x.id === id);

    if (btn.dataset.action === "delete") {
      gastoAEliminar = id;
      modalEliminar.hidden = false;
    }
    
     if (btn.dataset.action === "edit" && g) {
      document.getElementById("editMonto").value = g.monto;
      document.getElementById("editFecha").value = g.fecha;
      document.getElementById("editCategoria").value = g.categoria;
      document.getElementById("editDescripcion").value = g.descripcion;
      gastoEditando = g.id;
      modalEditar.hidden = false;
    }
  });

  // 7. Confirmar borrado lógico
  btnCancelarEliminar.addEventListener("click", () => {
    modalEliminar.hidden = true;
    gastoAEliminar = null;
  });

  btnConfirmarEliminar.addEventListener("click", async () => {
    if (gastoAEliminar) {
      await eliminarMovimientoSQLite(gastoAEliminar);
      actualizarTodo();
    }
    modalEliminar.hidden = true;
    gastoAEliminar = null;
  });

  // 8. Confirmar edición
  btnCancelarEditar.addEventListener("click", () => {
    modalEditar.hidden = true;
    gastoEditando = null;
  });

  formEditar.addEventListener("submit", async e => {
    e.preventDefault();
    if (gastoEditando) {
      await editarMovimientoSQLite({
        id: gastoEditando,
        monto: parseFloat(document.getElementById("editMonto").value),
        fecha: document.getElementById("editFecha").value,
        categoria: document.getElementById("editCategoria").value,
        descripcion: document.getElementById("editDescripcion").value.trim()
      });
      actualizarTodo();
    }
    modalEditar.hidden = true;
    gastoEditando = null;
  });

  // 9. Navegación interna
  const navButtons = document.querySelectorAll(".nav-dashboard button");
  const sections = document.querySelectorAll("main .card section");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      sections.forEach(sec => sec.classList.add("panel--off"));
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.remove("panel--off");
    });
  });

  // Logout
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuarioActual");
      window.location.href = "index.html";
    });
  }

  actualizarTodo();
});

function crearGraficoBalance() {
  const totales = obtenerTotalesPorTipoSQL(usuarioActual.email);
  const ctx = document.getElementById("graficoBalance");

  if (graficoBalance) graficoBalance.destroy();

  graficoBalance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Ingresos", "Egresos"],
      datasets: [{
        label: "Total ($)",
        data: [totales.ingreso, totales.egreso],
        backgroundColor: ["#2ecc71", "#e74c3c"]
      }]
    }
  });
}

function crearGraficoCategorias() {
  const resultado = obtenerEgresosPorCategoriaSQL(usuarioActual.email);
  const ctx = document.getElementById("graficoCategorias");

  if (graficoCategorias) graficoCategorias.destroy();

  graficoCategorias = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: resultado.labels,
      datasets: [{
        data: resultado.data
      }]
    }
  });
}

async function subirComprobante(archivo) {
  const API_KEY = "50aec7e51f2c4ef1128e7dc8fd997430";
  const formData = new FormData();
  formData.append("image", archivo);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const resultado = await response.json();

    if (resultado.success && resultado.data && resultado.data.url) {
      return resultado.data.url;
    } else {
      throw new Error("Respuesta inválida de la API de imágenes.");
    }
  } catch (error) {
    console.error("Error subiendo comprobante:", error);
    alert("No se pudo subir el comprobante (falla de red o API). El movimiento se registrará sin imagen.");
    return null;
  }
}