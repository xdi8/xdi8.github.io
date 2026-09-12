const langSwitcher = document.querySelector(".lang-switcher")
if (langSwitcher) {
  document.addEventListener("mousedown", (event) => {
    if (!langSwitcher.contains(event.target)) langSwitcher.open = false
  })
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  })
}
