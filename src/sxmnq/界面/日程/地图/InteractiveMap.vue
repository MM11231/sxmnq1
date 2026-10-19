<template>
  <section :data-season="season" class="atlas" :class="{ compact, 'exploration-atlas': activityMode }" aria-label="白塔可交互城区地图">
    <header class="atlas-header">
      <div><span class="eyebrow">WHITE TOWER / DISTRICT ATLAS</span><h2>白塔辖区 <small>城市导览图</small></h2></div>
      <span class="edition">哨向模拟器 · 城区 01</span>
    </header>
    <div class="toolbar">
      <label class="search"><span aria-hidden="true">⌕</span><input v-model="query" placeholder="找地点、行动…" aria-label="查找地点" @keydown.esc.stop="query = ''" /><button v-if="query" class="clear-search" aria-label="清空地点搜索" @click="query = ''">×</button></label>
      <div class="filters"><button :class="{ active: filter === '全部' }" :aria-pressed="filter === '全部'" @click="focusDistrict('全部')">全城</button><button v-for="district in districts" :key="district" :class="{ active: filter === district }" :aria-pressed="filter === district" @click="focusDistrict(district)"><i :style="{ background: districtColors[district] }" />{{ district }}</button></div>
      <select class="district-select" :value="filter" aria-label="选择地图区域" @change="focusDistrict(($event.target as HTMLSelectElement).value as District | '全部')"><option value="全部">全城</option><option v-for="district in districts" :key="district" :value="district">{{ district }}</option></select>
      <details v-if="activityMode" ref="索引" class="map-directory" @keydown.esc.stop="关闭索引"><summary>地点 · {{ visibleLocations.length }}</summary><div><button v-for="地点 in visibleLocations" :key="地点.id" @click="selectLocation(地点)"><span>{{ 地点.name }}</span><small>{{ 地点.district }}</small></button><p v-if="!visibleLocations.length">没有找到地点，试试建筑名或行动名称。</p></div></details>
      <label class="art-style"><span>画法</span><select v-model="artMode" aria-label="建筑画法"><option value="solid">立体色块</option><option value="outline">线稿轮廓</option></select></label>
    </div>
    <div class="map-layout" :class="{ 'has-selection': activityMode && selected }" @keydown.esc.stop="关闭地点" @pointerdown="关闭索引">
      <div class="map-frame">
        <svg ref="svgElement" class="map" :viewBox="viewBox" role="group" aria-label="白塔俯视平面地图，建筑可使用 Tab 选择，回车查看" @pointerdown="startDrag" @pointermove="moveDrag" @pointerup="endDrag" @pointercancel="endDrag" @wheel.prevent="onWheel">
          <defs>
            <pattern id="wt-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#c3b88b" stroke-opacity=".045" /></pattern>
            <pattern id="wt-roof" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 0H9M0 4H9M4 0V4M8 4V9" stroke="#d9c997" stroke-opacity=".18" fill="none" /></pattern>
            <pattern id="wt-floor" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="#dfd2ac" stroke-opacity=".12" /></pattern>
            <pattern id="wt-water" width="30" height="16" patternUnits="userSpaceOnUse"><path d="M0 8Q7 0 15 8T30 8" fill="none" stroke="#75a5a6" stroke-opacity=".45" /></pattern>
            <pattern id="wt-lawn" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="var(--land-lawn, #243025)" /><path d="M0 9 9 0l9 9-9 9ZM4 9h10M9 4v10" fill="none" stroke="#71805b" stroke-opacity=".35" stroke-width=".8" /><path d="m1 1 3 3m10 10 3 3m0-16-3 3M4 14l-3 3" stroke="#89946c" stroke-opacity=".3" /></pattern>
            <pattern id="wt-stone" width="32" height="24" patternUnits="userSpaceOnUse"><rect width="32" height="24" fill="var(--land-stone, #33362e)" /><path d="M0 0h32M0 12h32M0 24h32M16 0v12M8 12v12M28 12v12" fill="none" stroke="#a39b7b" stroke-opacity=".34" /><path d="M2 2h12M18 2h12M10 14h16" stroke="#d2c5a0" stroke-opacity=".11" /></pattern>
            <pattern id="wt-gravel" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="var(--land-gravel, #33322a)" /><g fill="#a69b7d" opacity=".38"><circle cx="4" cy="5" r="1" /><circle cx="15" cy="3" r=".8" /><circle cx="11" cy="14" r="1.2" /><circle cx="20" cy="18" r=".8" /><circle cx="2" cy="20" r=".7" /></g><path d="m6 17 3-1m7-8 3 1" stroke="#706b55" /></pattern>
            <pattern id="wt-deck" width="12" height="36" patternUnits="userSpaceOnUse"><rect width="12" height="36" fill="var(--land-deck, #40362a)" /><path d="M0 0v36M6 0v36M0 18h6M6 0h6" stroke="#a09068" stroke-opacity=".45" /><path d="M2 1v15M8 20v12" stroke="#c0a779" stroke-opacity=".15" /></pattern>
            <pattern id="wt-flowerbed" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="var(--land-bed, #2a3526)" /><path d="M0 12h24M12 0v24" stroke="#728154" stroke-opacity=".35" /><g fill="#b69b8a" opacity=".65"><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /></g><g fill="#a5b17a" opacity=".55"><path d="m18 3 3 3-3 3-3-3ZM6 15l3 3-3 3-3-3Z" /></g></pattern>
            <symbol id="wt-tree" viewBox="0 0 30 36"><path d="M15 26v9" stroke="#776b4e" stroke-width="3" /><path d="M15 0 27 15h-5l7 12H1l7-12H3Z" fill="var(--land-tree, #344333)" stroke="#7a8860" stroke-width="1" /><path d="M15 4v22" stroke="#8f966e" opacity=".35" /></symbol>
            <symbol id="wt-flower" viewBox="0 0 40 50"><ellipse cx="21" cy="46" rx="14" ry="3" fill="#0e1611" opacity=".7" /><path d="M19 45V22m0 14-9-10m9 8 10-12" fill="none" stroke="#b49b75" stroke-width="3" /><path d="M16 45h8" stroke="#b49b75" stroke-width="2" /><path d="M7 30C0 28 0 19 5 16 1 10 9 5 14 7 15 0 24 0 27 6 35 3 40 11 36 17 43 24 35 32 29 30 23 36 13 34 7 30Z" fill="var(--land-flower, #926b7c)" stroke="var(--land-flower-edge, #d0a3af)" stroke-width="1.2" /><path d="M7 19c3-5 9-5 13-1m1-9c5-2 10 2 11 7M13 27c4 3 10 2 13-1" fill="none" stroke="#d5b3b7" stroke-width="1" /><g fill="#e3c1bd"><circle cx="10" cy="12" r="1.8" /><circle cx="23" cy="8" r="1.6" /><circle cx="29" cy="21" r="1.8" /><circle cx="15" cy="24" r="1.7" /><circle cx="20" cy="16" r="1.4" /></g></symbol>
            <symbol id="wt-lamp" viewBox="0 0 12 26"><path d="M6 8v17M2 25h8" stroke="#b5a477" stroke-width="2" /><rect x="2" y="2" width="8" height="8" rx="2" fill="#cfb77d" /><circle cx="6" cy="6" r="6" fill="#e8cd8d" opacity=".12" /></symbol>
          </defs>
          <CityGround />
          <g v-for="location in locations" :key="location.id" class="building" :class="{ selected: selectedId === location.id, muted: !matches(location), current: currentLocationId === location.id }" :transform="`translate(${location.x},${location.y})`" role="button" tabindex="0" :aria-label="`${location.name}，${location.district}，点击展开立体建筑`" :aria-pressed="selectedId === location.id" @click="点击建筑(location)" @keydown.enter.prevent="点击建筑(location)" @keydown.space.prevent="点击建筑(location)">
            <title>{{ location.name }} · {{ location.access }}</title>
            <rect x="5" y="7" :width="location.w" :height="location.h" rx="2" fill="#080d0c" opacity=".65" />
            <rect class="footprint" :width="location.w" :height="location.h" rx="2" :fill="location.kind === 'garden' ? 'var(--land-lawn, #2a382a)' : 'var(--land-building, #30312a)'" :stroke="districtColors[location.district]" stroke-width="1.5" />
            <rect x="5" y="5" :width="location.w - 10" :height="location.h - 10" fill="url(#wt-roof)" :stroke="districtColors[location.district]" stroke-opacity=".4" />
            <template v-if="location.kind === 'tower'">
              <path :d="`M${location.w / 2} 8 ${location.w - 13} ${location.h / 2} ${location.w / 2} ${location.h - 8} 13 ${location.h / 2}Z`" fill="#494939" :stroke="districtColors[location.district]" />
              <path :d="`M${location.w / 2} 8v${location.h - 16}M13 ${location.h / 2}h${location.w - 26}`" stroke="#b3a77d" stroke-opacity=".45" /><circle :cx="location.w / 2" :cy="location.h / 2" r="12" fill="#888464" stroke="#ded0a1" />
            </template>
            <template v-else-if="location.kind === 'arena'">
              <rect x="12" y="14" :width="location.w - 24" :height="location.h - 28" rx="28" fill="#47422f" stroke="#b5a178" /><rect v-for="n in 3" :key="n" :x="24 + (n - 1) * 58" y="30" width="52" :height="location.h - 60" fill="url(#wt-floor)" stroke="#a19066" /><path :d="`M15 22h${location.w - 30}M15 ${location.h - 22}h${location.w - 30}`" stroke="#bbb085" stroke-dasharray="3 4" />
            </template>
            <template v-else-if="location.kind === 'garden'">
              <rect x="7" y="7" :width="location.w - 14" :height="location.h - 14" fill="url(#wt-lawn)" /><path :d="`M12 ${location.h / 2}h${location.w - 24}M${location.w / 2} 12v${location.h - 24}`" stroke="#94886b" stroke-width="8" /><ellipse :cx="location.w / 2" :cy="location.h / 2" :rx="location.w / 5" :ry="location.h / 4" fill="#344b46" stroke="#8f9d7d" /><ellipse :cx="location.w / 2" :cy="location.h / 2" :rx="location.w / 5 - 4" :ry="location.h / 4 - 4" fill="url(#wt-water)" /><use href="#wt-tree" x="10" y="10" width="23" height="30" /><use href="#wt-flower" :x="location.w - 37" :y="location.h - 47" width="30" height="38" />
            </template>
            <template v-else-if="location.h > 40">
              <rect x="12" y="12" :width="location.w - 24" :height="location.h - 24" fill="url(#wt-floor)" stroke="#a69a73" stroke-opacity=".4" /><path :d="`M${location.w / 2} 12v${location.h - 24}M12 ${location.h / 2}h${location.w - 24}`" stroke="#a69a73" stroke-opacity=".5" /><rect v-for="n in 3" :key="n" :x="15 + (n - 1) * (location.w - 36) / 2" y="8" width="7" height="5" fill="#bbac7c" opacity=".7" /><path :d="`M${location.w / 2 - 8} ${location.h - 4}h16`" stroke="#d3c395" stroke-width="3" />
            </template>
            <path v-if="season?.includes('冬')" :d="`M4 5h${location.w - 8}M6 9h${location.w - 12}`" stroke="#e3e9df" stroke-width="3" opacity=".85" pointer-events="none" />
            <template v-if="!总览">
              <rect :x="4" :y="(location.h - labelHeight(location)) / 2" :width="location.w - 8" :height="labelHeight(location)" rx="2" fill="#17201d" opacity=".9" />
              <text class="building-label" :font-size="buildingFont(location)" text-anchor="middle" fill="#f2e7c9"><tspan v-for="(line, i) in labelLines(location.name)" :key="i" :x="location.w / 2" :y="(location.h - labelHeight(location)) / 2 + 4 + buildingFont(location) * (1 + i * 1.2)">{{ line }}</tspan><tspan v-if="floorLabel(location.name)" :x="location.w / 2" :dy="buildingFont(location) * 1.15" :font-size="buildingFont(location) * .75" fill="#c4b891">{{ floorLabel(location.name) }}</tspan></text>
            </template>
            <path v-if="location.source === '扩展'" :d="`M${location.w - 11} 4v8m-4-4h8`" stroke="#c9b784" stroke-width="1.4" />
            <g v-if="currentLocationId === location.id" :transform="`translate(${location.w / 2},-12)`"><circle r="7" fill="#d9c89b" /><circle r="3" fill="#202923" /><text y="-13" text-anchor="middle" fill="#e4d6b0" font-size="11">当前位置</text></g>
          </g>
          <g v-if="总览" class="district-overview"><g v-for="区域 in 区域标记" :key="区域.name" :transform="`translate(${区域.x},${区域.y})`" role="button" tabindex="0" :aria-label="`展开${区域.name}`" @click="focusDistrict(区域.name)" @keydown.enter.prevent="focusDistrict(区域.name)" @keydown.space.prevent="focusDistrict(区域.name)"><rect :x="-(区域.name.length * districtLabelSize + 40) / 2" :y="-Math.max(42, 18 / mapScale)" :width="区域.name.length * districtLabelSize + 40" :height="Math.max(84, 36 / mapScale)" rx="5" fill="#19261fed" :stroke="districtColors[区域.name]" stroke-width="2"/><text text-anchor="middle" :y="districtLabelSize * .35" :fill="districtColors[区域.name]" :font-size="districtLabelSize">{{ 区域.name }}</text></g></g>
          <g v-if="!总览" class="cartography" fill="#a8ab8e" font-size="12" letter-spacing="2" pointer-events="none"><text x="560" y="95">北翼 · 医疗与恢复</text><text x="118" y="333">西翼 · 训练与考核</text><text x="1030" y="333">东翼 · 觉醒者居住区</text><text x="565" y="831">南翼 · 商业综合体</text><text x="115" y="1180" font-size="10">示意布局 · 非测绘比例</text><text x="676" y="754" font-size="10">中央中庭</text></g>
          <Transition name="building-rise">
            <g v-if="selected && raisedBounds" :key="selected.id" class="raised-building" role="button" tabindex="0" :aria-label="`收起${selected.name}立体建筑`" :style="{ transformOrigin: `${selected.x + selected.w / 2}px ${selected.y + selected.h}px` }" @click.stop="收起立体" @keydown.enter.prevent.stop="收起立体" @keydown.space.prevent.stop="收起立体">
              <title>{{ selected.name }} · 点击收回平面</title>
              <ellipse :cx="selected.x + selected.w / 2" :cy="selected.y + selected.h" :rx="raisedBounds.w * .34" :ry="raisedBounds.w * .07" fill="#07120e" opacity=".55" pointer-events="none" />
              <image class="raised-art" :href="(artMode === 'outline' ? buildingOutline : buildingArt)[selected.id]" :x="raisedBounds.x" :y="raisedBounds.y" :width="raisedBounds.w" :height="raisedBounds.h" preserveAspectRatio="xMidYMid meet" />
            </g>
          </Transition>
        </svg>
        <WeatherLayer :weather="sceneContext?.天气" :season="season" :period="sceneContext?.时段" />
        <div class="map-controls"><button aria-label="放大地图" @click="zoom(1.25)">＋</button><button aria-label="缩小地图" @click="zoom(0.8)">−</button><button @click="focusDistrict('全部')">全城</button><button v-if="currentLocation" class="locate-current" aria-label="定位当前位置" @click="selectLocation(currentLocation)">◎ 定位</button></div>
        <div v-if="query && !visibleLocations.length" class="empty-search" role="status">没有匹配地点<button @click="query = ''">清空搜索</button></div>
        <div class="map-caption"><span v-if="invitation" class="invitation-note">{{ invitation.姓名 }} · {{ invitation.主题 }}<button aria-label="前往邀约地点" @click="前往地点(invitation.地点id)">前往活动 ↗</button></span><span v-else class="map-breadcrumb">白塔 / {{ selected ? selected.name : query ? `搜索 · ${visibleLocations.length} 处` : filter === '全部' ? '全城导览' : filter }}</span><span>{{ selected ? '点击建筑收回平面' : 总览 ? '点击区域，展开建筑' : '点选建筑，立体展开' }}</span></div>
        <div class="terrain-legend" aria-label="地图装饰图例"><span><svg viewBox="0 0 40 50" width="22" height="28" aria-hidden="true"><use href="#wt-flower" width="40" height="50" /></svg>观花乔木</span><span><svg viewBox="0 0 30 36" width="18" height="25" aria-hidden="true"><use href="#wt-tree" width="30" height="36" /></svg>常绿树</span><span><i class="swatch lawn" />草坪</span><span><i class="swatch stone" />石铺广场</span><span><i class="swatch gravel" />碎石地</span><span><i class="swatch deck" />木栈平台</span><span><i class="swatch water" />水景</span></div>
      </div>
      <aside v-if="!activityMode || selected" ref="详情" class="details" aria-label="地点详情" aria-live="polite" tabindex="-1">
        <template v-if="selected">
          <header class="place-heading"><div><div class="detail-kicker"><span :style="{ color: districtColors[selected.district] }">{{ selected.district }}<template v-if="floorLabel(selected.name)"> · {{ floorLabel(selected.name) }}</template></span><span v-if="currentLocationId === selected.id">你在这里</span></div><h3>{{ selected.name.split(' · ')[0] }}</h3></div><button v-if="activityMode && !readOnly && 店名[selected.id]" class="shop-entry" @click="emit('shop', selected.id)">逛商店</button><button v-if="activityMode" class="close-details" aria-label="收起地点详情" @click="关闭地点">× 收起</button></header><div class="ornament">✦</div>
          <section v-if="scene" class="location-scene" aria-label="地点场景"><div class="action-label">眼前</div><p>{{ scene.描写 }}</p><p v-if="scene.闲谈" class="ambient-dialogue">{{ scene.闲谈 }}</p></section>
          <details v-if="scene" :key="selected.id" class="location-info"><summary>场景与地点介绍</summary><p class="mobile-scene-full">{{ scene.描写 }}<template v-if="scene.闲谈">{{ scene.闲谈 }}</template></p><p>{{ selected.description }}</p><p>通行 / 开放：{{ selected.access }}</p></details><template v-else><p>{{ selected.description }}</p><div class="access"><span>通行 / 开放</span><p>{{ selected.access }}</p></div></template>
          <div class="action-label" :class="{ 'activity-disabled': disabled || readOnly }">{{ readOnly ? '今日值班 · 休息日可在此行动' : disabled ? '今日活动已结束，或正在处理剧情' : '在这里，你可以' }}</div><div v-if="!readOnly" class="place-actions"><button v-for="action in (props.activityMode ? 地点活动(selected) : selected.actions)" :key="action" class="action" :disabled="disabled || (action === '参加活动' && (sceneContext?.时段 ?? 0) < (invitation?.最早时段 ?? 0))" @click="chooseAction(selected, action)"><span>{{ action }}<small v-if="props.activityMode" class="action-cost">{{ activityHint(selected, action) }}</small></span><span>↗</span></button></div>
          <p v-if="lastAction" class="action-feedback" role="status">已选择：{{ lastAction }}<span v-if="!connected"> · 等待接入剧情</span></p>
        </template>
        <template v-else><div class="detail-kicker">EXPLORE THE TOWER</div><h3>选一个地方，开始探索</h3><div class="ornament">✦</div><p>点击地图上的建筑，查看地点信息、通行条件与可选行动。</p></template>
        <details class="directory"><summary>地点索引 · {{ visibleLocations.length }}</summary><div class="directory-list"><button v-for="location in visibleLocations" :key="location.id" @click="selectLocation(location)"><i :style="{ background: districtColors[location.district] }" />{{ location.name }}</button><p v-if="!visibleLocations.length">没有匹配地点，试试其他关键词。</p></div></details>
      </aside>
    </div>
    <footer class="atlas-footer"><span>四大特区：极北 · 凛冬 / 极南 · 森海 / 极东 · 浮岛 / 极西 · 狂沙</span><span>离塔需许可 · 深渊地块属高危区域</span></footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { 活动列表 } from '../../../养成/规则';
