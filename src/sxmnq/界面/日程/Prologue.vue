<template>
 <Teleport to="body"><div class="prologue-shade"><section ref="panel" class="prologue" role="dialog" aria-modal="true" aria-label="白塔序章" tabindex="-1" @keydown.tab="trap">
  <div class="arrival-art" aria-hidden="true"><svg viewBox="0 0 260 440" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="arrival-sky" x2="0" y2="1"><stop stop-color="#586650"/><stop offset="1" stop-color="#1f302a"/></linearGradient></defs><path fill="url(#arrival-sky)" d="M0 0h260v440H0z"/><circle cx="174" cy="96" r="55" fill="#c6bd8c" opacity=".25"/><g stroke="#b6ba93" stroke-width=".7" fill="none" opacity=".45"><path d="M0 322h260M0 350h260M0 380h260M0 417h260M130 286 18 440M130 286l112 154"/><path d="M70 288V176h24v-53l36-73 36 73v53h24v112M94 176h72M94 123h72M104 123v165M156 123v165M118 123v165M142 123v165M118 80h24M130 50V28"/></g><path d="M108 288V145h44v143h-13v-41h-18v41Z" fill="#d7d3ac" opacity=".35"/><path d="M0 291h61v-66H28v66m171 0v-66h33v66M11 225l32-17 32 17m110 0 32-17 32 17" fill="none" stroke="#b6ba93" opacity=".55"/><g stroke="#9ca683" fill="#344735"><path d="m20 328 12-48 12 48Zm198 0 12-48 12 48ZM-9 355l17-61 17 61Zm244 0 17-61 17 61Z"/></g><path d="M0 286h260" stroke="#d6ca99"/><path d="M12 12h236v416H12z" fill="none" stroke="#d6ca99" opacity=".35"/></svg><span>WHITE TOWER<br/>一段生活，自此开始</span></div>
  <div class="arrival-letter">
   <small>序章 · 抵达白塔</small><h1>你的故事，<br/>才刚刚开始。</h1>
   <button class="arrival-copy" :aria-label="最后一段 ? '序章最后一段' : '阅读下一段序章'" :aria-disabled="最后一段" @click="下一段">
    <span :key="段号" class="arrival-paragraph" :class="{ 'arrival-last': 最后一段 }" aria-live="polite" aria-atomic="true">{{ 序章段落[段号] }}</span>
    <span class="arrival-hint" aria-hidden="true">{{ 最后一段 ? '新的生活，即将开始' : '点击继续' }} <span v-if="!最后一段">▸</span></span>
   </button>
   <div class="arrival-progress"><span :aria-label="`第 ${段号 + 1} 段，共 ${序章段落.length} 段`"><i v-for="(_, i) in 序章段落" :key="i" :class="{ active: i === 段号, read: i < 段号 }" aria-hidden="true" /></span><span>{{ 段号 + 1 }} / {{ 序章段落.length }}</span></div>
   <footer><span>{{ replay ? '重读序章不会改变当前进度' : '第一天 · 白塔治疗中心' }}</span><div class="arrival-actions"><button class="arrival-back" :disabled="段号 === 0" @click="段号--">上一段</button><button v-if="!最后一段" @click="下一段">继续 <span aria-hidden="true">→</span></button><button v-else @click="完成">{{ replay ? '返回当前进度' : '开始第一天工作' }} <span aria-hidden="true">→</span></button></div></footer>
  </div>
 </section></div></Teleport>
