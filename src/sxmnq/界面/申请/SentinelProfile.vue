<template>
 <Teleport to="body"><div class="sentinel-backdrop" @click.self="emit('close')" @keydown.esc.stop.prevent="emit('close')"><section ref="panel" class="sentinel-profile" role="dialog" aria-modal="true" :aria-label="name + '的基础档案'" tabindex="-1" @keydown.tab="trap">
  <header><span>哨兵 · 基础档案</span><button aria-label="关闭哨兵档案" @click="emit('close')">× 返回</button></header>
  <div class="identity"><div class="initial" aria-hidden="true">{{ name.slice(0,1) }}</div><div><h2>{{ name }}</h2><p>{{ person.等级 }}级哨兵 <span>·</span> {{ person.年龄 || '年龄未登记' }}{{ person.年龄 ? '岁' : '' }}</p><small>{{ treated ? '曾与你完成过疏导' : '等待初次接诊' }}</small></div></div>
  <div class="profile-content"><div class="origin"><span>来自</span><strong>{{ region || '地域尚未登记' }}</strong></div>
   <section class="impression"><h3>初见印象 · {{ appearance.亚种 }}</h3><p>{{ impression }}</p><div v-if="appearance.辨识特征.length" class="features"><span v-for="feature in appearance.辨识特征" :key="feature">{{ feature }}</span></div></section>
   <section class="spirit"><div class="spirit-mark" aria-hidden="true">◇</div><div><h3>精神体</h3><strong>{{ person.精神体?.名称 || '尚未记录' }}</strong><p>{{ [person.精神体?.体型,person.精神体?.栖息].filter(Boolean).join(' · ') }}</p></div></section>
  </div>
  <footer><span>{{ treated ? `已完成 ${treated} 次疏导` : '尚未与你完成疏导' }}</span><button @click="emit('close')">返回候诊</button></footer>
 </section></div></Teleport>
</template>
<script setup lang="ts">
import {computed,ref,onMounted,onUnmounted,nextTick} from 'vue';
import { 读取形象, 外貌描述, type 人物形象 } from '../../生成/形象';
const props=defineProps<{name:string;person:{等级:string;年龄:number;地域:string;特征:string[];形象?:人物形象;精神体:{名称:string;体型:string;栖息:string}};treated:number}>();
const emit=defineEmits<{close:[]}>();
const panel=ref<HTMLElement>();let previous:HTMLElement|null=null;
const region=computed(()=>props.person.地域.split(/[(:：（]/)[0]);
const appearance=computed(()=>读取形象(props.name, props.person));
const impression=computed(()=>外貌描述(appearance.value));
function trap(event:KeyboardEvent){const buttons=Array.from(panel.value?.querySelectorAll<HTMLButtonElement>('button')??[]),first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel.value)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
onMounted(async()=>{previous=document.activeElement as HTMLElement;await nextTick();panel.value?.focus();});
onUnmounted(()=>{if(previous?.isConnected)previous.focus({preventScroll:true});});
</script>
<style scoped>
.sentinel-backdrop{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:16px;background:#07110ed9;color:#e2d7b8}
.sentinel-profile{width:min(510px,100%);max-height:calc(100dvh - 32px);display:flex;flex-direction:column;background:linear-gradient(145deg,#303c2c,#1d2922);border:1px solid #a29468;box-shadow:0 24px 90px #0008;outline:none;overflow:hidden;font-family:inherit}
header,footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 20px;font-size:12px;color:#b3ba9e}header{border-bottom:1px solid #6e755344}button{font:inherit;color:#ded0aa;border:1px solid #7e855d;background:#35412d;padding:6px 10px;cursor:pointer}button:focus-visible{outline:2px solid #dbc991;outline-offset:2px}.identity{display:flex;align-items:center;gap:20px;padding:23px 24px 18px}.initial{display:grid;place-items:center;width:72px;height:86px;border:1px solid #93936b;background:linear-gradient(135deg,#76836533,#ad99691a);font-size:36px;color:#c5b991}.identity h2{margin:0;font-size:28px;font-weight:400;letter-spacing:3px}.identity p{margin:8px 0 5px;font-size:14px;color:#c9c7aa}.identity p span{padding:0 7px;color:#8b997d}.identity small{font-size:11px;color:#99ab94}.profile-content{padding:0 24px 22px;overflow:auto;min-height:0}.origin{display:flex;gap:12px;align-items:center;border-bottom:1px solid #7780604d;padding-bottom:14px;font-size:13px}.origin span{color:#9baa91}.origin strong{font-weight:400}.impression h3,.spirit h3{font-size:11px;color:#b5bc95;font-weight:400;letter-spacing:2px;margin:18px 0 9px}.impression p{font-size:15px;line-height:1.9;margin:0;color:#d0d3b9}.features{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.features span{padding:4px 8px;border:1px solid #6b795d;color:#bfc5a9;font-size:12px}.spirit{display:flex;gap:15px;margin-top:19px;padding:14px;background:#16271e66;border:1px solid #566e544d}.spirit-mark{font-size:36px;color:#9aab87;align-self:center}.spirit h3{margin:0 0 6px}.spirit strong{font-size:19px;font-weight:400}.spirit p{font-size:12px;color:#a8b99f;margin:7px 0 0;line-height:1.6}footer{border-top:1px solid #6e75534d;background:#1a271e}.muted{font-size:12px!important;color:#9aaa8e!important}
@media(max-width:480px){.sentinel-backdrop{padding:10px}.sentinel-profile{max-height:calc(100dvh - 20px)}header,footer{padding:10px 14px}.identity{padding:17px 17px 14px;gap:15px}.identity h2{font-size:24px}.initial{width:57px;height:68px;font-size:30px}.profile-content{padding:0 17px 17px}.impression p{font-size:13px;line-height:1.8}.impression h3{margin-top:13px}.features span{font-size:11px}.spirit{margin-top:14px;padding:11px}.spirit strong{font-size:17px}}
</style>
