import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/bicycle",
    name: "Bicycle",
    component: () => import("../views/Bicycle.vue"),
  },
  {
    path: "/station",
    name: "Station",
    component: () => import("../views/Station.vue"),
  },
  {
    path: "/route",
    name: "Route",
    component: () => import("../views/Route.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "Home" },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
