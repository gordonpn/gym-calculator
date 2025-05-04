import Alpine from "alpinejs";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap";
import calculator from "./components/calculator";
import repMaxCalculator from "./components/repMaxCalculator";
import "./style.css";

window.Alpine = Alpine;

const getPreferredTheme = () => {
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme) {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const setTheme = (theme) => {
  document.documentElement.setAttribute("data-bs-theme", theme);
  localStorage.setItem("theme", theme);
  window.dispatchEvent(new CustomEvent("theme-changed", { detail: { theme } }));
};

setTheme(getPreferredTheme());

document.addEventListener("toggle-theme", () => {
  const currentTheme = document.documentElement.getAttribute("data-bs-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
});

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      setTheme(e.matches ? "dark" : "light");
    }
  });

Alpine.data("themeToggle", () => ({
  isDarkTheme: getPreferredTheme() === "dark",

  init() {
    window.addEventListener("theme-changed", (e) => {
      this.isDarkTheme = e.detail.theme === "dark";
    });
  },

  toggleTheme() {
    document.dispatchEvent(new CustomEvent("toggle-theme"));
  },
}));

Alpine.data("calculator", calculator);
Alpine.data("repMaxCalculator", repMaxCalculator);

Alpine.start();
