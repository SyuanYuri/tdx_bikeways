import Vue from "vue";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from "axios";
import VueAxios from "vue-axios";
import "./index.css";
import "./assets/tailwind.css";

const app = createApp(App);
app.use(Vue);
app.use(store);
app.use(router);
app.use(VueAxios, axios);
app.mount("#app");
