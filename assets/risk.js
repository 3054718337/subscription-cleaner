// 红黄绿三级风险评分。输入订阅对象，输出 { level, score, label, reasons }。
// level: 'red' 高风险(建议立即退订) / 'yellow' 中风险(建议关注) / 'green' 低风险(可保留)。

export const LEVELS = {
  red:    { label: '高风险', hint: '建议立即退订', color: '#E5484D', bg: '#FDEBEC', dot: '#E5484D' },
  yellow: { label: '中风险', hint: '建议关注',   color: '#C27400', bg: '#FEF3E2', dot: '#F5A623' },
  green:  { label: '低风险', hint: '可保留',     color: '#1E7B4D', bg: '#E6F4EC', dot: '#30A46C' },
};

// 折合月均金额。
export function monthlyAmount(sub) {
  const a = Number(sub.amount) || 0;
  switch (sub.period) {
    case '包年': case '年付': return a / 12;
    case '包季': case '季付': return a / 3;
    case '连续包月': case '包月': case '月付': return a;
    default: return a; // 未知周期按月算
  }
}

export function scoreRisk(sub) {
  const reasons = [];
  // 用户手动标记优先，一票否决 / 一票通过。
  if (sub.flag === 'forgotten') {
    return { level: 'red', score: 100, label: LEVELS.red.label, reasons: ['你已标记「遗忘 / 不再使用」'] };
  }
  if (sub.flag === 'keep') {
    return { level: 'green', score: 0, label: LEVELS.green.label, reasons: ['你已标记「持续在用」'] };
  }

  const monthly = monthlyAmount(sub);
  let score = 0;

  if (sub.period === '包年' || sub.period === '年付') {
    score += 20;
    reasons.push('年付，单笔一次性扣款较大');
  }

  if (monthly >= 30) {
    score += 40;
    reasons.push(`月均约 ¥${monthly.toFixed(0)}，金额偏高`);
  } else if (monthly >= 15) {
    score += 20;
    reasons.push(`月均约 ¥${monthly.toFixed(0)}，中等金额`);
  } else if (monthly > 0) {
    reasons.push(`月均约 ¥${monthly.toFixed(0)}，金额不高`);
  }

  if ((sub.charges || 0) >= 3) {
    reasons.push(`已连续扣款 ${sub.charges} 次`);
    score = Math.max(score, 20); // 多次扣款至少中风险，值得关注
  }

  if (score >= 40) return { level: 'red', score, label: LEVELS.red.label, reasons };
  if (score >= 20) return { level: 'yellow', score, label: LEVELS.yellow.label, reasons };
  return { level: 'green', score, label: LEVELS.green.label, reasons };
}
