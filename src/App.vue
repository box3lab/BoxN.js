<template>
  <div class="app">
    <LiteGraphEditor />
  </div>
</template>

<script setup lang="ts">
import LiteGraphEditor from './components/LiteGraphEditor.vue'
</script>

<style>
/* App特定样式 */
.app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
