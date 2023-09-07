<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);

function increment() {
  count.value++;
}
</script>
<template>
    <h1>Hello world</h1>
  <div>count is {{ count }}</div>
  <button @click="increment">Increment</button>
</template>