import { 文案形状 } from './生成/文案';
import { 社交形状 } from './养成/哨兵社交';
import { 转换旧年历 } from './养成/年历';
import { 探索形状 } from './养成/探索事件';
import { 购物形状 } from './购物/schema';
import { 创建形象 } from './生成/形象';
import { 具体精神体 } from './生成/精神体';
import { 好感分档, 信赖分档, 等级称号 } from './分档';
import { 算气氛, 开局家具 } from './家园/家具';
import { 大阿卡纳 } from './占卜/塔罗';
import { 路线取值 } from './路线';

/** 精神体名称与分类一同保存，旧存档缺少名称时补齐。 */
const 精神体形状 = z
  .object({
    名称: z.string().prefault(''),
    纲: z.string().prefault(''),
    方向: z.string().prefault(''),
    栖息: z.string().prefault(''),
    体型: z.string().prefault(''),
    危险: z.string().prefault(''),
  })
  .transform(data => ({ ...data, 名称: data.名称 || 具体精神体(data) }))
  .prefault({});

/**
 * 一份哨兵档案。**申请列表 / 哨兵 两处共用这一个形状。**
 *
 * spec §8.5 说「三个结构的字段必须一致 —— 人是同一个对象在流转, 不重新生成」。
 * 那时第三个结构是 `待登记`, 2026-10-06「名单直出」把它删了, 所以现在只剩两处。
 * 靠这一处保证, 而不是靠两处手抄同一份字段表: 手抄的版本改一处忘另一处,
 * 而漏掉的字段会被 zod **静默丢掉** —— 界面上看起来只是「这个人没精神体」。
 *
 * 每个字段都带 prefault。不是因为前端会漏写, 是因为 MVU 每次 parse 的是
 * **整份** stat_data, 任何一个字段缺失都会让 safeParse 整体失败、
 * 于是整个 store 退回默认值 (util/mvu.ts: `if (result.error) return`)。
 */
const 档案形状 = {
  等级: z.enum(['D', 'C', 'B', 'A', 'S']).prefault('D'),
  污染度: z.coerce.number().prefault(0),
  诊金: z.coerce.number().prefault(0),
  年龄: z.coerce.number().prefault(25),
  地域: z.string().prefault(''),
  精神体: 精神体形状,
  特征: z.array(z.string()).prefault([]),
  形象: z.object({
    版本: z.literal(1), 肤色: z.string(), 发色: z.string(), 发型: z.string(),
    瞳色: z.string(), 体态: z.string(), 亚种: z.string(), 亚种特征: z.string(),
    辨识特征: z.array(z.string()), 气息: z.string(), 相处细节: z.string(),
  }).optional().catch(undefined),
  A面: z.string().prefault(''),
  B面: z.string().prefault(''),
  战损来源: z.string().prefault(''),
};

/** 世界页「近期事件」一条。都是文本, 没有数值 —— 那是 AI 的文笔活。 */
const 近期事件形状 = z
  .object({
    名称: z.string().prefault(''),
    状态: z.string().prefault(''),
    说明: z.string().prefault(''),
  })
  .prefault({});

/**
 * 《白塔日报》的社会版供稿。**AI 写的, 可选。**
 *
 * 报纸的主体是前端池子 (零 token, 见 报纸/池子.ts), 这里只是给 AI 留一个
 * 「把跟当下剧情有关的那一条插进社会版」的口子。AI 不写完全没关系 ——
 * 日期对不上、或者一条都没有, 社会版就退回池子, 不会空版。
 */
/** 跟 报纸/投稿.ts 的 投稿版面 是同一组。这里不 import 它: schema 是数据的定义,
 *  不该反过来依赖界面模块的常数表, 而两边一共五个词, 抄一遍比绕一圈清楚。
 *  改版面时 **两处都要改**, 漏了的话玩家买的稿子会被 transform 打回分类广告版。 */
const 认得的版面 = ['宣传诊所', '社会', '学术科技', '趣闻', '广告'];

