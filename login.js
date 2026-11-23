document.addEventListener("DOMContentLoaded", () => {
   
    // --- Persistencia de tema ---
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("sgg_theme") || "light";
    htmlElement.setAttribute("data-theme", savedTheme);
    document.body.classList.add(savedTheme === "dark" ? "dark-mode" : "light-mode");

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const current = htmlElement.getAttribute("data-theme");
            const next = current === "dark" ? "light" : "dark";
            htmlElement.setAttribute("data-theme", next);
            document.body.classList.toggle("dark-mode", next === "dark");
            document.body.classList.toggle("light-mode", next === "light");
            localStorage.setItem("sgg_theme", next);
        });
    }

    // Ver/Ocultar contraseña
    document.querySelectorAll(".field__eye").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = document.getElementById(btn.dataset.target);
            if (input) {
                input.type = input.type === "password" ? "text" : "password";
            }
        });
    });

    // Lógica de Login
    const formLogin = document.getElementById("formLogin");
    const btnLogin = document.getElementById("btnLogin");
    const globalMsg = document.getElementById("globalMsg");

    let intentosFallidos = 0;

    function showAlert(msg, type) {
        globalMsg.textContent = msg;
        globalMsg.style.display = "block";
        globalMsg.className = "modal__msg " + type;
    }

   if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPass").value;

    btnLogin.disabled = true;
    btnLogin.textContent = "Sincronizando...";

    if (typeof descargarBaseDesdeNube === "function") {
      await descargarBaseDesdeNube(email);
    }
    await initDatabase();

    const user = obtenerUsuarioPorEmail(email);

    if (!user || user.password !== password) {
      btnLogin.disabled = false;
      btnLogin.textContent = "Iniciar sesión";
      intentosFallidos++;
      if (intentosFallidos >= 3) {
        showAlert("Demasiados intentos. Sistema bloqueado por 30 segundos.", "error");
        btnLogin.disabled = true;
        setTimeout(() => {
          intentosFallidos = 0;
          btnLogin.disabled = false;
          btnLogin.textContent = "Iniciar sesión";
          globalMsg.style.display = "none";
        }, 30000);
      } else {
        showAlert(`Credenciales incorrectas. Intento ${intentosFallidos}/3`, "error");
      }
      return;
    }

    // Éxito en login
    intentosFallidos = 0;
    globalMsg.style.display = "none";
    localStorage.setItem("usuarioActual", JSON.stringify({
      email: user.email,
      name: user.name
    }));

    window.location.href = "dashboard.html";
  });
}
});