const test = require('node:test');
const assert = require('node:assert');
<<<<<<< testing-improvement-settlement-calculation-3950783168132012676
const {
  calculateStopSettlement,
  getGoMultiplier,
  getOpponentDetailForPigbak,
  scoreDetailWithOption
} = require('./game.js');

test('calculateStopSettlement - Basic scoring', () => {
  const player = { goCount: 0, shakeMultiplier: 1 };
  const detail = { base: 7, junkPoint: 0, gwangPoint: 0, animals: 0, gwang: 0 };
  const opponent = null;

  const result = calculateStopSettlement(player, detail, opponent);
  assert.strictEqual(result.stopScore, 7);
  assert.deepStrictEqual(result.mods, []);
});

test('calculateStopSettlement - Go count additions (1-go, 2-go)', () => {
  const player1 = { goCount: 1, shakeMultiplier: 1 };
  const detail = { base: 7, junkPoint: 0, gwangPoint: 0, animals: 0, gwang: 0 };
  const result1 = calculateStopSettlement(player1, detail, null);
  assert.strictEqual(result1.stopScore, 8); // 7 + 1
  assert.deepStrictEqual(result1.mods, ['고 1회 +1']);

  const player2 = { goCount: 2, shakeMultiplier: 1 };
  const result2 = calculateStopSettlement(player2, detail, null);
  assert.strictEqual(result2.stopScore, 9); // 7 + 2
  assert.deepStrictEqual(result2.mods, ['고 2회 +2']);
});

test('calculateStopSettlement - 3-Go multiplier (2x)', () => {
  const player = { goCount: 3, shakeMultiplier: 1 };
  const detail = { base: 7, junkPoint: 0, gwangPoint: 0, animals: 0, gwang: 0 };
  const result = calculateStopSettlement(player, detail, null);
  // (7 + 3) * 2 = 20
  assert.strictEqual(result.stopScore, 20);
  assert.ok(result.mods.includes('고 3회 +3'));
  assert.ok(result.mods.includes('3고 x2'));
});

test('calculateStopSettlement - 4-Go multiplier (4x)', () => {
  const player = { goCount: 4, shakeMultiplier: 1 };
  const detail = { base: 7, junkPoint: 0, gwangPoint: 0, animals: 0, gwang: 0 };
  const result = calculateStopSettlement(player, detail, null);
  // (7 + 4) * 4 = 44
  assert.strictEqual(result.stopScore, 44);
  assert.ok(result.mods.includes('고 4회 +4'));
  assert.ok(result.mods.includes('4고 x4'));
});

test('calculateStopSettlement - Shake multiplier', () => {
  const player = { goCount: 0, shakeMultiplier: 2 };
  const detail = { base: 7, junkPoint: 0, gwangPoint: 0, animals: 0, gwang: 0 };
  const result = calculateStopSettlement(player, detail, null);
  assert.strictEqual(result.stopScore, 14);
  assert.deepStrictEqual(result.mods, ['흔들기 x2']);
});

test('calculateStopSettlement - Pi-bak', () => {
  const player = { goCount: 0, shakeMultiplier: 1 };
  const detail = { base: 7, junkPoint: 1, gwangPoint: 0, animals: 0, gwang: 0 };
  const opponent = {
    captured: Array(5).fill({ type: 'junk' }), // 5 junk cards -> < 7
    nineAnimalAsJunk: false
  };
  const result = calculateStopSettlement(player, detail, opponent);
  assert.strictEqual(result.stopScore, 14); // 7 * 2
  assert.ok(result.mods.includes('피박 x2'));
});

test('calculateStopSettlement - No Pi-bak if winner has no junk point', () => {
  const player = { goCount: 0, shakeMultiplier: 1 };
  const detail = { base: 7, junkPoint: 0, gwangPoint: 7, animals: 0, gwang: 0 }; // 7 points from something else
  const opponent = {
    captured: Array(5).fill({ type: 'junk' }),
    nineAnimalAsJunk: false
  };
  const result = calculateStopSettlement(player, detail, opponent);
  assert.strictEqual(result.stopScore, 7);
  assert.ok(!result.mods.includes('피박 x2'));
});

