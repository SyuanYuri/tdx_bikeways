<template>
  <div
    class="
      flex flex-col
      content-center
      bg-blue_100
      h-screen
      w-16
      border-r-2
      border-blue_400
    "
    style="z-index: 800"
  >
    <router-link to="/" class="text-white w-full"
      ><img class="py-5 mx-auto" src="@/assets/images/logo_bike.svg" alt=""
    /></router-link>

    <ul class="flex flex-col my-auto">
      <li>
        <router-link to="/bicycle" class="py-4 text-white block"
          ><img class="mx-auto" src="@/assets/images/tab_01.svg" alt=""
        /></router-link>
      </li>
      <li>
        <router-link to="/station" class="py-4 text-white block"
          ><img class="mx-auto" src="@/assets/images/tab_02.svg" alt=""
        /></router-link>
      </li>
      <li>
        <router-link to="/route" class="py-4 text-white block"
          ><img class="mx-auto" src="@/assets/images/tab_03.svg" alt=""
        /></router-link>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "Sidebar",
};
</script>

<style scoped>
.router-link-active {
  background: #08111a;
}
</style>
