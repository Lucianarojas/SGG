document.addEventListener("DOMContentLoaded", () => {

    const USERS = [
        { email: "usuario1@gmail.com", password: "Usuario.1", name: "Usuario 1" },
        { email: "usuario2@gmail.com", password: "Usuario.2", name: "Usuario 2" }
    ];

    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    const formLogin = document.getElementById("formLogin");
    const globalMsg = document.getElementById("globalMsg");
    const welcomeBox = document.getElementById("welcomeBox");
    const welcomeTitle = document.getElementById("welcomeTitle");

    const panelLogin = document.getElementById("panelLogin");
    const panelRegister = document.getElementById("panelRegister");
    const formRegister = document.getElementById("formRegister");
    const linkToRegister = document.getElementById("linkToRegister");
    const linkToLogin = document.getElementById("linkToLogin");

    // Elementos de contraseña y la nube de éxito
    const regPass = document.getElementById("regPass");
    const strengthFill = document.getElementById("strengthFill");
    const strengthLabel = document.getElementById("strengthLabel");
    const successCloud = document.getElementById("successCloud");
    const btnReturnToHome = document.getElementById("btnReturnToHome");

    function showAlert(text, type){
        globalMsg.textContent = text;
        globalMsg.className = `msg-zone ${type}`;
    }

    function clearAlert(){
        globalMsg.textContent = "";
        globalMsg.className = "msg-zone";
    }

    function clearIndividualErrors() {
        document.querySelectorAll("#formRegister .field__err").forEach(span => span.textContent = "");
    }

    // --- MANEJO DE TEMA ---
    const savedTheme = localStorage.getItem("sgg_theme") || "light";
    htmlElement.setAttribute("data-theme", savedTheme);

    themeToggle.addEventListener("click", () => {
        const current = htmlElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        htmlElement.setAttribute("data-theme", next);
        localStorage.setItem("sgg_theme", next);
    });

    // --- VER/OCULTAR CONTRASEÑA ---
    document.querySelectorAll(".field__eye").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = document.getElementById(btn.dataset.target);
            input.type = input.type === "password" ? "text" : "password";
        });
    });

    // --- CAMBIO DE PANTALLAS ---
    if(linkToRegister) {
        linkToRegister.addEventListener("click", (e) => {
            e.preventDefault();
            clearAlert();
            clearIndividualErrors();
            panelLogin.style.display = "none";
            panelRegister.hidden = false;
        });
    }

    if(linkToLogin) {
        linkToLogin.addEventListener("click", (e) => {
            e.preventDefault();
            clearAlert();
            panelRegister.hidden = true;
            panelLogin.style.display = "block";
        });
    }

    // --- FORTALEZA DE CONTRASEÑA EN VIVO ---
    if(regPass) {
        regPass.addEventListener("input", () => {
            const val = regPass.value;
            let score = 0;

            if (val.length >= 8) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^a-zA-Z0-9]/.test(val)) score++;

            if (val.length === 0) {
                strengthFill.style.width = "0%";
                strengthLabel.textContent = "Insegura";
                strengthFill.style.backgroundColor = "transparent";
            } else if (score <= 2) {
                strengthFill.style.width = "35%";
                strengthLabel.textContent = "Débil";
                strengthFill.style.backgroundColor = "var(--error)";
            } else if (score === 3) {
                strengthFill.style.width = "70%";
                strengthLabel.textContent = "Media";
                strengthFill.style.backgroundColor = "#e1b12c";
            } else if (score === 4) {
                strengthFill.style.width = "100%";
                strengthLabel.textContent = "Segura";
                strengthFill.style.backgroundColor = "var(--success)";
            }
        });
    }

    // --- FORMULARIO LOGIN ---
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        clearAlert();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPass").value;

        const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

        if(!user || user.password !== password){
            showAlert("Correo o contraseña incorrectos.", "error");
            return;
        }

        panelLogin.style.display = "none";
        welcomeTitle.textContent = `¡Bienvenido/a ${user.name}!`;
        welcomeBox.hidden = false;
    });

    // --- FORMULARIO REGISTRO CON MENSAJES ABAJO ---
    if(formRegister) {
        formRegister.addEventListener("submit", (e) => {
            e.preventDefault();
            clearIndividualErrors();
            clearAlert();

            let hasErrors = false;

            // Selección de campos individuales
            const nameEl = document.getElementById("regName");
            const lastNameEl = document.getElementById("regLastName");
            const dniEl = document.getElementById("regDni");
            const emailEl = document.getElementById("regEmail");
            const passEl = document.getElementById("regPass");

            // Validar que no estén vacíos (Obligatoriedad estricta abajo en rojo)
            if(!nameEl.value.trim()) {
                document.getElementById("errRegName").textContent = "El campo Nombre es obligatorio.";
                hasErrors = true;
            }
            if(!lastNameEl.value.trim()) {
                document.getElementById("errRegLastName").textContent = "El campo Apellido es obligatorio.";
                hasErrors = true;
            }
            if(!dniEl.value.trim()) {
                document.getElementById("errRegDni").textContent = "El campo DNI es obligatorio.";
                hasErrors = true;
            }
            if(!emailEl.value.trim()) {
                document.getElementById("errRegEmail").textContent = "El campo Correo es obligatorio.";
                hasErrors = true;
            }

            // Validación interna de la contraseña
            const password = passEl.value;
            const hasUpper = /[A-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSymbol = /[^a-zA-Z0-9]/.test(password);
            const hasLength = password.length >= 8;

            if(!password) {
                document.getElementById("errRegPass").textContent = "La contraseña es obligatoria.";
                hasErrors = true;
            } else if(!hasUpper || !hasNumber || !hasSymbol || !hasLength) {
                document.getElementById("errRegPass").textContent = "Debe cumplir todos los requisitos (Mayúscula, Número, Símbolo, 8+ caracteres).";
                hasErrors = true;
            }

            // Detener el registro si hay algún error
            if(hasErrors) return;

            // Validar si el email ya existe
            const exist = USERS.some(u => u.email.toLowerCase() === emailEl.value.trim().toLowerCase());
            if(exist) {
                document.getElementById("errRegEmail").textContent = "Este correo ya está registrado.";
                return;
            }

            // Registrar usuario en memoria
            USERS.push({
                email: emailEl.value.trim(),
                password: password,
                name: `${nameEl.value.trim()} ${lastNameEl.value.trim()}`
            });

            // Resetear inputs del formulario y barra de fortaleza
            formRegister.reset();
            strengthFill.style.width = "0%";
            strengthLabel.textContent = "Insegura";

            // MOSTRAR LA NUBE FLOTANTE DE ÉXITO
            successCloud.hidden = false;
        });
    }

    // Opcion de Volver al Inicio desde la nube flotante de éxito
    if(btnReturnToHome) {
        btnReturnToHome.addEventListener("click", () => {
            successCloud.hidden = true; // Ocultar la nube
            panelRegister.hidden = true; // Ocultar panel registro
            panelLogin.style.display = "block"; // Volver al inicio de sesión
        });
    }
});