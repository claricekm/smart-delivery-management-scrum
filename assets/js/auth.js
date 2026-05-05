(function () {
  const USERS_KEY = "smartDeliveryUsers";
  const SESSION_KEY = "smartDeliverySession";
  const LOGIN_PAGE = "/prototypes/login.html";
  const DASHBOARD_PAGE = "/prototypes/sprint1/dashboard/dashboard.html";

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getUsers() {
    return readJson(USERS_KEY, []);
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    return readJson(SESSION_KEY, null);
  }

  function setSession(user) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        loggedAt: new Date().toISOString()
      })
    );
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function getBasePath() {
    const href = window.location.href.replace(/\\/g, "/");
    const index = href.toLowerCase().indexOf("/prototypes/");
    return index >= 0 ? href.slice(0, index) : window.location.origin;
  }

  function toAppUrl(path) {
    return `${getBasePath()}${path}`;
  }

  function isAuthPage() {
    return document.body.classList.contains("auth-page");
  }

  function redirectToLogin() {
    const current = window.location.href;
    const loginUrl = `${toAppUrl(LOGIN_PAGE)}?redirect=${encodeURIComponent(current)}`;
    window.location.replace(loginUrl);
  }

  function redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    window.location.href = redirect || toAppUrl(DASHBOARD_PAGE);
  }

  function showMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `auth-message ${type || ""}`.trim();
  }

  function getInitials(name) {
    return String(name || "Utilizador")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  function setupLoginForm() {
    const form = document.querySelector("[data-auth-login-form]");
    if (!form) return;

    const message = document.querySelector("[data-auth-message]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const email = normalizeEmail(form.email.value);
      const password = form.password.value;
      const user = getUsers().find((item) => item.email === email && item.password === password);

      if (!user) {
        showMessage(message, "Email ou palavra-passe inválidos.", "error");
        return;
      }

      setSession(user);
      redirectAfterLogin();
    });
  }

  function setupSignupForm() {
    const form = document.querySelector("[data-auth-signup-form]");
    if (!form) return;

    const message = document.querySelector("[data-auth-message]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = form.name.value.trim();
      const email = normalizeEmail(form.email.value);
      const password = form.password.value;
      const confirmPassword = form.confirmPassword.value;
      const users = getUsers();

      if (name.length < 2) {
        showMessage(message, "Indique um nome válido.", "error");
        return;
      }

      if (!email.includes("@")) {
        showMessage(message, "Indique um email válido.", "error");
        return;
      }

      if (password.length < 6) {
        showMessage(message, "A palavra-passe deve ter pelo menos 6 caracteres.", "error");
        return;
      }

      if (password !== confirmPassword) {
        showMessage(message, "As palavras-passe não coincidem.", "error");
        return;
      }

      if (users.some((user) => user.email === email)) {
        showMessage(message, "Já existe uma conta com esse email.", "error");
        return;
      }

      const user = {
        id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        name,
        email,
        password
      };

      users.push(user);
      saveUsers(users);
      setSession(user);
      redirectAfterLogin();
    });
  }

  function setupLogout() {
    document.querySelectorAll("[data-auth-logout]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        clearSession();
        window.location.href = toAppUrl(LOGIN_PAGE);
      });
    });
  }

  function updateCurrentUser() {
    const session = getSession();
    if (!session) return;

    document.querySelectorAll(".user-avatar").forEach((element) => {
      element.textContent = getInitials(session.name);
      element.title = session.name;
    });

    document.querySelectorAll("[data-auth-user-name]").forEach((element) => {
      element.textContent = session.name;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const session = getSession();

    if (!isAuthPage() && !session) {
      redirectToLogin();
      return;
    }

    if (isAuthPage() && session) {
      redirectAfterLogin();
      return;
    }

    setupLoginForm();
    setupSignupForm();
    setupLogout();
    updateCurrentUser();
  });
})();
