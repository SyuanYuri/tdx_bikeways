<template>
  <div class="banner w-screen h-screen">
    <router-link
      to="/bicycle"
      class="
        absolute
        bottom-24
        left-72
        text-blue_400
        text-xl
        border-2
        border-blue_400
        rounded-md
        px-12
        py-3
        bg-gradient-to-r
        hover:from-blue_400 hover:text-white
        transition
        duration-300
        ease-in-out
      "
      style="letter-spacing: 3px"
      >Let's BIKE</router-link
    >
    <img
      class="object-cover h-screen w-full"
      src="@/assets/images/banner.jpg"
      alt=""
    />
  </div>
</template>

<script>
export default {
  name: "Home",
};
</script>
