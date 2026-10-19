<template>
 <Teleport to="body"><div class="event-shade" @keydown.esc.stop.prevent="emit('choose','skip')"><section ref="panel" class="event-sheet" role="dialog" aria-modal="true" aria-label="探索事件" tabindex="-1" @keydown.tab="trap">
  <header><small>{{ pending.id.startsWith('festival:')?'节庆见闻':'途中小事' }} · {{ pending.地点 }}</small><button aria-label="跳过事件" @click="emit('choose','skip')">×</button></header>
  <h2>{{ event?.标题 || '途中见闻' }}</h2><p>{{ event?.正文 || '这条事件已无法继续，可以返回原来的安排。' }}</p>
  <div class="choices"><button v-for="option in event?.选项 ?? []" :key="option.id" @click="emit('choose',option.id)"><span>{{ option.名称 }}</span><small>{{ option.属性?`${option.属性} +1`:option.金钱?`金钱 +${option.金钱}`:option.恢复?`恢复精力 ${option.恢复}`:'无数值变化' }}</small></button></div>
  <footer><span>不额外占用时段 · 可自由离开</span><button @click="emit('choose','skip')">继续赶路</button></footer>
 </section></div></Teleport>
</template>
<script setup lang="ts">
import {computed,ref,onMounted,onUnmounted,nextTick} from 'vue';
import {查事件,type 探索状态} from '../../养成/探索事件';
const props=defineProps<{pending:NonNullable<探索状态['待处理']>}>(),emit=defineEmits<{choose:[string]}>();
const event=computed(()=>查事件(props.pending.id)),panel=ref<HTMLElement>();let previous:HTMLElement|null=null;
function trap(e:KeyboardEvent){const b=Array.from(panel.value?.querySelectorAll<HTMLButtonElement>('button')??[]);if(e.shiftKey&&(document.activeElement===b[0]||document.activeElement===panel.value)){e.preventDefault();b.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0]?.focus();}}
onMounted(async()=>{previous=document.activeElement as HTMLElement;await nextTick();panel.value?.focus();});onUnmounted(()=>previous?.isConnected&&previous.focus({preventScroll:true}));
</script>
<style scoped>
.event-shade{position:fixed;inset:0;z-index:10500;display:grid;place-items:center;padding:14px;background:#07110ed9;color:#e2d7b8}.event-sheet{width:min(510px,100%);max-height:calc(100dvh - 28px);overflow:auto;padding:22px;background:linear-gradient(145deg,#303c2c,#1d2922);border:1px solid #a29468;box-sizing:border-box;box-shadow:0 24px 80px #0008;outline:none}header,footer{display:flex;justify-content:space-between;align-items:center;gap:10px}header small,footer{font-size:11px;color:#aeb79b}h2{font-size:25px;font-weight:400;letter-spacing:2px;margin:18px 0}p{font-size:14px;line-height:1.9;margin:12px 0 22px}button{font:inherit;color:inherit;border:1px solid #78805c;background:#35422d;padding:8px 12px;cursor:pointer}button:focus-visible{outline:2px solid #e4ca91;outline-offset:2px}.choices{display:grid;gap:10px}.choices button{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:52px;text-align:left}.choices small{font-size:11px;color:#b5bf9e;white-space:nowrap}footer{border-top:1px solid #757c5266;padding-top:15px;margin-top:18px}footer button{white-space:nowrap}@media(max-width:480px){.event-sheet{padding:18px}h2{font-size:22px}p{font-size:13px}.choices button{font-size:13px;padding:9px;min-height:48px}footer{gap:5px;font-size:10px}}
</style>
