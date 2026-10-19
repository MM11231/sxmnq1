<template>
  <Teleport to="body"><div class="choice-mask" @click.self="!busy && emit('skip')" @keydown.esc.prevent.stop="!busy && emit('skip')"><section ref="dialog" class="choice-dialog" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1" @keydown.tab="trap"><h3>{{ title }}</h3><p>{{ text }}</p><p v-if="endOfDay">今天三个活动时段已用完，可以结束休息日。</p><footer><button :disabled="busy" @click="emit('story')">{{ busy ? '正在请求…' : '开启剧情' }}</button><button :disabled="busy" @click="emit('skip')">{{ skipLabel }}</button></footer></section></div></Teleport>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
withDefaults(defineProps<{ title: string; text: string; skipLabel?: string; busy?: boolean; endOfDay?: boolean }>(), { skipLabel: '继续治疗', busy: false, endOfDay: false });
const emit = defineEmits<{ story: []; skip: [] }>();
const dialog = ref<HTMLElement>();
const previous = document.activeElement as HTMLElement | null;
onMounted(async () => { await nextTick(); dialog.value?.focus(); });
onUnmounted(() => previous?.isConnected && previous.focus());
function trap(event: KeyboardEvent) {
  const buttons = [...(dialog.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
  if (!buttons.length) { event.preventDefault(); return; }
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  event.preventDefault(); buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
}
</script>
<style scoped>
.choice-mask{position:fixed;inset:0;z-index:1300;background:#07100dc9;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}.choice-dialog{width:440px;max-width:100%;padding:22px;box-sizing:border-box;background:#252e23;color:#ddd1b5;border:1px solid #a09162;box-shadow:0 16px 50px #0008;font-family:'Songti SC','SimSun',serif;outline:none}.choice-dialog h3{font-size:19px;margin:0 0 14px;font-weight:400}.choice-dialog p{font-size:13px;line-height:1.8;white-space:pre-line}.choice-dialog footer{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.choice-dialog button{padding:10px 15px;background:#35412d;border:1px solid #998b60;color:#e4d5ae;font:inherit;font-size:13px;cursor:pointer}.choice-dialog button:disabled{opacity:.5}.choice-dialog button:focus-visible{outline:2px solid #dac998;outline-offset:3px}
</style>
