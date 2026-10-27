// 常见「连续包月 / 自动续费」服务知识库。
// 每条：name(规范名)、aliases(账单里可能出现的写法)、category、site(官网，可缺省)、
//       steps(具体退订步骤，可缺省 -> 渲染时用 genericSteps 兜底)。
// 退订步骤为通用指引，最终以各 App 当前版本实际路径为准。

export const library = [
  // ---- 视频 ----
  { name: '爱奇艺', aliases: ['爱奇艺视频', '爱奇艺会员', '爱奇艺VIP', 'iqiyi', '爱奇艺黄金会员'], category: '视频', site: 'https://www.iqiyi.com',
    steps: ['打开「爱奇艺」App → 我的 → 我的VIP会员', '进入「管理自动续费」→ 关闭自动续费', '或到 支付宝/微信「扣费服务」中解约「爱奇艺」'] },
  { name: '腾讯视频', aliases: ['腾讯视频VIP', '腾讯视频会员', '腾讯视频', 'vip.video.qq'], category: '视频', site: 'https://v.qq.com',
    steps: ['打开「腾讯视频」App → 个人中心 → 我的VIP会员', '进入「续费管理」→ 关闭自动续费', '或到 支付宝/微信「扣费服务」中解约'] },
  { name: '优酷', aliases: ['优酷会员', '优酷VIP', '优酷视频', 'youku'], category: '视频', site: 'https://www.youku.com' },
  { name: '芒果TV', aliases: ['芒果TV会员', '芒果会员', '芒果tv', 'mgtv'], category: '视频', site: 'https://www.mgtv.com' },
  { name: '哔哩哔哩', aliases: ['bilibili', 'B站', '哔哩哔哩大会员', '大会员', 'b站大会员'], category: '视频', site: 'https://www.bilibili.com',
    steps: ['打开「哔哩哔哩」App → 我的 → 大会员', '进入「大会员续费管理」→ 关闭自动续费', '或到 支付宝/微信「扣费服务」中解约'] },
  { name: '咪咕视频', aliases: ['咪咕视频会员', '咪咕'], category: '视频', site: 'https://www.miguvideo.com' },
  { name: '西瓜视频', aliases: ['西瓜视频会员', '西瓜'], category: '视频', site: 'https://www.ixigua.com' },
  { name: 'Netflix', aliases: ['奈飞', 'netflix'], category: '视频', site: 'https://www.netflix.com' },

  // ---- 音乐 ----
  { name: '网易云音乐', aliases: ['网易云音乐黑胶', '黑胶VIP', '网易云会员', '网易云'], category: '音乐', site: 'https://music.163.com',
    steps: ['打开「网易云音乐」App → 我的 → 会员中心', '进入「自动续费管理」→ 关闭', '或到 支付宝/微信「扣费服务」中解约'] },
  { name: 'QQ音乐', aliases: ['QQ音乐绿钻', '绿钻', 'qq音乐会员', 'QQ音乐豪华绿钻'], category: '音乐', site: 'https://y.qq.com' },
  { name: '酷狗音乐', aliases: ['酷狗', '酷狗会员'], category: '音乐', site: 'https://www.kugou.com' },
  { name: '酷我音乐', aliases: ['酷我', '酷我会员'], category: '音乐', site: 'https://www.kuwo.cn' },
  { name: 'Apple Music', aliases: ['apple music', '苹果音乐'], category: '音乐', site: 'https://www.apple.com' },
  { name: 'Spotify', aliases: ['spotify'], category: '音乐', site: 'https://www.spotify.com' },

  // ---- 知识 / 阅读 ----
  { name: '知乎', aliases: ['知乎盐选', '盐选会员', '知乎会员', 'zhihu'], category: '知识', site: 'https://www.zhihu.com' },
  { name: '得到', aliases: ['得到App', '得到会员', 'dedao'], category: '知识', site: 'https://www.dedao.cn' },
  { name: '喜马拉雅', aliases: ['喜马拉雅会员', '喜马拉雅VIP', '喜马拉雅'], category: '知识', site: 'https://www.ximalaya.com' },
  { name: '微信读书', aliases: ['微信读书会员', '微信读书无限卡'], category: '阅读', site: 'https://weread.qq.com' },
  { name: '樊登读书', aliases: ['樊登', '樊登读书会员'], category: '阅读' },
  { name: '番茄小说', aliases: ['番茄小说会员', '番茄会员'], category: '阅读' },
  { name: '起点读书', aliases: ['起点', '起点读书会员', '起点会员'], category: '阅读', site: 'https://www.qidian.com' },

  // ---- 云存储 / 工具 ----
  { name: '百度网盘', aliases: ['百度网盘超级会员', '百度网盘会员', '百度网盘SVIP', '网盘'], category: '云存储', site: 'https://pan.baidu.com',
    steps: ['打开「百度网盘」App → 我的 → 会员中心', '进入「自动续费」→ 关闭', '或到 支付宝/微信「扣费服务」中解约'] },
  { name: '阿里云盘', aliases: ['阿里云盘会员', '阿里云盘'], category: '云存储', site: 'https://www.aliyundrive.com' },
  { name: '腾讯微云', aliases: ['微云', '微云会员'], category: '云存储', site: 'https://www.weiyun.com' },
  { name: '夸克', aliases: ['夸克网盘', '夸克会员', '夸克网盘会员', 'quark'], category: '云存储', site: 'https://www.quark.cn' },
  { name: 'iCloud', aliases: ['iCloud+', 'icloud', '苹果iCloud', '云盘(iCloud)'], category: '云存储', site: 'https://www.icloud.com',
    steps: ['iPhone「设置」→ 顶部你的名字 → iCloud → 管理订阅', '或 App Store → 头像 → 订阅 → 选择并取消'] },
  { name: '迅雷', aliases: ['迅雷会员', '迅雷超级会员'], category: '工具', site: 'https://www.xunlei.com' },
  { name: '百度文库', aliases: ['百度文库会员', '文库VIP'], category: '工具', site: 'https://wenku.baidu.com' },
  { name: '扫描全能王', aliases: ['camscanner', '扫描全能王会员'], category: '工具' },
  { name: '剪映', aliases: ['剪映专业版', '剪映会员', 'CapCut'], category: '工具' },

  // ---- 办公 ----
  { name: 'WPS', aliases: ['WPS会员', 'WPS超级会员', '金山文档', 'wps office'], category: '办公', site: 'https://www.wps.cn',
    steps: ['打开「WPS」App → 我的 → 会员中心', '进入「自动续费」→ 关闭', '或到 支付宝/微信「扣费服务」中解约'] },
  { name: '微软365', aliases: ['Microsoft 365', 'Office 365', 'office365', '微软365'], category: '办公', site: 'https://www.microsoft.com' },
  { name: '印象笔记', aliases: ['印象笔记会员', 'evernote'], category: '办公', site: 'https://www.yinxiang.com' },
  { name: '石墨文档', aliases: ['石墨文档会员', '石墨'], category: '办公', site: 'https://shimo.im' },
  { name: '幕布', aliases: ['幕布会员'], category: '办公', site: 'https://mubu.com' },

  // ---- 电商 ----
  { name: '京东PLUS', aliases: ['京东plus', '京东PLUS会员', '京东会员', 'PLUS会员', 'jd plus'], category: '电商', site: 'https://www.jd.com', period: '包年',
    steps: ['打开「京东」App → 我的 → 开通PLUS会员', '进入「PLUS会员」→ 自动续费管理 → 关闭', '或到 支付宝/微信「扣费服务」中解约'] },
  { name: '淘宝88VIP', aliases: ['88VIP', '88会员', '淘宝88会员', '淘宝88vip'], category: '电商', site: 'https://www.taobao.com', period: '包年',
    steps: ['打开「淘宝」App → 我的淘宝 → 会员中心 → 88VIP', '进入「自动续费」→ 关闭'] },
  { name: '拼多多', aliases: ['拼多多会员', '拼多多省钱月卡', '省钱月卡'], category: '电商', site: 'https://www.pinduoduo.com' },
  { name: '盒马', aliases: ['盒马X会员', '盒马会员', '盒马鲜生'], category: '电商', period: '包年' },

  // ---- 生活服务 ----
  { name: '美团', aliases: ['美团会员', '美团外卖会员', '美团神会员'], category: '生活', site: 'https://www.meituan.com' },
  { name: '饿了么', aliases: ['饿了么会员', '饿了么超级吃货卡', '超级吃货卡'], category: '生活', site: 'https://www.ele.me' },
  { name: '滴滴出行', aliases: ['滴滴会员', '滴滴出行会员'], category: '生活' },
  { name: '携程', aliases: ['携程会员', '携程超级会员'], category: '生活' },
  { name: 'Keep', aliases: ['keep会员', 'keep'], category: '运动', site: 'https://www.keep.com' },

  // ---- 云服务 ----
  { name: '阿里云', aliases: ['阿里云服务器', '阿里云'], category: '云服务', site: 'https://www.aliyun.com' },
  { name: '腾讯云', aliases: ['腾讯云服务器', '腾讯云'], category: '云服务', site: 'https://cloud.tencent.com' },
  { name: '华为云', aliases: ['华为云服务器', '华为云'], category: '云服务', site: 'https://www.huaweicloud.com' },
];

