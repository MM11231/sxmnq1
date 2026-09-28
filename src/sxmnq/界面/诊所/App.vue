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
      <span class="诊所__设">{{ 数据.世界.日期 }} · {{ 数据.世界.时段 }}</span>
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
}
</style>
