import { parseBill, mergeEntries } from './parser.js';
import { scoreRisk, monthlyAmount } from './risk.js';
import { findService, genericSteps, buildSearchUrl } from './library.js';

const STORE_KEY = 'subs-cleaner:subs';
const API_KEY_STORE = 'subs-cleaner:apikey';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5-5';
const SYSTEM_PROMPT = [
  '你是「续费管家」的 AI 订阅管理助手，帮用户判断哪些连续包月 / 自动续费该退、怎么退。',
  '回答原则：',
  '- 用中文，简短、口语化，先直接给结论和建议。',
  '- 结合用户当前的订阅列表（会附在下方）给出个性化建议：哪些是高风险该立即退、哪些可保留。',
  '- 退订步骤给 App 内路径，并提醒用户可在支付宝/微信的「扣费服务」里统一解约。',
  '- 不编造官方联系方式、不保证退订一定成功；不确定时建议去官方入口或搜索确认。',
  '- 不提供医疗、法律、金融投资建议。',
].join('\n');

const $ = (id) => document.getElementById(id);

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtMoney = (n) => {
  const v = Number(n || 0);
  return '¥' + (Number.isInteger(v) ? v.toString() : v.toFixed(2));
};

const CATEGORIES = ['视频', '音乐', '知识', '阅读', '云存储', '工具', '办公', '电商', '生活', '运动', '云服务', '其他'];
const SOURCES = ['微信支付', '支付宝', 'Apple', '银行卡', '其他', '手动添加'];
const PERIODS = ['连续包月', '包月', '包季', '包年', '未知'];

let subs = load();
let filter = 'all';
let chatHistory = [];
let chatReady = false;
let typing = false;

// ---- 存储 ----
function load() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(subs)); }

