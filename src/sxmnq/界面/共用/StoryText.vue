<template><p class="story-paragraph"><span v-for="(片, 序) in 片们" :key="序" :class="片.类">{{ 片.文 }}</span></p></template>
<script setup lang="ts">
import { computed } from 'vue';
import { 排印片段 } from './文字演出';
const props = defineProps<{ text: string }>();
const 片们 = computed(() => 排印片段(props.text));
</script>
<style scoped>
.story-paragraph { margin: 0 0 1.35em; color: #eee9df; font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', serif; font-size: clamp(16px, 1.1vw + 10px, 18px); line-height: 2.05; letter-spacing: .035em; overflow-wrap: anywhere; white-space: pre-wrap; }
.fx-dialogue { color: #f5d08a; font-weight: 550; }
.fx-emphasis { color: #d5dfd9; font-style: italic; }
.fx-amber,.fx-marigold,.fx-cider { color: #f6cc83; }
.fx-copper,.fx-terracotta,.fx-coral { color: #efb99a; }
.fx-sage,.fx-pine,.fx-wildwood { color: #bed6b9; }
.fx-rose,.fx-heather { color: #e9bace; }
.fx-denim,.fx-slate,.fx-indigo { color: #bacff2; }
.fx-ash,.fx-mist,.fx-obsidian { color: #d7dce2; }
.fx-whisper,.fx-whispering { font-size: .95em; font-style: italic; letter-spacing: .055em; }
.fx-tremble { letter-spacing: .09em; text-decoration: underline dotted #abbdcc; text-underline-offset: .3em; }
.fx-bite { font-weight: 750; text-decoration: underline; text-decoration-color: #c49f73; text-underline-offset: .25em; }
.fx-steady,.fx-tight,.fx-crush { font-weight: 600; letter-spacing: .01em; }
.fx-heavy { font-size: 1.08em; font-weight: 800; color: #ffe2a5; }
.fx-tilt,.fx-lean,.fx-lean_right { font-style: italic; }
.fx-stretch,.fx-echo { letter-spacing: .11em; }
.fx-fracture { letter-spacing: .15em; text-decoration: underline dashed #bfaf9c; text-underline-offset: .3em; }
.fx-dusk,.fx-solstice,.fx-eclipse { color: #dac8ed; }
.fx-hearth { color: #f2c39f; }
.fx-veil,.fx-mistveil { color: #cbd9e4; }
@supports (background-clip: text) {
 .fx-dusk,.fx-solstice,.fx-eclipse { background: linear-gradient(100deg,#f6cc83,#c9bdf5); background-clip: text; color: transparent; }
}
</style>
