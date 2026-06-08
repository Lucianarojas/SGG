document.addEventListener("DOMContentLoaded", () => {

    const USERS = [
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

    const htmlElement =
        document.documentElement;

    const themeToggle =
        document.getElementById("themeToggle");

    const formLogin =
        document.getElementById("formLogin");

    const globalMsg =
        document.getElementById("globalMsg");

    const welcomeBox =
        document.getElementById("welcomeBox");

    const welcomeTitle =
        document.getElementById("welcomeTitle");

    function showAlert(text, type){

        globalMsg.textContent = text;
        globalMsg.className =
            `msg-zone ${type}`;
    }

    function clearAlert(){

        globalMsg.textContent = "";
        globalMsg.className =
            "msg-zone";
    }

    const savedTheme =
        localStorage.getItem("sgg_theme")
        || "light";

    htmlElement.setAttribute(
        "data-theme",
        savedTheme
    );

    themeToggle.addEventListener(
        "click",
        () => {

            const current =
                htmlElement.getAttribute(
                    "data-theme"
                );

            const next =
                current === "dark"
                ? "light"
                : "dark";

            htmlElement.setAttribute(
                "data-theme",
                next
            );

            localStorage.setItem(
                "sgg_theme",
                next
            );

        }
    );

    document
    .querySelectorAll(".field__eye")
    .forEach(btn => {

        btn.addEventListener(
            "click",
            () => {

                const input =
                    document.getElementById(
                        btn.dataset.target
                    );

                input.type =
                    input.type === "password"
                    ? "text"
                    : "password";
            }
        );

    });

    formLogin.addEventListener(
        "submit",
        (e) => {

            e.preventDefault();

            clearAlert();

            const email =
                document
                .getElementById(
                    "loginEmail"
                )
                .value
                .trim();

            const password =
                document
                .getElementById(
                    "loginPass"
                )
                .value;

            if(!email || !password){

                showAlert(
                    "Complete todos los campos.",
                    "error"
                );

                return;
            }

            const user =
                USERS.find(
                    u =>
                    u.email.toLowerCase()
                    ===
                    email.toLowerCase()
                );

            if(
                !user ||
                user.password !== password
            ){

                showAlert(
                    "Correo o contraseña incorrectos.",
                    "error"
                );

                return;
            }

            document
            .getElementById(
                "panelLogin"
            )
            .style.display =
            "none";

            welcomeTitle.textContent =
                `¡Bienvenido/a ${user.name}!`;

            welcomeBox.hidden = false;
        }
    );

});