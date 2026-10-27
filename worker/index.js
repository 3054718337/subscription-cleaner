// 续费管家后端：Cloudflare Worker，代理 Anthropic Messages API 做 AI 订阅助手。
// 部署后把 Worker 地址填到前端（localStorage 'subs-cleaner:worker'）。
// 需要设置密钥：wrangler secret put ANTHROPIC_API_KEY

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-5-5';

const SYSTEM_PROMPT = [
  '你是「续费管家」的 AI 订阅管理助手，帮用户判断哪些连续包月 / 自动续费该退、怎么退。',
  '回答原则：',
  '- 用中文，简短、口语化，先直接给结论和建议。',
  '- 结合用户当前的订阅列表（会附在下方）给出个性化建议：哪些是高风险该立即退、哪些可保留。',
  '- 退订步骤给 App 内路径，并提醒用户可在支付宝/微信的「扣费服务」里统一解约。',
  '- 不编造官方联系方式、不保证退订一定成功；不确定时建议去官方入口或搜索确认。',
  '- 不提供医疗、法律、金融投资建议。',
].join('\n');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/api/health')) {
      return json({ ok: true, name: 'subs-cleaner-worker', model: env.MODEL || DEFAULT_MODEL });
    }

    if (request.method !== 'POST' || url.pathname !== '/api/chat') {
      return json({ error: 'Not found' }, 404);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'Worker 未配置 ANTHROPIC_API_KEY 密钥' }, 500);
    }

    try {
      const { messages = [], context = '' } = await request.json();
      const cleanMessages = messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content }));

      if (cleanMessages.length === 0) {
        return json({ error: '缺少 messages' }, 400);
      }

      const resp = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: env.MODEL || DEFAULT_MODEL,
          max_tokens: 600,
          system: `${SYSTEM_PROMPT}\n\n${context}`,
          messages: cleanMessages,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = data?.error?.message || `Anthropic API 返回 ${resp.status}`;
        return json({ error: msg }, 502);
      }

      const reply = (data?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('') || '（无回复）';
      return json({ reply });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};
