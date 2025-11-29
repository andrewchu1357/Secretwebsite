(function createSnow(count = 80) {
  const container = document.getElementById("snow");
  if (!container) return;

  // Reduce count on small screens
  const maxCount = Math.max(20, Math.floor((window.innerWidth * count) / 1200));
  const finalCount = Math.min(count, maxCount);

  for (let i = 0; i < finalCount; i++) {
    const flake = document.createElement("div");
    flake.className = "snowflake";
    flake.textContent = "❅"; // emoji or •, ❄, etc.

    // randomize visual properties
    const size = Math.random() * 18 + 6; // 6..24px
    const left = Math.random() * 100;    // 0..100vw
    const dur = Math.random() * 15 + 8;  // 8..23s
    const delay = Math.random() * -20;   // negative so each starts at a different place
    const drift = (Math.random() * 200 - 100).toFixed(1); // horizontal drift

    flake.style.fontSize = size + "px";
    flake.style.left = left + "vw";
    flake.style.opacity = (0.4 + Math.random() * 0.7).toString();
    // set animation properties to the fall keyframes defined in CSS
    flake.style.animationDuration = dur + "s";
    flake.style.animationDelay = delay + "s";
    // optional extra transform for variety
    flake.style.transform = `translateX(${Math.random() * 40 - 20}px)`;

    // give a small individual translate in the animation via custom property (if desired)
    container.appendChild(flake);

    // Clean up after long time if you want (keeps DOM small if creating new flakes repeatedly)
  }
})(80);