import type { 邀约 } from '../../../养成/哨兵社交';
import { districtColors, districts, locations, type District, type MapLocation } from './locations';
import { buildingArt, buildingOutline } from './building-art';
import WeatherLayer from './WeatherLayer.vue';
import CityGround from './CityGround.vue';
import { 店名 } from '../../../购物/商品';
import { 地点场景, type 场景上下文 } from '../../../创作/场景';

const props = withDefaults(defineProps<{ currentLocationId?: string; connected?: boolean; activityMode?: boolean; sceneContext?: 场景上下文; season?: string; compact?: boolean; invitation?: 邀约 | null; readOnly?: boolean; disabled?: boolean }>(), { currentLocationId: '', connected: false, compact: false, disabled: false });
const artMode = ref<'solid' | 'outline'>('solid');
try { if (sessionStorage.getItem('white-tower-art-mode') === 'outline') artMode.value = 'outline'; } catch { /* 嵌入页可能不提供存储。 */ }
watch(artMode, mode => { try { sessionStorage.setItem('white-tower-art-mode', mode); } catch { /* 画法切换仍可用。 */ } });
const emit = defineEmits<{ shop: [id: string]; select: [location: MapLocation]; action: [payload: { location: MapLocation; action: string }] }>();
const selectedId = ref('');
const 详情 = ref<HTMLElement>();
const 索引 = ref<HTMLDetailsElement>();
function 关闭地点() {
  const 建筑 = svgElement.value?.querySelector<SVGElement>('.building[aria-pressed="true"]');
  selectedId.value = '';
  nextTick(() => { frameMap(); 建筑?.focus({ preventScroll: true }); });
}
function 收起立体() { if (!suppressClick) 关闭地点(); }
const selected = computed(() => locations.find(location => location.id === selectedId.value));
const currentLocation = computed(() => locations.find(location => location.id === props.currentLocationId));
const scene = computed(() => selected.value && props.sceneContext ? 地点场景(selected.value, props.sceneContext) : undefined);
function 地点活动(location: MapLocation) {
  return 活动列表(location).map(item => props.invitation?.地点id === location.id && item.名称 === '坐下休息' ? '参加活动' : item.名称);
}
function activityHint(location: MapLocation, action: string) {
  if (action === '参加活动') return (props.sceneContext?.时段 ?? 0) < (props.invitation?.最早时段 ?? 0) ? '晚上开始 · 1时段 · 免费' : '与' + props.invitation?.姓名 + ' · 免费 · 1时段';
  const activity = 活动列表(location).find(item => item.名称 === action);
  return activity ? `${activity.费用 ? `${activity.费用} 金` : '免费'} · ${activity.属性 ? `${activity.属性} +${activity.收益}` : `精力 +${activity.恢复 ?? 0}`} · 1 时段` : '';
}
const query = ref('');
const filter = ref<District | '全部'>('全部');
const 总览 = computed(() => filter.value === '全部' && !query.value.trim());
const 区域标记: {name: District; x:number; y:number}[] = [{name:'核心区',x:695,y:525},{name:'医疗区',x:700,y:168},{name:'训练区',x:265,y:563},{name:'居住区',x:1150,y:520},{name:'商业区',x:700,y:1008},{name:'公共空间',x:270,y:887}];
function 点击建筑(location: MapLocation) { if (suppressClick) return; if (selectedId.value === location.id) { 关闭地点(); return; } selectLocation(location); }
const lastAction = ref('');
const svgElement = ref<SVGSVGElement>();
const view = ref({ x: 0, y: 0, w: 1400, h: 1280 });
const mapSize = ref({ width: 1400, height: 1280 });
const mapScale = computed(() => Math.max(.1, Math.min(mapSize.value.width / view.value.w, mapSize.value.height / view.value.h)));
const labelSize = computed(() => Math.min(28, (mapSize.value.width >= 600 ? 19 : 14) / mapScale.value));
const districtLabelSize = computed(() => Math.max(24, 14 / mapScale.value));
const raisedBounds = computed(() => {
  if (!selected.value) return null;
  const location = selected.value;
  const w = Math.max(260, Math.min(370, location.w * 2.5)), h = w * .8;
  return { x: location.x + location.w / 2 - w / 2, y: location.y + location.h - h * .87, w, h };
});
function frameMap() {
  const art = raisedBounds.value;
  if (art) {
    const aspect = mapSize.value.width / mapSize.value.height;
    const w = Math.max(art.w + 60, (art.h + 42) * aspect), h = w / aspect;
    view.value = { x: art.x + art.w / 2 - w / 2, y: art.y + art.h / 2 - h / 2, w, h };
  } else if (总览.value) resetView();
  else fitLocations(visibleLocations.value);
}
function labelLines(name: string) { return name.split(' · ')[0].match(/.{1,6}/gu) || [name]; }
function floorLabel(name: string) { return ({ '1F': '一层', '2F': '二层' } as Record<string, string>)[name.split(' · ')[1]] || ''; }
function buildingFont(location: MapLocation) {
  const lines = labelLines(location.name);
  return Math.min(labelSize.value, (location.w - 14) / Math.max(...lines.map(line => line.length)), (location.h - 12) / (lines.length * 1.2 + (floorLabel(location.name) ? .9 : 0)));
}
function labelHeight(location: MapLocation) { return Math.min(location.h - 4, 8 + buildingFont(location) * (labelLines(location.name).length * 1.2 + (floorLabel(location.name) ? .9 : 0))); }
function fitLocations(buildings: MapLocation[]) {
  if (!buildings.length) return;
  const left = Math.min(...buildings.map(l => l.x)) - 40, top = Math.min(...buildings.map(l => l.y)) - 40;
  const right = Math.max(...buildings.map(l => l.x + l.w)) + 40, bottom = Math.max(...buildings.map(l => l.y + l.h)) + 40;
  const aspect = mapSize.value.width / mapSize.value.height;
  const w = Math.max(320, right - left, (bottom - top) * aspect), h = w / aspect;
  view.value = { x: (left + right - w) / 2, y: (top + bottom - h) / 2, w, h };
}
function focusDistrict(district: District | '全部') {
  query.value = '';
  selectedId.value = '';
  关闭索引();
  filter.value = district;
  if (district === '全部') { resetView(); return; }
  fitLocations(locations.filter(location => location.district === district));
}
const viewBox = computed(() => `${view.value.x} ${view.value.y} ${view.value.w} ${view.value.h}`);
useResizeObserver(svgElement, entries => {
  const { width, height } = entries[0].contentRect;
  if (width < 1 || height < 1) return;
  mapSize.value = { width, height };
  frameMap();
});
let drag: { id: number; x: number; y: number; startX: number; startY: number; moved: boolean } | undefined;
let suppressClick = false;

