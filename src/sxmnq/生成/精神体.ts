/** 分类范围落实为稳定的物种名；同一档案解析时不会重新掷骰。 */
export function 具体精神体(精神体: {纲: string; 方向?: string; 栖息?: string; 体型?: string; 危险?: string}, seed = '') {
  const pool: Record<string, string[]> = {哺乳纲:['银狐','雪狼','猞猁','黑豹','白鹿'],鸟纲:['雪鸮','游隼','渡鸦','白鹭','金雕'],爬行纲:['王锦蛇','鬃狮蜥','豹纹守宫','黑曼巴蛇'],两栖纲:['蓝箭毒蛙','火蝾螈','树蛙'],鱼类及水生生物:['鲸鲨','蝠鲼','虎鲸','白鲸'],昆虫及节肢动物:['兰花螳螂','帝王蝎','蓝闪蝶','跳蛛'],幻想种族:['羽蛇','狮鹫','麒麟','小型翼龙']};
  const choices = pool[精神体.纲];
  if (!choices) return '';
  const key = seed || Object.values(精神体).join('|');
  const hash = [...key].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,0);
  return choices[hash % choices.length];
}
