import type { Alpine } from "alpinejs";
import calculator from "./components/calculator";
import repMaxCalculator from "./components/repMaxCalculator";
import strengthLevelCalculator from "./components/strengthLevelCalculator";
import { readStorage, writeStorage } from "./storage";

declare global {
  interface WindowEventMap {
    "theme-changed": CustomEvent<{ theme: string }>;
  }
}

const getPreferredTheme = () => {
  const storedTheme = readStorage("theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const setTheme = (theme: string) => {
  document.documentElement.setAttribute("data-bs-theme", theme);
  window.dispatchEvent(new CustomEvent("theme-changed", { detail: { theme } }));
};

export default function (Alpine: Alpine) {
  let explicitTheme = readStorage("theme");
  if (explicitTheme !== "light" && explicitTheme !== "dark")
    explicitTheme = null;

  // Initialize theme on startup
  setTheme(getPreferredTheme());

  // Listen for system theme changes if no stored preference
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!explicitTheme) {
        setTheme(e.matches ? "dark" : "light");
      }
    });

  window.addEventListener("storage", (event) => {
    if (event.key !== "theme" && event.key !== null) return;
    const storedTheme = readStorage("theme");
    explicitTheme =
      storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
    setTheme(getPreferredTheme());
  });

  // Listen for toggle-theme events
  document.addEventListener("toggle-theme", () => {
    const currentTheme = document.documentElement.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    explicitTheme = newTheme;
    writeStorage("theme", newTheme);
    setTheme(newTheme);
  });

  // Register Alpine data stores and components
  Alpine.data("themeToggle", () => ({
    isDarkTheme: getPreferredTheme() === "dark",

    init() {
      window.addEventListener("theme-changed", (e) => {
        if (e instanceof CustomEvent) {
          const detail: unknown = e.detail;
          if (detail && typeof detail === "object" && "theme" in detail) {
            this.isDarkTheme = detail.theme === "dark";
          }
        }
      });
    },

    toggleTheme() {
      document.dispatchEvent(new CustomEvent("toggle-theme"));
    },
  }));

  Alpine.data("calculator", calculator);
  Alpine.data("repMaxCalculator", repMaxCalculator);
  Alpine.data("strengthLevelCalculator", strengthLevelCalculator);
}
