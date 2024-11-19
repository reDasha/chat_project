document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }

    createBubbles();
});


function createBubbles() {
    const bubbles = document.getElementById('bubbles');
    for (let i = 0; i < 10; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'floating-bubble';
        bubble.style.width = Math.random() * 100 + 50 + 'px';
        bubble.style.height = bubble.style.width;
        bubble.style.left = Math.random() * 100 + 'vw';
        bubble.style.top = Math.random() * 100 + 'vh';
        bubble.style.animationDelay = Math.random() * 2 + 's';
        bubbles.appendChild(bubble);
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');
    document.querySelector(`.tab[onclick="switchTab('${tab}')"]`).classList.add('active');
}


async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = new URLSearchParams(formData);

    try {
        const response = await fetch("/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            credentials: "include",
            body: data,
        });

        if (response.ok) {
            const result = await response.json();
            localStorage.setItem("token", result.access_token);
            localStorage.setItem("user_id", result.user_id);
            window.location.href = "/chat";
        } else {
            alert('Ошибка входа. Проверьте имя и пароль.');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при входе.');
    }
}

let isRegistering = false;

async function handleRegister(event) {
    event.preventDefault();
    if (isRegistering) return;
    isRegistering = true;

    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const username = form.querySelector('input[type="text"]').value;
    const passwords = form.querySelectorAll('input[type="password"]');

    if (passwords[0].value !== passwords[1].value) {
        alert('Пароли не совпадают');
        isRegistering = false;
        return;
    }

    try {
        const response = await fetch("/register", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                username,
                password: passwords[0].value,
            }),
        });

        const result = await response.json();

        if (response.ok && result.message) {
            alert('Регистрация успешна! Теперь вы можете войти.');
            switchTab("login");
        } else {
            alert(result.detail || 'Ошибка регистрации. Попробуйте другой email.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при регистрации.');
    }

    isRegistering = false;
}