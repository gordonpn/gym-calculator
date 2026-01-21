import calculator from './components/calculator';
import repMaxCalculator from './components/repMaxCalculator';
import strengthLevelCalculator from './components/strengthLevelCalculator';

const getPreferredTheme = () => {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    return storedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const setTheme = (theme: string) => {
  document.documentElement.setAttribute('data-bs-theme', theme);
  localStorage.setItem('theme', theme);
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
};

export default function (Alpine: any) {
  // Initialize theme on startup
  setTheme(getPreferredTheme());

  // Listen for system theme changes if no stored preference
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });

  // Listen for toggle-theme events
  document.addEventListener('toggle-theme', () => {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });

  // Register Alpine data stores and components
  Alpine.data('themeToggle', () => ({
    isDarkTheme: getPreferredTheme() === 'dark',

    init() {
      window.addEventListener('theme-changed', (e: any) => {
        this.isDarkTheme = e.detail.theme === 'dark';
      });
    },

    toggleTheme() {
      document.dispatchEvent(new CustomEvent('toggle-theme'));
    },
  }));

  Alpine.data('calculator', calculator);
  Alpine.data('repMaxCalculator', repMaxCalculator);
  Alpine.data('strengthLevelCalculator', strengthLevelCalculator);
}
