<script lang="ts">
import { ref } from "vue";
import { City } from "../models/cityInfo";
import CityCard from "./CityCard.vue";

export default {
  name: "Settings",
};
</script>

<script setup lang="ts">
const { cities } = defineProps<{ cities: City[] }>();
const emit = defineEmits<{
  (e: "add", name: string): void;
  (e: "sort", firstItem: string, secondItem: string): void;
  (e: "delete", name: string): void;
}>();
const cityName = ref<string>("");

const addCity = () => {
  if (!cityName.value) {
    console.error("Error: Field must to be not empty");
    return;
  }
  emit("add", cityName.value);
  cityName.value = "";
};
const sort = (draggedItem: string, dropOnItem: string): void => {
  emit("sort", draggedItem, dropOnItem);
};
const deleteCity = (name: string) => {
  emit("delete", name);
};
</script>

<template>
  <CityCard
    v-for="city in cities"
    :key="city.name"
    :city="city"
    @dragged="sort"
    @delete="deleteCity"
  />
  <form action="submit" @submit.prevent="addCity">
    <input placeholder="add location" type="text" v-model.trim="cityName" />
    <button type="submit"></button>
  </form>
</template>