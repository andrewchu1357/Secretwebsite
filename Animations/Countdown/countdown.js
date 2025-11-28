const targetDate = new Date("December 25, 2025 00:00:00").getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const distance = targetDate - now;

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("countdown").innerHTML =
    `${days}d ${hours}h ${minutes}m ${seconds}s`;

  if (distance < 0) {
    document.getElementById("countdown").innerHTML = "🎄 Merry Christmas!";
    clearInterval(timer);
  }
}

const timer = setInterval(updateCountdown, 1000);


// filepath suggestion: c:\Users\andre\Documents\GitHub\Secretwebsite\Animations\Countdown\snow.js
(function makeSnow({count=80, maxSize=22, minSize=6}={}) {
  const container = document.body;
  for (let i=0;i<count;i++){
    const f = document.createElement('div');
    f.className = 'flake';
    f.textContent = '❅'; // or '•' or use SVG
    const size = Math.random() * (maxSize-minSize) + minSize;
    f.style.fontSize = size + 'px';
    f.style.left = Math.random()*100 + 'vw';
    f.style.opacity = (0.3 + Math.random()*0.9).toFixed(2);
    const duration = 6 + Math.random()*10;
    const delay = Math.random()*5;
    const sway = (Math.random()*80 - 40) + 'px';
    container.appendChild(f);
    requestAnimationFrame(() => {
      f.animate([
        { transform: `translateY(-20vh) translateX(0)` },
        { transform: `translateY(120vh) translateX(${sway})` }
      ], {
        duration: duration * 1000,
        iterations: Infinity,
        delay: delay * 1000,
        easing: 'linear'
      });
    });
  }
})();