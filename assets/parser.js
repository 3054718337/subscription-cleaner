// 账单文本解析器：把微信/支付宝账单、银行扣款短信等原始文本，
// 自动识别出其中的「连续包月 / 自动续费」项（服务名、金额、周期、日期、来源）。
import { findService } from './library.js';

const SUB_KEYWORDS = /会员|订阅|自动续费|连续包月|续费|扣费|扣款|代扣|免密支付|委托扣款|包月|包年|月卡|年卡|季卡|vip|plus/i;

// 金额：¥15 / 15元 / 15.00 / 人民币15.00
const RE_AMOUNT_SYMBOL = /(?:[¥￥]\s*)(\d+(?:\.\d{1,2})?)/;
const RE_AMOUNT_YUAN  = /(\d+(?:\.\d{1,2})?)\s*(?:元|人民币|块)/;
const RE_AMOUNT_PLAIN = /\b(\d+\.\d{2})\b/;

// 日期：2026-10-25 / 2026/10/25 / 2026年10月25日 / 10月25日
const RE_DATE_FULL = /(20\d{2})[-/年.](\d{1,2})[-/月.](\d{1,2})/;
const RE_DATE_MD   = /(\d{1,2})月(\d{1,2})日/;

// 括号内名称：【爱奇艺】/「爱奇艺」/《爱奇艺》
const RE_BRACKET = /[【「《]([^】」》]{1,20})[】」》]/;

function extractAmount(line) {
  let m = line.match(RE_AMOUNT_SYMBOL) || line.match(RE_AMOUNT_YUAN) || line.match(RE_AMOUNT_PLAIN);
  return m ? parseFloat(m[1]) : null;
}

function extractDate(line) {
  let m = line.match(RE_DATE_FULL);
  if (m) {
    const mm = String(m[2]).padStart(2, '0');
    const dd = String(m[3]).padStart(2, '0');
    return `${m[1]}-${mm}-${dd}`;
  }
  m = line.match(RE_DATE_MD);
  if (m) {
    const mm = String(m[1]).padStart(2, '0');
    const dd = String(m[2]).padStart(2, '0');
    return `${new Date().getFullYear()}-${mm}-${dd}`;
  }
  return '';
}

function extractPeriod(line) {
  if (/包年|年卡|年付/.test(line)) return '包年';
  if (/包季|季卡|季付/.test(line)) return '包季';
  if (/连续包月|自动续费|包月|月卡|月付|扣费|代扣/.test(line)) return '连续包月';
  return '';
}

function extractSource(line) {
  if (/微信|wechat/i.test(line)) return '微信支付';
  if (/支付宝|alipay/i.test(line)) return '支付宝';
  if (/苹果|apple|app store|itunes/i.test(line)) return 'Apple';
  if (/信用卡|银行卡|储蓄卡|尾号|消费|支出/.test(line)) return '银行卡';
  return '';
}

// 从一行里尽可能提取一个可读的服务名（找不到返回 ''）。
function extractName(line) {
  const bracket = line.match(RE_BRACKET);
  if (bracket) return bracket[1].trim();

  const found = findService(line);
  if (found) return found.entry.name;

  // 「XXX会员」「XXX VIP」形式：取关键词前的一段
  const kw = line.match(/(.{1,12}?)(?:会员|VIP|vip|月卡|年卡|季卡|订阅|自动续费|连续包月)/);
  if (kw) return kw[1].trim();

  return '';
}

function isSubscriptionLine(line) {
  return SUB_KEYWORDS.test(line) || (findService(line) !== null && extractAmount(line) !== null);
}

function normalize(line) {
  return line.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

// 主入口：text -> { entries, summary, warnings }
export function parseBill(text) {
  const lines = String(text || '').split(/\r?\n/).map(normalize).filter(Boolean);
  const warnings = [];
  const map = new Map();

  for (const line of lines) {
    if (!isSubscriptionLine(line)) continue;

    const amount = extractAmount(line);
    const found = findService(line);
    const name = found ? found.entry.name : extractName(line);
    const period = extractPeriod(line) || (found && found.entry.period) || '连续包月';
    const source = extractSource(line);
    const date = extractDate(line);

    if (!name) {
      warnings.push(`未能识别服务名，已跳过：${line.slice(0, 40)}`);
      continue;
    }

    const key = name;
    if (!map.has(key)) {
      map.set(key, {
        name,
        category: found ? found.entry.category : '其他',
        site: found ? found.entry.site || '' : '',
        matched: !!found,
        period,
        source,
        amount: amount || 0,
        lastDate: date,
        charges: amount !== null ? 1 : 0,
        totalSpent: amount || 0,
      });
    } else {
      const e = map.get(key);
      if (amount !== null) {
        e.charges += 1;
        e.totalSpent = Math.round((e.totalSpent + amount) * 100) / 100;
        e.amount = amount;
      }
      if (date && (!e.lastDate || date > e.lastDate)) e.lastDate = date;
      if (source && !e.source) e.source = source;
    }
  }

  const entries = [...map.values()];
  if (entries.length === 0) {
    warnings.push('没有识别出任何订阅项。请确认粘贴的是账单/扣款记录，或改用「手动添加」。');
  }

  const totalSpent = entries.reduce((s, e) => s + e.totalSpent, 0);
  return {
    entries,
    summary: {
      count: entries.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
    },
    warnings,
  };
}

// 追加解析：把新文本合并进已有条目列表（用于多次粘贴导入）。
export function mergeEntries(existing, parsedEntries) {
  const map = new Map(existing.map((e) => [e.name, { ...e }]));
  for (const p of parsedEntries) {
    if (map.has(p.name)) {
      const e = map.get(p.name);
      e.charges = (e.charges || 0) + (p.charges || 0);
      e.totalSpent = Math.round((e.totalSpent + p.totalSpent) * 100) / 100;
      if (p.amount) e.amount = p.amount;
      if (p.lastDate && (!e.lastDate || p.lastDate > e.lastDate)) e.lastDate = p.lastDate;
      if (p.source && !e.source) e.source = p.source;
      e.period = e.period || p.period;
      e.matched = e.matched || p.matched;
      e.site = e.site || p.site;
      e.category = e.category === '其他' ? p.category : e.category;
    } else {
      map.set(p.name, { ...p });
    }
  }
  return [...map.values()];
}
