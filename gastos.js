document.addEventListener("DOMContentLoaded", () => {

  console.log("gastos.js cargado");
  initDatabase();

  // 1. Verificar sesión
  const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
  if (!usuarioActual) {
    window.location.href = "index.html";
    return;
  }

  // 2. Referencias DOM
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
 // --- Persistencia de tema desde login ---
  const htmlElement = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("sgg_theme") || "light";

// Aplicar el tema guardado al cargar
htmlElement.setAttribute("data-theme", savedTheme);
document.body.classList.remove("dark-mode", "light-mode"); // limpiar
document.body.classList.add(savedTheme === "dark" ? "dark-mode" : "light-mode");

// --- Toggle Día/Noche ---
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = htmlElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    // Cambiar atributo
    htmlElement.setAttribute("data-theme", nextTheme);

    // 👇 limpiar antes de aplicar
    document.body.classList.remove("dark-mode", "light-mode");
    document.body.classList.add(nextTheme === "dark" ? "dark-mode" : "light-mode");

    // Guardar preferencia
    localStorage.setItem("sgg_theme", nextTheme);
  });
}


  // 3. Funciones de LocalStorage
  function getGastos() {
    return JSON.parse(localStorage.getItem("gastos_sgg")) || [];
  }
  function setGastos(arr) {
    localStorage.setItem("gastos_sgg", JSON.stringify(arr));
  }

  // 4. Renderizar gastos
  function renderGastos() {
    const gastos = getGastos().filter(g => g.email_usuario === usuarioActual.email && g.estado_activo);
    tablaBody.innerHTML = "";
    gastos.forEach(g => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${g.fecha}</td>
        <td>${g.categoria}</td>
        <td>${g.tipo_movimiento || "egreso"}</td>
        <td>$${g.monto}</td>
        <td>${g.descripcion}</td>
        <td>
          <button class="link-btn" data-id="${g.id}" data-action="edit">Editar</button>
          <button class="link-btn" data-id="${g.id}" data-action="delete">Eliminar</button>
        </td>`;
      tablaBody.appendChild(tr);
    });

    const total = gastos.reduce((sum, g) => {
  return g.tipo_movimiento === "ingreso"
    ? sum + parseFloat(g.monto)
    : sum - parseFloat(g.monto);
}, 0);
totalBox.textContent = `$${total}`;
  }

  // 5. Crear gasto (formulario principal)
  form.addEventListener("submit", e => {
  e.preventDefault();
  const monto = parseFloat(document.getElementById("gastoMonto").value);
  const fecha = document.getElementById("gastoFecha").value;
  const categoria = document.getElementById("gastoCategoria").value;
  const descripcion = document.getElementById("gastoDescripcion").value.trim();
  
  const tipoMovimiento =
  document.getElementById("tipoMovimiento").value;

  // limpiar errores previos
  document.getElementById("errMonto").textContent = "";

  if (!monto || monto <= 0) {
    document.getElementById("errMonto").textContent = "El monto debe ser mayor a 0.";
    return;
  }
  if (!fecha || !categoria || !descripcion) {
    // Podés agregar otros err debajo de cada campo si querés
    alert("Todos los campos son obligatorios.");
    return;
  }

  const gastos = getGastos();
  const nuevo = {
  id: Date.now(),
  email_usuario: usuarioActual.email,
  monto,
  fecha,
  categoria,
  descripcion,
  tipo_movimiento: tipoMovimiento,
  estado_activo: true
};

  console.log(nuevo);
  gastos.push(nuevo);
  setGastos(gastos);

// NUEVO
  insertarMovimientoCompleto(nuevo);

  form.reset();
  renderGastos();

  crearGraficoBalance();
  crearGraficoCategorias();
});

  // 6. Botones Editar / Eliminar
  tablaBody.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const gastos = getGastos();
    const g = gastos.find(x => x.id === id);

    if (btn.dataset.action === "delete") {
      gastoAEliminar = id;
      modalEliminar.hidden = false;
    }

    if (btn.dataset.action === "edit" && g) {
      // Cargar datos en el modal de edición
      document.getElementById("editMonto").value = g.monto;
      document.getElementById("editFecha").value = g.fecha;
      document.getElementById("editCategoria").value = g.categoria;
      document.getElementById("editDescripcion").value = g.descripcion;
      gastoEditando = g.id;
      modalEditar.hidden = false;
    }
  });

  // 7. Confirmar eliminación
  btnCancelarEliminar.addEventListener("click", () => {
    modalEliminar.hidden = true;
    gastoAEliminar = null;
  });
  btnConfirmarEliminar.addEventListener("click", () => {
    if (gastoAEliminar) {
      const gastos = getGastos();
      const g = gastos.find(x => x.id === gastoAEliminar);
      if (g) g.estado_activo = false;
      eliminarMovimientoSQLite(gastoAEliminar);
      setGastos(gastos);
      renderGastos();
      crearGraficoBalance();
      crearGraficoCategorias();

    }
    modalEliminar.hidden = true;
    gastoAEliminar = null;
  });

  // 8. Confirmar edición
  btnCancelarEditar.addEventListener("click", () => {
    modalEditar.hidden = true;
    gastoEditando = null;
  });
  formEditar.addEventListener("submit", e => {
    e.preventDefault();
    const gastos = getGastos();
    const g = gastos.find(x => x.id === gastoEditando);
    if (g) {
      g.monto = parseFloat(document.getElementById("editMonto").value);
      g.fecha = document.getElementById("editFecha").value;
      g.categoria = document.getElementById("editCategoria").value;
      g.descripcion = document.getElementById("editDescripcion").value.trim();
      setGastos(gastos);
      renderGastos();
    }
    modalEditar.hidden = true;
    gastoEditando = null;
  });

  // 9. Navegación interna (tabs)
  const navButtons = document.querySelectorAll(".nav-dashboard button");
  const sections = document.querySelectorAll("main .card section");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      sections.forEach(sec => sec.classList.add("panel--off"));
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.remove("panel--off");
    });
  });

  // Inicializar
  renderGastos();

  crearGraficoBalance();
  crearGraficoCategorias();
});


// Botón de logout en dashboard
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("usuarioActual");
    window.location.href = "index.html";
  });
}
 
let graficoBalance = null;
let graficoCategorias = null;

function crearGraficoBalance() {

 const gastos =
(JSON.parse(localStorage.getItem("gastos_sgg")) || [])
.filter(g => g.estado_activo);
  let ingresos = 0;
  let egresos = 0;

  gastos.forEach(g => {

    if (g.tipo_movimiento === "ingreso") {
      ingresos += Number(g.monto);
    } else {
      egresos += Number(g.monto);
    }

  });

  const ctx =
document.getElementById("graficoBalance");

if (graficoBalance) {
    graficoBalance.destroy();
}

graficoBalance = new Chart(ctx, {
      type: "bar",
      data: {
          labels: ["Ingresos", "Egresos"],
          datasets: [{
              label: "Total",
              data: [ingresos, egresos]
          }]
      }
  });
}

function crearGraficoCategorias() {

  const gastos =
(JSON.parse(localStorage.getItem("gastos_sgg")) || [])
.filter(
        g =>
        g.estado_activo &&
        g.tipo_movimiento === "egreso"
      );

  const categorias = {};
  
  gastos.forEach(g => {

    if (!categorias[g.categoria]) {
      categorias[g.categoria] = 0;
    }

    categorias[g.categoria] +=
      Number(g.monto);

  });

  const ctx =
document.getElementById("graficoCategorias");

if (graficoCategorias) {
    graficoCategorias.destroy();
}

graficoCategorias = new Chart(ctx, {

      type: "doughnut",

      data: {

          labels:
            Object.keys(categorias),

          datasets: [{

              data:
                Object.values(categorias)

          }]
      }
  });
}
