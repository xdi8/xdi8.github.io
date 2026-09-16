const langSwitcher = document.querySelector(".lang-switcher")
if (langSwitcher) {
  document.addEventListener("mousedown", (event) => {
    if (!langSwitcher.contains(event.target)) langSwitcher.open = false
  })
}

// Nav overflow hide & dropdown
;(function () {
  const nav = document.querySelector(".nav-main")
  if (!nav) return
  const ul = nav.querySelector("ul")
  const items = [...nav.querySelectorAll("li.nav-item")]
  const logo = nav.querySelector("li.nav-logo")
  const logoLink = logo.querySelector("a")
  const dropdown = nav.querySelector(".nav-dropdown")
  const dropdownInner = dropdown.querySelector("div")

  // Group items by distance from logo (farthest first, dist = yml order)
  const leftItems = items.filter((el) => el.dataset.side === "left").sort((a, b) => b.dataset.dist - a.dataset.dist)
  const rightItems = items.filter((el) => el.dataset.side === "right").sort((a, b) => b.dataset.dist - a.dataset.dist)

  function updateNav() {
    // Reset all to visible first
    items.forEach((el) => el.classList.remove("nav-hidden"))

    const containerWidth = ul.clientWidth
    const maxPairs = Math.min(leftItems.length, rightItems.length)
    let hiddenCount = 0

    // Try hiding pairs until content fits or all hidden
    for (let pairs = 0; pairs <= maxPairs; pairs++) {
      // Apply test state
      leftItems.forEach((el, i) => el.classList.toggle("nav-hidden", i < pairs))
      rightItems.forEach((el, i) => el.classList.toggle("nav-hidden", i < pairs))

      if (ul.scrollWidth <= containerWidth) {
        hiddenCount = pairs
        break
      }
    }

    // Re-apply final state
    leftItems.forEach((el, i) => el.classList.toggle("nav-hidden", i < hiddenCount))
    rightItems.forEach((el, i) => el.classList.toggle("nav-hidden", i < hiddenCount))

    const hasHidden = hiddenCount > 0
    nav.classList.toggle("has-hidden", hasHidden)

    // Rebuild dropdown content
    dropdownInner.innerHTML = ""
    if (hasHidden) {
      const hiddenLeft = leftItems.slice(0, hiddenCount).reverse()
      const hiddenRight = rightItems.slice(0, hiddenCount)
      hiddenLeft.forEach((el) => {
        const a = el.querySelector("a").cloneNode(true)
        dropdownInner.appendChild(a)
      })
      hiddenRight.forEach((el) => {
        const a = el.querySelector("a").cloneNode(true)
        dropdownInner.appendChild(a)
      })
      const homeLink = document.createElement("a")
      homeLink.href = logoLink.href
      homeLink.textContent = logoLink.title
      dropdownInner.appendChild(homeLink)
    }
  }

  // Toggle dropdown
  logoLink.addEventListener("click", (e) => {
    if (!nav.classList.contains("has-hidden")) return
    e.preventDefault()
    dropdown.classList.toggle("open")
  })

  document.addEventListener("mousedown", (e) => {
    if (!nav.contains(e.target)) dropdown.classList.remove("open")
  })

  // Watch for resize
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(updateNav).observe(nav)
  } else {
    window.addEventListener("resize", updateNav)
  }
  updateNav()
})()

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  })
}
