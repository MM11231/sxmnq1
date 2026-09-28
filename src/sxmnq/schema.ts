import { 好感分档, 信赖分档, 等级称号 } from './分档';

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
      // 开局自带一张床。②商店之后改由 摆位 派生, 这里先落成普通数字。
      床位: z.coerce.number().prefault(1),
    })
    .transform(data => ({
      ...data,
      名声: _.clamp(data.名声, 0, 100),
      $称号: 等级称号(data.等级),
    }))
    .prefault({}),

  今日: z
    .object({
      申请列表: z
        .record(
          z.string().describe('哨兵姓名'),
          z.object({
            等级: z.enum(['D', 'C', 'B', 'A', 'S']),
            污染度: z.coerce.number(),
            战损来源: z.string(),
            诊金: z.coerce.number(),
            状态: z.enum(['待接', '已接', '已婉拒']),
          }),
        )
        .prefault({}),
    })
    .prefault({}),

  哨兵: z
    .record(
      z.string().describe('哨兵姓名'),
      z
        .object({
          等级: z.enum(['D', 'C', 'B', 'A', 'S']).prefault('D'),
          污染度: z.coerce.number().prefault(0),
          战损来源: z.string().prefault(''),
          信赖: z.coerce.number().prefault(0),
          好感: z.coerce.number().prefault(0),
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
