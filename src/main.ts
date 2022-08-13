import { defineCustomElement } from 'vue';
import WeatherWidget from './components/WeatherWidget.ce.vue';

const element = defineCustomElement(WeatherWidget);

customElements.define('weather-widget', element);
