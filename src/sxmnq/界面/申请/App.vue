<template>
  <div class="申请块 界卡">
    <h4 class="申请块__日">{{ 数据.世界.日期 }} · {{ 数据.世界.时段 }}</h4>

    <p v-if="!待接.length" class="申请块__空">
      今天没有新的申请。{{ 已接.length ? '' : '去休息，或者等明天。' }}
    </p>

    <article v-for="申 in 待接" :key="申.姓名" class="申请">
      <div class="申请__首">
        <span class="申请__名">{{ 申.姓名 }}</span>
        <span class="申请__级">{{ 申.等级 }}级</span>
        <span v-if="申.信赖" class="申请__熟">信赖 {{ 申.信赖 }}</span>
        <span class="申请__污">污染 {{ 申.污染度 }}</span>
      </div>
      <p class="申请__源">{{ 申.战损来源 }}</p>
      <div class="申请__底">
        <span class="申请__计">诊金 {{ 申.诊金 }} · 约 {{ 申.线数 }} 条丝线 · 还要 {{ 申.预计次数 }} 趟</span>
        <span v-if="!床位够吗(申.姓名)" class="申请__满">没床了</span>
        <button class="申请__钮 is-拒" @click="婉拒(申.姓名)">婉拒</button>
        <button class="申请__钮 is-接" :disabled="!床位够吗(申.姓名)" @click="接诊(申)">接诊</button>
      </div>
    </article>

    <div v-if="数据.今日.待登记.length" class="申请块__待登">
      <p class="申请块__待登标">桌上还压着 {{ 数据.今日.待登记.length }} 张没登记的申请单</p>
      <!-- `_` 是必须的: 写成 (条, i) 会让 `条` 成为未使用的变量, eslint 报错。这里只要序号 -->
      <span v-for="(_, i) in 数据.今日.待登记" :key="i" class="申请块__徽">
        未登记 · {{ String(i + 1).padStart(2, '0') }}
      </span>
    </div>

    <div v-if="已接.length" class="申请块__已接">
      <span class="申请块__已接标">今日已接</span>
      <span v-for="名 in 已接" :key="名" class="申请块__徽">{{ 名 }}</span>
    </div>

    <!-- 治疗浮层挂在三个块**之外**(Teleport 到 body)。
         它原来是块内的一个 position:fixed 元素 —— 拆成三块之后,
         治疗进行中点一下别的块就能让浮层消失, 而治疗状态还在 (spec §9.1.1)。 -->
    <Teleport to="body">
      <div v-if="诊疗" class="申请块__罩">
        <TreatmentPanel :哨兵姓名="诊疗.姓名" :参数="诊疗.参数" @结算="结束" @取消="诊疗 = null" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// import 名必须是 ASCII。写成 `<治疗面板 />` 会被当纯文本渲染、绑定全丢,
// 于是 `结束` 成了没人用的函数, 被 tree-shaking 删掉, 连带整个 结算.ts 都不进包
// —— 而且只有生产构建才会这样, dev 模式不做 tree-shaking, 一点征兆都没有。
import TreatmentPanel from '../治疗/App.vue';
import {
  算单次清除量,
  算预计次数,
  算线数,
  type 等级,
  type 治疗参数,
  type 治疗结果,
} from '../治疗/game';
import { 应用结算, 构建元指令, 能接诊吗, type 结算上下文 } from '../状态栏/结算';
import { 算床位 } from '../../家园/家具';
// 用 共用/数据 那一份(读最新一楼), **不要**在本地另起一个 store —— 界面只在第 0 楼
// 挂载, 钉死楼层的 store 会读到开局冻结状态, 与同一屏顶部的角标对不上。详见原注释。
import { useDataStore } from '../共用/数据';
import { 盯住日期 } from '../共用/掷骰接线';

interface 申请项 {
  姓名: string;
  等级: 等级;
  污染度: number;
  战损来源: string;
  诊金: number;
  信赖: number;
  线数: number;
  /** 按评级 A 估的还要几趟 (spec §5.2) —— 接诊**之前**就得看得见 */
  预计次数: number;
}

const store = useDataStore();
const 数据 = computed(() => store.data);

/** 床位是派生值: 摆出来的床有几张 (spec §7.1) */
const 床位 = computed(() => 算床位(数据.value.诊所.家具));

/** 床位满时按钮置灰 + 一句「没床了」(spec §5.2)。已经在诊的那个人不受限 —— 那是复诊 */
function 床位够吗(姓名: string): boolean {
  return 能接诊吗(数据.value.哨兵, 床位.value, 姓名);
}