function uid() {
  return crypto.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---- 派生信息 ----
function stepsFor(sub) {
  const f = findService(sub.name);
  return (f && f.entry.steps) || genericSteps(sub.name);
}
function siteFor(sub) {
  if (sub.site) return sub.site;
  const f = findService(sub.name);
  return f && f.entry.site ? f.entry.site : '';
}

// ---- 统计与渲染 ----
function computeStats() {
  let monthly = 0, red = 0, yellow = 0, green = 0;
  for (const s of subs) {
    monthly += monthlyAmount(s);
    const r = scoreRisk(s);
    if (r.level === 'red') red++;
    else if (r.level === 'yellow') yellow++;
    else green++;
  }
  return { monthly, red, yellow, green };
}

function render() {
  const st = computeStats();
  $('statMonthly').textContent = fmtMoney(st.monthly) + '/月';
  $('statCount').textContent = subs.length;
  $('statRed').textContent = st.red;
  renderList();
  renderEmpty();
}

function renderEmpty() {
  $('emptyState').hidden = subs.length > 0;
}

function renderList() {
  const list = $('subsList');
  const shown = subs
    .map((s) => ({ s, r: scoreRisk(s) }))
    .filter(({ r }) => filter === 'all' || r.level === filter)
    .sort((a, b) => {
      const order = { red: 0, yellow: 1, green: 2 };
      if (order[a.r.level] !== order[b.r.level]) return order[a.r.level] - order[b.r.level];
      return monthlyAmount(b.s) - monthlyAmount(a.s);
    });

  list.innerHTML = shown.map(({ s, r }) => cardHTML(s, r)).join('');
}

function cardHTML(s, r) {
  const amount = s.amount ? fmtMoney(s.amount) : '金额未知';
  const periodSuffix = { '包年': '/年', '包季': '/季', '连续包月': '/月', '包月': '/月' }[s.period] || '';
  const reasons = r.reasons.map((x) => `<span>· ${esc(x)}</span>`).join('');

  return `
    <div class="sub">
      <span class="risk-dot" style="background:${r.level === 'red' ? '#E5484D' : r.level === 'yellow' ? '#F5A623' : '#30A46C'}"></span>
      <div class="sub-main">
        <div class="sub-top">
          <span class="sub-name">${esc(s.name)}</span>
          ${s.category ? `<span class="sub-cat">${esc(s.category)}</span>` : ''}
          <span class="badge" style="background:${r.level === 'red' ? '#FDEBEC' : r.level === 'yellow' ? '#FEF3E2' : '#E6F4EC'};color:${r.level === 'red' ? '#E5484D' : r.level === 'yellow' ? '#C27400' : '#1E7B4D'}">${esc(r.label)}</span>
        </div>
        <div class="sub-meta">
          <span><b>${esc(amount)}</b>${periodSuffix}</span>
          <span>周期 <b>${esc(s.period || '未知')}</b></span>
          ${s.charges ? `<span>已扣款 <b>${s.charges}</b> 次</span>` : ''}
          ${s.source ? `<span>来源 <b>${esc(s.source)}</b></span>` : ''}
          ${s.lastDate ? `<span>最近 <b>${esc(s.lastDate)}</b></span>` : ''}
        </div>
        ${reasons ? `<div class="sub-reasons">${reasons}</div>` : ''}
      </div>
      <div class="sub-actions">
        <div class="row">
          <button class="btn primary small" data-act="guide" data-id="${s.id}">一键退订</button>
          <button class="btn ghost small" data-act="edit" data-id="${s.id}">编辑</button>
        </div>
        <div class="row">
          <button class="btn keep small" data-act="keep" data-id="${s.id}">${s.flag === 'keep' ? '在用 ✓' : '在用'}</button>
          <button class="btn forgot small" data-act="forgot" data-id="${s.id}">${s.flag === 'forgotten' ? '遗忘 ✓' : '遗忘'}</button>
          <button class="btn danger small" data-act="del" data-id="${s.id}">删除</button>
        </div>
      </div>
    </div>`;
}

// ---- 导入 / 扫描 ----
function scan() {
  const text = $('billInput').value.trim();
  if (!text) { showWarnings(['请先粘贴账单或扣款记录文本']); return; }

  const { entries, warnings } = parseBill(text);
  if (entries.length === 0) {
    showWarnings(warnings.length ? warnings : ['没有识别出任何订阅项']);
    return;
  }

  const withMeta = entries.map((e) => ({ ...e, id: uid(), flag: '' }));
  subs = mergeEntries(subs, withMeta);
  save();
  render();
  showWarnings(warnings);
}

function fillDemo() {
  $('billInput').value = [
    '微信支付-爱奇艺视频会员 15.00',
    '微信支付-腾讯视频VIP 30.00元',
    '支付宝-淘宝88VIP会员 88.00',
    '支付宝-网易云音乐黑胶VIP 15.00',
    '您尾号1234的卡于10月25日消费15.00元，商户：爱奇艺',
    'Apple：Apple Music 会员 11.00',
    '微信支付-百度网盘超级会员 25.00元',
    '微信支付-哔哩哔哩大会员 25.00元',
  ].join('\n');
  hideWarnings();
}

function showWarnings(list) {
  const box = $('importWarnings');
  if (!list || list.length === 0) { hideWarnings(); return; }
  box.hidden = false;
  box.innerHTML = '<ul>' + list.map((w) => `<li>${esc(w)}</li>`).join('') + '</ul>';
}
function hideWarnings() { $('importWarnings').hidden = true; }

// ---- 手动添加 / 编辑 ----
function openForm(sub) {
  const isEdit = !!sub;
  const v = sub || { name: '', amount: '', period: '连续包月', category: '其他', source: '手动添加', lastDate: '' };
  $('modalBody').innerHTML = `
    <h3 class="guide-name">${isEdit ? '编辑订阅' : '手动添加订阅'}</h3>
    <form id="subForm">
      <div class="form-grid">
        <div class="field full">
          <label>服务名称</label>
          <input name="name" required value="${esc(v.name)}" placeholder="如：爱奇艺" />
        </div>
        <div class="field">
          <label>金额（元）</label>
          <input name="amount" type="number" step="0.01" min="0" value="${v.amount ?? ''}" placeholder="15" />
        </div>
        <div class="field">
          <label>周期</label>
          <select name="period">${PERIODS.map((p) => `<option ${p === v.period ? 'selected' : ''}>${p}</option>`).join('')}</select>
        </div>
        <div class="field">
          <label>分类</label>
          <select name="category">${CATEGORIES.map((c) => `<option ${c === v.category ? 'selected' : ''}>${c}</option>`).join('')}</select>
        </div>
        <div class="field">
          <label>来源</label>
          <select name="source">${SOURCES.map((s) => `<option ${s === v.source ? 'selected' : ''}>${s}</option>`).join('')}</select>
        </div>
        <div class="field">
          <label>最近扣款日期</label>
          <input name="lastDate" type="date" value="${esc(v.lastDate || '')}" />
        </div>
      </div>
      <div class="import-actions">
        <button type="submit" class="btn primary">保存</button>
        <button type="button" class="btn ghost" data-close>取消</button>
      </div>
    </form>`;
  showModal();

  $('subForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const data = {
      name: f.name.value.trim(),
      amount: f.amount.value === '' ? 0 : parseFloat(f.amount.value),
      period: f.period.value,
      category: f.category.value,
      source: f.source.value,
      lastDate: f.lastDate.value,
    };
    if (!data.name) return;
    if (isEdit) {
      Object.assign(sub, data);
    } else {
      subs.push({ ...data, id: uid(), flag: '', matched: false, site: '', charges: 0, totalSpent: 0 });
    }
    save();
    render();
    closeModal();
  });
}

