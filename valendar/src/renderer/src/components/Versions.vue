<script setup lang="ts">
import { reactive } from 'vue'

const versions = reactive({
  electron: '39.2.6',
  chrome: '134.0.6998.165',
  node: '22.19.1'
})
</script>

<template>
  <ul class="versions">
    <li class="electron-version">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
  </ul>
</template>
