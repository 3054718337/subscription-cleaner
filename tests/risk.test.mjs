import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyAmount, scoreRisk } from '../assets/risk.js';

test('月均金额折算', () => {
  assert.equal(monthlyAmount({ amount: 120, period: '包年' }), 10);
  assert.equal(monthlyAmount({ amount: 30, period: '包季' }), 10);
  assert.equal(monthlyAmount({ amount: 20, period: '连续包月' }), 20);
});

test('金额决定风险等级', () => {
  assert.equal(scoreRisk({ amount: 40, period: '连续包月', charges: 1 }).level, 'red');
  assert.equal(scoreRisk({ amount: 20, period: '连续包月', charges: 1 }).level, 'yellow');
  assert.equal(scoreRisk({ amount: 10, period: '连续包月', charges: 1 }).level, 'green');
});

test('年付单笔较大会提升风险', () => {
  assert.equal(scoreRisk({ amount: 88, period: '包年', charges: 1 }).level, 'yellow');
});

test('连续扣款多次提升风险', () => {
  assert.equal(scoreRisk({ amount: 12, period: '连续包月', charges: 4 }).level, 'yellow');
});

test('手动标记优先于金额', () => {
  assert.equal(scoreRisk({ amount: 10, period: '连续包月', charges: 1, flag: 'forgotten' }).level, 'red');
  assert.equal(scoreRisk({ amount: 100, period: '包年', charges: 1, flag: 'keep' }).level, 'green');
});
