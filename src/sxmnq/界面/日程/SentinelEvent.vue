<template>
 <Teleport to="body"><div class="social-shade" @keydown.esc.stop.prevent="emit('choose',false)"><section ref="panel" class="social-sheet" role="dialog" aria-modal="true" :aria-label="invitation?'哨兵邀约':'哨兵偶遇'" tabindex="-1" @keydown.tab="trap">
  <header><small>{{ invitation?'休息日 · 收到一份邀请':'途中 · 熟悉的身影' }}</small><button :aria-label="invitation?'婉拒邀请':'点头离开'" @click="emit('choose',false)">×</button></header>
  <h2>{{ name }}{{ invitation?'向你发出邀请':' · 不期而遇' }}</h2><p class="identity">{{ identity }}</p>
  <template v-if="invitation"><dl><div><dt>活动</dt><dd>{{ invitation.主题 }}</dd></div><div><dt>地点</dt><dd>{{ invitation.地点 }}</dd></div><div><dt>时间</dt><dd>{{ invitation.最早时段===2?'今天晚上':'今天任一空闲时段' }}</dd></div></dl><p class="quote">{{ invitation.正文 }}</p><p class="note">接受后到对应地点点击“参加活动”，占用1个时段，免费。拒绝或未赴约不扣关系值。</p></template>
  <template v-else><p class="quote">{{ encounter?.正文 }}</p><p class="note">聊几句可增加信赖；也可以简单打招呼后离开。不额外占用时段。</p></template>
  <footer><button @click="emit('choose',false)">{{ invitation?'今天另有安排':'点头致意，继续赶路' }}</button><button class="accept" @click="emit('choose',true)">{{ invitation?'接受邀请':'聊几句近况' }}</button></footer>
 </section></div></Teleport>
</template>
<script setup lang="ts">
import {computed,ref,onMounted,onUnmounted,nextTick} from 'vue';
import type {邀约,哨兵社交} from '../../养成/哨兵社交';
const props=defineProps<{invitation?:邀约|null;encounter?:哨兵社交['待偶遇'];identity:string}>(),emit=defineEmits<{choose:[boolean]}>();
const name=computed(()=>props.invitation?.姓名??props.encounter?.姓名??'熟人'),panel=ref<HTMLElement>();let previous:HTMLElement|null=null;
function trap(e:KeyboardEvent){const b=Array.from(panel.value?.querySelectorAll<HTMLButtonElement>('button')??[]);if(e.shiftKey&&(document.activeElement===b[0]||document.activeElement===panel.value)){e.preventDefault();b.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0]?.focus();}}
onMounted(async()=>{previous=document.activeElement as HTMLElement;await nextTick();panel.value?.focus();});onUnmounted(()=>previous?.isConnected&&previous.focus({preventScroll:true}));
</script>
<style scoped>
.social-shade{position:fixed;inset:0;z-index:10600;display:grid;place-items:center;padding:14px;box-sizing:border-box;background:#07110ed9;color:#e2d7b8}.social-sheet{width:min(510px,100%);max-height:calc(100dvh - 28px);overflow:auto;padding:24px;background:linear-gradient(145deg,#303c2c,#1d2922);border:1px solid #a29468;box-sizing:border-box;box-shadow:0 24px 80px #0008;outline:none}header,footer{display:flex;justify-content:space-between;align-items:center;gap:10px}header small,.identity,.note{color:#aeb79b;font-size:12px}h2{font-size:24px;line-height:1.6;font-weight:400;letter-spacing:1px;margin:16px 0 6px;overflow-wrap:anywhere}.identity{margin:0 0 18px}.quote{font-size:14px;line-height:1.9;margin:16px 0}.note{line-height:1.8;margin:12px 0}dl{border-block:1px solid #8b906044;padding:12px 0;margin:12px 0}dl>div{display:flex;gap:15px;font-size:13px;line-height:1.9}dt{color:#aeb79b;flex:none}dd{margin:0;color:#e1d0a5}button{font:inherit;font-size:13px;color:inherit;border:1px solid #78805c;background:#35422d;padding:10px 13px;cursor:pointer}button:focus-visible{outline:2px solid #e4ca91;outline-offset:2px}.accept{background:#586341;border-color:#ac9b65}footer{border-top:1px solid #757c5266;padding-top:18px;margin-top:18px}footer button{flex:1}@media(max-width:480px){.social-sheet{padding:18px}h2{font-size:21px}.quote{font-size:13px}footer{gap:8px}footer button{font-size:12px;padding:10px 7px}}
</style>
