<template>
  <div class="诊所 界卡">
    <header class="诊所__招牌">
      <span class="诊所__名">{{ 数据.诊所.名称 || '未命名的诊所' }}</span>
      <span class="诊所__星">{{ 数据.诊所.等级 }} 级 · {{ 数据.诊所.$称号 }}</span>
    </header>

    <div class="诊所__行">
      <div class="诊所__槽"><i class="is-名声" :style="{ width: `${数据.诊所.名声}%` }" /></div>
      <span class="诊所__值">名声 {{ 数据.诊所.名声 }}</span>
    </div>

    <div class="诊所__行">
      <div class="诊所__槽"><i class="is-精神" :style="{ width: `${精神比}%` }" /></div>
      <span class="诊所__值">精神力 {{ 数据.主角.精神力 }}/{{ 数据.主角.精神力上限 }}</span>
    </div>

    <div class="诊所__条">
      <span>{{ 数据.主角.姓名 || '向导' }}</span>
      <span class="诊所__钱">{{ 数据.主角.金钱 }} 金</span>
      <span class="诊所__设">床位 {{ 在诊数 }}/{{ 床位 }}</span>
    </div>

    <div class="诊所__条">
      <span>气氛 {{ 数据.诊所.气氛 }}</span>
      <span class="诊所__档">{{ 档 }}</span>
      <span v-if="地点" class="诊所__设 诊所__地">◎ {{ 地点 }}</span>
    </div>

    <!-- 世界那一角。诊所页要的是「丰富」不是「变长」(spec §5.2) —— 所以是往已有的
         `条` 里塞, 不是新开一块。老存档里这些字段全是 prefault 出来的空串, 所以
         每一行都判空; 不判的话底下会挂出一条「· · ·」, 比什么都不显示更难看。 -->
    <div v-if="日时" class="诊所__条">
      <span>{{ 日时 }}</span>
      <span v-if="天候" class="诊所__设">{{ 天候 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../共用/数据';
import { 在诊人数 } from '../状态栏/结算';
import { 气氛档, 算床位 } from '../../家园/家具';

const store = useDataStore();
const 数据 = computed(() => store.data);

const 精神比 = computed(
  () => (数据.value.主角.精神力 / Math.max(1, 数据.value.主角.精神力上限)) * 100,
);

const 在诊数 = computed(() => 在诊人数(数据.value.哨兵));

/** 床位不再是变量, 是「摆出来的床有几张」(spec §7.1) */
const 床位 = computed(() => 算床位(数据.value.诊所.家具));

/** 气氛的档位描述 (spec §9.3)。气氛本身由 schema 从家具汇总出来 */
const 档 = computed(() => 气氛档(数据.value.诊所.气氛));

/**
 * 用 `·` 把有值的片段连起来, 空的直接不出现。
 *
 * 不能直接 `a + ' · ' + b`: `世界` 这一整套是 2026-10-05 才加的, 老存档里它们是
 * prefault 出来的空串, 直拼会在界面上渲染出「霜降月第一日 ·  · 」这种东西。
 */
const 串 = (...段: string[]) => 段.map(s => (s ?? '').trim()).filter(Boolean).join(' · ');

/**
 * 世界那一角 (spec §5.2)。
 *
 * `时刻` 优先、`时段` 兜底, 而不是两个都显示: 它们是同一件事的两个精度, 并排写会变成
 * 「07:30 · 清晨」这种同义反复。老存档只有 `时段`, 新存档两个都有 —— 这条兜底是给老存档的。
 */
const 时刻 = computed(() => 数据.value.世界.时刻 || 数据.value.世界.时段);
const 日时 = computed(() => 串(数据.value.世界.日期, 数据.value.世界.星期, 时刻.value));
const 天候 = computed(() => 串(数据.value.世界.季节, 数据.value.世界.天气, 数据.value.世界.温度));
const 地点 = computed(() => 数据.value.世界.地点);
</script>

<style lang="scss" scoped>
/* 外壳(底色/圆角/阴影)在 global.css 的 .界卡 上, 三个块共用。
   这里只管诊所块自己的排版。 */
.诊所 {
  &__招牌 {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 9px;
  }

  &__名 {
    color: #eef3f8;
    font-weight: 600;
    font-size: 1.06em;
    letter-spacing: 0.03em;
  }

  &__星 {
    color: #7fe3ff;
    font-size: 0.82em;
    white-space: nowrap;
  }

  &__行 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }

  &__槽 {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.07);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: 3px;
      transition: width 0.45s ease;

      &.is-名声 {
        background: linear-gradient(90deg, #4a7fa5, #7fe3ff);
      }

      &.is-精神 {
        background: linear-gradient(90deg, #6b5fa8, #b39ddb);
      }
    }
  }

  &__值 {
    color: #7d8896;
    font-size: 0.8em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__条 {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin: 8px 0 2px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    color: #9aa5b1;
    font-size: 0.85em;
  }

  &__钱 {
    color: #ffd76e;
  }

  &__档 {
    color: #7fd6a0;
  }

  &__设 {
    color: #6f7a87;
    margin-left: auto;
  }

  /* 地点比别的「设」重要一点: 它是这一页唯一告诉玩家「我现在在哪」的字。
     但也不能亮到抢名声/精神力那两条 —— 所以只提一档灰。 */
  &__地 {
    color: #8c98a6;
  }
}
</style>
