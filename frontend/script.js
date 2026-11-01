
const API_URL = "http://localhost:3000/api/auth";

// HTML elements
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");
const otpSection = document.getElementById("otpSection");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const otpForm = document.getElementById("otpForm");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const otpMessage = document.getElementById("otpMessage");

// Store access token while this page is open
let accessToken = null;

// Show messages
function showMessage(element, message, type = "info") {
    element.textContent = message;
    element.style.color =
        type === "success" ? "green" :
        type === "error" ? "red" : "#344054";
}

// Switch between Login and Register
function showLogin() {
    loginSection.classList.remove("hidden");
    registerSection.classList.add("hidden");

    loginTab.classList.add("active");
    registerTab.classList.remove("active");
}

function showRegister() {
    registerSection.classList.remove("hidden");
    loginSection.classList.add("hidden");

    registerTab.classList.add("active");
    loginTab.classList.remove("active");
}

loginTab.addEventListener("click", showLogin);
registerTab.addEventListener("click", showRegister);

document.getElementById("showLogin").addEventListener("click", showLogin);
document.getElementById("showRegister").addEventListener("click", showRegister);


// 1. REGISTER
registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.Message || "Registration failed");
        }

        showMessage(
            registerMessage,
            data.message || "Account created! Check your email for the OTP.",
            "success"
        );

        // Show OTP form after successful registration
        document.getElementById("otpEmail").value = email;
        otpSection.classList.remove("hidden");

    } catch (error) {
        showMessage(registerMessage, error.message, "error");
    }
});


// 2. VERIFY EMAIL OTP
otpForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("otpEmail").value.trim();
    const otp = document.getElementById("otp").value.trim();

    try {
        const response = await fetch(`${API_URL}/verify-email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                otp
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "OTP verification failed");
        }

        showMessage(
            otpMessage,
            data.message || "Email verified successfully! You can now log in.",
            "success"
        );

        otpForm.reset();

        // Move to login after successful verification
        setTimeout(() => {
            showLogin();
            document.getElementById("loginEmail").value = email;
        }, 1000);

    } catch (error) {
        showMessage(otpMessage, error.message, "error");
    }
});


// 3. LOGIN
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.Message || "Login failed");
        }

        accessToken = data.accessToken;

        showMessage(
            loginMessage,
            data.message || "Login successful!",
            "success"
        );

        loginForm.reset();

        // Load profile after login
        await getMe();

    } catch (error) {
        showMessage(loginMessage, error.message, "error");
    }
});


// 4. GET CURRENT USER PROFILE
async function getMe() {
    if (!accessToken) {
        showMessage(loginMessage, "Please log in first.", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/get-me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            },
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not fetch profile");
        }

        const user = data.user;

        // Create profile elements safely
        const profileArea = document.getElementById("profileArea");
        if (!profileArea) {
    console.error("profileArea element not found in index.html");
    return;
}

profileArea.replaceChildren();

        const profile = document.createElement("div");
        profile.className = "profile";

        const heading = document.createElement("h3");
        heading.textContent = "Your Profile";
        profile.appendChild(heading);

        const username = document.createElement("p");
        username.textContent = `Username: ${user.username}`;
        profile.appendChild(username);

        const email = document.createElement("p");
        email.textContent = `Email: ${user.email}`;
        profile.appendChild(email);

        const logoutButton = document.createElement("button");
        logoutButton.className = "secondary-btn";
        logoutButton.type = "button";
        logoutButton.textContent = "Logout";

        logoutButton.addEventListener("click", logout);

        profile.appendChild(logoutButton);
        profileArea.appendChild(profile);

    } catch (error) {
        showMessage(loginMessage, error.message, "error");
    }
}


// 5. LOGOUT
async function logout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: "POST",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Logout failed");
        }

        accessToken = null;
        document.getElementById("profileArea").replaceChildren();

        showMessage(
            loginMessage,
            data.message || "Logged out successfully.",
            "success"
        );

    } catch (error) {
        showMessage(loginMessage, error.message, "error");
    }
}
