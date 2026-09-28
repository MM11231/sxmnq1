// 正文从哪来。
//
// 正则把整条消息换成了界面, 所以玩家在聊天区看不见剧情 —— 剧情得由界面自己从
// **原始消息文本**里抠出来重新渲染。`getChatMessages` 给的是原始文本, 变量更新标签、
// 占位符这些都还在里面, 所以要先剥干净。

// 明确包起来的正文标记。用「最后一次出现」的那一对 —— AI 有时会把草稿也写进标签里。
const 正文标记 = /<(?:正文|maintext)>([\s\S]*?)<\/(?:正文|maintext)>/gi;

// 已知的控制标签。剥掉之后剩下的就是正文。
const 控制标签: RegExp[] = [
  // MVU 的变量更新块。完整的一对:
  /<update(?:variable)?>[\s\S]*?<\/update(?:variable)?>/gi,
  // 只开了头、还没收尾的 —— 流式生成到一半时就是这个样子。
  /<update(?:variable)?>[\s\S]*$/gi,
  // 治疗结算时塞进聊天记录的元指令, 那是给 AI 看的, 不是剧情。
  /<疏导指令>[\s\S]*?<\/疏导指令>/gi,
  // 老状态栏的占位符, 现在不用了, 但老存档里可能还留着。
  /<StatusPlaceHolderImpl\s*\/?>/gi,
];

export function 剥控制标签(原文: string): string {
  let 文 = 原文 ?? '';
  for (const 式 of 控制标签) {
    文 = 文.replace(式, '');
  }
  return 文.trim();
}

/**
 * 抠出要显示的正文。
 *
 * 两种都认: 写了对标记就按标记取, 没写就把剥干净之后的全文当正文。
 *
 * 为什么不强制要求标记 —— AI 漏写标记就会白屏, 而白屏对一个随手点两下的玩家来说
 * 是最糟的失败方式: 他不知道发生了什么, 也不知道能做什么。宁可偶尔多显示几个字。
 */
export function 取正文(原文: string): string {
  const 标记 = [...(原文 ?? '').matchAll(正文标记)];
  if (标记.length) {
    return 标记[标记.length - 1][1].trim();
  }
  return 剥控制标签(原文);
}

/** 读最新一楼的原始文本。`-1` 就是「最新」, 界面挂在哪一楼都不影响。 */
export function 读最新原文(): string {
  try {
    const 消 = getChatMessages(-1);
    return 消?.[0]?.message ?? '';
  } catch {
    return '';
  }
}