</template>
<script setup lang="ts">
import {ref,computed,onMounted,onUnmounted,nextTick} from 'vue';
import { 序章段落 } from './序章文案';
defineProps<{replay:boolean}>();const emit=defineEmits<{start:[]}>(),panel=ref<HTMLElement>();let previous:HTMLElement|null=null;
const 段号=ref(0),最后一段=computed(()=>段号.value===序章段落.length-1);
let 已完成=false;
function 下一段(){if(!最后一段.value)段号.value++;}
function 完成(){if(!已完成&&最后一段.value){已完成=true;emit('start');}}
function trap(e:KeyboardEvent){
 const buttons=Array.from(panel.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);
 if(!buttons.length)return;
 const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
 if(index<0||(e.shiftKey&&index===0)||(!e.shiftKey&&index===buttons.length-1)){
  e.preventDefault();buttons[e.shiftKey?buttons.length-1:0].focus();
 }
}
onMounted(async()=>{previous=document.activeElement as HTMLElement;await nextTick();panel.value?.focus();});onUnmounted(()=>previous?.isConnected&&previous.focus({preventScroll:true}));
</script>
<style scoped>
.prologue-shade{position:fixed;inset:0;z-index:16000;background:#101b17f5;display:grid;place-items:center;padding:16px;color:#e4dcc0;box-sizing:border-box}.prologue{width:min(800px,100%);max-height:calc(100dvh - 32px);overflow:auto;display:grid;grid-template-columns:240px minmax(0,1fr);border:1px solid #9f956a;background:#263228;box-shadow:0 25px 90px #0008;outline:none;box-sizing:border-box}.arrival-art{position:relative;min-height:440px;overflow:hidden}.arrival-art svg{position:absolute;width:100%;height:100%;inset:0}.arrival-art>span{position:absolute;bottom:30px;left:28px;font-size:11px;line-height:2.2;letter-spacing:2px;color:#dbd0a3}.arrival-letter{padding:36px 34px;min-width:0}.arrival-letter>small{color:#aaa989;font-size:12px;letter-spacing:3px}h1{font-size:30px;line-height:1.55;font-weight:400;letter-spacing:3px;margin:16px 0 20px}.arrival-copy p{font-size:14px;line-height:1.95;margin:0 0 14px;text-align:justify;color:#c9cbb5}.arrival-copy .arrival-last{color:#e3c992;margin-bottom:24px}footer{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;border-top:1px solid #9d9e7144;padding-top:18px}footer>span{font-size:11px;color:#a8ae92}button{font:inherit;font-size:14px;cursor:pointer;color:#f0ddaa;background:#445238;border:1px solid #ada16c;padding:11px 15px}button span{margin-left:12px}button:focus-visible{outline:2px solid #e4cf96;outline-offset:3px}@media(max-width:600px){.prologue-shade{padding:12px}.prologue{grid-template-columns:1fr;max-height:calc(100dvh - 24px)}.arrival-art{min-height:78px;height:78px}.arrival-art svg{height:260px;top:-115px}.arrival-art>span{left:18px;bottom:10px;font-size:9px}.arrival-letter{padding:20px}h1{font-size:23px;line-height:1.45;margin:10px 0 14px}h1 br{display:none}.arrival-copy p{font-size:13px;line-height:1.8;margin-bottom:12px}.arrival-copy .arrival-last{margin-bottom:14px}footer{padding-top:12px;gap:9px}footer>span{font-size:10px}button{font-size:13px;padding:9px 12px}}
</style>
<style scoped>
.arrival-letter{display:flex;flex-direction:column}
.arrival-copy{display:flex;flex-direction:column;justify-content:space-between;gap:20px;width:100%;min-height:190px;padding:18px 20px;text-align:left;border:1px solid #93957055;background:#1e2b2399;color:#c9cbb5;line-height:1.95;box-sizing:border-box}
.arrival-copy:hover{border-color:#c1b78099;background:#223027}
.arrival-copy[aria-disabled="true"]{cursor:default}
.arrival-copy span{margin-left:0}
.arrival-paragraph{display:block;font-size:15px;animation:arrival-reveal .22s ease-out}
.arrival-copy .arrival-last{color:#e3c992;margin-bottom:0}
.arrival-hint{align-self:flex-end;font-size:11px;letter-spacing:2px;color:#a8ae92}
.arrival-hint span{display:inline-block;margin-left:6px;color:#d1be83}
.arrival-progress{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:16px 0 22px;color:#a8ae92;font-size:11px;font-variant-numeric:tabular-nums}
.arrival-progress>span:first-child{display:flex;gap:7px}
.arrival-progress i{display:block;width:6px;height:6px;border:1px solid #969b77;transform:rotate(45deg)}
.arrival-progress i.read{background:#697551}.arrival-progress i.active{background:#dec78c;border-color:#dec78c}
footer{margin-top:auto;flex-direction:column;align-items:stretch}
.arrival-actions{display:flex;justify-content:space-between;gap:12px}
.arrival-back{background:transparent;border-color:transparent;color:#b5b99d;padding-left:0}
.arrival-back:disabled{opacity:.3;cursor:default}
@keyframes arrival-reveal{from{opacity:.25;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:600px){.arrival-copy{min-height:180px;padding:15px 16px;gap:12px}.arrival-paragraph{font-size:14px;line-height:1.9}.arrival-progress{margin:13px 0 16px}}
@media(max-height:600px){.arrival-art{min-height:0}.arrival-letter{padding:16px 22px}h1{font-size:23px;line-height:1.3;margin:9px 0 12px}.arrival-copy{min-height:140px;padding:12px 15px}.arrival-progress{margin:10px 0}footer{padding-top:10px;gap:8px}.arrival-paragraph{font-size:13px;line-height:1.75}}
@media(prefers-reduced-motion:reduce){.arrival-paragraph{animation:none}}
@media(max-height:600px){h1 br{display:none}}
</style>
