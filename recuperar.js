document.addEventListener("DOMContentLoaded", () => {
    const recNewPass = document.getElementById("recNewPass");
    const recRepeatPass = document.getElementById("recRepeatPass");
    const btnRecover = document.getElementById("btnRecover");
    const form = document.getElementById("formRecover");
   const globalMsg = document.getElementById("globalMsg");

    function showAlert(msg, type) {
        globalMsg.textContent = msg;
        globalMsg.style.display = "block";
        globalMsg.className = "modal__msg " + type;
    }

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

    document.querySelectorAll(".field__eye").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = document.getElementById(btn.dataset.target);
            if (input) input.type = input.type === "password" ? "text" : "password";
        });
    });

    function validateUX() {
        const val = recNewPass.value;
        const reqs = [
            { id: "req1", test: val.length >= 8 },
            { id: "req2", test: /[A-Z]/.test(val) },
            { id: "req3", test: /[a-z]/.test(val) },
            { id: "req4", test: /[0-9]/.test(val) },
            { id: "req5", test: /[^A-Za-z0-9]/.test(val) }
        ];

        let allValid = true;
        reqs.forEach(r => {
            const el = document.getElementById(r.id);
            if (el) {
                if (r.test) {
                    el.className = "ok";
                    el.querySelector('svg').innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
                } else {
                    el.className = "err";
                    el.querySelector('svg').innerHTML = '<circle cx="12" cy="12" r="9"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
                    allValid = false;
                }
            }
        });

        const match = (val === recRepeatPass.value && val !== "");
        btnRecover.disabled = !(allValid && match);
    }

    recNewPass.addEventListener("input", validateUX);
    recRepeatPass.addEventListener("input", validateUX);

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("recEmail").value.trim();
            const newPass = recNewPass.value;
            const repeatPass = recRepeatPass.value;

            const users = JSON.parse(localStorage.getItem('usuarios_sgg')) || [];
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
              showAlert("El correo electrónico no se encuentra registrado.", "error");
                return;
            }

          if (newPass !== repeatPass) {
                showAlert("Las contraseñas no coinciden.", "error");
                return;
            }

            if (user.password === newPass) {
                showAlert("Seguridad: La nueva contraseña no puede ser igual a tu contraseña actual.", "error");
                return;
            }

            // Validación de requisitos de seguridad
            const requisitos = [
                newPass.length >= 8,
                /[A-Z]/.test(newPass),
                /[a-z]/.test(newPass),
                /[0-9]/.test(newPass),
                /[^A-Za-z0-9]/.test(newPass)
            ];
            if (!requisitos.every(r => r)) {
                showAlert("La contraseña no cumple con los requisitos de seguridad.", "error");
                return;
            }

            // Actualización exitosa
            user.password = newPass;
            localStorage.setItem('usuarios_sgg', JSON.stringify(users));
            
            showAlert("Contraseña modificada correctamente.", "success");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        });
    }
});