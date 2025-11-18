// This file contains the main JavaScript logic for the user login functionality and any other user-related scripts.

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Redirect to dashboard
          window.location.href = "/dashboard.html";
        })
        .catch((error) => {
          alert("Login failed: " + error.message);
        });
    });
  }
});