// 匹配账单文本中的服务名：优先用别名（含规范名）最长匹配，避免「优酷」误中「优酷TV」等。
export function findService(text) {
  const t = String(text || '').toLowerCase().replace(/\s+/g, '');
  if (!t) return null;
  let best = null;
  for (const entry of library) {
    const names = [entry.name, ...(entry.aliases || [])];
    for (const n of names) {
      const key = n.toLowerCase().replace(/\s+/g, '');
      if (key && t.includes(key)) {
        if (!best || key.length > best.keyLen) {
          best = { entry, matched: n, keyLen: key.length };
        }
      }
    }
  }
  return best ? { entry: best.entry, matched: best.matched } : null;
}

// 生成「搜索退订方法」的安全链接（始终有效，跳到当前最新的官方指引）。
export function buildSearchUrl(name) {
  return 'https://www.bing.com/search?q=' + encodeURIComponent(`${name} 关闭自动续费`);
}

// 无专属步骤时用的通用退订指引。
export function genericSteps(name) {
  return [
    `打开「${name}」App 或官网`,
    '进入「我的 / 设置 / 会员中心」',
    '找到「自动续费 / 订阅管理 / 扣费服务」并关闭',
    `若找不到，到 支付宝/微信 的「扣费服务」中解约「${name}」`,
  ];
}
