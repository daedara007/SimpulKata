import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import './services/apiClient'; // Memuat konfigurasi dan interceptor global Axios

createApp(App).mount('#app');
