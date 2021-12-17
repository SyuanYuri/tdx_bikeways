<script>
export default {
  name: "Spinner",
}
</script>

<template>
  <div class="flex justify-center items-center">
    <div
      class="loader-style ease-linear rounded-full border-8 border-t-8 border-yellow h-12 w-12"
      style="left: 1em; top: 9em; z-index: 1000"
    ></div>
  </div>
</template>

<style scoped>
.loader-style {
  position: absolute;
  bottom: 10rem;
  border-top-color: #6390b9;
  -webkit-animation: loader 1.5s linear infinite;
  animation: loader 1.5s linear infinite;
}

@-webkit-keyframes loader {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}

@keyframes loader {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
