<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>

<template>
  <div class="min-h-screen bg-background">
    <RouterView />
    <Toaster position="top-center" :theme="'system'" />
  </div>
</template>