// ---- 退订指引 ----
function openGuide(id) {
  const s = subs.find((x) => x.id === id);
  if (!s) return;
  const r = scoreRisk(s);
  const steps = stepsFor(s);
  const site = siteFor(s);
  const search = buildSearchUrl(s.name);

  $('modalBody').innerHTML = `
    <h3 class="guide-name">${esc(s.name)} 退订指引</h3>
    <p class="guide-sub">${esc(r.label)} · 月均 ${fmtMoney(monthlyAmount(s))}</p>
    <ol class="guide-steps">${steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol>
    <div class="guide-links">
      ${site ? `<a href="${esc(site)}" target="_blank" rel="noopener">前往官方入口 ↗</a>` : ''}
      <a href="${esc(search)}" target="_blank" rel="noopener">搜索退订方法 ↗</a>
    </div>
    <div class="guide-note">本工具只提供退订指引，实际退订需在对应 App 或平台内完成。退订成功后回来点「删除」即可从列表移除。</div>`;
  showModal();
}

// ---- 列表操作 ----
function onListClick(e) {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = btn.dataset.id;
  const s = subs.find((x) => x.id === id);
  if (!s) return;

  switch (btn.dataset.act) {
    case 'guide': openGuide(id); break;
    case 'edit': openForm(s); break;
    case 'del':
      if (confirm(`确定删除「${s.name}」？`)) { subs = subs.filter((x) => x.id !== id); save(); render(); }
      break;
    case 'keep': s.flag = s.flag === 'keep' ? '' : 'keep'; save(); render(); break;
    case 'forgot': s.flag = s.flag === 'forgotten' ? '' : 'forgotten'; save(); render(); break;
  }
}

// ---- 弹窗 ----
function showModal() { $('modal').hidden = false; }
function closeModal() { $('modal').hidden = true; }

// ---- AI 助手 ----
function buildContext() {
  if (!subs.length) return '用户还没有添加任何订阅。';
  const lines = subs.map((s) => {
    const r = scoreRisk(s);
    const flag = s.flag === 'keep' ? '，标记：在用' : s.flag === 'forgotten' ? '，标记：遗忘' : '';
    return `${s.name}：${s.amount ? fmtMoney(s.amount) : '金额未知'}${s.period ? ' / ' + s.period : ''}，已扣 ${s.charges || 0} 次，风险「${r.label}」${flag}`;
  });
  return '用户当前订阅：\n' + lines.join('\n');
}

function getKey() { return localStorage.getItem(API_KEY_STORE) || ''; }

function updateKeyStatus() {
  const has = !!getKey();
  $('chatStatus').textContent = has ? '已配置自己的 API Key' : '未配置 API Key';
  if (!has) $('keyBar').hidden = false;
}

