import { 好感分档, 信赖分档, 等级称号 } from './分档';
import { 算气氛, 开局家具 } from './家园/家具';

/** 精神体的四项掷定值。具体物种是 AI 写的, 不进变量 */
const 精神体形状 = z
  .object({
    纲: z.string().prefault(''),
    方向: z.string().prefault(''),
    栖息: z.string().prefault(''),
    体型: z.string().prefault(''),
    危险: z.string().prefault(''),
  })
  .prefault({});

/**
 * 一份哨兵档案。**待登记 / 申请列表 / 哨兵 三处共用这一个形状。**
 *
 * spec §8.5 说「三个结构的字段必须一致 —— 人是同一个对象在流转, 不重新生成」。
 * 靠这一处保证, 而不是靠三处手抄同一份字段表: 手抄的版本改一处忘两处,
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
  A面: z.string().prefault(''),
  B面: z.string().prefault(''),
  战损来源: z.string().prefault(''),
};

export const Schema = z.object({
  世界: z
    .object({
      日期: z.string().prefault(''),
      时段: z.string().prefault(''),
      地点: z.string().prefault(''),
    })
    .prefault({}),

  主角: z
    .object({
      姓名: z.string().prefault(''),

      // 开局在创建页选的两样, 之后不再变。写进变量而不是只存在前端里, 是因为
      // 「变量列表」那条世界书会把整份 stat_data 注入提示词 —— 选了什么是靠这个
      // 让 AI 知道的, 不是靠界面告诉它。
      身份: z.enum(['向导', '哨兵']).prefault('向导'),
      // 现在是单值。以后开第二条线就往这个数组里加一个字符串, 别处不用动。
      路线: z.enum(['常规']).prefault('常规'),

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
      金钱: z.coerce.number().prefault(0),
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
      // 写回一次之后 `家具` 就不空了, 下次解析不会再播。
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

      // 掷完还没名字的。**数组不是 record** —— 还没有 key。
      // 界面上显示成「未登记 · 01」。
      待登记: z
        .array(
          z.object({
            ...档案形状,
            // 名字由 AI 写 (§8.2), 写完之后由 流转.ts 的 晋级已命名的 搬进 申请列表。
            // 它必须在这里 —— 少了它, zod 每次 parse 都会把 AI 写的名字剥掉,
            // 于是那些条目永远晋级不了, 而界面上什么都不报。
            姓名: z.string().prefault(''),
            // 这两项是给 AI 的指令, 不是给人看的属性
            字数: z.coerce.number().prefault(3),
            中式: z.boolean().prefault(true),
          }),
        )
        .prefault([]),

      // AI 命名后进来。以姓名为 key
      申请列表: z
        .record(
          z.string().describe('哨兵姓名'),
          z
            .object({
              ...档案形状,
              状态: z.enum(['待接', '已接', '已婉拒']).prefault('待接'),
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
});
export type Schema = z.output<typeof Schema>;
