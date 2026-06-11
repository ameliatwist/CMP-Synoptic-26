//Handles the user creation form submission and validation
document.addEventListener("DOMContentLoaded", () => {
  const createForm = document.getElementById("create-form");
  const messageBox = document.getElementById("messageBox");

  function showMessage(message, type = "error") {
    messageBox.textContent = message;
    messageBox.className = `message-box show ${type}`;
  }

  function clearMessage() {
    messageBox.textContent = "";
    messageBox.className = "message-box";
  }

  createForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const fullname = document.getElementById("fullname").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!fullname || fullname.length < 3) {
      showMessage("Please enter your full name.");
      return;
    }

    if (!username || username.length < 3) {
      showMessage("Username must be at least 3 characters.");
      return;
    }

    if (!email || !email.includes("@")) {
      showMessage("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 8) {
      showMessage("Password must be at least 8 characters.");
      return;
    }

    // Send the data to the server
    try {
      const response = await fetch("/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname,
          username,
          email,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || `Error ${response.status}`);
        return;
      }

      window.location.href = "/index";

    } catch (e) {
      showMessage("Could not complete the request. Please try again.");
    }
  });
});