/**
 * 掷骰的唯一入口。它常驻挂载(在「申请」折叠区里用 v-show, 不销毁),
 * 所以放在这里就够 —— 不需要在 主界面/App.vue 那个 500ms 轮询里再做一次。
 *
 * ⚠ **这一块永远不能用 `v-if`。** 用了就是把这条 watch 一起销毁:
 * 掷骰和申请列表会静默死掉, 不报错, 只是永远不再出现新申请 (spec §9.1)。
 */
盯住日期({
  今日: () => 数据.value.今日,
  日期: () => 数据.value.世界.日期,
  等级: () => 数据.value.诊所.等级,
});

function 算预计线数(姓名: string, 等级: 等级, 污染度: number) {
  return 算线数({
    污染度,
    哨兵等级: 等级,
    主角等级: 数据.value.诊所.等级,
    信赖: 数据.value.哨兵[姓名]?.信赖 ?? 0,
    第几次: 1,
    预计次数: 1,
  });
}

const 待接 = computed<申请项[]>(() =>
  _(数据.value.今日.申请列表)
    .entries()
    .filter(([, 项]) => 项.状态 === '待接')
    .map(([姓名, 项]) => ({
      姓名,
      等级: 项.等级,
      污染度: 项.污染度,
      战损来源: 项.战损来源,
      诊金: 项.诊金,
      信赖: 数据.value.哨兵[姓名]?.信赖 ?? 0,
      线数: 算预计线数(姓名, 项.等级, 项.污染度),
      // 以**申请列表里写的**污染度为准, 而不是 哨兵 里存的旧值 ——
      // 回头客重新出现在申请列表时, 只有申请列表是他此刻最新的状态 (同 应用结算)。
      预计次数: 算预计次数(项.污染度, 算单次清除量(数据.value.诊所.等级)),
    }))
    .value(),
);

const 已接 = computed(() =>
  _(数据.value.今日.申请列表)
    .entries()
    .filter(([, 项]) => 项.状态 === '已接')
    .map(([姓名]) => 姓名)
    .value(),
);

const 诊疗 = ref<{ 姓名: string; 参数: 治疗参数 } | null>(null);

function 接诊(申: 申请项) {
  const 等级 = 数据.value.诊所.等级;
  诊疗.value = {
    姓名: 申.姓名,
    参数: {
      污染度: 申.污染度,
      哨兵等级: 申.等级,
      主角等级: 等级,
      信赖: 申.信赖,
      第几次: (数据.value.哨兵[申.姓名]?.已治疗 ?? 0) + 1,
      预计次数: 算预计次数(申.污染度, 算单次清除量(等级)),
    },
  };
}

function 婉拒(姓名: string) {
  const 项 = 数据.value.今日.申请列表[姓名];
  if (项) 项.状态 = '已婉拒';
}

async function 结束(果: 治疗结果) {
  const 患 = 诊疗.value;
  if (!患) return;

  const 申 = 数据.value.今日.申请列表[患.姓名];
  const 旧 = 数据.value.哨兵[患.姓名];

  // 首次接诊时 应用结算 会照 患者 就地建档, 所以这里必须把**整份档案**带上。
  // 少一个字段, schema 的 prefault 就会把它悄悄填成空串 —— 界面上表现为
  // 「这个病人没有精神体」, 而哪里都不报错。
  //
  // 以申请列表那一份为准(它是这个人此刻最新的状态), 没有才退回已有的哨兵记录。
  const 档 = 申 ?? 旧;

  // 先把结算时的状态拍下来 —— 元指令描述的是这一场**开始时**的处境,
  // 而应用结算会就地改掉精神力、名声这些东西。
  const 上: 结算上下文 = {
    世界: { 日期: 数据.value.世界.日期, 时段: 数据.value.世界.时段 },
    主角: {
      姓名: 数据.value.主角.姓名,
      精神力: 数据.value.主角.精神力,
      精神力上限: 数据.value.主角.精神力上限,
    },
    诊所: {
      名称: 数据.value.诊所.名称,
      等级: 数据.value.诊所.等级,
      $称号: 数据.value.诊所.$称号,
      名声: 数据.value.诊所.名声,
      床位: 床位.value,
    },
    // ★ 真的接上了 —— 装修好的诊所, 结算文案会不一样 (spec §7.3)
    气氛: 数据.value.诊所.气氛,
    患者: {
      姓名: 患.姓名,
      等级: 患.参数.哨兵等级,
      污染度: 患.参数.污染度,
      战损来源: 档?.战损来源 ?? '',
      年龄: 档?.年龄 ?? 25,
      地域: 档?.地域 ?? '',
      精神体: 档?.精神体 ?? { 纲: '', 方向: '', 栖息: '', 体型: '', 危险: '' },
      特征: 档?.特征 ?? [],
      A面: 档?.A面 ?? '',
      B面: 档?.B面 ?? '',
      信赖: 旧?.信赖 ?? 0,
      好感: 旧?.好感 ?? 0,
      基础诊金: 申?.诊金 ?? 0,
      $信赖: 旧?.$信赖 ?? '',
      $好感: 旧?.$好感 ?? '',
    },
  };

  const 收益 = 应用结算(store.data, 上, 果);
  诊疗.value = null;

  await createChatMessages([{ role: 'user', message: 构建元指令(上, 果) }]);
  await triggerSlash('/trigger');

  toastr.success(`评级 ${果.评级}　诊金 +${收益.诊金}　名声 +${收益.名声}`, '疏导结束');
}
</script>