function saveKey() {
  const key = $('keyInput').value.trim();
  if (!/^sk-ant-/.test(key)) {
    alert('Key 格式不对，应以 sk-ant- 开头。');
    return;
  }
  localStorage.setItem(API_KEY_STORE, key);
  $('keyInput').value = '';
  $('keyBar').hidden = true;
  updateKeyStatus();
}

function clearKey() {
  if (!confirm('清除已保存的 API Key？')) return;
  localStorage.removeItem(API_KEY_STORE);
  $('keyBar').hidden = false;
  updateKeyStatus();
}

function openChat() {
  $('chatPanel').hidden = false;
  if (!chatReady) {
    chatReady = true;
    const st = computeStats();
    chatHistory.push({
      role: 'assistant',
      content: `你好，我是续费管家 AI 助手。\n\n可以问我：某笔订阅该不该退、退订步骤、怎么避免被扣费、如何管理自动续费等。\n\n当前你记录了 ${subs.length} 项订阅，其中高风险 ${st.red} 项、中风险 ${st.yellow} 项。\n\nAI 助手使用你自己的 Anthropic API Key，点右上角 ⚙ 填写。`,
    });
  }
  updateKeyStatus();
  renderChat();
}

function closeChat() { $('chatPanel').hidden = true; }
function toggleChat() { $('chatPanel').hidden ? openChat() : closeChat(); }

function renderChat() {
  const box = $('chatMessages');
  box.innerHTML = chatHistory
    .map((m) => `<div class="msg ${m.role === 'user' ? 'user' : 'ai'}">${esc(m.content)}</div>`)
    .join('');
  if (typing) box.innerHTML += `<div class="msg ai"><span class="typing">正在思考…</span></div>`;
  box.scrollTop = box.scrollHeight;
}

function setTyping(on) {
  typing = on;
  renderChat();
}

async function sendChat() {
  const input = $('chatInput');
  const text = input.value.trim();
  if (!text || typing) return;

  const key = getKey();
  if (!key) {
    $('keyBar').hidden = false;
    $('keyInput').focus();
    return;
  }

  input.value = '';
  chatHistory.push({ role: 'user', content: text });
  renderChat();

  const messages = chatHistory
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
  while (messages.length && messages[0].role !== 'user') messages.shift();

  setTyping(true);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: `${SYSTEM_PROMPT}\n\n${buildContext()}`,
        messages: messages.slice(-12),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || `Anthropic API 返回 HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(API_KEY_STORE);
        $('keyBar').hidden = false;
        updateKeyStatus();
        chatHistory.push({ role: 'assistant', content: `Key 无效或已失效（${msg}），请点右上角 ⚙ 重新填写。` });
      } else {
        chatHistory.push({ role: 'assistant', content: `请求失败：${msg}` });
      }
    } else {
      const reply = (data?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('') || '（无回复）';
      chatHistory.push({ role: 'assistant', content: reply });
    }
  } catch (err) {
    chatHistory.push({ role: 'assistant', content: `请求失败：${err.message}\n请检查网络与代理设置。` });
  }
  setTyping(false);
  renderChat();
}

// ---- 事件绑定 ----
$('scanBtn').addEventListener('click', scan);
$('demoBtn').addEventListener('click', fillDemo);
$('clearInputBtn').addEventListener('click', () => { $('billInput').value = ''; hideWarnings(); });
$('addBtn').addEventListener('click', () => openForm());

$('riskFilter').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  filter = chip.dataset.filter;
  [...$('riskFilter').querySelectorAll('.chip')].forEach((c) => c.classList.toggle('active', c === chip));
  renderList();
});

$('subsList').addEventListener('click', onListClick);

$('modal').addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) closeModal();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

$('chatFab').addEventListener('click', toggleChat);
$('chatClose').addEventListener('click', closeChat);
$('chatSend').addEventListener('click', sendChat);
$('chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
$('keyBtn').addEventListener('click', () => {
  $('keyBar').hidden = !$('keyBar').hidden;
  if (!$('keyBar').hidden) $('keyInput').focus();
});
$('keySave').addEventListener('click', saveKey);
$('keyClear').addEventListener('click', clearKey);
$('keyInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveKey(); });

render();
