<template>
  <q-layout view="lHh Lpr lFf">
    <div class="q-pa-lg">
      <q-input v-model="comment" label="Комментарий" filled outlined dense type="textarea" />
      <q-btn label="Создать заказ" color="primary" @click.prevent="createOrder" class="q-mt-md" />
    </div>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const comment = ref('')

const createOrder = async (e) => {
  try {
    const response = await axios.post('http://185.26.120.191:5555/api/create-order', { comment: comment.value })
    if (response.status === 201) alert('Заказ успешно добавлен')
    comment.value = ''
  } catch (e) {
    console.log(e.message);
  }
}
</script>
