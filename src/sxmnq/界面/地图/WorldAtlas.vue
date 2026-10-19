<template>
  <section class="world-atlas" aria-label="四大特区世界地图">
    <div class="world-caption"><span>四大特区 · 大陆与海域</span><span>点击地名查看 · 拖动平移 · 滚轮缩放</span></div>
    <div class="world-canvas">
      <svg ref="paper" :viewBox="viewBox" role="group" aria-label="包含海洋、森林、沙漠、雪山、群岛和分散污染裂隙的世界地图" @wheel.prevent="wheel" @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end">
        <defs>
          <linearGradient id="wa-sea" x2=".6" y2="1"><stop stop-color="#192f32" /><stop offset="1" stop-color="#102225" /></linearGradient>
          <linearGradient id="wa-land" x2=".4" y2="1"><stop stop-color="#687060" /><stop offset=".48" stop-color="#5e6247" /><stop offset="1" stop-color="#374d3c" /></linearGradient>
          <radialGradient id="wa-desert"><stop stop-color="#a78b52" /><stop offset="1" stop-color="#75673e" /></radialGradient>
          <linearGradient id="wa-snow" x2="0" y2="1"><stop stop-color="#b6c8c0" /><stop offset="1" stop-color="#647c73" /></linearGradient>
          <pattern id="wa-waves" width="96" height="42" patternUnits="userSpaceOnUse"><path d="M0 13q12-8 24 0t24 0t24 0t24 0M-24 34q12-7 24 0t24 0t24 0t24 0t24 0" fill="none" stroke="#648681" stroke-width=".75" opacity=".22" /></pattern>
          <pattern id="wa-grain" width="19" height="17" patternUnits="userSpaceOnUse"><circle cx="4" cy="6" r=".8" fill="#dfd5a0" opacity=".16" /><path d="M11 12l3-1" stroke="#18291d" opacity=".2" /></pattern>
          <pattern id="wa-sand" width="80" height="48" patternUnits="userSpaceOnUse"><path d="M-8 32q24-35 62-4M25 48q24-30 64-4" fill="none" stroke="#e0c38a" stroke-width="1.3" opacity=".28" /></pattern>
          <path id="wa-continent" d="M241 164l43-21 17-42 54-21 16-27 67 4 37-24 65 18 57-11 66 32 25 44 58 2 18 46 49 22 16 43 51 18 27 51-17 28 34 27-22 38 20 38-40 24-8 42-47 29-2 48-34 28-35 53-59 19-11 36-57 10-43 49-49-6-18-38-47 2-49-28-36-47-45-3-20-45-45-29-27-40-49-14-28-44-40-8-16-47-50-25 12-55-14-38 36-30 7-51 33-15 8-42 36-24z" />
          <clipPath id="wa-coast"><use href="#wa-continent" /></clipPath>
          <symbol id="wa-pine" viewBox="0 0 28 43"><path d="M14 0L2 22h6L0 33h11v10h6V33h11l-8-11h6z" fill="#243c2c" stroke="#7a9164" stroke-width=".6" /><path d="M14 9v24" stroke="#91a579" opacity=".35" /></symbol>
          <symbol id="wa-jungle" viewBox="0 0 35 42"><path d="M17 23v19" stroke="#8d8960" stroke-width="3" /><path d="M17 29C0 30-4 18 5 13 2 1 20-5 24 7c13-1 15 19-7 22z" fill="#2b4732" stroke="#8a9b65" stroke-width=".6" /><path d="M17 9v20m0-10-9-3m9 7 9-8" stroke="#a1ae70" opacity=".3" /></symbol>
          <symbol id="wa-mountain" viewBox="0 0 75 72"><path d="M2 69L34 1l39 68z" fill="#71847d" stroke="#c2ccb3" stroke-width=".8" /><path d="M34 1l-8 24 9-7 8 10 7-2z" fill="#d2ded5" /><path d="M34 1l6 43 33 25H47z" fill="#3f5a55" opacity=".6" /><path d="M34 31L15 66" stroke="#a1b3a6" fill="none" /></symbol>
          <symbol id="wa-crack" viewBox="0 0 92 58"><path d="M1 28l17-9 11 5 16-18 11 15 16-6 19 11-17 13-14-3-13 17-17-16-15 4z" fill="#654453" opacity=".8" /><path d="M3 28l24-2 18-17 4 21 25-6 15 3M49 30l-14 17m14-17 16 9" stroke="#ca8292" stroke-width="1.8" fill="none" /><ellipse cx="46" cy="29" rx="43" ry="27" stroke="#d39196" stroke-dasharray="3 5" fill="none" opacity=".6" /></symbol>
        </defs>
        <rect x="-900" y="-900" width="3000" height="2500" fill="url(#wa-sea)" /><rect width="1200" height="800" fill="url(#wa-waves)" />
        <g fill="none" stroke="#698781" opacity=".27"><use href="#wa-continent" stroke-width="20" /><use href="#wa-continent" stroke-width="42" /><use href="#wa-continent" stroke-width="66" opacity=".5" /></g>
        <use href="#wa-continent" fill="url(#wa-land)" stroke="#c1bd89" stroke-width="2" />
        <g clip-path="url(#wa-coast)">
          <path d="M165 244q165-123 237 66l31 203-88 91-210-163z" fill="url(#wa-desert)" /><path d="M165 244q165-123 237 66l31 203-88 91-210-163z" fill="url(#wa-sand)" />
          <path d="M227 27l548-5 7 196-126 52-101-20-97-46-125 18-90-80z" fill="url(#wa-snow)" />
          <path d="M344 501q135-42 247-5t176 66l-40 241-387-14-71-139z" fill="#3c573e" />
          <path d="M653 217q54 59 132 53l101 179-89 68-73-130-92-62z" fill="#748463" opacity=".6" />
          <path d="M578 182q-30 43-8 75t-7 67q-17 45 39 59t62 64q0 37 48 48t23 56" fill="none" stroke="#223f40" stroke-width="12" /><path d="M578 182q-30 43-8 75t-7 67q-17 45 39 59t62 64q0 37 48 48t23 56" fill="none" stroke="#92afa0" stroke-width="2" opacity=".65" />
          <path d="M547 525q-8 38-39 64t-39 82M695 416q47-21 80-21t48-23" fill="none" stroke="#46736b" stroke-width="7" /><ellipse cx="511" cy="575" rx="30" ry="17" fill="#294c4a" stroke="#9daa87" /><ellipse cx="342" cy="365" rx="18" ry="10" fill="#426657" stroke="#bac081" />
          <g opacity=".9"><use v-for="(m, i) in mountains" :key="i" href="#wa-mountain" :x="m.x" :y="m.y" :width="m.w" :height="m.w" /></g>
          <use v-for="(tree, i) in trees" :key="`tree${i}`" :href="tree.jungle ? '#wa-jungle' : '#wa-pine'" :x="tree.x" :y="tree.y" :width="tree.w" :height="tree.w * 1.3" />
          <g stroke="#dbc18a" fill="none" opacity=".5"><path d="M182 321q31-36 87-20m-84 74q40-35 81-16m-47 72q45-40 88-15m-30 51q31-26 68-14m-79-182q29-26 61-14" /><path d="M384 429l8-33 13 34m-15-14h13M258 484l10-28 11 29m-14-12h13" /></g>
          <rect width="1200" height="800" fill="url(#wa-grain)" />
        </g>
        <!-- 离岸群岛与浅海。浮岛特区仍保持大陆东侧的原设定。 -->
        <g fill="#64775b" stroke="#c3c192" stroke-width="1.5"><path d="M866 222l24-19 30 6 14 24-20 20-36-9z" /><path d="M952 289l41-23 32 12 18 35-27 22-38-8z" /><path d="M888 388l19-25 37 6 11 25-24 22-28-7z" /><path d="M1010 427l18-13 25 9-3 17-23 9z" /><path d="M878 488l14-8 14 15-13 13-17-6z" /><path d="M995 187l15-10 11 12-7 10z" /><path d="M1075 352l12-5 9 11-13 8z" /></g>
        <g fill="none" stroke="#97b7a2" opacity=".45"><ellipse cx="981" cy="303" rx="66" ry="48" /><ellipse cx="902" cy="229" rx="47" ry="32" /><ellipse cx="924" cy="397" rx="45" ry="30" /></g>
        <g fill="none" stroke="#b8ae77" stroke-width="2" stroke-dasharray="4 6" opacity=".75"><path d="M603 401Q482 323 424 164M603 401Q438 417 249 375M603 401Q577 526 521 644M603 401Q774 331 976 307" /><path d="M846 350q42-65 128-40" stroke="#8eaba5" /></g>
        <g fill="#c7c08b"><circle cx="459" cy="302" r="3" /><circle cx="369" cy="401" r="3" /><circle cx="570" cy="513" r="3" /><circle cx="758" cy="356" r="3" /></g>
        <g class="pollution-node" v-for="(裂隙, i) in cracks" :key="`crack${i}`" role="button" tabindex="0" :aria-label="`污染裂隙 ${i + 1}：查看封锁情报`" @click.stop="select('abyss')" @keydown.enter.prevent="select('abyss')" @keydown.space.prevent="select('abyss')">
          <use href="#wa-crack" :x="裂隙.x" :y="裂隙.y" :width="裂隙.w" :height="裂隙.w * .63" />
        </g>
        <g class="land-labels" fill="#c1bc94" font-size="13" letter-spacing="4" pointer-events="none"><text x="197" y="418">赤沙盆地</text><text x="488" y="197">凛冬山脉</text><text x="468" y="709">低地雨林</text><text x="968" y="392">季风海域</text><text x="94" y="587" transform="rotate(-24 94 587)">西侧外海</text><text x="923" y="548" transform="rotate(10 923 548)">东 部 深 海</text><text x="413" y="303" font-size="11" fill="#c58d96">封锁裂隙</text></g>
        <g class="world-place" v-for="place in places" :key="place.id" :transform="`translate(${place.x},${place.y})`" role="button" tabindex="0" :aria-label="`查看${place.name}`" :aria-current="当前位置 === place.id ? 'location' : undefined" @click.stop="select(place.id)" @keydown.enter.prevent="select(place.id)" @keydown.space.prevent="select(place.id)">
          <circle r="31" fill="#17241c" fill-opacity=".94" stroke="#d1bf83" stroke-width="1.5" /><circle r="39" fill="none" stroke="#b7ab77" stroke-dasharray="2 6" opacity=".7" />
          <g v-if="place.id === 'tower'" stroke="#e0d2a3" fill="none" stroke-width="2"><path d="M-12 15h24M-8 13V-6l8-16 8 16v19M-13-5h26M0-21v36M-6 3H6" /></g>
          <g v-else-if="place.id === 'north'" stroke="#cad8cc" fill="none" stroke-width="1.7"><path d="M-17 12L-3-17l19 29zM-3-17l-3 12 6-4 6 7" /></g>
          <g v-else-if="place.id === 'west'" stroke="#e1c38e" fill="none" stroke-width="1.7"><path d="M-19 7q17-25 37 2M-18 14q18-18 37 0M-14-6q8-9 18-4" /></g>
          <g v-else-if="place.id === 'south'" stroke="#b4c79a" fill="none" stroke-width="1.7"><path d="M0 19v-30M0 4q-17 0-15-14 15 0 15 14m0-8q16-3 15-16Q0-18 0-4" /></g>
          <g v-else stroke="#b6cec2" fill="none" stroke-width="1.7"><path d="M0-17v24m0-14 12 12H0M-15 8h30l-5 8h-20zM-19 22q9-5 18 0t19 0" /></g>
          <path v-if="当前位置 === place.id" d="M0-54l-8-12h16z" fill="#ebd59a" />
          <rect x="-84" y="45" width="168" height="43" rx="2" fill="#15231e" fill-opacity=".92" stroke="#a99f70" stroke-opacity=".5" />
          <text y="63" text-anchor="middle" fill="#e2d3a6" font-size="18" letter-spacing="2">{{ place.name }}</text><text y="80" text-anchor="middle" fill="#aeb69a" font-size="11">{{ place.sub }}</text>
        </g>
        <g transform="translate(1090,663)" stroke="#b9b083" fill="none" pointer-events="none"><circle r="38" stroke-opacity=".5" /><path d="M0-48v96M-48 0h96M0-35l8 35-8 35-8-35z" /><path d="M-35 0l35-8 35 8-35 8z" opacity=".5" /><text y="-55" text-anchor="middle" fill="#d2c898" stroke="none" font-size="14">N</text></g>
        <g fill="#a1ab93" font-size="11" letter-spacing="2" pointer-events="none"><text x="54" y="744">白塔辖区地貌示意 · 航线与污染裂隙</text><path d="M54 762h120m-120-4v8m60-8v8m60-8v8" stroke="#a1ab93" /></g>
      </svg>
      <div class="world-tools"><button aria-label="放大世界地图" @click="zoom(1.25)">＋</button><button aria-label="缩小世界地图" @click="zoom(.8)">−</button><button @click="reset">全图</button></div>
    </div>
    <div class="world-legend"><span><i class="ocean" />海洋与浅海</span><span><i class="snow" />雪山</span><span><i class="forest" />雨林</span><span><i class="sand" />沙漠</span><button @click="select('abyss')"><i class="pollution" />污染裂隙 · 多处封锁</button></div>
    <nav class="place-links" aria-label="世界地图地点"><button v-for="place in places" :key="place.id" :aria-current="当前位置 === place.id ? 'location' : undefined" @click="select(place.id)">{{ place.name }}<span v-if="当前位置 === place.id"> · 当前位置</span></button></nav>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
