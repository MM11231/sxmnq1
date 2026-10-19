export const 演出名称 = ['marigold','amber','coral','copper','terracotta','sage','rose','denim','cider','slate','indigo','heather','ash','mist','pine','obsidian','whisper','whispering','tremble','bite','steady','heavy','tilt','lean','lean_right','stretch','echo','tight','crush','fracture','dusk','solstice','eclipse','wildwood','hearth','veil','mistveil'];
const 白名单 = new Set(演出名称);
/** 只保留已知排印语义，以内部文本标记传递，绝不执行预设中的 HTML/CSS。 */
export function 保留演出(文: string) {
  return 文.replace(/<(\/?)([a-z][a-z0-9_:-]*)\s*>/gi, (原, 关闭, 名: string) => {
    const 部分 = 名.toLowerCase().split(':').filter(词 => 白名单.has(词));
    return 部分.length ? `\uE000${关闭 ? '/' : ''}${部分.join(':')}\uE001` : 原;
  });
}
export function 排印片段(文: string) {
  const 出: { 文: string; 类: string }[] = [];
  const 栈: string[][] = [];
  const 匹配 = /\uE000(\/?[a-z0-9_:]+)\uE001|“[^”]*(?:”|$)|「[^」]*(?:」|$)|『[^』]*(?:』|$)|"[^"\n]+"|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;
  const 添加 = (文本: string, 类 = '') => { if (文本) 出.push({ 文: 文本, 类: [...栈.flat().map(名 => `fx-${名}`), 类].filter(Boolean).join(' ') }); };
  let 起点 = 0;
  for (const 命中 of 文.matchAll(匹配)) {
    添加(文.slice(起点, 命中.index));
    if (命中[1]) {
      if (命中[1].startsWith('/')) { const 名 = 命中[1].slice(1).split(':')[0]; const 位置 = 栈.findLastIndex(层 => 层[0] === 名); if (位置 >= 0) 栈.splice(位置); }
      else if (栈.length < 16) 栈.push(命中[1].split(':').filter(名 => 白名单.has(名)));
    } else if (命中[2]) 添加(命中[2], 'fx-heavy');
    else if (命中[3]) 添加(命中[3], 'fx-emphasis');
    else 添加(命中[0], 'fx-dialogue');
    起点 = 命中.index! + 命中[0].length;
  }
  添加(文.slice(起点));
  return 出;
}
