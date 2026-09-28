<template>
  <div class="家园 界卡">
    <header class="家园__头">
      <span class="家园__名">
        {{ 层 === '二层' ? '家园 · 诊所' : 当前房 }}
      </span>
      <span class="家园__数">
        <template v-if="层 === '二层'">床位 {{ 床位 }}/{{ 房间数 }}</template>
        <template v-else>气氛 {{ 房间氛围 }}</template>
      </span>
    </header>

    <Grid :格子们="格子们" @点="点格" />

    <p class="家园__注">
      {{ 层 === '二层' ? '点房间进去摆家具。门 = 收起家园。' : '点床或自由格开店。门 = 回上一层。' }}
    </p>

    <!-- 商店弹层。挂到 body 上 —— 折叠区有 max-height 与 overflow,
         留在里面会被裁掉一半, 而且跟着滚动跑 (同 治疗浮层, spec §9.1.1) -->
    <Teleport to="body">
      <div v-if="选中" class="家园__罩" @click.self="选中 = null">
        <div class="弹">
          <header class="弹__头">
            <span class="弹__题">{{ 选中的键 }}</span>
            <span class="弹__钱">{{ 数据.主角.金钱 }} 金</span>
            <button class="弹__关" @click="选中 = null"><i class="fa-solid fa-xmark" /></button>
          </header>

          <p v-if="摆着的" class="弹__在">
            这里摆着 <strong>{{ 摆着的.名称 }}</strong> · 氛围 +{{ 摆着的.氛围 }}
          </p>

          <section v-if="能放的.length" class="弹__段">
            <h5 class="弹__标">仓库里能放的</h5>
            <button v-for="项 in 能放的" :key="项.序" class="弹__项" @click="摆仓库件(项.序)">
              <span>{{ 项.件.名称 }}</span>
              <span class="弹__价">氛围 +{{ 项.件.氛围 }}</span>
            </button>
          </section>

          <section v-if="!摆着的 && 能买的.length" class="弹__段">
            <h5 class="弹__标">这里能买的</h5>
            <button
              v-for="物 in 能买的"
              :key="物.名称"
              class="弹__项"
              :disabled="数据.主角.金钱 < 物.价钱"
              @click="买下(物)"
            >
              <span>{{ 物.名称 }}</span>
              <span class="弹__价">
                氛围 +{{ 物.氛围 }} ·
                {{ 数据.主角.金钱 < 物.价钱 ? `还差 ${物.价钱 - 数据.主角.金钱} 金` : `${物.价钱} 金` }}
              </span>
            </button>
          </section>

          <section v-if="摆着的 && 更好的.length" class="弹__段">
            <h5 class="弹__标">换成</h5>
            <button
              v-for="物 in 更好的"
              :key="物.名称"
              class="弹__项"
              :disabled="数据.主角.金钱 < 物.价钱"
              @click="买下(物)"
            >
              <span>{{ 物.名称 }}</span>
              <span class="弹__价">
                氛围 +{{ 物.氛围 }} ·
                {{ 数据.主角.金钱 < 物.价钱 ? `还差 ${物.价钱 - 数据.主角.金钱} 金` : `${物.价钱} 金` }}
              </span>
            </button>
          </section>

          <p v-if="摆着的 && !更好的.length" class="弹__满">这类里就它最好了。</p>

          <footer class="弹__脚">
            <button v-if="摆着的" class="弹__收" @click="收起这件">收起来（退回仓库）</button>
            <span v-else class="弹__提示">买下来就直接摆在这儿，不用先去仓库取。</span>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// import 名必须是 ASCII。Vue 模板编译器认不出非 ASCII 的标签名, 写成 `<九宫格 />`
// 会被当纯文本渲染、绑定全丢, 而且只有生产构建才发作。同 状态栏/App.vue 那条注释。
import Grid from './九宫格.vue';
import { useDataStore } from '../共用/数据';
import { 二层格子, 三层格子, type 宫格 } from '../../家园/布局';
import { 从仓库摆, 摆上, 收起来, 算仓库, 算床位, 算摆位, 房间概况 } from '../../家园/家具';
import { 更贵的同类, 同类物品, type 物品 } from '../../家园/物品';
import { 房间名表, 格收什么类 } from '../../家园/房型';

const emit = defineEmits<{ 门: [] }>();

const store = useDataStore();
const 数据 = computed(() => store.data);

/**
 * 现在在哪一层, 以及在哪间房。
 *
 * **这是组件内部的 state, 不进变量** —— 玩家退出重进时回到 L2 总览是对的,
 * 「上次停在四号房」不值得为它多一个字段。
 */
const 层 = ref<'二层' | '三层'>('二层');
const 当前房 = ref('');
const 选中 = ref<宫格 | null>(null);

const 房间数 = 房间名表.length;
const 床位 = computed(() => 算床位(数据.value.诊所.家具));
const 房间氛围 = computed(() => 房间概况(数据.value.诊所.家具, 当前房.value).氛围);

const 格子们 = computed(() =>
  层.value === '二层' ? 二层格子(数据.value.诊所.家具) : 三层格子(数据.value.诊所.家具, 当前房.value),
);