function matches(location: MapLocation) {
  const term = query.value.trim().toLowerCase();
  const actions = props.activityMode ? 活动列表(location).map(item => item.名称).join('') : location.actions.join('');
  return (filter.value === '全部' || location.district === filter.value) && `${location.name}${location.district}${location.description}${actions}`.toLowerCase().includes(term);
}
const visibleLocations = computed(() => locations.filter(matches));
function 关闭索引() { if (索引.value) 索引.value.open = false; }
watch(query, async value => {
  if (!value.trim()) { 关闭索引(); if (总览.value) resetView(); return; }
  filter.value = '全部';
  selectedId.value = '';
  fitLocations(visibleLocations.value);
  await nextTick();
  if (索引.value && query.value.trim()) 索引.value.open = true;
});
function selectLocation(location: MapLocation) {
  if (suppressClick) return;
  if (query.value || 总览.value || filter.value !== location.district) focusDistrict(location.district);
  selectedId.value = location.id;
  if (索引.value) 索引.value.open = false;
  nextTick(() => { frameMap(); if (props.activityMode) 详情.value?.focus({ preventScroll: true }); });
  lastAction.value = '';
  emit('select', location);
}
function 前往地点(id: string) { const 地点 = locations.find(l => l.id === id); if (地点) selectLocation(地点); }
defineExpose({ 前往地点 });
function chooseAction(location: MapLocation, action: string) {
  if (props.disabled || props.readOnly || (action === '参加活动' && (props.sceneContext?.时段 ?? 0) < (props.invitation?.最早时段 ?? 0))) return;
  lastAction.value = action;
  emit('action', { location, action });
  if (props.activityMode) 关闭地点();
}
function clampView() {
  view.value.x = Math.max(-80, Math.min(1480 - view.value.w, view.value.x));
  view.value.y = Math.max(-60, Math.min(1340 - view.value.h, view.value.y));
}
function zoom(factor: number, cx = view.value.x + view.value.w / 2, cy = view.value.y + view.value.h / 2) {
  const old = { ...view.value };
  const width = Math.max(320, Math.min(1400, old.w / factor));
  const ratio = width / old.w;
  view.value = { x: cx - (cx - old.x) * ratio, y: cy - (cy - old.y) * ratio, w: width, h: old.h * ratio };
  clampView();
}
function mapPoint(x: number, y: number) {
  const svg = svgElement.value;
  const matrix = svg?.getScreenCTM();
  if (!svg || !matrix) return;
  const point = svg.createSVGPoint();
  point.x = x;
  point.y = y;
  return point.matrixTransform(matrix.inverse());
}
function onWheel(event: WheelEvent) {
  const point = mapPoint(event.clientX, event.clientY);
  if (point) zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12, point.x, point.y);
}
function startDrag(event: PointerEvent) {
  if (event.button !== 0 || !event.isPrimary) return;
  const point = mapPoint(event.clientX, event.clientY);
  if (!point) return;
  suppressClick = false;
  drag = { id: event.pointerId, x: point.x, y: point.y, startX: event.clientX, startY: event.clientY, moved: false };
}
function moveDrag(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId) return;
  if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
  drag.moved = true;
  const point = mapPoint(event.clientX, event.clientY);
  if (!point) return;
  svgElement.value?.setPointerCapture(event.pointerId);
  view.value.x += drag.x - point.x;
  view.value.y += drag.y - point.y;
  clampView();
}
function endDrag(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId) return;
  suppressClick = drag.moved;
  if (svgElement.value?.hasPointerCapture(event.pointerId)) svgElement.value.releasePointerCapture(event.pointerId);
  drag = undefined;
  // 浏览器会在 pointerup 后派发 click；下一轮任务再恢复点击。
  window.setTimeout(() => { suppressClick = false; }, 0);
}
function resetView() { filter.value = '全部'; view.value = { x: 0, y: 0, w: 1400, h: 1280 }; }
// 当前位置由宿主传入；本组件不会把点选地点写为真实位置。
void props;
</script>



