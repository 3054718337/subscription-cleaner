# 续费管家 · 自动续费清理小工具

粘贴微信/支付宝账单或银行扣款短信，自动识别「连续包月 / 自动续费」订阅；按红黄绿三级标注风险；一键查看退订指引；内置 AI 聊天助手答疑。纯前端 + 本地存储，数据不上传。

- 前端：原生 HTML/CSS/JS（ES Module），无框架无构建，部署到 GitHub Pages
- AI：沿用浏览器直连 Anthropic API（**自带 Key**），不经过任何自建后端
- 本地测试：`node --test`（13 个用例）

## 功能

- **自动扫描**：粘贴账单文本，正则 + 内置订阅库（40+ 常见服务）识别服务名、金额、周期、日期、来源；同名多次扣款自动合并计数
- **红黄绿风险标注**：按月均金额、年付单笔、连续扣款次数、手动标记（在用/遗忘）综合评分
  - 🔴 高风险：建议立即退订　🟡 中风险：建议关注　🟢 低风险：可保留
- **一键退订**：展示退订步骤 + 官方入口 + 搜索退订方法链接（实际退订需在对应 App/平台内完成）
- **AI 助手**：右下角悬浮窗，结合你的订阅列表给出个性化建议
- **手动添加/编辑/删除**：补录解析不到或记不清的订阅

## 目录结构

```
subscription-cleaner/
├── index.html            # 页面结构
├── assets/
│   ├── app.js            # 主逻辑（渲染、导入、弹窗、聊天）
│   ├── parser.js         # 账单解析器
│   ├── risk.js           # 风险评分
│   ├── library.js        # 订阅服务知识库 + 退订步骤
│   └── styles.css        # 样式
├── tests/                # node:test 单测
└── package.json
```

## 本地运行与测试

```bash
cd C:/Users/asus/Desktop/subscription-cleaner

# 跑单测（13 个用例）
node --test

# 本地预览（任选其一）
python -m http.server 5175
# 浏览器打开 http://localhost:5175
```

本地预览时 AI 助手会提示「后端尚未配置」，属正常现象——部署后端后即可对话。

## 部署前端到 GitHub Pages

```bash
cd C:/Users/asus/Desktop/subscription-cleaner

git remote add origin https://github.com/<你的用户名>/subscription-cleaner.git
git add -A
git commit -m "feat: 续费管家自动续费清理小工具"
git push -u origin main
```

然后在 GitHub 仓库 **Settings → Pages → Source 选 `Deploy from a branch` → 分支 `main`、目录 `/ (root)` → Save**，等约 1 分钟自动构建，访问 `https://<用户名>.github.io/subscription-cleaner/`。

## AI 助手：自带 API Key（无需自建后端）

AI 助手由**每位使用者自己的** Anthropic API Key 驱动，站点本身不保存、不代理任何 Key，因此站长不承担任何人的调用费用。

使用步骤：

1. 到 [console.anthropic.com](https://console.anthropic.com/) 创建一个 API Key（`sk-ant-...`）
2. 打开页面，点右下角聊天按钮，再点右上角 ⚙
3. 粘贴 Key → 保存，即可对话

Key 存在该浏览器的 `localStorage`（`subs-cleaner:apikey`），发送消息时浏览器直连 `https://api.anthropic.com/v1/messages`，附带官方要求的 `anthropic-dangerous-direct-browser-access: true` 头。点「清除」可随时删除。

> 提示：任何人都能在自己浏览器里填自己的 Key 使用；没有 Key 时除 AI 对话外的所有功能（扫描、风险、退订指引）照常可用。

## 说明与边界

- 数据只存在浏览器 `localStorage`，不经过任何服务器；换设备/清缓存会丢失。
- 「自动扫描」基于账单文本识别，微信/支付宝等平台没有对第三方开放的「列出所有自动续费」接口，无法直接读取你的账号，需手动粘贴账单。
- 「一键退订」提供指引与入口链接，实际退订在对应 App / 支付宝/微信「扣费服务」内完成。
- 退订步骤为通用指引，各 App 版本界面可能有差异，以实际为准。
