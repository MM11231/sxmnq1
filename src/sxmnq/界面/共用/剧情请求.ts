/** 请求或结束事件丢失时也必须释放调用方的忙状态。持续收到文本则继续等待。 */
export async function 请求正文(指令: string) {
  let 最新文本 = getChatMessages(-1)[0]?.message ?? '';
  let 更新时间 = Date.now();
  let 收到内容 = false;
  const 流式 = getPreset('in_use').settings.should_stream;
  let 计时: ReturnType<typeof setInterval>;
  let 停止监听: EventOnReturn | undefined;
  const 停止 = new Promise<never>((_, reject) => {
    停止监听 = eventOn(tavern_events.GENERATION_STOPPED, () => {
      clearInterval(计时);
      reject(new Error('本次生成已停止。已收到的正文及结算结果保留，可以手动重试。'));
    });
  });
  const 超时 = new Promise<never>((_, reject) => {
    计时 = setInterval(() => {
      const 文本 = getChatMessages(-1)[0]?.message ?? '';
      if (文本 !== 最新文本) { 最新文本 = 文本; 更新时间 = Date.now(); if (getChatMessages(-1)[0]?.role === 'assistant' && 文本.trim()) 收到内容 = true; }
      const 上限 = 流式 && 收到内容 ? 180 : 600;
      if (Date.now() - 更新时间 < 上限 * 1000) return;
      clearInterval(计时);
      try { SillyTavern.stopGeneration(); } catch (error) { console.warn('[正文] 中止请求失败', error); }
      reject(new Error(`连续 ${上限} 秒未收到新内容，已结束等待并尝试中止请求。已收到的正文及治疗/探索结果保留，请检查连接后手动重试。`));
    }, 500);
  });
  try { return await Promise.race([triggerSlash(指令), 超时, 停止]); }
  finally { clearInterval(计时!); 停止监听?.stop(); }
}
