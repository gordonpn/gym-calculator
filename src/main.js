import Alpine from 'alpinejs';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import calculator from "./components/calculator";

window.Alpine = Alpine;

Alpine.data('calculator', calculator);

Alpine.start();