test('calculateStopSettlement - Gwang-bak', () => {
  const player = { goCount: 0, shakeMultiplier: 1 };
  const detail = { base: 7, gwangPoint: 3, gwang: 3, junkPoint: 0, animals: 0 };
  const opponent = {
    captured: [], // 0 gwang
    nineAnimalAsJunk: false
  };
  const result = calculateStopSettlement(player, detail, opponent);
  assert.strictEqual(result.stopScore, 14); // 7 * 2
  assert.ok(result.mods.includes('광박 x2'));
});

test('calculateStopSettlement - Mung-bak (7+ animals)', () => {
  const player = { goCount: 0, shakeMultiplier: 1 };
  const detail = { base: 7, animals: 7, gwangPoint: 0, junkPoint: 0 };
  const opponent = { captured: [], nineAnimalAsJunk: false };
  const result = calculateStopSettlement(player, detail, opponent);
  assert.strictEqual(result.stopScore, 14);
  assert.ok(result.mods.includes('멍박 x2'));
});

test('calculateStopSettlement - Cumulative multipliers', () => {
  const player = { goCount: 3, shakeMultiplier: 2 }; // 3-go (2x), shake (2x)
  const detail = { base: 7, junkPoint: 1, gwangPoint: 3, gwang: 3, animals: 7 }; // Winner has Pi, Gwang(3), Animals(7)
  const opponent = {
    captured: [], // Pi-bak (0 junk < 7), Gwang-bak (0 gwang)
    nineAnimalAsJunk: false
  };

  // (7 + 3) * 2 [3-go] * 2 [shake] * 2 [pi-bak] * 2 [gwang-bak] * 2 [mung-bak]
  // 10 * 2 * 2 * 2 * 2 * 2 = 320
  const result = calculateStopSettlement(player, detail, opponent);
  assert.strictEqual(result.stopScore, 320);
  assert.strictEqual(result.mods.length, 6);
  assert.ok(result.mods.includes('고 3회 +3'));
  assert.ok(result.mods.includes('3고 x2'));
  assert.ok(result.mods.includes('흔들기 x2'));
  assert.ok(result.mods.includes('피박 x2'));
  assert.ok(result.mods.includes('광박 x2'));
  assert.ok(result.mods.includes('멍박 x2'));
});

test('getOpponentDetailForPigbak - Avoids Pi-bak with 9-animal', () => {
  // Opponent has 6 junk cards + 9-animal.
  // If 9-animal is treated as animal, junk count is 6 (Pi-bak).
  // If 9-animal is treated as junk (2 junk cards), junk count is 8 (No Pi-bak).
  const opponent = {
    captured: [
      { type: 'junk', junkValue: 1 },
      { type: 'junk', junkValue: 1 },
      { type: 'junk', junkValue: 1 },
      { type: 'junk', junkValue: 1 },
      { type: 'junk', junkValue: 1 },
      { type: 'junk', junkValue: 1 },
      { type: 'animal', month: 9 }
    ],
    nineAnimalAsJunk: false
  };

  const detail = getOpponentDetailForPigbak(opponent);
  assert.strictEqual(detail.junk, 8); // Should have picked the alt version
});

test('getGoMultiplier', () => {
  assert.strictEqual(getGoMultiplier(0), 1);
  assert.strictEqual(getGoMultiplier(1), 1);
  assert.strictEqual(getGoMultiplier(2), 1);
  assert.strictEqual(getGoMultiplier(3), 2);
  assert.strictEqual(getGoMultiplier(4), 4);
  assert.strictEqual(getGoMultiplier(5), 8);
  assert.strictEqual(getGoMultiplier(6), 16);
=======
const { getSecureRandom, shuffle } = require('./game.js');

test('getSecureRandom returns a number between 0 and 1', () => {
  for (let i = 0; i < 1000; i++) {
    const val = getSecureRandom();
    assert.ok(val >= 0 && val < 1, `Value ${val} out of range [0, 1)`);
  }
});

test('shuffle shuffles an array', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const output = shuffle(input);
  assert.strictEqual(input.length, output.length);
  // Statistically likely to be true for 10 elements.
  // The probability of getting the same order is 1/10! = 1/3,628,800.
  assert.notDeepStrictEqual(input, output);
  assert.deepStrictEqual([...input].sort((a, b) => a - b), [...output].sort((a, b) => a - b));
});

test('shuffle does not mutate original array', () => {
  const input = [1, 2, 3];
  const inputCopy = [...input];
  shuffle(input);
  assert.deepStrictEqual(input, inputCopy);
>>>>>>> main
});