<style scoped>
.atlas.compact .map-layout{grid-template-rows:minmax(0,1fr)}@media(max-width:760px){.atlas.compact .map-layout{grid-template-rows:minmax(0,1fr) 100px}.atlas.compact .toolbar{padding:4px 6px}.atlas.compact .map-caption{font-size:9px}}
.atlas.compact.exploration-atlas .map-layout{display:block;position:relative;overflow:hidden}.atlas.compact.exploration-atlas .map-frame{width:100%;height:100%;border-right:0}.atlas.compact.exploration-atlas .details{position:absolute;right:0;top:0;bottom:0;width:min(340px,46%);box-sizing:border-box;z-index:3;border-left:1px solid #a18d60;border-top:0;background:#212a22;box-shadow:-12px 0 28px #0006;outline:none}.atlas.compact.exploration-atlas .details:focus-visible{outline:2px solid #c8b681;outline-offset:-2px}.exploration-atlas .close-details{display:block;position:sticky;top:0;z-index:1;margin:0 0 10px auto;padding:6px 9px;background:#36432e;color:#efd6a0;border:1px solid #8f805d;cursor:pointer}.atlas.compact.exploration-atlas .access{display:block}.exploration-atlas .details .directory{display:none}.map-directory{position:relative;flex:none;z-index:5;font-size:11px;color:#e2ce9c}.map-directory summary{cursor:pointer;border:1px solid #706b4e;border-radius:3px;padding:5px 7px;white-space:nowrap}.map-directory>div{position:absolute;right:0;top:calc(100% + 6px);width:240px;max-height:320px;overflow:auto;padding:8px;background:#222d24;border:1px solid #a18d60;box-shadow:0 8px 20px #0008}.map-directory button{display:block;width:100%;text-align:left;padding:8px;font-size:12px}.map-directory button:hover{background:#3b4932}@media(max-width:760px){.atlas.compact.exploration-atlas .details{width:min(330px,88%)}.atlas.compact.exploration-atlas .search{min-width:85px;flex:1}.atlas.compact.exploration-atlas .filters{max-width:42%}.atlas.compact.exploration-atlas .details .action{padding:10px}.atlas.compact.exploration-atlas .map{width:100%;height:100%;min-height:0}}
.building-label{paint-order:stroke fill;stroke:#172019;stroke-width:3px;stroke-linejoin:round;font-weight:600;letter-spacing:0!important}
@media(min-width:600px){.atlas .toolbar{gap:10px;padding:9px 12px}.atlas.compact .filters button,.atlas .filters button{font-size:15px;padding:7px 9px}.atlas .search input{font:15px 'Noto Serif SC','Songti SC',serif}.atlas .map-directory,.atlas .map-directory button{font-size:15px}.atlas.compact .details p,.atlas.compact .action,.atlas .details p,.atlas .action{font-size:16px;line-height:1.85}.atlas .details h3{font-size:24px}.atlas .action-label,.atlas .action-cost,.atlas .detail-kicker,.atlas .location-info{font-size:14px}.atlas .map-caption{font-size:12px}.atlas.compact.exploration-atlas .details{width:min(410px,46%)}}
.district-overview g{cursor:pointer;outline:none}.district-overview g:hover rect,.district-overview g:focus-visible rect{stroke:#f5d999;stroke-width:4}.district-overview text{font-weight:600;letter-spacing:2px;pointer-events:none}
.invitation-note{display:flex;align-items:center;gap:8px;min-width:0;color:#e0c78c}.invitation-note button{font:inherit;white-space:nowrap;padding:1px 5px;color:#f2ddb1;background:#455435;border:1px solid #9b9567;cursor:pointer}
</style>
<style scoped>
.atlas.compact{height:100%;display:flex;flex-direction:column;min-height:0;overflow:hidden}.compact .atlas-header,.compact .atlas-footer,.compact .terrain-legend{display:none}.compact .toolbar{padding:5px 8px;gap:5px;flex:none}.compact .search{padding:3px 6px;max-width:190px}.compact .search span{font-size:16px}.compact .filters button{padding:4px;font-size:10px}.compact .map-layout{flex:1;min-height:0;grid-template-columns:minmax(0,1fr) minmax(210px,35%)}.compact .map-frame{height:100%;min-height:0;display:flex;flex-direction:column;align-self:stretch}.compact .map{flex:1;min-height:0;aspect-ratio:auto;height:100%}.compact .map-caption{padding:4px 7px;flex:none}.compact .details{padding:10px;min-height:0;overflow:auto;overscroll-behavior:contain}.compact h3{margin:8px 0;font-size:17px}.compact .ornament,.compact .source-note{display:none}.compact .details p{margin:6px 0;font-size:11px;line-height:1.6}.compact .location-scene{padding:7px;margin:7px 0}.compact .access{padding:5px 8px;margin:7px 0}.compact .action{padding:7px;margin-bottom:5px;font-size:11px}.compact .action-label{margin-bottom:5px}.compact .directory{margin-top:8px;padding-top:8px}.compact .map-controls{top:7px;left:7px}.compact .map-controls button{padding:4px 7px}@media(max-width:760px){.compact .map-layout{grid-template-columns:1fr;grid-template-rows:minmax(110px,45%) minmax(0,1fr)}.compact .toolbar{flex-wrap:nowrap}.compact .search{flex-basis:auto;min-width:100px}.compact .filters{flex-wrap:nowrap;overflow:auto;white-space:nowrap;max-width:55%;scrollbar-width:none}.compact .filters button{flex:none}.compact .map-caption span{display:none}.compact .details{padding:7px 9px}.compact .details .action{padding:6px}.compact .details h3{margin:5px 0}.compact .action-cost{margin-top:2px}}
.location-scene{padding:12px;border:1px solid #686e50;background:#20291f;margin:14px 0}.location-scene p{margin:8px 0}.location-scene .ambient-dialogue{padding-top:10px;border-top:1px solid #50583e;color:#d3c698}.location-info{font-size:11px;line-height:1.8;color:#aeb098}.location-info summary{cursor:pointer}.action-cost{display:block;font-size:10px;margin-top:5px;color:#a5aa8e}
.terrain-legend{display:flex;align-items:center;flex-wrap:wrap;gap:9px 15px;padding:10px 14px;border-top:1px solid #424b39;background:#1d261e;color:#bbb79a;font-size:10px}.terrain-legend>span{display:inline-flex;align-items:center;gap:5px}.swatch{display:inline-block;width:22px;height:18px;border:1px solid #747553}.swatch.lawn{background-color:#283526;background-image:repeating-linear-gradient(45deg,transparent 0 5px,#7c8a574d 5px 6px),repeating-linear-gradient(-45deg,transparent 0 5px,#7c8a574d 5px 6px)}.swatch.stone{background-color:#34362e;background-image:linear-gradient(#a39b7b66 1px,transparent 1px),linear-gradient(90deg,#a39b7b66 1px,transparent 1px);background-size:11px 7px}.swatch.gravel{background-color:#33322a;background-image:radial-gradient(#a69b7d 1px,transparent 1px);background-size:5px 6px}.swatch.deck{background:repeating-linear-gradient(90deg,#40362a 0 5px,#a0906877 5px 6px)}.swatch.water{background-color:#29433f;background-image:repeating-radial-gradient(ellipse at 50% 100%,transparent 0 3px,#75a5a677 3px 4px,transparent 4px 7px)}
.atlas{color:#ddd1b5;background:#171d1b;border:1px solid #756e52;font-family:'Noto Serif SC','Songti SC','SimSun',serif;width:100%;box-sizing:border-box}.atlas *{box-sizing:border-box}.atlas-header{display:flex;justify-content:space-between;align-items:center;padding:23px 26px 18px;border-bottom:1px solid #655e45;background:linear-gradient(110deg,#2a2e24,#1b231f)}.eyebrow{font:9px Georgia,serif;letter-spacing:3px;color:#a99c78}h2{font-size:26px;letter-spacing:5px;font-weight:400;margin:9px 0 0}h2 small{font-size:11px;letter-spacing:2px;color:#a69c82}.edition{font-size:10px;color:#a99c78;letter-spacing:1px}.toolbar{padding:13px 18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #3e4538}.search{display:flex;gap:8px;align-items:center;border:1px solid #545a48;padding:7px 10px;flex:1;max-width:270px}.search span{font-size:20px;color:#cbb78a}.search input{width:100%;background:none;border:0;outline:none;color:#e1d4b2;font:12px inherit}.search input::placeholder{color:#8b917f}.filters{display:flex;gap:4px;flex-wrap:wrap}button{font:12px inherit;color:inherit;cursor:pointer;background:none;border:1px solid transparent}.filters button{padding:7px 9px;color:#a7ad9b}.filters button.active{background:#353c2d;border-color:#8c835f;color:#ecdfbf}.filters i,.directory i{display:inline-block;width:5px;height:5px;margin-right:6px}.map-layout{display:grid;grid-template-columns:minmax(0,1fr) 246px}.map-frame{position:relative;border-right:1px solid #5a5e49;align-self:start}.map{display:block;width:100%;aspect-ratio:1400/1280;touch-action:none;user-select:none;cursor:grab}.map:active{cursor:grabbing}.building{cursor:pointer;outline:none;transition:opacity .18s}.building.muted{opacity:.22}.building:hover .footprint,.building:focus-visible .footprint{stroke:#f1dfae;stroke-width:3}.building.selected .footprint{stroke:#f2d18a;stroke-width:3;filter:drop-shadow(0 0 5px #d0b56966)}.building text{font-family:'Songti SC','SimSun',serif;letter-spacing:.3px}.map-controls{position:absolute;left:14px;top:14px;display:flex;gap:4px}.map-controls button{padding:7px 10px;background:#1b241fee;border:1px solid #807656;font-size:14px}.map-controls button:hover{background:#3c432f}.map-caption{display:flex;justify-content:space-between;padding:9px 14px;font-size:10px;border-top:1px solid #444b3b;color:#b2ae94;gap:8px}.map-caption span{color:#818b78}.details{padding:23px 19px;background:linear-gradient(#252b23,#1c241f)}.detail-kicker{display:flex;justify-content:space-between;gap:8px;font-size:10px;letter-spacing:1px;color:#a69c7c}.detail-kicker span+span{font-size:9px;border:1px solid #62664f;padding:2px 5px}h3{font-size:22px;font-weight:400;letter-spacing:2px;margin:17px 0}.ornament{display:flex;align-items:center;gap:10px;color:#b39e6c;font-size:12px}.ornament:before,.ornament:after{content:'';height:1px;flex:1;background:#676349}.details p{font-size:12px;line-height:1.95;color:#b8baa4;margin:17px 0}.access{border-left:2px solid #aa9c6f;background:#30372a;padding:10px 12px;margin:20px 0}.access>span,.action-label{font-size:10px;letter-spacing:2px;color:#c8b788}.access p{margin:6px 0 0;font-size:11px}.action-label{margin-bottom:10px}.action{display:flex;justify-content:space-between;align-items:center;text-align:left;width:100%;padding:10px 9px;border:1px solid #5b604a;margin-bottom:7px;color:#d2c8a9;background:#252f26;font-size:12px}.action:hover,.action:focus-visible{background:#414a33;border-color:#bbab78}.action span+span{color:#b7a679}.source-note{font-size:10px;color:#8c947f;border-top:1px solid #4c5240;margin-top:18px;padding-top:12px;line-height:1.8}.action-feedback{color:#deca97!important;font-size:11px!important}.directory{margin-top:24px;border-top:1px solid #5b6049;padding-top:13px}.directory summary{cursor:pointer;font-size:12px;color:#c4b791}.directory-list{display:grid;gap:2px;margin-top:10px}.directory button{text-align:left;padding:6px 3px;font-size:11px}.directory button:hover{background:#3c4531}.directory small{float:right;color:#b9ab7f}.atlas-footer{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:13px 18px;border-top:1px solid #655e45;font-size:10px;color:#a29f86;line-height:1.6}button:focus-visible,input:focus-visible{outline:2px solid #c8b681;outline-offset:2px}@media(max-width:760px){.map-layout{grid-template-columns:1fr}.map-frame{border-right:0;border-bottom:1px solid #655e45}.details{padding:20px}.atlas-header{padding:18px 16px}.edition{display:none}.toolbar{padding:10px}.search{max-width:none;flex-basis:100%}.filters button{font-size:10px;padding:5px 7px}.details .action{padding:12px}.atlas-footer{font-size:9px}.map-caption{font-size:9px}h2{font-size:22px}}
</style>
<style scoped>
.compact .map-layout{grid-template-columns:minmax(0,3fr) minmax(190px,1fr)}.compact .details{font-size:12px}.action:disabled{opacity:.45;cursor:default}@media(max-width:760px){.compact .map-layout{grid-template-columns:1fr;grid-template-rows:minmax(0,7fr) minmax(0,3fr)}.compact .details{border-top:1px solid #7e795b}.compact .details h3{margin:4px 0}.compact .access,.compact .directory{display:none}.compact .map{width:100%;height:100%}}
</style>

<style scoped>
/* 地图工具保持在一行；窄屏用区域选择器替代横向滚动的标签。 */
.atlas .art-style { display:flex; align-items:center; gap:5px; flex:none; color:#b6b99e; font-size:11px; }
.atlas .art-style select { background:#202a22; color:#d8c9a2; border:1px solid #837957; border-radius:3px; padding:7px 5px; font:inherit; cursor:pointer; }
.atlas .art-style select:focus-visible { outline:2px solid #c8b681; outline-offset:2px; }
.atlas .district-select { display: none; }
.atlas .search { min-width: 0; }
.atlas .clear-search { flex: none; padding: 0 3px; font-size: 18px; }
.atlas .map-directory > div { width: min(310px, 84vw); max-height: min(320px, 48dvh); }
.atlas .map-directory button { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.atlas .map-directory small { flex: none; color: #a9b297; font-size: 11px; }
.atlas .map-caption .map-breadcrumb { display: inline; color: #d1c29e; }
.atlas .empty-search { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: grid; gap: 12px; padding: 18px 24px; background: #17211df5; border: 1px solid #8e815e; color: #e5d5b2; text-align: center; white-space: nowrap; }
.atlas .empty-search button { border-color: #877c56; padding: 6px; }
.atlas .building.current .footprint { stroke: #a2d3bb; stroke-width: 2.5; }
.atlas .building.muted { opacity: .25; }
.atlas .place-heading { position: sticky; top: -14px; z-index: 2; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; background: #212a22; }
.atlas .place-heading h3 { margin: 7px 0 0; letter-spacing: 1px; line-height: 1.4; }
.atlas .place-heading .close-details { position: static; flex: none; margin: 0; font-size: 12px; padding: 5px 7px; }
.atlas .details .location-info { margin: 10px 0 14px; }
.atlas.compact.exploration-atlas .map-layout.has-selection { display: grid; grid-template-columns: minmax(0, 1fr) minmax(290px, 32%); grid-template-rows: minmax(0, 1fr); }
.atlas.compact.exploration-atlas .details { position: static; width: auto; height: 100%; padding: 14px; box-shadow: none; }
.atlas.compact.exploration-atlas .details .action { margin-bottom: 7px; padding: 9px 11px; }
.atlas.compact.exploration-atlas .location-scene { padding: 10px 12px; margin: 12px 0; }
.atlas.compact.exploration-atlas .location-scene .action-label { display: none; }
.atlas.compact.exploration-atlas .location-scene p { font-size: 14px; line-height: 1.8; margin: 0; }
.atlas.compact.exploration-atlas .location-scene .ambient-dialogue { margin-top: 8px; }
@media (max-width: 760px) {
  .atlas.compact.exploration-atlas .toolbar { gap: 6px; padding: 6px 8px; }
  .atlas .art-style > span { display:none; }
  .atlas .art-style select { width:86px; padding:7px 2px; font-size:11px; }
  .atlas.compact.exploration-atlas .search { flex:1 1 0; }
  .atlas.compact.exploration-atlas .district-select { min-width:0; width:74px; padding:6px 2px; font-size:11px; }
  .atlas.compact.exploration-atlas .filters { display: none; }
  .atlas.compact.exploration-atlas .district-select { display: block; width: 85px; flex: none; padding: 7px 3px; color: #ddcda5; background: #222d24; border: 1px solid #6d7356; border-radius: 3px; font: 12px inherit; }
  .atlas.compact.exploration-atlas .search { max-width: none; min-width: 0; padding: 5px 6px; gap: 4px; }
  .atlas.compact.exploration-atlas .search input { font-size: 12px; min-width: 0; }
  .atlas.compact.exploration-atlas .map-directory summary { padding: 7px 5px; font-size: 12px; }
  .atlas.compact.exploration-atlas .map-layout.has-selection { display: block; }
  .atlas.compact.exploration-atlas .details { position: absolute; top: auto; bottom: 0; right: 0; width: 100%; height: auto; max-height: 100%; padding: 10px 12px; border-left: 0; border-top: 1px solid #a18d60; box-shadow: 0 -8px 24px #0005; }
  .atlas.compact.exploration-atlas .place-heading h3 { font-size: 19px; margin: 4px 0 0; }
  .atlas.compact.exploration-atlas .place-heading { top: -10px; }
  .atlas.compact.exploration-atlas .location-scene { padding: 7px 9px; margin: 8px 0; }
  .atlas.compact.exploration-atlas .location-scene p { font-size: 12px; line-height: 1.7; }
  .atlas.compact.exploration-atlas .details .location-info { margin: 6px 0 9px; }
  .atlas.compact.exploration-atlas .details .action { padding: 6px 9px; margin-bottom: 5px; font-size: 13px; }
  .atlas.compact.exploration-atlas .details .action-cost { font-size: 11px; line-height: 1.4; margin-top: 2px; }
}
@media (max-width: 760px) and (max-height: 700px) {
  .atlas.compact.exploration-atlas .details { padding: 8px 12px; }
  .atlas.compact.exploration-atlas .place-heading { top: -8px; }
  .atlas.compact.exploration-atlas .details > .action-label { display: none; }
  .atlas.compact.exploration-atlas .location-scene { margin: 6px 0; padding: 6px 8px; }
  .atlas.compact.exploration-atlas .details .location-info { margin: 4px 0 6px; }
}
</style>

<style scoped>
.building.selected { opacity: .13; transition: opacity .22s; }
.raised-building { cursor: pointer; outline: none; transform-box: view-box; }
.raised-building:hover .raised-art, .raised-building:focus-visible .raised-art { filter: drop-shadow(0 0 3px #d4c58e70); }
.raised-art { pointer-events: bounding-box; }
.building-rise-enter-active { transition: transform .36s cubic-bezier(.2,.75,.25,1), opacity .24s; }
.building-rise-leave-active { transition: transform .2s ease-in, opacity .18s; pointer-events: none; }
.building-rise-enter-from, .building-rise-leave-to { transform: translateY(8px) scaleY(.25) scaleX(.8); opacity: 0; }
.mobile-scene-full { display: none; }
.place-actions { display: grid; gap: 7px; }
.atlas.compact.exploration-atlas .place-actions .action { margin: 0; }
@media (max-width: 760px) {
  .atlas.compact.exploration-atlas .map-layout.has-selection { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(100px, 1fr) auto; }
  .atlas.compact.exploration-atlas .has-selection .map-frame { min-height: 100px; border: 0; overflow: hidden; }
  .atlas.compact.exploration-atlas .has-selection .map-caption { display: none; }
  .atlas.compact.exploration-atlas .has-selection .map-controls { display: none; }
  .atlas.compact.exploration-atlas .details { position: relative; inset: auto; height: auto; max-height: min(57dvh, 290px); width: 100%; padding: 8px 10px; box-shadow: none; }
  .atlas.compact.exploration-atlas .place-heading { align-items: center; top: -8px; gap: 7px; }
  .atlas.compact.exploration-atlas .place-heading > div { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 9px; }
  .atlas.compact.exploration-atlas .place-heading h3 { font-size: 16px; line-height: 1.4; margin: 0; order: -1; }
  .atlas.compact.exploration-atlas .detail-kicker { font-size: 10px; letter-spacing: 0; }
  .atlas.compact.exploration-atlas .detail-kicker span+span { display: none; }
  .atlas.compact.exploration-atlas .place-heading .close-details { min-height: 30px; padding: 4px 6px; font-size: 11px; }
  .atlas.compact.exploration-atlas .location-scene { padding: 3px 7px; margin: 3px 0; }
  .atlas.compact.exploration-atlas .location-scene p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; font-size: 12px; line-height: 1.5; }
  .atlas.compact.exploration-atlas .location-scene .ambient-dialogue { display: none; }
  .atlas.compact.exploration-atlas .mobile-scene-full { display: block; }
  .atlas.compact.exploration-atlas .details .location-info { margin: 4px 0 6px; font-size: 11px; line-height: 1.4; }
  .atlas.compact.exploration-atlas .details > .action-label { display: none; }
  .atlas.compact.exploration-atlas .details > .activity-disabled { display: block; font-size: 11px; letter-spacing: 0; }
  .atlas.compact.exploration-atlas .place-actions { grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: 5px; }
  .atlas.compact.exploration-atlas .place-actions .action { padding: 6px; min-width: 0; align-items: flex-start; font-size: 12px; line-height: 1.4; }
  .atlas.compact.exploration-atlas .place-actions .action > span+span { display: none; }
  .atlas.compact.exploration-atlas .place-actions .action-cost { font-size: 10px; line-height: 1.5; margin-top: 2px; }
}
@media (max-width: 760px) and (max-height: 700px) {
  .atlas.compact.exploration-atlas .map-layout.has-selection { grid-template-rows: minmax(80px, 1fr) auto; }
  .atlas.compact.exploration-atlas .has-selection .map-frame { min-height: 80px; }
}
@media (prefers-reduced-motion: reduce) {
  .building-rise-enter-active, .building-rise-leave-active, .building.selected { transition: none; }
}
</style>

<style scoped>
.atlas[data-season*="春"]{--land-ground:#2d3c30;--land-lawn:#3a4d33;--land-tree:#506448;--land-hedge:#47603e;--land-flower:#b28599;--land-bed:#415538}
.atlas[data-season*="夏"]{--land-ground:#253c2e;--land-lawn:#29492f;--land-tree:#396043;--land-hedge:#315a3a;--land-flower:#527349;--land-flower-edge:#9cb482;--land-bed:#345238}
.atlas[data-season*="秋"]{--land-ground:#403b2d;--land-lawn:#66573a;--land-tree:#656043;--land-hedge:#6c6541;--land-flower:#ad784d;--land-flower-edge:#d6b277;--land-bed:#765c3a;--land-path:#8d7956;--land-gravel:#514735}
.atlas[data-season*="冬"]{--land-bg:#667975;--land-ground:#c4cec6;--land-lawn:#cbd5c9;--land-stone:#a3b1aa;--land-gravel:#b6c3bb;--land-hedge:#8fa69a;--land-tree:#9ab0a0;--land-flower:#d2ddd1;--land-flower-edge:#ecf0df;--land-plaza:#a3b3ab;--land-path:#758a81;--land-deck:#83968b;--land-market:#a3b2ab;--land-bed:#b4c8b3;--land-building:#697e72}
.atlas[data-season*="冬"] .raised-art{filter:saturate(.65) brightness(1.15)}
.atlas .place-heading .shop-entry{align-self:center;margin-left:auto;flex:none;padding:5px 8px;border:1px solid #a79662;background:#465339;color:#f0dfac;font-size:12px;white-space:nowrap}
@media(max-width:760px){.atlas .place-heading{gap:5px}.atlas.compact.exploration-atlas .place-heading .shop-entry{padding:4px 6px;font-size:11px;min-height:30px;height:30px;line-height:18px}.atlas .place-heading>div{min-width:0;flex:1}.atlas .place-heading h3{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
</style>
