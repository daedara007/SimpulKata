import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import './services/apiClient'; // Memuat konfigurasi dan interceptor global Axios

const app = createApp(App);
app.use(router);
app.mount('#app');
