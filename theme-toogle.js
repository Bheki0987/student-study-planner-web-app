// Theme toggle functionality
function initializeThemeToggle() {
  const savedTheme = localStorage.getItem("theme") || "dark"
  document.documentElement.classList.toggle("light-mode", savedTheme === "light")

  const themeToggle = document.getElementById("themeToggle")
  if (themeToggle) {
    themeToggle.checked = savedTheme === "light"

    themeToggle.addEventListener("change", function () {
      document.documentElement.classList.toggle("light-mode", this.checked)
      localStorage.setItem("theme", this.checked ? "light" : "dark")
    })
  }
}

document.addEventListener("DOMContentLoaded", initializeThemeToggle)

