// src/components/sidebar.js
export default () => ({
  isOpen: false,
  currentPage: 'home',
  menuItems: [
    { name: 'Home', path: 'home' },
    { name: 'About', path: 'about' },
    { name: 'Contact', path: 'contact' }
  ],
  toggleSidebar() {
    this.isOpen = !this.isOpen;
  },
  changePage(path) {
    this.currentPage = path;
    if (window.innerWidth < 768) {
      this.isOpen = false;
    }
  }
});
