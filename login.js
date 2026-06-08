document.addEventListener('DOMContentLoaded', () => {

    // 1. CUENTAS REGISTRADAS POR DEFECTO
    const INITIAL_USERS = [
    {
        email: "usuario1@gmail.com",
        password: "Usuario.1",
        name: "Usuario 1"
    },
    {
        email: "usuario2@gmail.com",
        password: "Usuario.2",
        name: "Usuario 2"
    }
];

    // Sincronización limpia con LocalStorage
    if (!localStorage.getItem('sgg_users')) {
        localStorage.setItem('sgg_users', JSON.stringify(INITIAL_USERS));
    }

    // Nodos Principales de Interfaz
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const globalMsg = document.getElementById('globalMsg');

    // Paneles (Vistas)
    const panelLogin = document.getElementById('panelLogin');
    
    // Formularios
    const formLogin = document.getElementById('formLogin');


    // Modal
    const modalForgot = document.getElementById('modalForgot');
    const forgotEmail = document.getElementById('forgotEmail');
    const forgotMsg = document.getElementById('forgotMsg');

    // ==========================================================================
    // CONTROL DE PREFERENCIA DE TEMA 
    // ==========================================================================
    const initTheme = () => {
        const savedTheme = localStorage.getItem('sgg_theme') || 'light';
        htmlElement.setAttribute('data-theme', savedTheme);
        themeToggle.setAttribute('aria-checked', savedTheme === 'dark');
    };
    initTheme();

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        themeToggle.setAttribute('aria-checked', newTheme === 'dark');
        localStorage.setItem('sgg_theme', newTheme);
    });

    // ==========================================================================
    // CONTROL DE INTERFAZ (Cambios de paneles y alertas)
    // ==========================================================================
    const showGlobalAlert = (text, type) => {
        globalMsg.textContent = text;
        globalMsg.className = `msg-zone ${type}`;
    };

    const clearGlobalAlert = () => {
        globalMsg.textContent = '';
        globalMsg.className = 'msg-zone';
    };


    // Ocultar / Mostrar Contraseñas
    document.querySelectorAll('.field__eye').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const inputTarget = document.getElementById(targetId);
            const icoEye = btn.querySelector('.ico-eye');
            const icoEyeOff = btn.querySelector('.ico-eye-off');

            if (inputTarget.type === 'password') {
                inputTarget.type = 'text';
                icoEye.style.display = 'none';
                icoEyeOff.style.display = 'block';
                btn.setAttribute('aria-label', 'Ocultar contraseña');
            } else {
                inputTarget.type = 'password';
                icoEye.style.display = 'block';
                icoEyeOff.style.display = 'none';
                btn.setAttribute('aria-label', 'Mostrar contraseña');
            }
        });
    });

    // ==========================================================================
    // PROCESAMIENTO Y VALIDACIONES DEL LOGIN
    // ==========================================================================
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        clearGlobalAlert();
        resetFormErrors();

        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPass').value;

        let hasError = false;
        if (!email) { setFieldError('loginEmail', 'El correo es obligatorio.'); hasError = true; }
        if (!pass) { setFieldError('loginPass', 'La contraseña es obligatoria.'); hasError = true; }

        if (hasError) {
            showGlobalAlert('Por favor, completa los campos obligatorios indicados.', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('sgg_users'));
        const userFound = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!userFound || userFound.password !== pass) {
            showGlobalAlert('El correo electrónico o la contraseña son incorrectos.', 'error');
            return;
        }

        showGlobalAlert('', 'success');

const welcomeBox = document.getElementById('welcomeBox');
const welcomeTitle = document.getElementById('welcomeTitle');

welcomeTitle.textContent = `¡Bienvenido ${userFound.name}!`;

welcomeBox.hidden = false;

