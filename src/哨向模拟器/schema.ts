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
        $称号: ['无名诊所', '略有耳闻', '小有名气', '声名远播', '声名鹊起'][星级 - 1],
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
            $信赖:
              信赖 >= 80
                ? '完全信赖{{user}}的能力，只愿意让{{user}}为自己进行精神疏导'
                : 信赖 >= 60
                  ? '比较信赖{{user}}的能力，认为{{user}}很可靠'
                  : 信赖 >= 40
                    ? '对{{user}}的能力比较认同，认为{{user}}的精神疏导效果不错'
                    : 信赖 >= 20
                      ? '对{{user}}的能力有一点信任，认为{{user}}是个正经向导'
                      : '不清楚{{user}}的能力，不知道能不能信赖',
            $好感:
              好感 >= 12
                ? '渴望和{{user}}组建家庭相伴一生，将{{user}}视为一生的伴侣，会频繁试图求婚和求爱'
                : 好感 >= 9
                  ? '渴望成为{{user}}的恋人，会非常明显地表达出追求，非常容易吃醋'
                  : 好感 >= 6
                    ? '会隐晦地试着追求{{user}}，会在对话里试探自己对{{user}}是否特殊'
                    : 好感 >= 3
                      ? '将{{user}}视为有点在意的人，会时不时下意识地靠近{{user}}'
                      : '认识的向导，会用公事公办的态度对待',
          };
        }),
    )
    .prefault({}),

  治疗: z
    .record(
      z.string().describe('哨兵姓名'),
      z.object({
        线数: z.coerce.number().prefault(0),
        已完成: z.coerce.number().prefault(0),
        失误次数: z.coerce.number().prefault(0),
        失误日志: z
          .record(z.string().describe('失误序号'), z.string().describe('失误瞬间的短句'))
          .prefault({}),
        评级: z.string().prefault(''),
      }),
    )
    .prefault({}),
});
export type Schema = z.output<typeof Schema>;
