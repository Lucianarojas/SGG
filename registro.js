document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formRegister");
    const regPass = document.getElementById("regPass");
    const regPassRepeat = document.getElementById("regPassRepeat");
    const btnRegister = document.getElementById("btnRegister");
    const regDate = document.getElementById("regDate");
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

function validatePassword() {
    const val = regPass.value;
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
                el.querySelector('svg').innerHTML =
                    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>' +
                    '<polyline points="22 4 12 14.01 9 11.01"></polyline>';
            } else {
                el.className = "err";
                el.querySelector('svg').innerHTML =
                    '<circle cx="12" cy="12" r="9"></circle>' +
                    '<line x1="12" y1="8" x2="12" y2="12"></line>' +
                    '<line x1="12" y1="16" x2="12.01" y2="16"></line>';
                allValid = false;
            }
        }
    });

    // Confirmación de contraseña
    const match = (val === regPassRepeat.value && val !== "");
    btnRegister.disabled = !(allValid && match);
}

    regPass.addEventListener("input", validatePassword);
    regPassRepeat.addEventListener("input", validatePassword);

    form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("regName").value.trim();
  const lastName = document.getElementById("regLastName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const birthDateVal = regDate.value;

  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!nameRegex.test(name) || !nameRegex.test(lastName)) {
    showAlert("El Nombre y Apellido no deben contener números ni caracteres especiales.", "error");
    return;
  }

  const birthDate = new Date(birthDateVal);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 14) {
    showAlert("Registro rechazado: Debes ser mayor de 14 años.", "error");
    return;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    showAlert("Por favor, introduce un correo electrónico válido corporativo sin espacios.", "error");
    return;
  }

  await initDatabase();
  const resultado = await registrarUsuarioSQLite({
    email,
    password: regPass.value,
    name: `${name} ${lastName}`
  });

  if (!resultado.ok) {
    showAlert(resultado.error, "error");
    return;
  }

  alert("¡Registro Exitoso! Redirigiendo al inicio...");
  window.location.href = "index.html";
});
});