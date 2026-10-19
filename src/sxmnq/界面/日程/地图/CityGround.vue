<template>
 <g class="city-ground" aria-hidden="true" pointer-events="none">
  <rect width="1400" height="1280" fill="var(--land-bg,#171d1c)"/><rect x="28" y="28" width="1344" height="1224" rx="25" fill="var(--land-ground,#202824)" stroke="#8a8965" stroke-width="5"/>
  <g fill="var(--land-lawn,#2e3c2d)" stroke="#81906a" stroke-opacity=".25"><rect x="96" y="93" width="328" height="165" rx="22"/><rect x="500" y="93" width="400" height="165" rx="22"/><rect x="978" y="93" width="329" height="165" rx="22"/><rect x="96" y="338" width="328" height="390" rx="22"/><rect x="978" y="338" width="329" height="390" rx="22"/><rect x="96" y="810" width="328" height="350" rx="30"/><rect x="978" y="810" width="329" height="350" rx="30"/></g>
  <rect x="506" y="338" width="393" height="390" rx="26" fill="var(--land-stone,#363c30)" opacity=".65"/>
  <rect x="506" y="810" width="393" height="350" rx="24" fill="var(--land-market,#3d3433)" opacity=".8"/>
  <!-- 主干道有连续去向，支路只在建筑之间与入口连接。 -->
  <path class="perimeter-road" d="M65 65H1335V1200H65Z" fill="none" stroke="var(--land-path,#79755e)" stroke-width="24" stroke-linejoin="round"/>
  <path class="main-roads" :d="main" fill="none" stroke="#b4ae8733" stroke-width="64"/>
  <path :d="main" fill="none" stroke="var(--land-path,#79755e)" stroke-width="52"/>
  <path :d="main" fill="none" stroke="#c7c3a178" stroke-width="1" stroke-dasharray="8 16"/>
  <g fill="none" stroke="var(--land-stone,#85846b)" stroke-linecap="round" stroke-linejoin="round"><path class="neighborhood-roads" :d="lanes" stroke-width="22"/><path :d="entries" stroke-width="14"/></g>
  <g fill="none" stroke="#c9bf9455" stroke-width="1"><path :d="lanes"/><path :d="entries"/></g>
  <g transform="translate(695,675)"><circle r="55" fill="var(--land-plaza,#555b44)" stroke="#b4ad80"/><circle r="43" fill="none" stroke="#d1c695" stroke-opacity=".35"/><circle r="30" fill="#3e6058" stroke="#aab795"/><circle r="24" fill="url(#wt-water)"/><circle r="7" fill="#c1b584"/><path d="M0-20V20M-20 0H20" stroke="#a6ba9b" stroke-width="1"/></g>
  <g fill="var(--land-bed,#4e6242)" stroke="#8e9a6855"><rect x="525" y="457" width="55" height="225" rx="22"/><rect x="821" y="457" width="55" height="225" rx="22"/><ellipse cx="185" cy="868" rx="51" ry="31"/><path d="M1015 1035Q1100 1005 1195 1050T1285 1140Q1170 1175 1060 1130Z"/></g>
  <path d="M1040 1070Q1110 1030 1200 1078T1250 1130Q1165 1150 1090 1120Z" fill="#36574e" stroke="#90a28a" stroke-width="2"/><path d="M1040 1070Q1110 1030 1200 1078T1250 1130Q1165 1150 1090 1120Z" fill="url(#wt-water)" opacity=".7"/>
  <g v-for="(point,i) in trees" :key="i"><use :href="point.flower ? '#wt-flower' : '#wt-tree'" :x="point.x" :y="point.y" :width="point.flower ? 28 : 22" :height="point.flower ? 35 : 28"/></g>
  <use v-for="(point,i) in lamps" :key="'l'+i" href="#wt-lamp" :x="point[0]" :y="point[1]" width="10" height="23"/>
  <g v-for="(point,i) in benches" :key="'b'+i" :transform="`translate(${point[0]},${point[1]})`" fill="none" stroke="#b0a278" stroke-width="2"><path d="M0 0H29M0 5H29M4 0V11M25 0V11"/></g>
  <g stroke="#d0c6a1" stroke-width="3" opacity=".6"><path v-for="x in [460,940]" :key="x" :d="`M${x-18} 269v-14m9 14v-14m9 14v-14m9 14v-14m9 14v-14M${x-18} 814v-14m9 14v-14m9 14v-14m9 14v-14m9 14v-14`"/></g>
 </g>
</template>
<script setup lang="ts">
const main='M460 65V1200M940 65V1200M65 300H1335M65 770H1335';
const lanes='M65 475H460M65 650H460M260 300V475M460 445H940M695 300V475M695 592V620M695 730V770M695 770V1070M460 945H940M460 1070H940M1150 300V770M1040 462H1260M1040 610H1150M1150 660H1260M280 770V1200M1000 1020H1335';
const entries='M195 215V300M367 205V300M627 240V300M832 230V300M1060 240V300M1240 240V300M250 475V505M250 635V650M172 735V770M352 735V770M580 410V445M807 410V445M1057 450V462M1240 450V462M1057 590V610M1240 640V660M1150 489H1180M1057 710V770M1247 726V770M600 920V945M807 920V945M600 945V970M807 945V970M572 1070V1090M700 1070V1090M835 1070V1090M180 930V905H280M310 1000H280M695 1200V1240';
const trees=[
 ...Array.from({length:16},(_,i)=>({x:110+i*77,y:35,flower:false})),
 ...[120,240,390,540,680,860,1010,1130].flatMap(y=>[{x:33,y,flower:false},{x:1348,y,flower:false}]),
 ...[{x:524,y:463},{x:542,y:542},{x:525,y:620},{x:838,y:463},{x:826,y:542},{x:839,y:620},{x:322,y:843},{x:368,y:881},{x:117,y:840},{x:208,y:831},{x:1249,y:1050},{x:1000,y:1095},{x:1290,y:1100},{x:1110,y:1153},{x:330,y:1115},{x:160,y:1120},{x:1000,y:110},{x:1285,y:110}].map(p=>({...p,flower:true})),
];
const lamps=[[425,335],[478,525],[425,805],[478,995],[905,335],[958,525],[905,805],[958,995],[659,811],[712,1025],[1117,344],[1169,688]];
const benches=[[604,658],[759,658],[174,906],[1060,1030],[1210,1155],[320,1130]];
</script>
