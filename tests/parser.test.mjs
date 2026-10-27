import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBill, mergeEntries } from '../assets/parser.js';

test('解析微信支付账单：识别服务名与金额', () => {
  const text = [
    '微信支付-爱奇艺视频会员 15.00',
    '微信支付-腾讯视频VIP 30.00元',
    '微信支付-哔哩哔哩大会员 25.00元',
  ].join('\n');
  const { entries, summary } = parseBill(text);
  const byName = Object.fromEntries(entries.map((e) => [e.name, e]));

  assert.equal(summary.count, 3);
  assert.equal(byName['爱奇艺'].amount, 15);
  assert.equal(byName['腾讯视频'].amount, 30);
  assert.equal(byName['哔哩哔哩'].amount, 25);
  assert.equal(byName['爱奇艺'].source, '微信支付');
});

test('解析支付宝账单：年费会员走包年周期', () => {
  const text = [
    '支付宝-淘宝88VIP会员 88.00',
    '支付宝-网易云音乐黑胶VIP 15.00',
  ].join('\n');
  const { entries } = parseBill(text);
  const byName = Object.fromEntries(entries.map((e) => [e.name, e]));

  assert.equal(byName['淘宝88VIP'].amount, 88);
  assert.equal(byName['淘宝88VIP'].period, '包年');
  assert.equal(byName['网易云音乐'].amount, 15);
});

test('解析银行扣款短信：提取日期与金额', () => {
  const text = '您尾号1234的卡于10月25日消费15.00元，商户：爱奇艺';
  const { entries } = parseBill(text);
  const e = entries[0];

  assert.equal(e.name, '爱奇艺');
  assert.equal(e.amount, 15);
  assert.equal(e.source, '银行卡');
  assert.match(e.lastDate, /^\d{4}-10-25$/);
});

test('解析 Apple 订阅：iCloud 与 Apple Music', () => {
  const text = [
    'Apple 商店：iCloud+ 50GB 6.00',
    'Apple：Apple Music 会员 11.00',
  ].join('\n');
  const { entries } = parseBill(text);
  const byName = Object.fromEntries(entries.map((e) => [e.name, e]));

  assert.equal(byName['iCloud'].amount, 6);
  assert.equal(byName['Apple Music'].amount, 11);
});

test('连续包月关键词触发订阅识别', () => {
  const text = '【爱奇艺】您已成功续费连续包月，¥15/月';
  const { entries } = parseBill(text);
  assert.equal(entries[0].name, '爱奇艺');
  assert.equal(entries[0].period, '连续包月');
});

test('同名订阅多次出现会合并计数', () => {
  const text = [
    '微信支付-爱奇艺视频会员 15.00',
    '微信支付-爱奇艺视频会员 15.00元',
  ].join('\n');
  const { entries } = parseBill(text);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].charges, 2);
  assert.equal(entries[0].totalSpent, 30);
});

test('无法识别的行会跳过并给出警告', () => {
  const text = '这是普通消费 88.00';
  const { entries, warnings } = parseBill(text);
  assert.equal(entries.length, 0);
  assert.ok(warnings.length > 0);
});

test('mergeEntries 把新解析结果并入已有列表', () => {
  const existing = [
    { name: '爱奇艺', amount: 15, charges: 1, totalSpent: 15, lastDate: '', period: '连续包月', matched: true, category: '视频', site: '' },
  ];
  const parsed = parseBill('微信支付-爱奇艺视频会员 15.00').entries;
  const merged = mergeEntries(existing, parsed);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].charges, 2);
  assert.equal(merged[0].totalSpent, 30);
});
