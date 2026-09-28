<template>
  <div class="创">
    <div class="创__晕" />

    <div class="创__中" :style="{ paddingTop: `${顶栏高}px` }">
      <div class="创__台" :style="{ transform: `scale(${缩放})` }">
        <div class="创__文">
          <div class="创__署">
            <span>开局创建</span>
          </div>

          <div class="创__步">
            <button v-if="步 !== '身份'" class="创__退" @click="退">‹ 返回</button>
            <span class="创__步文">{{ 步文 }}</span>
          </div>

          <!-- key 挂在体上: 换步时整块重挂, 入场动画才会重放一遍。
               不这么做的话三步之间是原地改内容, 看起来像卡住了。 -->
          <div :key="步" class="创__体">
            <template v-if="步 === '身份'">
              <button
                v-for="项 in 身份表"
                :key="项.键"
                class="创__卡"
                :class="{ 'is-开': 项.开 }"
                :aria-disabled="项.开 ? undefined : 'true'"
                @click="选身份(项)"
              >
                <span class="创__卡名">{{ 项.名 }}</span>
                <span class="创__卡介">{{ 项.介 }}</span>
                <span v-if="!项.开" class="创__未">未开放</span>
              </button>
            </template>

            <template v-else-if="步 === '路线'">
              <button v-for="项 in 路线表" :key="项.键" class="创__卡 is-开" @click="选路线(项)">
                <span class="创__卡名">{{ 项.名 }}</span>
                <span class="创__卡介">{{ 项.介 }}</span>
              </button>
            </template>

            <template v-else>
              <input
                v-model="诊所名"
                class="创__入"
                type="text"
                maxlength="12"
                placeholder="无名诊所"
                aria-label="诊所名称"
                @keydown.enter="进入"
              />

              <div class="创__试">
                <span class="创__试标">想不出来？试试</span>
                <div class="创__试行">
                  <button v-for="名 in 候补名" :key="名" class="创__签" @click="诊所名 = 名">
                    {{ 名 }}
                  </button>
                </div>
              </div>

              <button class="创__进" @click="进入">进入白塔</button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 开局创建。三步: 身份 → 路线 → 给诊所起名。
//
// 这里**只在最后一步写变量**, 前两步只记在内存里 —— 所以「‹ 返回」一路退回去改主意
// 都是安全的, 不会中途落下半份脏数据。
//
// `身份` / `路线` 的取值必须和 schema.ts 里的 enum 一个字都不差。写错了不会报错:
// MVU 的 store 拿到 safeParse 失败就**直接 return**, 变量就永远停在旧值上, 静默失效。
// 而且 ts-loader 配的是 transpileOnly, 类型不对构建照样过。
//
// import 名必须是 ASCII —— Vue 模板编译器认不出非 ASCII 的标签名, 写成 `<身份卡 />`
// 会被当纯文本渲染、绑定全丢, 而且只有生产构建才发作(见 状态栏/App.vue 同一处注释)。
import { useDataStore } from '../共用/数据';
import { use合窗 } from '../共用/合窗';
import { use顶栏高 } from '../共用/量顶栏';

const emit = defineEmits<{ 完成: [] }>();

const store = useDataStore();

// 尺寸纪律同标题页: 画布固定像素, 相对量只有 JS 算出来的那个缩放系数。
// 详见 共用/合窗.ts。
const 顶栏高 = use顶栏高();
const { 缩放, 量 } = use合窗(340, 420, () => 顶栏高.value);
watch(顶栏高, 量);

type 步 = '身份' | '路线' | '命名';

const 步 = ref<步>('身份');

const 步文 = computed(
  () => ({ 身份: '第 一 步 · 你 是 谁', 路线: '第 二 步 · 走 哪 条 路', 命名: '第 三 步 · 给 它 起 个 名' })[步.value],
);