defineProps<{ 当前位置?: string }>();
const emit = defineEmits<{ 选择: [id: string] }>();
const places = [
  { id: 'north', name: '极北 · 凛冬', sub: '重工业 / 军备', x: 426, y: 142 },
  { id: 'west', name: '极西 · 狂沙', sub: '矿产 / 能源', x: 249, y: 355 },
  { id: 'tower', name: '白塔', sub: '中央庇护所 · 点击进入', x: 603, y: 389 },
  { id: 'east', name: '极东 · 浮岛', sub: '商贸 / 物流', x: 976, y: 294 },
  { id: 'south', name: '极南 · 森海', sub: '医药 / 向导素', x: 521, y: 622 },
];
const mountains = Array.from({ length: 22 }, (_, i) => ({ x: 292 + (i % 11) * 34, y: 55 + Math.floor(i / 11) * 58 + ((i * 17) % 31), w: 52 + (i * 7) % 29 }));
const trees = Array.from({ length: 100 }, (_, i) => ({ x: 338 + ((i * 47) % 360), y: 487 + ((i * 37) % 203), w: 18 + ((i * 7) % 13), jungle: true })).concat(Array.from({ length: 38 }, (_, i) => ({ x: 622 + ((i * 43) % 143), y: 222 + ((i * 31) % 228), w: 17 + (i % 8), jungle: false })));
const cracks = [{ x: 434, y: 268, w: 87 }, { x: 361, y: 472, w: 78 }, { x: 686, y: 475, w: 104 }, { x: 764, y: 290, w: 70 }, { x: 596, y: 567, w: 78 }];
const paper = ref<SVGSVGElement>();
const view = ref({ x: 0, y: 0, w: 1200, h: 800 });
const viewBox = computed(() => `${view.value.x} ${view.value.y} ${view.value.w} ${view.value.h}`);
let drag: { id: number; x: number; y: number; screenX: number; screenY: number; moved: boolean } | undefined;
let suppressClick = false;
function select(id: string) { if (!suppressClick) emit('选择', id); }
function clamp() { view.value.x = Math.max(-70, Math.min(1270 - view.value.w, view.value.x)); view.value.y = Math.max(-50, Math.min(850 - view.value.h, view.value.y)); }
function zoom(factor: number, cx = view.value.x + view.value.w / 2, cy = view.value.y + view.value.h / 2) { const old = view.value; const w = Math.max(400, Math.min(1200, old.w / factor)), ratio = w / old.w; view.value = { x: cx - (cx - old.x) * ratio, y: cy - (cy - old.y) * ratio, w, h: w * 2 / 3 }; clamp(); }
function reset() { view.value = { x: 0, y: 0, w: 1200, h: 800 }; }
function wheel(event: WheelEvent) { const p = point(event); if (p) zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12, p.x, p.y); }
function point(event: PointerEvent | WheelEvent) { const matrix = paper.value?.getScreenCTM(); if (!matrix || !paper.value) return; const p = paper.value.createSVGPoint(); p.x = event.clientX; p.y = event.clientY; return p.matrixTransform(matrix.inverse()); }
function start(event: PointerEvent) { if (event.button !== 0 || !event.isPrimary) return; const p = point(event); if (!p) return; suppressClick = false; drag = { id: event.pointerId, x: p.x, y: p.y, screenX: event.clientX, screenY: event.clientY, moved: false }; }
function move(event: PointerEvent) { if (!drag || drag.id !== event.pointerId) return; if (!drag.moved && Math.hypot(event.clientX - drag.screenX, event.clientY - drag.screenY) < 5) return; const p = point(event); if (!p) return; drag.moved = true; paper.value?.setPointerCapture(event.pointerId); view.value.x += drag.x - p.x; view.value.y += drag.y - p.y; clamp(); }
function end(event: PointerEvent) { if (!drag || drag.id !== event.pointerId) return; suppressClick = drag.moved; if (paper.value?.hasPointerCapture(event.pointerId)) paper.value.releasePointerCapture(event.pointerId); drag = undefined; window.setTimeout(() => { suppressClick = false; }, 0); }
</script>

