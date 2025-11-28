// Set the target date/time
const targetDate = new Date("December 24, 2025 23:59:59").getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const distance = targetDate - now;

  // Time calculations
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Display result
  document.getElementById("countdown").innerHTML =
    `${days}d ${hours}h ${minutes}m ${seconds}s`;

  // If countdown finished
  if (distance < 0) {
    document.getElementById("countdown").innerHTML = "🎉 Time's up!";
    clearInterval(timer);
  }
}

// Update every second
const timer = setInterval(updateCountdown, 1000);