// 键必须与 schema 的 enum 一致, 见文件头。
const 身份表 = [
  {
    键: '向导',
    名: '向导',
    介: '精神疏导者。刚从向导学院毕业，继承了一间破诊所。',
    开: true,
  },
  {
    键: '哨兵',
    名: '哨兵',
    介: '五感强化者。',
    开: false,
  },
] as const;

const 路线表 = [{ 键: '常规', 名: '常规路线', 介: '从无名诊所开始。接单、疏导、攒名声。' }] as const;

type 身份键 = (typeof 身份表)[number]['键'];
type 路线键 = (typeof 路线表)[number]['键'];

// 选不了的那个也留个默认值: 哨兵线开放那天, 这段代码一行都不用改。
const 身份 = ref<身份键>('向导');
const 路线 = ref<路线键>('常规');

const 诊所名 = ref('');

// 候选名纯粹是省打字 —— 手机上输中文很烦, 想不出名字也很烦。
const 候补名 = ['听雨', '长明', '归鸦', '拾光'];

function 退() {
  步.value = 步.value === '命名' ? '路线' : '身份';
}

function 选身份(项: (typeof 身份表)[number]) {
  if (!项.开) {
    // 不能静默。灰按钮点下去没反应, 玩家会以为是卡了, 而不是"这条路还没开"。
    try {
      toastr.info('哨兵线还没做，这一期只有向导。', '未开放');
    } catch {
      // 不在酒馆里(开发期直接开 index.html)时没有 toastr, 忽略。
    }
    return;
  }
  身份.value = 项.键;
  步.value = '路线';
}

function 选路线(项: (typeof 路线表)[number]) {
  路线.value = 项.键;
  步.value = '命名';
}

/**
 * 落盘。三个变量一起写, 写的是 store.data —— MVU 的 store 上挂着 deep watch,
 * 改完它自己会 updateVariablesWith 回去(结算.ts 也是这么写的)。
 */
function 进入() {
  const 数 = store.data;
  数.主角.身份 = 身份.value;
  数.主角.路线 = 路线.value;
  // 空着就退回 initvar 的默认。不写空串: 状态栏有 `|| '未命名的诊所'` 兜得住,
  // 但结算.ts 拼的元指令里会变成「诊所：｜…」, 空一块。
  数.诊所.名称 = 诊所名.value.trim() || '无名诊所';
  // 这一下之后, 路由就不再把玩家送回这儿了(见 入口/App.vue)。
  数.主角.已创建 = true;
  emit('完成');
}
</script>

