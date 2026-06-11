// Handles the user login form submission and validation
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const messageBox = document.getElementById("messageBox");

  function showMessage(message, type = "error") {
    messageBox.textContent = message;
    messageBox.className = `message-box show ${type}`;
  }

  function clearMessage() {
    messageBox.textContent = "";
    messageBox.className = "message-box";
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const login = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!login || !password) {
      showMessage("Please enter your username/email and password.");
      return;
    }
// Send the data to the server
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || `Error ${response.status}`);
        return;
      }

      window.location.href = data.redirect || "/index";

    } catch (e) {
      showMessage("Could not complete the request. Please try again.");
    }
  });
});