<style scoped>
.world-atlas{border:1px solid #736d4b;background:#172824;color:#d6cba6}.world-caption{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:10px 14px;font-size:11px;letter-spacing:1px;border-bottom:1px solid #5d684c}.world-caption span+span{color:#a0b19c;font-size:10px}.world-canvas{position:relative;overflow:hidden}.world-canvas svg{display:block;width:100%;aspect-ratio:3/2;touch-action:none;user-select:none}.world-place,.pollution-node{cursor:pointer;outline:none}.world-place:hover>circle,.world-place:focus-visible>circle{stroke:#f3dda0;stroke-width:3;fill:#354432}.pollution-node:hover,.pollution-node:focus-visible{filter:brightness(1.6)}.world-tools{position:absolute;right:10px;bottom:10px;display:flex;gap:4px}.world-tools button,.place-links button,.world-legend button{font:inherit;color:#dbcea5;border:1px solid #737851;background:#1c2c23;padding:6px 10px;cursor:pointer}.world-tools button:hover,.place-links button:hover{background:#3d4c32}.world-tools{font-size:12px}.world-legend{display:flex;flex-wrap:wrap;gap:15px;align-items:center;padding:10px 14px;border-top:1px solid #626c4e;font-size:10px;color:#b9c0a4}.world-legend span,.world-legend button{display:flex;gap:6px;align-items:center}.world-legend button{padding:4px 7px;font-size:10px}.world-legend i{width:9px;height:9px;border:1px solid #adad80;display:inline-block}.ocean{background:#294b4a}.snow{background:#b2c4b9}.forest{background:#3f653f}.sand{background:#b09159}.pollution{background:#a2677e}.place-links{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 12px;font-size:11px}@media(max-width:540px){.world-caption{padding:8px;font-size:10px}.world-legend{gap:9px;padding:8px}.world-tools{right:6px;bottom:6px}.place-links{padding:0 8px 10px}.world-caption span+span{font-size:9px}}
</style>
<style scoped>
.world-atlas { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.world-caption, .world-legend, .place-links { flex: none; }
.world-canvas { flex: 1; min-height: 0; background: radial-gradient(ellipse at center, #243c36, #142723); }
.world-canvas svg { height: 100%; aspect-ratio: auto; cursor: grab; }
.world-canvas svg:active { cursor: grabbing; }
.place-links { gap: 6px; margin: 0; }
.place-links button { flex: 1; min-height: 32px; white-space: nowrap; }
.place-links button[aria-current] { border-color: #9dc8b4; color: #c0e2cd; }
.world-tools button:focus-visible, .place-links button:focus-visible, .world-legend button:focus-visible { outline: 2px solid #e5d4a0; outline-offset: 2px; }
@media (max-width: 540px) {
  .world-caption { gap: 5px; }
  .world-caption span+span { font-size: 10px; letter-spacing: 0; }
  .world-legend { padding: 8px; gap: 8px 10px; }
  .place-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 0 8px 8px; }
  .place-links button { padding: 6px 4px; }
  .place-links button:nth-child(3) { grid-column: 1 / -1; grid-row: 1; }
}
</style>
