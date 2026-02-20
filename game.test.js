const { test, describe } = require('node:test');
const assert = require('node:assert');
const { scoreDetailWithOption } = require('./game.js');

describe('scoreDetailWithOption', () => {
  test('should calculate gwang points correctly', () => {
    // 3 Gwang without rain
    const threeGwang = [
      { type: 'gwang', month: 1 },
      { type: 'gwang', month: 3 },
      { type: 'gwang', month: 8 }
    ];
    assert.strictEqual(scoreDetailWithOption(threeGwang).gwangPoint, 3);
    assert.strictEqual(scoreDetailWithOption(threeGwang).base, 3);

    // 3 Gwang with rain
    const threeGwangWithRain = [
      { type: 'gwang', month: 1 },
      { type: 'gwang', month: 3 },
      { type: 'gwang', month: 11, rain: true }
    ];
    assert.strictEqual(scoreDetailWithOption(threeGwangWithRain).gwangPoint, 2);
    assert.strictEqual(scoreDetailWithOption(threeGwangWithRain).base, 2);

    // 4 Gwang
    const fourGwang = [
      { type: 'gwang', month: 1 },
      { type: 'gwang', month: 3 },
      { type: 'gwang', month: 8 },
      { type: 'gwang', month: 11, rain: true }
    ];
    assert.strictEqual(scoreDetailWithOption(fourGwang).gwangPoint, 4);
    assert.strictEqual(scoreDetailWithOption(fourGwang).base, 4);

    // 5 Gwang
    const fiveGwang = [
      { type: 'gwang', month: 1 },
      { type: 'gwang', month: 3 },
      { type: 'gwang', month: 8 },
      { type: 'gwang', month: 11, rain: true },
      { type: 'gwang', month: 12 }
    ];
    assert.strictEqual(scoreDetailWithOption(fiveGwang).gwangPoint, 15);
    assert.strictEqual(scoreDetailWithOption(fiveGwang).base, 15);
  });

  test('should calculate ribbon points correctly', () => {
    // 5 Ribbons
    const fiveRibbons = [
      { type: 'ribbon', month: 1 },
      { type: 'ribbon', month: 2 },
      { type: 'ribbon', month: 4 },
      { type: 'ribbon', month: 5 },
      { type: 'ribbon', month: 7 }
    ];
    const res = scoreDetailWithOption(fiveRibbons);
    assert.strictEqual(res.ribbonBasePoint, 1);
    assert.strictEqual(res.ribbonYakPoint, 3); // Chodan (4, 5, 7)
    assert.strictEqual(res.ribbonPoint, 4);

    // Hongdan
    const hongdan = [
      { type: 'ribbon', month: 1 },
      { type: 'ribbon', month: 2 },
      { type: 'ribbon', month: 3 }
    ];
    assert.strictEqual(scoreDetailWithOption(hongdan).ribbonYakPoint, 3);

    // Cheongdan
    const cheongdan = [
      { type: 'ribbon', month: 6 },
      { type: 'ribbon', month: 9 },
      { type: 'ribbon', month: 10 }
    ];
    assert.strictEqual(scoreDetailWithOption(cheongdan).ribbonYakPoint, 3);
  });

  test('should calculate animal points correctly', () => {
    // 5 Animals
    const fiveAnimals = [
      { type: 'animal', month: 2 },
      { type: 'animal', month: 4 },
      { type: 'animal', month: 6 },
      { type: 'animal', month: 7 },
      { type: 'animal', month: 10 }
    ];
    assert.strictEqual(scoreDetailWithOption(fiveAnimals).animalBasePoint, 1);

    // Godori
    const godori = [
      { type: 'animal', month: 2 },
      { type: 'animal', month: 4 },
      { type: 'animal', month: 8 }
    ];
    assert.strictEqual(scoreDetailWithOption(godori).animalYakPoint, 5);
  });

  test('should calculate junk points correctly', () => {
    // 10 Junk
    const tenJunk = Array(10).fill({ type: 'junk', month: 1 });
    assert.strictEqual(scoreDetailWithOption(tenJunk).junkPoint, 1);

    // Junk with junkValue: 2
    const junkWithDouble = [
      { type: 'junk', month: 11, junkValue: 2 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 }
    ]; // total 10 points
    assert.strictEqual(scoreDetailWithOption(junkWithDouble).junk, 10);
    assert.strictEqual(scoreDetailWithOption(junkWithDouble).junkPoint, 1);

    // Bonus cards
    const bonusCards = [
      { type: 'bonus', month: 0, junkValue: 2 },
      { type: 'bonus', month: 0, junkValue: 2 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 },
      { type: 'junk', month: 1 }
    ]; // 2+2+6 = 10
    assert.strictEqual(scoreDetailWithOption(bonusCards).junk, 10);
    assert.strictEqual(scoreDetailWithOption(bonusCards).junkPoint, 1);
  });

  test('should handle 9-month animal card correctly', () => {
    const cardsWithNineAnimal = [
      { type: 'animal', month: 9 },
      { type: 'animal', month: 2 },
      { type: 'animal', month: 4 },
      { type: 'animal', month: 8 },
      { type: 'animal', month: 6 }
    ];

    // As animal (default)
    const asAnimal = scoreDetailWithOption(cardsWithNineAnimal, false);
    assert.strictEqual(asAnimal.animals, 5);
    assert.strictEqual(asAnimal.hasGodori, true);
    assert.strictEqual(asAnimal.animalPoint, 6); // 1 (base) + 5 (godori)
    assert.strictEqual(asAnimal.junk, 0);

    // As junk
    const asJunk = scoreDetailWithOption(cardsWithNineAnimal, true);
    assert.strictEqual(asJunk.animals, 4);
    assert.strictEqual(asJunk.hasGodori, true);
    assert.strictEqual(asJunk.animalPoint, 5); // 0 (base) + 5 (godori)
    assert.strictEqual(asJunk.junk, 2);
  });
});