<style lang="scss" scoped>
.申请块 {
  &__日 {
    margin: 0 0 7px;
    color: #6f7a87;
    font-size: 0.8em;
    font-weight: 500;
    letter-spacing: 0.08em;
  }

  &__空 {
    margin: 0 0 6px;
    color: #55606d;
    font-size: 0.85em;
  }

  &__已接 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding-top: 9px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__已接标 {
    color: #6f7a87;
    font-size: 0.78em;
  }

  &__徽 {
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(127, 227, 255, 0.1);
    border: 1px solid rgba(127, 227, 255, 0.22);
    color: #a8ecff;
    font-size: 0.78em;
  }

  /* 掷完但 AI 还没起名的那些。虚框 + 压暗, 一眼看出「还不能接」——
     它们不在 申请列表 里, 所以点不动, 是这一局的待办而不是这一屏的病人 (spec §8.2) */
  &__待登 {
    margin: 8px 0;
    padding: 8px;
    border: 1px dashed currentColor;
    border-radius: 6px;
    opacity: 0.55;
  }

  &__待登标 {
    margin: 0 0 6px;
    font-size: 12px;
  }

  /* 治疗浮层。Teleport 到 body, 所以 fixed 是相对视口的 —— 盖住整个界面 */
  &__罩 {
    position: fixed;
    inset: 0;
    z-index: 9999;
  }
}

.申请 {
  padding: 9px 11px;
  margin-bottom: 7px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.055);

  &__首 {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 9px;
  }

  &__名 {
    color: #eef3f8;
    font-weight: 600;
  }

  &__级 {
    color: #b39ddb;
    font-size: 0.85em;
  }

  &__熟 {
    padding: 1px 7px;
    border-radius: 999px;
    background: rgba(255, 215, 110, 0.1);
    border: 1px solid rgba(255, 215, 110, 0.24);
    color: #ffd76e;
    font-size: 0.76em;
  }

  &__污 {
    margin-left: auto;
    color: #7d8896;
    font-size: 0.85em;
    font-variant-numeric: tabular-nums;
  }

  &__源 {
    margin: 4px 0 7px;
    color: #77828f;
    font-size: 0.84em;
  }

  &__底 {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  &__计 {
    flex: 1;
    color: #6f7a87;
    font-size: 0.8em;
    min-width: 0;
  }

  /* 床位满了。接诊按钮置灰时在旁边说明原因 ——
     只置灰不说话, 玩家会以为是坏了 (spec §5.2) */
  &__满 {
    margin-left: auto;
    font-size: 11px;
    opacity: 0.6;
  }

  &__钮 {
    flex: none;
    min-height: 30px;
    padding: 0 13px;
    border-radius: 7px;
    border: 1px solid transparent;
    font-family: inherit;
    font-size: 0.84em;
    cursor: pointer;
    transition: background 0.18s ease;

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    &.is-接 {
      background: rgba(127, 227, 255, 0.15);
      border-color: rgba(127, 227, 255, 0.36);
      color: #a8ecff;

      /* 置灰的按钮别再亮起来 —— 否则「没床了」的按钮看着像能点 */
      &:not(:disabled):hover {
        background: rgba(127, 227, 255, 0.25);
      }
    }

    &.is-拒 {
      background: rgba(255, 255, 255, 0.045);
      border-color: rgba(255, 255, 255, 0.08);
      color: #77828f;

      &:not(:disabled):hover {
        background: rgba(255, 255, 255, 0.08);
      }
    }
  }
}

@media (max-width: 480px) {
  .申请__钮 {
    min-height: 34px;
    padding: 0 15px;
  }
}
</style>