formLogin.style.display = 'none';
    });

    // ==========================================================================
    // MEDIDOR DE FORTALEZA Y REGISTRO DE USUARIOS
    // ==========================================================================
    const regPassInput = document.getElementById('regPass');
    regPassInput.addEventListener('input', () => updateStrengthBar(regPassInput.value));

    const updateStrengthBar = (password) => {
        const bar = document.getElementById('strengthBar');
        const label = document.getElementById('strengthLabel');
        
        if (!password) {
            bar.style.width = '0%'; bar.style.backgroundColor = 'transparent';
            label.textContent = ''; return;
        }

        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

        const widthMap = ['25%', '50%', '75%', '100%'];
        const labelMap = ['Débil', 'Regular', 'Buena', 'Fuerte'];
        const colorMap = ['#b92c2c', '#aa8445', '#4299e1', '#237845'];

        bar.style.width = widthMap[score - 1] || '10%';
        bar.style.backgroundColor = colorMap[score - 1] || '#b92c2c';
        label.textContent = labelMap[score - 1] || 'Insegura';
        label.style.color = colorMap[score - 1] || '#b92c2c';
    };

    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        clearGlobalAlert();
        resetFormErrors();

        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const pass = document.getElementById('regPass').value;
        const confirm = document.getElementById('regConfirm').value;

        let hasError = false;
        if (!name) { setFieldError('regName', 'El nombre completo es obligatorio.'); hasError = true; }
        if (!email) { setFieldError('regEmail', 'El correo electrónico es obligatorio.'); hasError = true; }
        if (!pass) { setFieldError('regPass', 'La contraseña es obligatoria.'); hasError = true; }
        if (!confirm) { setFieldError('regConfirm', 'Debes confirmar tu contraseña.'); hasError = true; }

        if (hasError) {
            showGlobalAlert('Todos los campos con asterisco son obligatorios.', 'error');
            return;
        }

        if (pass !== confirm) {
            setFieldError('regConfirm', 'Las contraseñas ingresadas no coinciden.');
            showGlobalAlert('Error: Las contraseñas no coinciden.', 'error');
            return;
        }

        const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passRegex.test(pass)) {
            setFieldError('regPass', 'No cumple con las especificaciones de seguridad.');
            showGlobalAlert('La contraseña no cumple los requisitos mínimos exigidos.', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('sgg_users')) || [];
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            setFieldError('regEmail', 'Este correo electrónico ya está registrado.');
            showGlobalAlert('El correo ya existe en el sistema.', 'error');
            return;
        }

        // Almacenamiento
        users.push({ name, email, password: pass });
        localStorage.setItem('sgg_users', JSON.stringify(users));

        // CAMBIO SOLICITADO: Mensaje explícito de éxito en la interfaz
        showGlobalAlert('¡Usuario registrado con éxito! Redireccionando al panel de acceso...', 'success');
        
        setTimeout(() => {
            togglePanels(false);
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPass').focus();
        }, 2000);
    });

    // ==========================================================================
    // MODAL DIALÓGICO DE RECUPERACIÓN
    // ==========================================================================
    const toggleModal = (show) => {
        modalForgot.hidden = !show;
        forgotMsg.textContent = '';
        forgotMsg.className = 'modal__msg';
        if (show) {
            forgotEmail.value = document.getElementById('loginEmail').value;
            forgotEmail.focus();
        }
    };

    document.getElementById('btnForgot').addEventListener('click', () => toggleModal(true));
    document.getElementById('modalClose').addEventListener('click', () => toggleModal(false));
    document.getElementById('modalBackdrop').addEventListener('click', () => toggleModal(false));

    document.getElementById('btnSendRecovery').addEventListener('click', () => {
        const email = forgotEmail.value.trim();
        if (!email) {
            forgotMsg.textContent = 'Ingresa un correo válido.';
            forgotMsg.className = 'modal__msg error';
            return;
        }
        forgotMsg.textContent = `Instrucciones enviadas con éxito al correo: ${email}`;
        forgotMsg.className = 'modal__msg success';
    });

    // Helpers Útiles de Renderizado de Errores
    function setFieldError(inputId, message) {
        const inputElement = document.getElementById(inputId);
        inputElement.style.borderColor = 'var(--error)';
        const errSpanId = inputElement.getAttribute('aria-describedby').split(' ')[0];
        document.getElementById(errSpanId).textContent = message;
    }

    function resetFormErrors() {
        document.querySelectorAll('.field__input').forEach(i => i.style.borderColor = '');
        document.querySelectorAll('.field__err').forEach(e => e.textContent = '');
    }
const btnLogout = document.getElementById('btnLogout');

if(btnLogout){
    btnLogout.addEventListener('click', () => {

        document.getElementById('welcomeBox').hidden = true;

        formLogin.style.display = 'block';

        formLogin.reset();

        clearGlobalAlert();

    });
}
});