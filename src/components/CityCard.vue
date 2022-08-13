<script lang="ts">
import { ref, watch } from "vue";
import { City } from "../models/cityInfo";

export default {
  name: "CityCard",
};
</script>

<script setup lang="ts">
const { city } = defineProps<{ city: City }>();
const emit = defineEmits<{
  (e: "dragged", firstItem: string, secondItem: string): void;
  (e: "delete", name: string): void;
}>();

const isDragging = ref<boolean>(false);
const cityCard = ref<HTMLElement>();

const deleteCity = (name: string) => {
  emit("delete", name);
};

const mousedown = (e: Event) => {
  isDragging.value = true;
};

const mouseleave = (e: Event) => {
  isDragging.value = false;
};

const startDrag = (event: DragEvent, draggingItem: string) => {
  event.dataTransfer?.setData("name", draggingItem);
};
const endDrag = (event: DragEvent) => {
  cityCard.value?.classList.remove("city_drag-over");
};
const overDrag = (event: DragEvent) => {
  cityCard.value?.classList.add("city_drag-over");
};
const drop = (event: DragEvent, dropOnItem: string) => {
  const draggingItem = event.dataTransfer?.getData("name");
  emit("dragged", draggingItem ?? "", dropOnItem);
  cityCard.value?.classList.remove("city_drag-over");
};

watch(isDragging, (value) => {
  cityCard.value.draggable = value;
});
</script>

<template>
  <div
    class="card city"
    ref="cityCard"
    :draggable="false"
    @dragstart="startDrag($event, city.name)"
    @dragleave.prevent="endDrag"
    @dragover.prevent="overDrag"
    @drop="drop($event, city.name)"
  >
    <div draggable="false">
      <div draggable="false" @mousedown="mousedown" @mouseleave="mouseleave">
        <svg
          class="city__draggable"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          id="body_4"
          width="32"
          height="32"
        >
          <g transform="matrix(1 0 0 1 0 0)">
            <image
              x="0"
              y="0"
              xlink:href="data:image/png;base64,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"
              width="32"
              height="32"
            />
          </g>
        </svg>
      </div>
      <!-- <img src="../assets/menu.png" /> -->
      <span draggable="false" @mousedown.prevent>
        {{ city.name }}, {{ city.coutry }}
      </span>
    </div>
    <button
      draggable="false"
      @mousedown.prevent
      @click="deleteCity(city.name)"
    ></button>
  </div>
</template>