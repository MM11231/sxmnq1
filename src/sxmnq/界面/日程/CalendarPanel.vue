<template>
 <Teleport to="body"><div class="calendar-shade" @click.self="emit('close')" @keydown.esc.stop.prevent="emit('close')"><section ref="panel" class="calendar-sheet" role="dialog" aria-modal="true" aria-label="白塔年历" tabindex="-1" @keydown.tab="trap">
  <header><div><small>四季各30天 · 全年120天</small><h2>白塔年历</h2></div><button aria-label="关闭年历" @click="emit('close')">× 返回</button></header>
  <div class="year"><button :disabled="year<=1" aria-label="上一年" @click="year--">←</button><span>白塔历 {{ year }} 年</span><button aria-label="下一年" @click="year++">→</button><button @click="reset">回到今天</button></div>
  <nav aria-label="选择季节"><button v-for="s in 四季" :key="s" :class="{active:season===s}" :aria-pressed="season===s" @click="season=s">{{ s }}季</button></nav>
  <div class="days" aria-label="本季三十天"><button v-for="d in 30" :key="d" :class="{today:year===today.年&&season===today.季&&d===today.日,selected:day===d,festival:festivalAt(d)}" :aria-label="`${season}${d}日${festivalAt(d)?' '+festivalAt(d)!.名称:''}`" :aria-pressed="day===d" @click="day=d"><span>{{ d }}</span><i aria-hidden="true">{{ festivalAt(d)?'·':'' }}</i></button></div>
  <p class="legend">描边为今天 · 金点为节庆 · 每次节庆持续2天</p>
  <section class="selected-day" aria-live="polite"><h3>{{ season }}{{ day }}日 · {{ gameDay<1?'开局前':gameDay%2?'值班日':'休息日' }}<span>{{ festival?.名称 || '普通日常' }}</span></h3><p>{{ festival?.简介 || '照常值班或自由探索，沿途仍可能遇到日常小事。' }}</p><small v-if="festival">{{ festival.季 }}{{ festival.起 }}—{{ festival.止 }}日 · {{ places }}</small><small v-else>一年96天日常、24天节庆，节庆不会改变上一休一。</small></section>
 </section></div></Teleport>
</template>
<script setup lang="ts">
import {computed,ref,onMounted,onUnmounted,nextTick} from 'vue';
import {四季,年历位置,今日节庆,type 季节} from '../../养成/年历';
import {locations} from './地图/locations';
const props=defineProps<{day:number;offset:number}>(),emit=defineEmits<{close:[]}>();
const today=computed(()=>年历位置(props.day,props.offset)),year=ref(today.value.年),season=ref<季节>(today.value.季),day=ref(today.value.日),panel=ref<HTMLElement>();
const selected=computed(()=>年历位置((year.value-1)*120+四季.indexOf(season.value)*30+day.value));
const festival=computed(()=>今日节庆(selected.value));
const places=computed(()=>festival.value?.地点.map(id=>locations.find(l=>l.id===id)?.name.replace(/ · [12]F/,'')??id).join('、'));
const gameDay=computed(()=>selected.value.总日-props.offset+1);
function festivalAt(d:number){return 今日节庆({...selected.value,日:d});}
function reset(){year.value=today.value.年;season.value=today.value.季;day.value=today.value.日;}
let previous:HTMLElement|null=null;
function trap(e:KeyboardEvent){const b=Array.from(panel.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(e.shiftKey&&(document.activeElement===b[0]||document.activeElement===panel.value)){e.preventDefault();b.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0]?.focus();}}
onMounted(async()=>{previous=document.activeElement as HTMLElement;await nextTick();panel.value?.focus();});onUnmounted(()=>previous?.isConnected&&previous.focus({preventScroll:true}));
</script>
<style scoped>
.calendar-shade{position:fixed;inset:0;z-index:11000;display:grid;place-items:center;padding:12px;background:#07110ed9;color:#e0d7b9}.calendar-sheet{width:min(530px,100%);max-height:calc(100dvh - 24px);overflow:auto;padding:22px;background:linear-gradient(140deg,#303c2c,#1c2923);border:1px solid #a09263;box-shadow:0 24px 80px #0008;box-sizing:border-box;font-family:inherit;outline:none}header,.year,nav{display:flex;align-items:center;gap:10px}header{justify-content:space-between}header small,.legend,small{font-size:11px;color:#aeb79b}h2{font-size:25px;font-weight:400;margin:5px 0 14px;letter-spacing:3px}button{font:inherit;color:inherit;border:1px solid #79805b;background:#35412c;padding:7px 10px;cursor:pointer}button:focus-visible{outline:2px solid #e2c985;outline-offset:2px}button:disabled{opacity:.35;cursor:default}.year{margin:4px 0 14px;font-size:13px}.year span{flex:1;text-align:center}nav{gap:0;border-bottom:1px solid #7d8351;margin-bottom:12px}nav button{flex:1;background:none;border:0;padding:10px}.active{color:#efd595;border-bottom:2px solid #dfbf7b!important}.days{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}.days button{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#14251f55;border-color:#66705a55;height:38px}.days i{font-size:23px;font-style:normal;color:#e6c27b}.days .today{outline:1px solid #d9c795}.days .selected{background:#69724b55;border-color:#d2b87b}.legend{margin:10px 0}.selected-day{border-top:1px solid #81856866;padding-top:10px;min-height:94px}h3{margin:0;font-size:14px;font-weight:400;display:flex;justify-content:space-between;gap:8px}h3 span{color:#e6c27b}p{font-size:13px;line-height:1.8;margin:8px 0}small{line-height:1.65}@media(max-width:480px){.calendar-sheet{padding:15px}.days button{padding:7px 9px;height:34px}.year{gap:5px}.year button{padding:6px 8px}h2{font-size:22px}.selected-day{min-height:104px}h3{font-size:13px}p{font-size:12px}}
</style>
