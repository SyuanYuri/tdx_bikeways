<script setup>
import Sidebar from "@/components/Sidebar.vue";
</script>

<template>
  <div class="flex">
    <Sidebar />
    <router-view />
  </div>
</template>

<style lang="scss">
#app {
  font-family: "Noto Sans TC", "Nunito Sans", sans-serif;
  letter-spacing: 1px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  -webkit-border-radius: 10px;
  border-radius: 10px;
  margin: 3px 0 5px 0;
}

::-webkit-scrollbar-thumb {
  -webkit-border-radius: 4px;
  border-radius: 4px;
  background: rgb(219, 219, 219);
}

.hover-style:hover {
  background: linear-gradient(90deg, #f07e3f 0%, #ffce65 100%);
}

.popupCustom {
  .leaflet-popup-content-wrapper {
    opacity: 0.9;
    background: #112c45;
    color: #fff;
  }
  .leaflet-popup-tip {
    background: #112c45;
  }
  .leaflet-popup-close-button {
    display: none;
  }
}
</style>
