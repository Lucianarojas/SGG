document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar base de datos con usuarios por defecto si no existen
    if (!localStorage.getItem('usuarios_sgg')) {
        const defaultUsers = [
            { email: "usuario1@gmail.com", password: "Usuario.1", name: "Usuario 1" },
            { email: "usuario2@gmail.com", password: "Usuario.2", name: "Usuario 2" }
        ];
        localStorage.setItem('usuarios_sgg', JSON.stringify(defaultUsers));
    }

    // 2. Configuración de Persistencia de Tema (RF-02)
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("sgg_theme") || "light";
    htmlElement.setAttribute("data-theme", savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const current = htmlElement.getAttribute("data-theme");
            const next = current === "dark" ? "light" : "dark";
            htmlElement.setAttribute("data-theme", next);
            localStorage.setItem("sgg_theme", next);
        });
    }

    // 3. Ver/Ocultar contraseña
    document.querySelectorAll(".field__eye").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = document.getElementById(btn.dataset.target);
            if (input) {
                input.type = input.type === "password" ? "text" : "password";
            }
        });
    });

    // 4. Lógica de Login y Bloqueo Defensivo
    const formLogin = document.getElementById("formLogin");
    const panelLogin = document.getElementById("panelLogin");
    const welcomeBox = document.getElementById("welcomeBox");
    const welcomeTitle = document.getElementById("welcomeTitle");
    const btnLogin = document.getElementById("btnLogin");
    const globalMsg = document.getElementById("globalMsg");

    let intentosFallidos = 0;

    function showAlert(msg, type) {
        globalMsg.textContent = msg;
        globalMsg.style.display = "block";
        if (type === "error") {
            globalMsg.className = "modal__msg error";
        }
    }

    if (formLogin) {
        formLogin.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim().toLowerCase();
            const password = document.getElementById("loginPass").value;

            const users = JSON.parse(localStorage.getItem('usuarios_sgg')) || [];
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!user || user.password !== password) {
                intentosFallidos++;
                if (intentosFallidos >= 3) {
                    showAlert("Demasiados intentos. Sistema bloqueado por 30 segundos.", "error");
                    btnLogin.disabled = true;
                    setTimeout(() => {
                        intentosFallidos = 0;
                        btnLogin.disabled = false;
                        globalMsg.style.display = "none";
                    }, 30000);
                } else {
                    showAlert(`Credenciales incorrectas. Intento ${intentosFallidos}/3`, "error");
                }
                return;
            }

            // Éxito
            intentosFallidos = 0;
            globalMsg.style.display = "none";
            panelLogin.classList.add("panel--off");
            welcomeTitle.textContent = `¡Bienvenido/a ${user.name}!`;
            welcomeBox.classList.remove("panel--off");
        });
    }

    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            welcomeBox.classList.add("panel--off");
            panelLogin.classList.remove("panel--off");
            formLogin.reset();
        });
    }
});