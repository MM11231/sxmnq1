<template>
  <div class="map-atmosphere" :class="[effect, { night: period === 2, paused: !motion || hidden }]" :data-effect="effect">
    <svg class="weather-art" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      <rect class="weather-tint" width="1000" height="1000" />
      <g v-if="effect === 'fog'" class="mist"><path d="M-300 220Q100 70 500 220T1400 220V340Q1000 190 600 340T-300 340Z"/><path d="M-300 650Q100 500 500 650T1400 650V790Q1000 640 600 790T-300 790Z"/></g>
      <g v-else-if="effect === 'frost'" class="frost-lines"><path d="M0 160V0H180M0 70l90-70M1000 830v170H810m190-80-90 80"/></g>
      <g v-for="particle in particles" :key="effect + particle.id" :transform="`translate(${particle.x},-35)`">
        <g class="particle" :style="{ '--duration': particle.duration + 's', '--delay': particle.delay + 's', '--drift': particle.drift + 'px', '--alpha': particle.alpha }">
          <path v-if="effect === 'rain'" d="M0 0l-9 32" class="rain-streak" />
          <circle v-else-if="effect === 'snow'" :r="particle.size" class="snowflake" />
          <g v-else class="flutter" :style="{ '--turn': particle.turn + 'deg' }">
            <path v-if="effect === 'petals'" d="M-5 0Q-8-8 0-6Q8-9 7-2Q5 6-5 0Z" class="petal" />
            <g v-else-if="effect === 'leaves'"><path d="M-8-3Q5-14 11-7Q12 6-8-3Z" class="leaf"/><path d="m-8-3 17-3" class="leaf-vein"/></g>
            <circle v-else :r="particle.size * .65" class="mote" />
          </g>
        </g>
      </g>
    </svg>
    <div v-if="weather || season" class="weather-status"><span>{{ season }}<template v-if="season && weather"> · </template>{{ weather }}</span><button :aria-pressed="motion" :aria-label="motion ? '暂停地图动态' : '开启地图动态'" @click="motion = !motion">{{ motion ? 'Ⅱ' : '▷' }}</button></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
const props = defineProps<{ weather?: string; season?: string; period?: number }>();
const motion = ref(true), hidden = ref(false);
const effect = computed(() => {
  const weather = props.weather ?? '', season = props.season ?? '';
  if (/雪|冰雹/.test(weather)) return 'snow';
  if (/雨/.test(weather)) return 'rain';
  if (/雾/.test(weather)) return 'fog';
  if (/春/.test(season)) return 'petals';
  if (/秋/.test(season)) return 'leaves';
  if (/夏/.test(season)) return 'motes';
  if (/冬/.test(season)) return 'frost';
  return 'clear';
});
const particles = computed(() => {
  const kind = effect.value, heavy = /大雪|雷|暴|大雨/.test(props.weather ?? '');
  const count = kind === 'rain' ? heavy ? 68 : 42 : kind === 'snow' ? heavy ? 42 : 25 : kind === 'motes' ? 9 : ['petals','leaves'].includes(kind) ? 14 : 0;
  return Array.from({ length: count }, (_, id) => ({
    id, x: (id * 137.51 + 27) % 1080 - 40, size: 1.5 + id % 3,
    duration: kind === 'rain' ? .85 + id % 7 * .09 : kind === 'snow' ? 8 + id % 7 : 15 + id % 9,
    delay: -(id * 2.37), drift: kind === 'rain' ? -210 : 55 + id % 7 * 20,
    alpha: kind === 'rain' ? .16 + id % 4 * .05 : .32 + id % 4 * .1,
    turn: id % 2 ? 180 : -150,
  }));
});
function updateVisibility() { hidden.value = document.hidden; }
onMounted(() => { updateVisibility(); document.addEventListener('visibilitychange', updateVisibility); });
onUnmounted(() => document.removeEventListener('visibilitychange', updateVisibility));
</script>

<style scoped>
.map-atmosphere{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1}
.weather-art{display:block;width:100%;height:100%;overflow:hidden;pointer-events:none}
.weather-tint{fill:#6c9187;opacity:0;transition:opacity 1s}
.rain .weather-tint{opacity:.055}.snow .weather-tint,.frost .weather-tint{fill:#b6c9c8;opacity:.045}.fog .weather-tint{fill:#a6b6ab;opacity:.055}.night .weather-tint{fill:#0b1628;opacity:.13}
.particle{animation:fall var(--duration) linear var(--delay) infinite;opacity:var(--alpha);will-change:transform}
.rain-streak{stroke:#c7d8d2;stroke-width:1.1;fill:none;stroke-linecap:round}
.snowflake{fill:#dce8df}.petal{fill:#d0a5ac;stroke:#e1bac0;stroke-width:.5}.leaf{fill:#b59760;stroke:#d1b77e;stroke-width:.6}.leaf-vein{fill:none;stroke:#716445;stroke-width:.6}.mote{fill:#cfcc9d}
.flutter{animation:flutter 4.8s ease-in-out var(--delay) infinite alternate}
.mist{fill:#b2c2b8;opacity:.065;animation:mist 24s ease-in-out infinite alternate}
.frost-lines{fill:none;stroke:#d3e1d8;stroke-width:2;opacity:.18}
.weather-status{position:absolute;right:8px;top:8px;display:flex;align-items:center;gap:5px;background:#19241de3;border:1px solid #77816480;color:#c8cbb5;padding:3px 5px;font-size:11px;letter-spacing:0;max-width:calc(100% - 150px)}
.weather-status span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.weather-status button{pointer-events:auto;flex:none;border:0;background:none;color:#c9bc94;cursor:pointer;font:inherit;padding:3px 5px;min-width:24px}
.weather-status button:focus-visible{outline:2px solid #c8b681}
.paused .particle,.paused .flutter,.paused .mist{animation-play-state:paused}
@keyframes fall{from{transform:translate(0,-40px)}to{transform:translate(var(--drift),1100px)}}
@keyframes flutter{from{transform:rotate(-25deg) scaleX(.55)}to{transform:rotate(var(--turn)) scaleX(1)}}
@keyframes mist{from{transform:translateX(-70px)}to{transform:translateX(80px)}}
@media(prefers-reduced-motion:reduce){.particle{display:none}.mist{animation:none}.weather-tint{transition:none}.weather-status button{display:none}}
@media(max-width:760px){.weather-status{top:5px;right:5px;font-size:10px;padding:1px 4px}.rain-streak{stroke-width:1.7}}
</style>