function 点格(格: 宫格) {
  if (格.类 === '房间') {
    当前房.value = 格.主;
    层.value = '三层';
    return;
  }
  if (格.类 === '门') {
    // L3 的门回 L2; L2 的门交给外面 —— ① 里 L2 就是根, 收起家园块回正文。
    // ② 做完之后 L1 存在了, 这里改成 层.value = '一层' 即可, 组件接口一个字不用动。
    if (层.value === '三层') {
      层.value = '二层';
      当前房.value = '';
    } else {
      emit('门');
    }
    return;
  }
  // 只剩 床 / 自由 两种能点到这儿; 路 是 disabled 的
  if (格收什么类(格)) 选中.value = 格;
}

/** 弹层里到底动哪一格 —— `一号·北`。二层不该有弹层, 当前房为空时它也是空串 */
const 选中的键 = computed(() => (当前房.value ? `${当前房.value}·${选中.value?.方位}` : ''));

/** 那一格上现在摆着什么 (没有就是 undefined) */
const 摆着的 = computed(() => 算摆位(数据.value.诊所.家具)[选中的键.value]?.件);

/** 这一格收哪一类家具。床格只列床, 自由格只列装饰 (spec §4.1) */
const 收什么 = computed(() => (选中.value ? 格收什么类(选中.value) : null));

const 能放的 = computed(() =>
  收什么.value ? 算仓库(数据.value.诊所.家具).filter(项 => 项.件.类型 === 收什么.value) : [],
);
const 能买的 = computed(() => (收什么.value ? 同类物品(收什么.value) : []));
const 更好的 = computed(() => (摆着的.value ? 更贵的同类(摆着的.value.名称) : []));

/**
 * 扣钱 + 摆上。两件事分开写是因为它们属于两个字段 (`主角.金钱` 与 `诊所.家具`),
 * 而 store 的深度监听会把两者一起写回变量。
 */
function 买下(物: 物品) {
  if (!选中.value || 数据.value.主角.金钱 < 物.价钱) return;
  数据.value.主角.金钱 -= 物.价钱;
  摆上(数据.value.诊所.家具, 选中的键.value, 物);
}

function 摆仓库件(序: number) {
  从仓库摆(数据.value.诊所.家具, 序, 选中的键.value);
}

function 收起这件() {
  收起来(数据.value.诊所.家具, 选中的键.value);
}
</script>

<style lang="scss" scoped>
.家园 {
  &__头 {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 9px;
  }

  &__名 {
    color: #eef3f8;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  &__数 {
    color: #7d8896;
    font-size: 0.82em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__注 {
    margin: 9px 0 0;
    color: #55606d;
    font-size: 0.78em;
  }

  /* 弹层的罩子。fixed + inset 0 盖住整个 iframe —— 它 Teleport 到 body,
     不属于折叠区。点空白处关掉 */
  &__罩 {
    position: fixed;
    inset: 0;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(6, 9, 13, 0.72);
  }
}

.弹 {
  width: 100%;
  max-width: 340px;
  max-height: 80vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 13px 14px;
  border-radius: 13px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(168deg, #161d27 0%, #0d1117 100%);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);
  color: #d8dee6;
  font-size: 13px;

  &__头 {
    display: flex;
    align-items: center;
    gap: 9px;
    padding-bottom: 9px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  &__题 {
    flex: 1;
    color: #eef3f8;
    font-weight: 600;
  }

  &__钱 {
    color: #ffd76e;
    font-size: 0.86em;
    font-variant-numeric: tabular-nums;
  }

  &__关 {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.06);
    color: #8e99a6;
    font-family: inherit;
    cursor: pointer;
  }

  &__在 {
    margin: 10px 0 0;
    color: #9aa5b1;
    font-size: 0.9em;

    strong {
      color: #a8ecff;
    }
  }

  &__段 {
    margin-top: 12px;
  }

  &__标 {
    margin: 0 0 6px;
    color: #6f7a87;
    font-size: 0.8em;
    font-weight: 500;
    letter-spacing: 0.08em;
  }

  /* 一件货一行。左边名字, 右边价钱/氛围 */
  &__项 {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    min-height: 38px;
    padding: 0 11px;
    margin-bottom: 5px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: #cfd7e0;
    font-family: inherit;
    font-size: 0.94em;
    text-align: left;
    cursor: pointer;
    transition: background 0.18s ease;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:not(:disabled):hover {
      background: rgba(127, 227, 255, 0.13);
    }
  }

  &__价 {
    flex: none;
    color: #7d8896;
    font-size: 0.84em;
    font-variant-numeric: tabular-nums;
  }

  &__满 {
    margin: 12px 0 0;
    color: #55606d;
    font-size: 0.86em;
  }

  &__脚 {
    margin-top: 13px;
    padding-top: 11px;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
  }

  /* 收起来是退回仓库, 不是卖掉 —— 文案要写明, 否则玩家不敢点 */
  &__收 {
    width: 100%;
    min-height: 38px;
    border-radius: 8px;
    border: 1px solid rgba(255, 215, 110, 0.28);
    background: rgba(255, 215, 110, 0.1);
    color: #ffd76e;
    font-family: inherit;
    font-size: 0.94em;
    cursor: pointer;

    &:hover {
      background: rgba(255, 215, 110, 0.18);
    }
  }

  &__提示 {
    display: block;
    color: #55606d;
    font-size: 0.84em;
  }
}
</style>