<style lang="scss" scoped>
.创 {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(168deg, #131922 0%, #10151c 46%, #0a0e13 100%);
  color: #d8dee6;

  &__晕 {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(58% 42% at 26% 14%, rgba(127, 227, 255, 0.07), transparent 70%);
  }

  &__中 {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  &__台 {
    width: 340px;
    height: 420px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: center center;
  }

  // 固定高。三步的内容高矮不一, 不钉住的话换步时上面的署名和步骤行会跟着上下跳。
  &__文 {
    display: flex;
    flex-direction: column;
    width: 340px;
    height: 400px;
  }

  &__署 {
    opacity: 0;
    animation: th-rise 0.8s 0.1s ease-out both;

    span {
      color: #8e99a6;
      font-size: 13px;
      letter-spacing: 0.3em;
      text-indent: 0.3em;
    }
  }

  &__步 {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 26px;
    margin: 10px 0 14px;
    opacity: 0;
    animation: th-rise 0.8s 0.2s ease-out both;
  }

  &__退 {
    position: absolute;
    left: 0;
    padding: 2px 6px 2px 0;
    border: 0;
    background: none;
    color: #6f7a87;
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    transition: color 0.18s ease;

    &:hover {
      color: #a8ecff;
    }
  }

  &__步文 {
    width: 100%;
    color: #8e99a6;
    font-size: 12px;
    letter-spacing: 0.2em;
    text-indent: 0.2em;
    text-align: center;
  }

  // 三步共用的容器: 内容在剩下的高度里居中, 换步时整块重挂放动画。
  &__体 {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    min-height: 0;
    animation: th-rise 0.4s ease-out both;
  }

  &__卡 {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 7px;
    width: 100%;
    padding: 15px 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.02);
    color: inherit;
    font-family: inherit;
    text-align: left;
    cursor: default;
    transition: border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;

    &.is-开 {
      cursor: pointer;

      &:hover {
        border-color: rgba(127, 227, 255, 0.44);
        background: rgba(127, 227, 255, 0.07);
        box-shadow: 0 0 22px rgba(127, 227, 255, 0.1);
      }

      &:active {
        transform: scale(0.988);
      }
    }

    // 点得动、但点了会说"还没开"。不用 disabled: 那属性会让点击事件根本不触发,
    // 就没法告诉玩家为什么。
    &[aria-disabled='true'] {
      opacity: 0.4;
    }
  }

  &__卡名 {
    color: #eef3f8;
    font-size: 15px;
    letter-spacing: 0.14em;
  }

  &__卡介 {
    color: #8e99a6;
    font-size: 12px;
    line-height: 1.6;
  }

  &__未 {
    position: absolute;
    right: 14px;
    top: 17px;
    color: #6f7a87;
    font-size: 11px;
    letter-spacing: 0.1em;
  }

  &__入 {
    box-sizing: border-box;
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border: 1px solid rgba(127, 227, 255, 0.24);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    color: #eef3f8;
    font-family: inherit;
    font-size: 15px;
    letter-spacing: 0.08em;
    transition: border-color 0.22s ease, background 0.22s ease;

    &::placeholder {
      color: #4d5866;
      letter-spacing: 0.08em;
    }

    &:focus {
      outline: none;
      border-color: rgba(127, 227, 255, 0.5);
      background: rgba(127, 227, 255, 0.05);
    }
  }

  &__试 {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 6px;
  }

  &__试标 {
    color: #6f7a87;
    font-size: 11px;
    letter-spacing: 0.12em;
  }

  &__试行 {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  &__签 {
    min-height: 30px;
    padding: 0 13px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.03);
    color: #8e99a6;
    font-family: inherit;
    font-size: 12px;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;

    &:hover {
      border-color: rgba(127, 227, 255, 0.4);
      background: rgba(127, 227, 255, 0.09);
      color: #a8ecff;
    }
  }

  // 和标题页那颗「开始游戏」同一个模样 —— 开局这一路走下来, 最后一下该是同一个动作。
  &__进 {
    position: relative;
    overflow: hidden;
    width: 100%;
    min-height: 46px;
    padding: 0;
    border: 1px solid rgba(127, 227, 255, 0.34);
    border-radius: 10px;
    background: rgba(127, 227, 255, 0.09);
    color: #cdf3ff;
    font-family: inherit;
    font-size: 15px;
    letter-spacing: 0.2em;
    text-indent: 0.2em;
    cursor: pointer;
    transition: background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.12s ease;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: -60%;
      width: 46%;
      background: linear-gradient(to right, transparent, rgba(205, 243, 255, 0.22), transparent);
      transform: skewX(-18deg);
      transition: left 0.55s cubic-bezier(0.3, 0.7, 0.3, 1);
      pointer-events: none;
    }

    &:hover {
      background: rgba(127, 227, 255, 0.16);
      border-color: rgba(127, 227, 255, 0.52);
      box-shadow: 0 0 24px rgba(127, 227, 255, 0.16);

      &::after {
        left: 118%;
      }
    }

    &:active {
      transform: scale(0.975);
    }
  }
}

@keyframes th-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

// 系统设了"减少动态效果"就把入场也收掉, 直接显示。
@media (prefers-reduced-motion: reduce) {
  .创__署,
  .创__步,
  .创__体 {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