const 供稿形状 = z
  .object({
    // 与世界.日期逐字相等的才显示。这样 AI 忘了清理旧稿也不会登出隔天的新闻。
    日期: z.string().prefault(''),
    标题: z.string().prefault(''),
    正文: z.string().prefault(''),
  })
  .prefault({});

/**
 * 玩家的报纸投稿。**玩家掏钱买的版面** (spec §2.3: 一律花钱, 没有免费版面)。
 *
 * 没有 `是宣传` 这个字段 —— spec §6.3 的字段表里有, 但那是**跟 `版面` 同一件事**:
 * `版面` 取 '宣传诊所' 就等于「是宣传」。两个字段存一个事实, 迟早会出现
 * 「版面: 趣闻 且 是宣传: true」这种自相矛盾的状态, 而加不加名声就变得看谁先读。
 * 所以只留 `版面` 一处, 名声由它推出来 (见 报纸/投稿.ts 的 落在哪版)。
 *
 * `版面` 是 `z.string()` 不是 `z.enum()`: 这个值就算写坏了 (手改存档、以后改版面名),
 * 后果也只是这一则落在分类广告版; 换成 enum 的话整个 stat_data 会 safeParse 失败、
 * 全部退回默认值 —— 那是这个仓库最怕的那种静默失败。收窄交给下面的 transform。
 */
const 投稿形状 = z
  .object({
    日期: z.string().prefault(''),
    版面: z.string().prefault('广告'),
    标题: z.string().prefault(''),
    正文: z.string().prefault(''),
    署名: z.string().prefault(''),
  })
  .transform(稿 => ({ ...稿, 版面: 认得的版面.includes(稿.版面) ? 稿.版面 : '广告' }))
  .prefault({});

/**
 * 今天抽的那一卦 (spec §7)。**整个对象连解读一起存**, 所以当天不管刷新多少次、
 * 精神力怎么变, 翻出来的都是同一张牌同一段话。
 *
 * `牌` 认不出时把整份卦清空 (而不是留着那句话): 牌名是会长大的东西, 以后
 * 改译名 (「愚者」→「愚人」) 或改牌堆, 老存档里就会留下一个牌堆里没有的名字。
 * 留着它的话牌面印不出编号、翻牌动画也找不着牌, 界面上是一张残牌; 清空则是
 * 「今天还没抽」, 玩家再抽一次就正常了 —— 这是能自愈的那一种。
 */
const 占卜形状 = z
  .object({
    已抽于: z.string().prefault(''),
    牌: z.string().prefault(''),
    逆位: z.boolean().prefault(false),
    解读: z.string().prefault(''),
  })
  .transform(卦 =>
    卦.牌 && !大阿卡纳.some(牌 => 牌.名 === 卦.牌)
      ? { 已抽于: '', 牌: '', 逆位: false, 解读: '' }
      : 卦,
  )
  .prefault({});

