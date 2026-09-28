import { 好感分档, 信赖分档, 星级称号 } from './分档';

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

      执业等级: z.enum(['F', 'E', 'D', 'C', 'B', 'A', 'S']).prefault('F'),
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
      名声: z.coerce.number().prefault(0),
      星级: z.coerce.number().prefault(1),
      诊室等级: z.coerce.number().prefault(1),
      躺椅等级: z.coerce.number().prefault(1),
    })
    .transform(data => {
      const 星级 = _.clamp(data.星级, 1, 5);
      return {
        ...data,
        名声: _.clamp(data.名声, 0, 100),
        星级,
        $称号: 星级称号(星级),
      };
    })
    .prefault({}),

  今日: z
    .object({
      申请列表: z
        .record(
          z.string().describe('哨兵姓名'),
          z.object({
            等级: z.enum(['F', 'E', 'D', 'C', 'B', 'A', 'S']),
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
          等级: z.enum(['F', 'E', 'D', 'C', 'B', 'A', 'S']).prefault('D'),
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
