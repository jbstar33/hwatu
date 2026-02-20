const test = require('node:test');
const assert = require('node:assert');
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
});