const 作品形状 = z.object({
  标题: z.string().prefault(''), 笔名: z.string().prefault('匿名'),
  类型: z.enum(['小说', '随笔']).prefault('小说'),
  名气: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
  期数: z.coerce.number().prefault(0), 首刊日: z.coerce.number().prefault(1),
  最近刊登日: z.coerce.number().prefault(1), 最近日期: z.string().prefault(''),
});
export const Schema = z.object({
  购物: 购物形状,
  创作: z.object({
    名气: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
    传播结算日: z.coerce.number().prefault(0),
    作品: z.array(作品形状).prefault([]),
    场景日: z.coerce.number().prefault(0),
    场景名气: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
    场景作品: z.array(作品形状).prefault([]),
  }).prefault({}),
  向导: z.object({
    等级: z.enum(['D','C','B','A','S']).prefault('D'),
    经验: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
    力量: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(10),
    精神: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(10),
    学识: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(10),
    魅力: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(10),
    已通关: z.boolean().prefault(false),
  }).prefault({}),
  日程: z.object({
    序章已读: z.boolean().prefault(false),
    历法版本: z.coerce.number().prefault(0),
    历法偏移: z.coerce.number().transform(Math.trunc).prefault(0),
    天数: z.coerce.number().transform(v => Math.max(1, Math.floor(v))).prefault(1),
    时段: z.coerce.number().transform(v => _.clamp(Math.floor(v), 0, 3)).prefault(0),
    起始日期: z.string().prefault(''), 已接诊: z.coerce.number().prefault(0),
    本日经验: z.coerce.number().prefault(0), 活动记录: z.array(z.string()).prefault([]),
    上日结算: z.string().prefault(''), 考核目标: z.string().prefault(''),
    考核阶段: z.coerce.number().prefault(0), 偶遇: z.string().prefault(''),
  }).prefault({}),
  世界: z
    .object({
      日期: z.string().prefault(''),
      时段: z.string().prefault(''),
      地点: z.string().prefault(''),

      // ★ 2026-10-05 扩的一层, 只为「世界是活的」这件事。
      //
      // 加这些字段**不只是为了显示**: 「变量列表」那条世界书整个是 format_message_variable
      // 出来的, 字段一进 schema, AI 下一次就会看见它们、就会开始填。所以 schema 这边加了,
      // 世界书/变量/变量更新规则.yaml 那边必须同步加规则 —— 少了那半边, 字段会一直空着,
      // 界面上看起来只是「今天没什么可说的」, 一点都不报错。
      时刻: z.string().prefault(''), // "07:30"
      星期: z.string().prefault(''),
      季节: z.string().prefault(''),
      天气: z.string().prefault(''),
      生活: z.object({社交:社交形状,探索:探索形状,更新日:z.coerce.number().prefault(0),节日:z.string().prefault(''),城内消息:z.string().prefault(''),遭遇记录:z.array(z.object({日期:z.string(),地点:z.string(),标题:z.string(),正文:z.string(),结果:z.string()})).transform(v=>v.slice(-8)).prefault([])}).prefault({}),
      温度: z.string().prefault(''), // 体感, 如「偏冷」。不是数字

      /** 一句话, 世界正在发生的大事。不是主角的日常 (spec §2.1) */
      世界主线: z.string().prefault(''),
      /** 平行发生的事件。AI 用 append 追加, 这里只保留最近 5 条 */
      近期事件: z.array(近期事件形状).prefault([]),

      // ★ 报纸 (第 3 期)。这两个都**不是「今天的报纸」本身** —— 报纸是前端按
      //   世界.日期 现算出来的 (报纸/装配.ts), 零 token、同一天同一份。
      //   这里存的只是「AI 想插的头条」和「玩家花钱买的版面」。
      报纸供稿: z.array(供稿形状).prefault([]),
      报纸投稿: z.array(投稿形状).prefault([]),

      // ★ 占卜 (第 4 期)。**玩家点出来的, 不是 AI 写的** —— 变量更新规则里
      //   明说了不让它碰这个字段。它进 schema 只是为了有个地方放下那一卦。
      占卜: 占卜形状,
    })
    // 截断放在这里而不是 z.array().transform() 上: 这个 .transform().prefault() 的组合
    // 在 主角/诊所 上已经跑了一年多, 是验过的写法; 链在数组上的那种没验过。
    //
    // 三样都要截, 因为整份 stat_data 每一轮都会被 format_message_variable 注进提示词
    // (变量列表.yaml), 留着不删就是每一轮都在烧的 token。5 条是「够玩家翻一翻往期,
    // 又不至于变成一本账」的量 —— 投稿是玩家自己写的字, 往往比 AI 写的长。
    .transform(世界 => ({
      ...世界,
      近期事件: 世界.近期事件.slice(-5),
      报纸供稿: 世界.报纸供稿.slice(-5),
      报纸投稿: 世界.报纸投稿.slice(-5),
    }))
    .prefault({}),

  主角: z
    .object({
      姓名: z.string().prefault(''),

      // 开局在创建页选的两样, 之后不再变。写进变量而不是只存在前端里, 是因为
      // 「变量列表」那条世界书会把整份 stat_data 注入提示词 —— 选了什么是靠这个
      // 让 AI 知道的, 不是靠界面告诉它。
      身份: z.enum(['向导', '哨兵']).prefault('向导'),
      // 取值在 `路线.ts` —— 创建页渲染的卡片也从那儿读, 所以两边不可能对不上。
      // 加一条新线往那个数组里加一个字符串就行, 这里一个字都不用动。
      //
      // `常规` 是 2026-10-08 改名前的老名字, 只当**别名**收: 那次改名把 `常规`
      // 换成了 `诊所线`, 而老存档的变量里存的还是 `常规`。要是直接从枚举里删掉,
      // safeParse 会整份失败 —— 而 MVU 拿到失败是直接 return 的, 玩家看到的是
      // 「所有数字变回默认值」, 一条报错都没有。所以先归一再交给枚举去挑。
      路线: z
        .preprocess(值 => (值 === '常规' ? '诊所线' : 值), z.enum(路线取值))
        .prefault('白塔向导路线'),

      // 开局创建走没走过。只在「进入白塔」那一下置 true, 之后没人再动它。
      //
      // 判「该不该去创建页」用它, 而不是用「末楼是不是 0」: 末楼只是消息条数,
      // 跟有没有选过身份是两回事 —— 聊过几句又没走过创建的存档(老版本留下的、
      // 或者玩家自己接着写下去的)用末楼判就永远补不上了。
      //
      // 它会跟着整份 stat_data 进提示词, 多一个布尔值而已, 不值当为它单开一套
      // chat 级变量。
      已创建: z.boolean().prefault(false),

      精神力: z.coerce.number().prefault(0),
      精神力上限: z.coerce.number().prefault(100),
      金钱: z.coerce.number().prefault(500),
    })
    .transform(data => ({
      ...data,
      精神力: _.clamp(data.精神力, 0, data.精神力上限),
    }))
    .prefault({}),

  诊所: z
    .object({
      名称: z.string().prefault(''),
      // ★ 合并了原来的 主角.执业等级 与 诊所.星级: 两者原本都是「你在这一行的分量」,
      //   只分面向病人还是面向同行, 分开就会出现「星级 4 但执业等级 D」这种荒谬状态。
      等级: z.enum(['D', 'C', 'B', 'A', 'S']).prefault('D'),
      名声: z.coerce.number().prefault(0),

      // ★ 家具数组。**一件家具「摆在哪」写在它自己身上** —— 早期是另存一张
      //   `摆位: {'一号·北': id}` 的表, 那样会出现「摆位指向一件已经不存在的家具」。
      //   数组天然允许同款买两件。`在哪` 为 '' 就是还在仓库 (spec §6.3)。
      //
      //   注意这里**没有 床位** 了: 它是派生值, 由 算床位(家具) 现算 (spec §7.1)。
      //   前序 §11 的 `床位: 1` 与 `摆位` 两条都并进这里。
      家具: z
        .array(
          z.object({
            名称: z.string().prefault(''),
            类型: z.enum(['床', '装饰']).prefault('床'),
            氛围: z.coerce.number().prefault(0),
            在哪: z.string().prefault(''),
          }),
        )
        .prefault([]),
    })
    .transform(data => {
      // 老存档里没有 `家具` 这个字段, prefault 会填成 [] ——
      // 于是派生出来的床位是 0, 等于把所有人的开局那张床弄丢了 (spec §8.1)。
      // **空 == 开局态** (本卡没有「卖掉所有家具」这条路), 所以这个播种是幂等的:
      // 家具非空就原样返回, 下次解析不会再播。
      // 注意: 内存里永远含播种结果(界面因此全程正确), 但**加载时那次写回不会发生** ——
      // store 判据是「与再解析一次 raw 的结果不同才写回」(util/mvu.ts), 两边都含播种, 相等。
      // 真正写回要等下一次变更(买/摆家具, 或 AI 改了别的变量)。
      const 家具 = data.家具.length ? data.家具 : 开局家具();
      return {
        ...data,
        家具,
        名声: _.clamp(data.名声, 0, 100),
        $称号: 等级称号(data.等级),
        // ★ 派生值, 照 $称号 的既有做法: 写在 schema 里、每次解析时重算,
        //   不靠谁记得在摆完家具之后去更新它 (spec §8 的 (b))。
        //   它取代的是已被删掉的 `减耗`。
        气氛: 算气氛(家具),
      };
    })
    .prefault({}),

  今日: z
    .object({
      // ★ 日期戳。iframe 每次渲染消息都会重建, 掷骰逻辑在里面跑,
      //   没有这个戳就会一天掷好几批 (spec §8.4)。
      //   与 世界.日期 相等 = 今天已经掷过, 什么都不做。
      已生成于: z.string().prefault(''),
      人物文案: 文案形状,

      // 今天门口排队的名单。**掷骰时前端直接产出这个 record** (生成.ts 的 掷一批),
      // 姓名就是键 —— 所以键一定非空、一定唯一 (重名在起名那一侧就避开了)。
      //
      // ★ 2026-10-06「名单直出」删掉了原来那两条:
      //   `待登记` (掷好了等人来的中间态) 与 `登场` (AI 报到的口子)。
      //   它们撑的是同一样东西 —— 「谁进来由 AI 决定」那道闸门。方向反过来了:
      //   名单现在是权威, 正文照名单写 (spec 2026-10-06-名单直出 §1)。
      //
      // ★ 这个字段**每轮都会被注进提示词** (变量列表 是 format_message_variable
      //   出来的), 所以 AI 每轮都看得见它 —— 这是下面 状态 要放宽的**理由**。
      申请列表: z
        .record(
          z.string().describe('哨兵姓名'),
          z
            .object({
              ...档案形状,
              // ★ 放宽类型, 把判断挪进 transform。原来这里是
              //   `z.enum(['待接','已接','已婉拒']).prefault('待接')`, 而 enum
              //   认不出就**整份 stat_data 解析失败**: util/mvu.ts 的 2 秒轮询
              //   与 watch 两处都是 `if (result.error) return`, 界面上只表现为
              //   「所有数字不再变」, 一条错都不报。
              //
              //   这个洞**一直开着**, 不是「将来才有的风险」: 旧世界书本来就指令 AI
              //   写这个字段 (那句原话是「【你】主角在正文里明确把人打发走时, 把 状态
              //   改成「已婉拒」」; 它已随本次改动从 变量更新规则.yaml 删掉)。
              //   那时没炸, 只是因为被指令写的那个值
              //   「已婉拒」**正好在 enum 里** —— 它要是写「婉拒」(少一个字) 就会炸。
              //   所以 enum 不是理论风险, 是一个当时就开着的洞。
              //
              //   配套的那另一半在 spec §7: 新世界书改成「【你】不要写 状态」, 把洞的
              //   来源撤掉。**那一处已经落地** —— 2026-10-06「名单直出」把 变量更新
              //   规则.yaml 里那句「【你】主角在正文里明确把人打发走时，把 状态 改成
              //   「已婉拒」」删掉了 (用原话指认它, 不写行号 —— 行号会漂; 上面「旧世界书
              //   本来就指令 AI 写这个字段」那段引的也是同一句, 同样改用原话)。所以现在
              //   是「**洞补上了, 来源也撤了**」。
              //   而名单从此每轮进提示词, 它读得更勤、伸手改是迟早的 —— 改的时候带的
              //   还是**它自己的用词**。放宽之后, 写歪只毁这一条的状态。
              //
              // ★ 用 `z.coerce.string()`, 而**不是** 投稿形状.版面 那个 `z.string()`。
              //   这两处**不是同一招, 是各自按威胁模型选的**:
              //   版面 防的是**玩家侧** (手改存档、以后改版面名), 玩家写出来的毕竟
              //   还是个字符串; 状态 是**AI 每轮都可能写**的, 而 AI 的输出**不带
              //   类型** —— 它可能写 null (想把这一格清掉)、写数字码 (照 等级 的
              //   样子)、写布尔, 或者把整个对象/数组塞进来。
              //   (`z.coerce.number()` 本文件里本来就用了 11 处: 污染度/诊金/年龄/
              //   精神力/精神力上限/金钱/名声/氛围/信赖/好感/已治疗 —— coerce 也不是新招。)
              //
              // ★ coerce 买到的确切性质 (按实测收窄过口径, 分三段说):
              //   ① **AI 正常输出与存档里会出现的值都没有失败路径** —— 字符串 /
              //      数字 / 布尔 / null / 数组 / 普通对象, 一律落到三个合法状态之一
              //      (schema.test.mjs 里钉住其中 5 种: null / 数字 / 布尔 / 数组 / 对象)。
              //   ② 仍会让整份报废的一类, 但**非 JSON 可达**: `Object.create(null)`
              //      与 `toString` 调用即抛的对象。AI 的输出与存档都到不了。
              //   ③ **但还有一类是 JSON 可达的**: 自带 `toString` 且其值不可调用的
              //      对象 (如 `JSON.parse('{"toString":1}')`)。`z.coerce.string()`
              //      走 `String(v)` → ToPrimitive; 对象**自有** `toString` 而它不可
              //      调用时, `String()` 抛 TypeError, zod 折成 invalid_type,
              //      **整份失败的**。AI 正常写不出来, 存档被别的东西动过就会中。
              //      要防它得上 `.catch()`, 本任务**不做**, 只把口径说准。
              //   对照: 换成 `z.string()` 时上面那 5 种**每一种都会让整份 stat_data
              //   报废** —— 正是本文件开头说的最怕的那种静默失败。
              状态: z
                .coerce.string()
                .prefault('待接')
                .transform(值 => (['待接', '已接', '已婉拒'].includes(值) ? 值 : '待接')),
            })
            .transform(data => ({ ...data, 污染度: _.clamp(data.污染度, 0, 100) })),
        )
        .prefault({}),
    })
    .prefault({}),

  哨兵: z
    .record(
      z.string().describe('哨兵姓名'),
      z
        .object({
          ...档案形状,
          信赖: z.coerce.number().prefault(0),
          好感: z.coerce.number().prefault(0),
          /** 已经疏导过几次。治疗界面靠它显示「第 3 / 5 趟」 */
          已治疗: z.coerce.number().prefault(0),
          状态: z.enum(['在诊', '已出院', '已收编']).prefault('在诊'),
        })
        .transform(data => {
          const 信赖 = _.clamp(data.信赖, 0, 100);
          const 好感 = _.clamp(data.好感, 0, 100);
          return {
            ...data,
            污染度: _.clamp(data.污染度, 0, 100),
            信赖,
            好感,
            $信赖: 信赖分档(信赖),
            $好感: 好感分档(好感),
          };
        }),
    )
    .prefault({}),
}).transform(data => {
  if (data.主角.路线 === '白塔向导路线') 转换旧年历(data);
  // 同名的已接诊档案优先；旧档只补全缺少的外貌，不改变既有年龄、特征、关系。
  for (const [姓名, 人] of Object.entries(data.哨兵)) 人.形象 ??= 创建形象(姓名, 人);
  for (const [姓名, 人] of Object.entries(data.今日.申请列表)) {
    人.形象 = _.cloneDeep(data.哨兵[姓名]?.形象 ?? 人.形象 ?? 创建形象(姓名, 人));
  }
  return data;
});
export type Schema = z.output<typeof Schema>;
