<template>
  <div id="app">
    <h1><span style="color:#00670D">Text</span><span style="color:#044C79">Share</span></h1>
    <Home/>
  </div>
</template>

<script>
import Home from './components/Home.vue'

export default {
  name: 'App',
  components: {
    Home
  }
}
</script>

<style>
h1 {
  font-family: 'Arial Black', sans-serif;
  font-size: 40px;
  font-weight: bold;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
