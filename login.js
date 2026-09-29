document.addEventListener("DOMContentLoaded", () => {
    // Inicializar usuarios por defecto
    if (!localStorage.getItem('usuarios_sgg')) {
        const defaultUsers = [
            { email: "usuario1@gmail.com", password: "Usuario.1", name: "Usuario 1" },
            { email: "usuario2@gmail.com", password: "Usuario.2", name: "Usuario 2" }
        ];
        localStorage.setItem('usuarios_sgg', JSON.stringify(defaultUsers));
    }

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
        formLogin.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim().toLowerCase();
            const password = document.getElementById("loginPass").value;

            const users = JSON.parse(localStorage.getItem('usuarios_sgg')) || [];
            const user = users.find(u => u.email.toLowerCase() === email);

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

            // Éxito en login
            intentosFallidos = 0;
            globalMsg.style.display = "none";

            // Guardar sesión del usuario actual
            localStorage.setItem("usuarioActual", JSON.stringify(user));

            // Redirigir al dashboard
            window.location.href = "dashboard.html";
        });
    }
});
