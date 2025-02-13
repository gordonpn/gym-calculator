import Alpine from 'alpinejs';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import sidebar from "./components/sidebar";
import calculator from "./components/calculator";

window.Alpine = Alpine;

Alpine.data('sidebar', sidebar);
Alpine.data('calculator', calculator);

Alpine.start();
