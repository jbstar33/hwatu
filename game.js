const MONTH_NAMES = {
  1: "1월 송학",
  2: "2월 매조",
  3: "3월 벚꽃",
  4: "4월 흑싸리",
  5: "5월 난초",
  6: "6월 모란",
  7: "7월 홍싸리",
  8: "8월 공산",
  9: "9월 국화",
  10: "10월 단풍",
  11: "11월 오동",
  12: "12월 비광"
};

const TYPE_LABEL = {
  gwang: "광",
  animal: "열끗",
  ribbon: "띠",
  junk: "피",
  bonus: "보피"
};

const TYPE_ORDER = { gwang: 0, animal: 1, ribbon: 2, junk: 3, bonus: 4 };
const RIBBON_KIND_ORDER = { cheong: 0, hong: 1, plain: 2 };
const HONGDAN_MONTHS = [1, 2, 3];
const CHEONGDAN_MONTHS = [6, 9, 10];
const CHODAN_MONTHS = [4, 5, 7];
const GODORI_MONTHS = [2, 4, 8];
const WIN_THRESHOLD = 7;
const ANIM = {
  aiThinkMs: 950,
  playMoveMs: 420,
  tableFlashMs: 360,
  humanShakeMs: 1100,
  aiShakeMs: 1200,
  deckToMidMs: 320,
  deckFlipMs: 260,
  deckToTableMs: 360,
  reminderMs: 8000,
  timeoutAfterReminderMs: 5000
};

const AI_SCORE_MATCH_MULTIPLIER = 3;
const AI_SCORE_BONUS_PRIORITY = 5;
const AI_SCORE_GWANG_PRIORITY = 1;
const AI_SCORE_RANDOM_WEIGHT = 0.2;
const HUMAN_AUTO_BONUS_PRIORITY = 4;

const game = {
  players: [],
  table: [],
  deck: [],
  turn: 0,
  gameOver: false,
  pendingChoice: null,
  awaitingGoStop: false,
  voiceEnabled: true,
  pigbakEnabled: true,
  reminderTimer: null,
  actionTimeoutTimer: null,
  countdownTimer: null,
  countdownSeconds: 0,
  voiceReady: false,
  lastPlay: { human: null, ai: null },
  isAnimating: false,
  turnState: null,
  ppukPiles: [],
  currentMultiplier: 1,
  nextGameMultiplier: 1,
  initialTurn: 0,
  forceNextTurn: undefined
};

const el = typeof document !== 'undefined' ? {
  statusText: document.getElementById("statusText"),
  turnText: document.getElementById("turnText"),
  aiLane: document.getElementById("aiLane"),
  humanLane: document.getElementById("humanLane"),
  aiHandCount: document.getElementById("aiHandCount"),
  aiScore: document.getElementById("aiScore"),
  aiGo: document.getElementById("aiGo"),
  mobileAiHandCount: document.getElementById("mobileAiHandCount"),
  mobileAiScore: document.getElementById("mobileAiScore"),
  mobileAiGo: document.getElementById("mobileAiGo"),
  humanScore: document.getElementById("humanScore"),
  humanGo: document.getElementById("humanGo"),
  mobileHumanScore: document.getElementById("mobileHumanScore"),
  mobileHumanGo: document.getElementById("mobileHumanGo"),
  aiHand: document.getElementById("aiHand"),
  humanHand: document.getElementById("humanHand"),
  tableCards: document.getElementById("tableCards"),
  deckCount: document.getElementById("deckCount"),
  ppukPiles: document.getElementById("ppukPiles"),
  turnCountdown: document.getElementById("turnCountdown"),
  goStopModal: document.getElementById("goStopModal"),
  nagariModal: document.getElementById("nagariModal"),
  nagariYesBtn: document.getElementById("nagariYesBtn"),
  nagariNoBtn: document.getElementById("nagariNoBtn"),
  resultModal: document.getElementById("resultModal"),
  resultConfetti: document.getElementById("resultConfetti"),
  resultTitle: document.getElementById("resultTitle"),
  resultWinner: document.getElementById("resultWinner"),
  resultFinalScore: document.getElementById("resultFinalScore"),
  restartBtn: document.getElementById("restartBtn"),
  goStopTitle: document.getElementById("goStopTitle"),
  goStopScore: document.getElementById("goStopScore"),
  goStopDetail: document.getElementById("goStopDetail"),
  aiLastPlay: document.getElementById("aiLastPlay"),
  humanLastPlay: document.getElementById("humanLastPlay"),
  aiCapturedCards: document.getElementById("aiCapturedCards"),
  humanCapturedCards: document.getElementById("humanCapturedCards"),
  mobileAiCapturedCards: document.getElementById("mobileAiCapturedCards"),
  mobileHumanCapturedCards: document.getElementById("mobileHumanCapturedCards"),
  logList: document.getElementById("logList"),
  rulesBtn: document.getElementById("rulesBtn"),
  goDecisionBtn: document.getElementById("goDecisionBtn"),
  stopDecisionBtn: document.getElementById("stopDecisionBtn"),
  newGameBtn: document.getElementById("newGameBtn"),
  voiceToggleBtn: document.getElementById("voiceToggleBtn"),
  sfxToggleBtn: document.getElementById("sfxToggleBtn"),
  pigbakToggleBtn: document.getElementById("pigbakToggleBtn")
} : {};

if (typeof document !== 'undefined') {
  el.newGameBtn.addEventListener("click", () => startGame());
  el.voiceToggleBtn.addEventListener("click", () => {
    game.voiceEnabled = !game.voiceEnabled;
    el.voiceToggleBtn.classList.toggle("active", game.voiceEnabled);
    el.voiceToggleBtn.setAttribute("aria-pressed", game.voiceEnabled);
  });
  el.sfxToggleBtn?.addEventListener("click", () => {
    const enabled = soundManager.toggle();
    el.sfxToggleBtn.classList.toggle("active", enabled);
    el.sfxToggleBtn.setAttribute("aria-pressed", enabled);
  });
  el.pigbakToggleBtn?.addEventListener("click", () => {
    game.pigbakEnabled = !game.pigbakEnabled;
    el.pigbakToggleBtn.classList.toggle("active", game.pigbakEnabled);
    el.pigbakToggleBtn.setAttribute("aria-pressed", game.pigbakEnabled);
  });
  el.rulesBtn?.addEventListener("click", () => window.open("rules.html", "_blank", "noopener"));
  el.goDecisionBtn?.addEventListener("click", () => handleGoStop(true));
  el.stopDecisionBtn?.addEventListener("click", () => handleGoStop(false));
  el.nagariYesBtn?.addEventListener("click", () => handleNagariDecision(true));
  el.nagariNoBtn?.addEventListener("click", () => handleNagariDecision(false));
  el.restartBtn?.addEventListener("click", () => startGame());

  if (window.speechSynthesis) {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      game.voiceReady = true;
    });
  }
}

function startGame() {
  soundManager.init();
  clearReminder();
  hideResultOverlay();
  hideNagariModal();
  const nextMult = game.nextGameMultiplier || 1;
  game.players = [makePlayer("human", "나", false), makePlayer("ai", "AI", true)];
  game.table = [];
  game.deck = shuffle(makeDeck());

  if (game.forceNextTurn !== undefined) {
    game.turn = game.forceNextTurn;
    game.forceNextTurn = undefined;
  } else {
    game.turn = getSecureRandom() < 0.5 ? 0 : 1;
  }
  game.initialTurn = game.turn;

  game.gameOver = false;
  game.pendingChoice = null;
  game.awaitingGoStop = false;
  game.lastPlay = { human: null, ai: null };
  game.isAnimating = false;
  game.countdownSeconds = 0;
  game.turnState = null;
  game.ppukPiles = [];
  game.currentMultiplier = nextMult;
  game.nextGameMultiplier = 1; // Reset for future, will be set again if Nagari

  dealCards();

  const chongTong = checkChongTong();
  if (chongTong) {
    processDealtTableBonus();
    render();
    setTimeout(() => {
      endGameWithChongTong(chongTong);
    }, 500);
    return;
  }

  processDealtTableBonus();
  logLine(`새 게임 시작${game.currentMultiplier > 1 ? ` (배수 x${game.currentMultiplier})` : ""}`);
  render();
  runTurnLoop();
}

function makePlayer(id, name, isAI) {
  return {
    id,
    name,
    isAI,
    hand: [],
    captured: [],
    goCount: 0,
    goDecisionRawTarget: WIN_THRESHOLD,
    shakeMultiplier: 1,
    shakenMonths: new Set(),
    buriedBonus: 0,
    nineAnimalAsJunk: false,
    nineAnimalChoiceLocked: false,
    score: 0,
    stopScore: 0,
    settlementMods: [],
    scoreDetail: null
  };
}

function makeDeck() {
  let id = 1;
  const deck = [];
  const push = (month, type, opt = {}) => {
    // 현재 화투 시트는 12열(1~12월) x 4행(월당 4장) 구조를 기준으로 매핑한다.
    // col: 월(1~12), row: slot(0~3) - 월별 4장 고정 순서를 직접 매핑
    const spriteCol = month - 1;
    const spriteRow = typeof opt.slot === "number" ? opt.slot : 0;
    const monthKey = String(month).padStart(2, "0");
    const asset = `assets/hwatu/m${monthKey}_${spriteRow}.webp`;
    deck.push({
      id: id++,
      month,
      type,
      spriteCol,
      spriteRow,
      asset,
      ...opt
    });
  };

  // 월별 4장 순서(행): [0,1,2,3]을 카드 실물 배열 기준으로 수동 매핑한다.
  push(1, "gwang", { slot: 0 });
  push(1, "ribbon", { slot: 1, ribbonKind: "hong" });
  push(1, "junk", { slot: 2 });
  push(1, "junk", { slot: 3 });

  push(2, "animal", { slot: 0 });
  push(2, "ribbon", { slot: 1, ribbonKind: "hong" });
  push(2, "junk", { slot: 2 });
  push(2, "junk", { slot: 3 });

  push(3, "gwang", { slot: 0 });
  push(3, "ribbon", { slot: 1, ribbonKind: "hong" });
  push(3, "junk", { slot: 2 });
  push(3, "junk", { slot: 3 });

  push(4, "animal", { slot: 0 });
  push(4, "ribbon", { slot: 1, ribbonKind: "plain" });
  push(4, "junk", { slot: 2 });
  push(4, "junk", { slot: 3 });

  push(5, "animal", { slot: 0 });
  push(5, "ribbon", { slot: 1, ribbonKind: "plain" });
  push(5, "junk", { slot: 2 });
  push(5, "junk", { slot: 3 });

  push(6, "animal", { slot: 0 });
  push(6, "ribbon", { slot: 1, ribbonKind: "cheong" });
  push(6, "junk", { slot: 2 });
  push(6, "junk", { slot: 3 });

  push(7, "animal", { slot: 0 });
  push(7, "ribbon", { slot: 1, ribbonKind: "plain" });
  push(7, "junk", { slot: 2 });
  push(7, "junk", { slot: 3 });

  push(8, "gwang", { slot: 0 });
  push(8, "animal", { slot: 1 });
  push(8, "junk", { slot: 2 });
  push(8, "junk", { slot: 3 });

  push(9, "animal", { slot: 0 });
  push(9, "ribbon", { slot: 1, ribbonKind: "cheong" });
  push(9, "junk", { slot: 2 });
  push(9, "junk", { slot: 3 });

  push(10, "animal", { slot: 0 });
  push(10, "ribbon", { slot: 1, ribbonKind: "cheong" });
  push(10, "junk", { slot: 2 });
  push(10, "junk", { slot: 3 });

  push(11, "gwang", { slot: 0, rain: true });
  // 11월(오동): 광 + 쌍피(m11_1) + 피 + 피
  push(11, "junk", { slot: 1, junkValue: 2 });
  push(11, "junk", { slot: 2, junkValue: 1 });
  push(11, "junk", { slot: 3, junkValue: 1 });

  // 12월(비): 광 + 열끗(m12_1) + 띠(m12_2) + 쌍피(m12_3)
  push(12, "gwang", { slot: 0 });
  push(12, "animal", { slot: 1 });
  push(12, "ribbon", { slot: 2, ribbonKind: "plain" });
  push(12, "junk", { slot: 3, junkValue: 2 });
  // 보너스 패 2장은 쌍피(피 2장) 취급
  push(13, "bonus", { slot: 0, spriteCol: 0, spriteRow: 0, junkValue: 2, asset: "assets/hwatu/bonus_1.webp" });
  push(14, "bonus", { slot: 0, spriteCol: 0, spriteRow: 0, junkValue: 2, asset: "assets/hwatu/bonus_2.webp" });

  return deck;
}

function dealCards() {
  for (let i = 0; i < 10; i += 1) {
    game.players[0].hand.push(game.deck.pop());
    game.players[1].hand.push(game.deck.pop());
  }

  for (let i = 0; i < 8; i += 1) {
    game.table.push(game.deck.pop());
  }

  soundManager.playNoise(0.6, 0, 0.5, 1200); // Shuffling sound
  game.players.forEach((p) => updatePlayerScore(p));
}

function runTurnLoop() {
  if (game.gameOver || game.awaitingGoStop || game.pendingChoice || game.isAnimating) {
    render();
    return;
  }

  const player = game.players[game.turn];
  ensureTurnState(player);
  if (player.isAI) {
    clearReminder();
    el.statusText.textContent = "AI 생각 중...";
    setTimeout(() => runAITurn(), ANIM.aiThinkMs);
  } else {
    el.statusText.textContent = "내 차례: 손패를 선택하세요.";
    scheduleReminder();
  }
  render();
}

function ensureTurnState(player) {
  if (game.turnState && game.turnState.playerId === player.id) return;
  game.turnState = {
    playerId: player.id,
    usedBonusCards: [],
    pendingSteal: 0,
    ppuk: false,
    deckBonusBuffer: []
  };
}

async function runAITurn() {
  if (game.gameOver || game.turn !== 1) return;
  const ai = game.players[1];
  const me = game.players[0];

  await maybeShake(ai);

  let playedCard = null;
  let handResult = null;
  while (!playedCard) {
    const card = chooseAICard(ai);
    if (!card) {
      endByDeck();
      return;
    }
    await animatePlayCard(card, null, true);
    logLine(`AI가 ${describeCard(card)} 를 냈습니다.`);
    setLastPlay("ai", card);
    const result = resolvePlacement(ai, card, null, false);
    if (result.bonusUsed) {
      continue;
    }
    playedCard = card;
    handResult = result;
    if (handResult.needsChoice) {
      handResult = resolvePlacement(ai, card, handResult.matches[0].id, false);
    }
  }

  const deckOutcome = await resolveDeckDraw(ai);
  markPpukIfNeeded(ai, playedCard, handResult, deckOutcome);
  finalizeBonusAfterTurn(ai, me);
  afterTurnScoring(ai, game.players[0]);

  if (!game.awaitingGoStop && !game.gameOver) {
    nextTurn();
  }
}

function chooseAICard(ai) {
  const tableCounts = {};
  for (const t of game.table) {
    tableCounts[t.month] = (tableCounts[t.month] || 0) + 1;
  }

  const scored = ai.hand.map((card) => {
    const m = tableCounts[card.month] || 0;
    const bonusPriority = card.type === "bonus" ? 5 : 0;
    return { card, score: m * 3 + (card.type === "gwang" ? 1 : 0) + bonusPriority + Math.random() * 0.2 };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.card;
}

async function maybeShake(player) {
  const monthCount = new Map();
  player.hand.forEach((c) => {
    monthCount.set(c.month, (monthCount.get(c.month) || 0) + 1);
  });

  for (const [month, cnt] of monthCount.entries()) {
    if (cnt >= 3 && !player.shakenMonths.has(month)) {
      const trigger = player.isAI ? getSecureRandom() < 0.5 : false;
      if (trigger) {
        player.shakenMonths.add(month);
        player.shakeMultiplier *= 2;
        await showShakeReveal(player, month);
        logLine(`${player.name}가 흔들기! 배수 x${player.shakeMultiplier}`);
        speak("흔들어");
      }
      break;
    }
  }
}

async function onHumanCardClick(cardId, sourceNode) {
  if (game.gameOver || game.turn !== 0 || game.awaitingGoStop || game.isAnimating || game.pendingChoice) return;
  soundManager.init();
  soundManager.playSnap();
  clearReminder();

  const me = game.players[0];
  const card = me.hand.find((c) => c.id === cardId);
  if (!card) return;

  const shookOnly = await maybeHumanShake(me, card.month);
  if (shookOnly) {
    el.statusText.textContent = "흔들기 완료. 낼 패를 선택하세요.";
    scheduleReminder();
    render();
    return;
  }
  await animatePlayCard(card, sourceNode, false);

  logLine(`내가 ${describeCard(card)} 를 냈습니다.`);
  setLastPlay("human", card);
  const handResult = resolvePlacement(me, card, null, false);
  if (handResult.bonusUsed) {
    scheduleReminder();
    render();
    return;
  }

  if (handResult.needsChoice) {
    game.pendingChoice = {
      playerIdx: 0,
      card,
      fromDeck: false,
      matches: handResult.matches.map((c) => c.id)
    };
    el.statusText.textContent = "바닥의 같은 월 카드 중 1장을 선택하세요.";
    scheduleReminder();
    render();
    return;
  }

  const deckOutcome = await resolveDeckDraw(me);
  markPpukIfNeeded(me, card, handResult, deckOutcome);

  if (game.pendingChoice) {
    render();
    return;
  }

  finalizeBonusAfterTurn(me, game.players[1]);
  afterTurnScoring(me, game.players[1]);

  if (!game.awaitingGoStop && !game.gameOver) {
    nextTurn();
  }
}

async function maybeHumanShake(player, month) {
  const cnt = player.hand.filter((c) => c.month === month).length;
  if (cnt >= 3 && !player.shakenMonths.has(month)) {
    const ok = confirm(`${month}월 카드로 흔들기를 하시겠습니까? (배수 2배)`);
    if (ok) {
      player.shakenMonths.add(month);
      player.shakeMultiplier *= 2;
      await showShakeReveal(player, month);
      logLine(`내가 흔들기! 배수 x${player.shakeMultiplier}`);
      speak("흔들어");
      return true;
    }
  }
  return false;
}

async function onTableCardChoice(tableCardId) {
  if (game.isAnimating) return;
  clearReminder();
  const pending = game.pendingChoice;
  if (!pending) return;
  if (!pending.matches.includes(tableCardId)) return;

  const player = game.players[pending.playerIdx];
  const opponent = game.players.find((p) => p.id !== player.id);

  try {
    resolvePlacement(player, pending.card, tableCardId, pending.fromDeck);
    game.pendingChoice = null;

    if (!pending.fromDeck) {
      const deckOutcome = await resolveDeckDraw(player);
      markPpukIfNeeded(player, pending.card, { laidToTable: false }, deckOutcome);

      if (game.pendingChoice) {
        render();
        return;
      }

      finalizeBonusAfterTurn(player, opponent);
      afterTurnScoring(player, opponent);
      if (!game.awaitingGoStop && !game.gameOver) nextTurn();
    } else {
      finalizeBonusAfterTurn(player, opponent);
      afterTurnScoring(player, opponent);
      if (!game.awaitingGoStop && !game.gameOver) nextTurn();
    }
  } catch (err) {
    console.error(err);
    logLine(`Error during choice: ${err.message}`);
    // Attempt to recover state or force next turn if critical
    if (!game.gameOver) {
       // If turn seems stuck, force next turn
       const expectedTurn = player.id === "human" ? 0 : 1;
       if (game.turn === expectedTurn) nextTurn();
    }
  }

  render();
}

function resolvePlacement(player, card, chosenTableId, fromDeck) {
  if (!fromDeck) {
    player.hand = player.hand.filter((c) => c.id !== card.id);
  }

  if (card.type === "bonus") {
    if (fromDeck) {
      takeCards(player, [card]);
      logLine(`${player.name}: 더미 보너스피 획득`);
      return { captured: [card], laidToTable: false, deckBonus: true };
    }
    const state = game.turnState;
    if (state && state.playerId === player.id) {
      state.usedBonusCards.push(card);
      state.pendingSteal += 1;
    }
    logLine(`${player.name}: 보너스피 사용`);
    drawToHand(player);
    return { bonusUsed: true, captured: [] };
  }

  const claimedPpukCards = claimPpukPileByMonth(player, card.month);
  if (claimedPpukCards.length) {
    takeCards(player, [card]);
    logLine(`${player.name}: 뻑 회수와 함께 ${describeCard(card)} 획득`);
    return { captured: [card, ...claimedPpukCards], laidToTable: false };
  }

  const matches = game.table.filter((t) => t.month === card.month);

  if (matches.length > 0) {
    soundManager.playMatch();
    showMatchEffect(matches.map((m) => m.id));
  }

  if (matches.length === 0) {
    game.table.push(card);
    logLine(`${player.name}: ${describeCard(card)} 바닥에 깔림`);
    return { captured: [], laidToTable: true };
  }

  if (matches.length === 1) {
    const target = matches[0];
    takeCards(player, [card, target]);
    removeTableCards([target.id]);
    return { captured: [card, target], laidToTable: false };
  }

  if (matches.length === 2) {
    if (!chosenTableId && matches.every((m) => m.type === "junk")) {
      const autoTarget = matches[Math.floor(getSecureRandom() * matches.length)];
      return resolvePlacement(player, card, autoTarget.id, fromDeck);
    }
    if (!chosenTableId) {
      return { needsChoice: true, matches };
    }
    const target = matches.find((m) => m.id === chosenTableId);
    if (!target) return { needsChoice: true, matches };
    showMatchEffect([target.id]);
    takeCards(player, [card, target]);
    removeTableCards([target.id]);
    logLine(`${player.name}: 같은 월 2장 중 선택해서 먹음`);
    return { captured: [card, target], laidToTable: false };
  }

  const ids = matches.map((m) => m.id);
  takeCards(player, [card, ...matches]);
  removeTableCards(ids);
  logLine(`${player.name}: ${card.month}월 싹쓸이!`);
  if (player.isAI) speak("쌌어");
  return { captured: [card, ...matches], laidToTable: false };
}

async function resolveDeckDraw(player) {
  const state = game.turnState;
  const bonusBuffer = state && state.playerId === player.id ? state.deckBonusBuffer : [];
  while (true) {
    if (game.deck.length === 0) {
      endByDeck();
      return { deckEmpty: true };
    }

    const drawn = game.deck.pop();
    await animateDeckDraw(drawn);
    logLine(`${player.name} 더미에서 ${describeCard(drawn)} 확인`);

    if (drawn.type === "bonus") {
      bonusBuffer.push(drawn);
      logLine(`${player.name}: 보너스피로 한 장 더 뒤집기`);
      continue;
    }

    const result = resolvePlacement(player, drawn, null, true);
    if (result.needsChoice) {
      if (player.isAI) {
        resolvePlacement(player, drawn, result.matches[0].id, true);
      } else {
        game.pendingChoice = {
          playerIdx: 0,
          card: drawn,
          fromDeck: true,
          matches: result.matches.map((m) => m.id)
        };
        el.statusText.textContent = "더미 카드 매칭: 바닥 카드 1장을 선택하세요.";
        scheduleReminder();
      }
    }

    if (player.isAI && result.captured && result.captured.length >= 3) {
      speak("쌌어");
    }
    return {
      deckEmpty: false,
      drawn,
      placement: result,
      bonusBuffer: bonusBuffer.slice()
    };
  }
}

function takeCards(player, cards) {
  player.captured.push(...cards);
}

function removeCapturedCards(player, ids) {
  const idSet = new Set(ids);
  player.captured = player.captured.filter((c) => !idSet.has(c.id));
}

function removeTableCards(ids) {
  const idSet = new Set(ids);
  game.table = game.table.filter((c) => !idSet.has(c.id));
}

function afterTurnScoring(current, opponent) {
  const oldScore = current.score;
  updatePlayerScore(current, opponent);

  const diff = current.score - oldScore;
  if (diff !== 0) {
    const lane = current.id === "human" ? el.humanLane : el.aiLane;
    showFloatingText(diff > 0 ? `+${diff}` : `${diff}`, lane, diff < 0);
    if (diff > 0) soundManager.playPoint();
  }

  updatePlayerScore(opponent, current);
  if (!current.isAI) {
    maybeAskNineAnimalChoice(current, opponent);
    updatePlayerScore(current, opponent);
    updatePlayerScore(opponent, current);
  }

  if (game.gameOver) return;

  if (current.score >= current.goDecisionRawTarget) {
    if (current.isAI) {
      const stop = shouldAIStop(current);
      if (stop) {
        currentGoStop(false);
      } else {
        currentGoStop(true);
      }
    } else {
      // 마지막 패인 경우 자동 스톱
      if (current.hand.length === 0) {
        logLine("마지막 패: 점수가 났으므로 자동 스톱하여 승리합니다.");
        currentGoStop(false);
        return;
      }

      game.awaitingGoStop = true;
      clearReminder();
      el.statusText.textContent = `점수 ${current.score}점. 고/스톱을 선택하세요.`;
      // Buttons disabled, use modal
      render();
    }
  }
}

function shouldAIStop(ai) {
  if (ai.stopScore >= 11) return true;
  if (game.deck.length <= 4 && ai.stopScore >= 8) return true;
  if (ai.goCount >= 1 && getSecureRandom() < 0.45) return true;
  return false;
}

function handleGoStop(isGo) {
  if (!game.awaitingGoStop || game.turn !== 0) return;
  clearReminder();
  currentGoStop(isGo);
  if (!game.gameOver) {
    nextTurn();
  }
}

function currentGoStop(isGo) {
  const player = game.players[game.turn];
  game.awaitingGoStop = false;

  if (isGo) {
    soundManager.playGo();
    showStamp("GO", "go-stamp");
    player.goCount += 1;
    // 고를 한 뒤에는 현재 점수에서 1점을 더 따야 다시 고/스톱 선택 가능
    player.goDecisionRawTarget = player.score + 1;
    updatePlayerScore(player, game.players[1 - game.turn]);
    logLine(`${player.name}: 고! (누적 ${player.goCount})`);
    speak("고");
  } else {
    soundManager.playStop();
    showStamp("STOP", "stop-stamp");
    player.goDecisionRawTarget = WIN_THRESHOLD;
    logLine(`${player.name}: 스톱 선언`);
    speak("스톱");
    endGame(player, "", player.stopScore);
  }
}

function endByDeck() {
  if (game.gameOver) return;

  const p0 = game.players[0];
  const p1 = game.players[1];
  updatePlayerScore(p0, p1);
  updatePlayerScore(p1, p0);

  const p0Final = p0.stopScore || 0;
  const p1Final = p1.stopScore || 0;

  if (p0Final < WIN_THRESHOLD && p1Final < WIN_THRESHOLD) {
    game.gameOver = true;
    clearReminder();
    el.statusText.textContent = "나가리: 양쪽 모두 7점 미만";
    logLine("나가리! 묻고 더블로 가?");
    soundManager.playLose();

    showNagariModal();
    render();
    return;
  }

  if (p0Final > p1Final) {
    endGame(p0, "더미 소진으로 라운드 종료", p0Final);
  } else if (p1Final > p0Final) {
    endGame(p1, "더미 소진으로 라운드 종료", p1Final);
  } else {
    game.gameOver = true;
    clearReminder();
    el.statusText.textContent = "무승부 (더미 소진)";
    logLine("무승부");
    soundManager.playLose();
  }
}

function endGame(winner, reason = "", finalScoreOverride = null) {
  game.gameOver = true;
  clearReminder();

  const loser = game.players.find((p) => p.id !== winner.id);
  const finalScore = finalScoreOverride ?? winner.score;
  el.statusText.textContent = `${winner.name} 승리! 최종 ${finalScore}점`;
  showResultOverlay(winner, finalScore);
  if (reason) {
    logLine(reason);
  }
  logLine(`${winner.name} 승리 (${finalScore}점 vs ${loser.score}점)`);
  render();
}

function showResultOverlay(winner, finalScore) {
  if (!el.resultModal) return;
  el.resultTitle.textContent = "게임 종료";
  el.resultWinner.textContent = `${winner.name} 승리`;
  el.resultFinalScore.textContent = `최종 정산 점수: ${finalScore}점`;
  el.resultModal.classList.remove("hidden");
  if (winner.id === "human") {
    soundManager.playWin();
    spawnConfetti(42);
  } else {
    soundManager.playLose();
  }
  el.restartBtn?.focus();
}

function hideResultOverlay() {
  if (!el.resultModal) return;
  el.resultModal.classList.add("hidden");
  if (el.resultConfetti) el.resultConfetti.innerHTML = "";
}

function showNagariModal() {
  if (!el.nagariModal) return;
  el.nagariModal.classList.remove("hidden");
}

function hideNagariModal() {
  if (!el.nagariModal) return;
  el.nagariModal.classList.add("hidden");
}

function handleNagariDecision(double) {
  hideNagariModal();
  let nextMult = game.currentMultiplier || 1;
  if (double) {
    nextMult *= 2;
    logLine(`묻고 더블로! 다음 판 x${nextMult}`);
    speak("묻고 더블로 가");
  } else {
    logLine(`그냥 진행. 다음 판 x${nextMult}`);
  }

  game.nextGameMultiplier = Math.min(nextMult, 16); // Cap at x16 for sanity? Or 8? Previous limit was 8. I'll stick to 8 or user request. User said double.
  // Actually previous code capped at 8. Let's cap at 16 or just allow it. The request didn't specify a cap.
  // I will check if previous code had a cap. Yes `Math.min(nextMult, 8)`.
  // I'll keep the cap at 16 (since x8 -> x16 is possible).
  game.nextGameMultiplier = Math.min(nextMult, 16);

  // Preserve the starter
  game.forceNextTurn = game.initialTurn;

  // Restart game after short delay
  setTimeout(() => startGame(), 1500);
}

function spawnConfetti(count = 36) {
  if (!el.resultConfetti) return;
  el.resultConfetti.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const colors = ["#ffd867", "#ff7f7f", "#8fe6a2", "#79beff", "#f7c0ff", "#fff0a8"];
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("span");
    piece.className = "result-confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 420}ms`;
    piece.style.animationDuration = `${1300 + Math.floor(Math.random() * 900)}ms`;
    piece.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
    fragment.appendChild(piece);
  }
  el.resultConfetti.appendChild(fragment);
  setTimeout(() => {
    if (el.resultConfetti) el.resultConfetti.innerHTML = "";
  }, 2600);
}

function nextTurn() {
  game.turn = 1 - game.turn;
  runTurnLoop();
}

function updatePlayerScore(player, opponent = null) {
  if (player.isAI) {
    autoChooseNineAnimalForAI(player, opponent);
  }
  const detail = scoreDetailWithOption(player.captured, player.nineAnimalAsJunk);
  const rawScore = Math.max(0, Math.floor(detail.base));
  const settlement = calculateStopSettlement(player, detail, opponent);
  player.score = rawScore;
  player.stopScore = settlement.stopScore;
  player.settlementMods = settlement.mods;
  player.scoreDetail = detail;
}

function autoChooseNineAnimalForAI(player, opponent = null) {
  const hasNineAnimal = player.captured.some((c) => c.type === "animal" && c.month === 9);
  if (!hasNineAnimal) return;
  if (player.nineAnimalChoiceLocked) return;

  const asAnimalDetail = scoreDetailWithOption(player.captured, false);
  const asJunkDetail = scoreDetailWithOption(player.captured, true);

  const asAnimalSettlement = calculateStopSettlement(
    { ...player, goCount: player.goCount, shakeMultiplier: player.shakeMultiplier },
    asAnimalDetail,
    opponent
  ).stopScore;
  const asJunkSettlement = calculateStopSettlement(
    { ...player, goCount: player.goCount, shakeMultiplier: player.shakeMultiplier },
    asJunkDetail,
    opponent
  ).stopScore;

  if (asJunkSettlement > asAnimalSettlement) {
    player.nineAnimalAsJunk = true;
    player.nineAnimalChoiceLocked = true;
    return;
  }
  if (asAnimalSettlement > asJunkSettlement) {
    player.nineAnimalAsJunk = false;
    player.nineAnimalChoiceLocked = true;
    return;
  }

  // 동점이면 일반적으로 피(쌍피)로 운용
  player.nineAnimalAsJunk = true;
  player.nineAnimalChoiceLocked = true;
}

function calculateStopSettlement(player, detail, opponent = null) {
  let total = detail.base;
  const mods = [];

  if (player.goCount > 0) {
    total += player.goCount;
    mods.push(`고 ${player.goCount}회 +${player.goCount}`);
  }

  if (player.goCount >= 3) {
    // 맞고 고배수: 3고=2배, 4고=4배, 5고=8배 ...
    const goMult = getGoMultiplier(player.goCount);
    total *= goMult;
    mods.push(`${player.goCount}고 x${goMult}`);
  }

  if (player.shakeMultiplier > 1) {
    total *= player.shakeMultiplier;
    mods.push(`흔들기 x${player.shakeMultiplier}`);
  }

  if (opponent) {
    const opDetail = getOpponentDetailForPigbak(opponent);
    // 피박: 승자가 피 점수로 이겼고, 패자 피가 1~7장일 때 적용(0장은 면제)
    if (game.pigbakEnabled && detail.junkPoint > 0 && opDetail.junk > 0 && opDetail.junk <= 7) {
      total *= 2;
      mods.push("피박 x2");
    }
    if (detail.gwangPoint > 0 && detail.gwang >= 3 && opDetail.gwang === 0) {
      total *= 2;
      mods.push("광박 x2");
    }
    if (detail.animals >= 7) {
      total *= 2;
      mods.push("멍박 x2");
    }
  }

  if (game.currentMultiplier && game.currentMultiplier > 1) {
    total *= game.currentMultiplier;
    mods.push(`나가리판 x${game.currentMultiplier}`);
  }

  return {
    stopScore: Math.max(0, Math.floor(total)),
    mods
  };
}

function getOpponentDetailForPigbak(opponent) {
  const normal = scoreDetailWithOption(opponent.captured, opponent.nineAnimalAsJunk);
  const hasNineAnimal = opponent.captured.some((c) => c.type === "animal" && c.month === 9);
  if (!hasNineAnimal) return normal;

  const alt = scoreDetailWithOption(opponent.captured, true);
  // 상대가 질 때 피박을 면할 수 있으면 9월 열끗이를 피로 보내는 자동 처리
  if (normal.junk < 7 && alt.junk >= 7) {
    return alt;
  }
  return normal;
}

function getGoMultiplier(goCount) {
  if (goCount < 3) return 1;
  return 2 ** (goCount - 2);
}

function getNineAnimalComparison(player, opponent = null) {
  const hasNineAnimal = player.captured.some((c) => c.type === "animal" && c.month === 9);
  if (!hasNineAnimal) return null;

  const asAnimalDetail = scoreDetailWithOption(player.captured, false);
  const asJunkDetail = scoreDetailWithOption(player.captured, true);

  const asAnimalSettlement = calculateStopSettlement(player, asAnimalDetail, opponent).stopScore;
  const asJunkSettlement = calculateStopSettlement(player, asJunkDetail, opponent).stopScore;

  return {
    asAnimalDetail,
    asJunkDetail,
    asAnimalSettlement,
    asJunkSettlement
  };
}

function scoreDetail(cards) {
  return scoreDetailWithOption(cards, false);
}

function scoreDetailWithOption(cards, nineAnimalAsJunk = false) {
  let gwangCount = 0;
  let rainCount = 0;
  let animals = 0;
  let ribbons = 0;
  let nineAsJunk = 0;
  let junkFromCards = 0;
  let junkFromBonus = 0;
  const animalMonths = new Set();
  const ribbonMonths = new Set();

  for (let i = 0, len = cards.length; i < len; i++) {
    const c = cards[i];
    const type = c.type;
    if (type === "gwang") {
      gwangCount++;
      if (c.rain) rainCount++;
    } else if (type === "animal") {
      if (nineAnimalAsJunk && c.month === 9) {
        nineAsJunk++;
      } else {
        animals++;
        animalMonths.add(c.month);
      }
    } else if (type === "ribbon") {
      ribbons++;
      ribbonMonths.add(c.month);
    } else if (type === "junk") {
      junkFromCards += (c.junkValue || 1);
    } else if (type === "bonus") {
      junkFromBonus += (c.junkValue || 2);
    }
  }

  // 9월 열끗을 피로 보낼 때는 쌍피(2장)로 계산
  const nineAsJunkValue = nineAsJunk * 2;
  const junk = junkFromCards + junkFromBonus + nineAsJunkValue;
  const pureGwang = gwangCount - rainCount;

  let gwangPoint = 0;
  if (gwangCount >= 5) gwangPoint = 15;
  else if (gwangCount === 4) gwangPoint = 4;
  else if (gwangCount === 3) gwangPoint = rainCount > 0 ? 2 : 3;

  const hasHongdan = HONGDAN_MONTHS.every((m) => ribbonMonths.has(m));
  const hasCheongdan = CHEONGDAN_MONTHS.every((m) => ribbonMonths.has(m));
  const hasChodan = CHODAN_MONTHS.every((m) => ribbonMonths.has(m));
  const hasGodori = GODORI_MONTHS.every((m) => animalMonths.has(m));

  const ribbonYakPoint = (hasHongdan ? 3 : 0) + (hasCheongdan ? 3 : 0) + (hasChodan ? 3 : 0);
  const animalYakPoint = hasGodori ? 5 : 0;

  const animalBasePoint = animals >= 5 ? animals - 4 : 0;
  const ribbonBasePoint = ribbons >= 5 ? ribbons - 4 : 0;
  const animalPoint = animalBasePoint + animalYakPoint;
  const ribbonPoint = ribbonBasePoint + ribbonYakPoint;
  const junkPoint = junk >= 10 ? junk - 9 : 0;

  return {
    gwang: gwangCount,
    pureGwang,
    animals,
    ribbons,
    junk,
    gwangPoint,
    animalBasePoint,
    animalPoint,
    animalYakPoint,
    ribbonBasePoint,
    ribbonPoint,
    ribbonYakPoint,
    junkPoint,
    hasHongdan,
    hasCheongdan,
    hasChodan,
    hasGodori,
    base: gwangPoint + animalPoint + ribbonPoint + junkPoint
  };
}

function render() {
  const me = game.players[0];
  const ai = game.players[1];

  el.turnText.textContent = game.gameOver
    ? "게임 종료"
    : `현재 턴: ${game.players[game.turn].name}`;

  el.aiHandCount.textContent = `손패 ${ai.hand.length}장`;
  el.aiScore.textContent = formatScoreLine(ai);
  el.aiGo.textContent = `고 ${ai.goCount}회 | 흔들기 x${ai.shakenMonths.size}`;

  el.humanScore.textContent = formatScoreLine(me);
  el.humanGo.textContent = `고 ${me.goCount}회 | 흔들기 x${me.shakenMonths.size}`;

  if (el.mobileAiHandCount) el.mobileAiHandCount.textContent = `손패 ${ai.hand.length}장`;
  if (el.mobileAiScore) el.mobileAiScore.textContent = formatScoreLine(ai);
  if (el.mobileAiGo) el.mobileAiGo.textContent = `고 ${ai.goCount}회 | 흔들기 x${ai.shakenMonths.size}`;
  if (el.mobileHumanScore) el.mobileHumanScore.textContent = formatScoreLine(me);
  if (el.mobileHumanGo) el.mobileHumanGo.textContent = `고 ${me.goCount}회 | 흔들기 x${me.shakenMonths.size}`;

  el.deckCount.textContent = `${game.deck.length}장`;

  renderAIHand(ai.hand.length);
  renderHumanHand(me);
  renderTable();
  renderLastPlay(el.aiLastPlay, game.lastPlay.ai);
  renderLastPlay(el.humanLastPlay, game.lastPlay.human);
  renderCaptured(el.aiCapturedCards, ai);
  renderCaptured(el.humanCapturedCards, me);
  if (el.mobileAiCapturedCards) renderCaptured(el.mobileAiCapturedCards, ai);
  if (el.mobileHumanCapturedCards) renderCaptured(el.mobileHumanCapturedCards, me);
  renderPpukPiles();
  renderGoStopModal(me);

  const humanTurnActive = !game.gameOver && game.turn === 0 && !game.isAnimating;
  const aiTurnActive = !game.gameOver && game.turn === 1 && !game.isAnimating;
  el.humanLane?.classList.toggle("turn-active", humanTurnActive);
  el.aiLane?.classList.toggle("turn-active", aiTurnActive);
}

function renderAIHand(count) {
  el.aiHand.innerHTML = "";
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i += 1) {
    const node = document.createElement("div");
    node.className = "card";
    fragment.appendChild(node);
  }
  el.aiHand.appendChild(fragment);
}

function renderHumanHand(me) {
  el.humanHand.innerHTML = "";
  const fragment = document.createDocumentFragment();
  me.hand
    .slice()
    .sort((a, b) => a.month - b.month)
    .forEach((card) => {
      const cardNode = buildCardNode(card);
      cardNode.dataset.month = String(card.month);
      if (!game.gameOver && game.turn === 0 && !game.awaitingGoStop && !game.pendingChoice) {
        cardNode.classList.add("clickable");
        cardNode.tabIndex = 0;
        cardNode.role = "button";
        cardNode.ariaLabel = describeCard(card);

        cardNode.addEventListener("click", () => onHumanCardClick(card.id, cardNode));
        cardNode.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onHumanCardClick(card.id, cardNode);
          }
        });
      }
      fragment.appendChild(cardNode);
    });
  el.humanHand.appendChild(fragment);
}

function renderTable() {
  el.tableCards.innerHTML = "";
  const fragment = document.createDocumentFragment();
  game.table
    .slice()
    .sort((a, b) => a.month - b.month)
    .forEach((card) => {
      const node = buildCardNode(card);
      if (game.pendingChoice && game.pendingChoice.matches.includes(card.id)) {
        node.classList.add("clickable", "selected");
        node.tabIndex = 0;
        node.role = "button";
        node.ariaLabel = describeCard(card);

        node.addEventListener("click", () => onTableCardChoice(card.id));
        node.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTableCardChoice(card.id);
          }
        });
      }
      fragment.appendChild(node);
    });
  el.tableCards.appendChild(fragment);
}

function renderCaptured(cardsContainer, player) {
  cardsContainer.innerHTML = "";

  const groups = {
    gwang: [],
    animal: [],
    ribbon: [],
    junk: []
  };

  const sortFn = (a, b) => {
    if (a.type === "ribbon" && b.type === "ribbon") {
      return (RIBBON_KIND_ORDER[a.ribbonKind || "plain"] ?? 2) - (RIBBON_KIND_ORDER[b.ribbonKind || "plain"] ?? 2);
    }
    return a.month - b.month;
  };

  player.captured.forEach((card) => {
    if (card.type === "gwang") groups.gwang.push(card);
    else if (card.type === "animal") groups.animal.push(card);
    else if (card.type === "ribbon") groups.ribbon.push(card);
    else groups.junk.push(card);
  });

  const createGroupDiv = (cards, className) => {
    if (cards.length === 0) return null;
    const div = document.createElement("div");
    div.className = "captured-group " + className;
    cards.sort(sortFn).forEach((c) => div.appendChild(buildCardNode(c)));
    return div;
  };

  const gwangDiv = createGroupDiv(groups.gwang, "group-gwang");
  const animalDiv = createGroupDiv(groups.animal, "group-animal");
  const ribbonDiv = createGroupDiv(groups.ribbon, "group-ribbon");
  const junkDiv = createGroupDiv(groups.junk, "group-junk");

  if (gwangDiv) cardsContainer.appendChild(gwangDiv);
  if (animalDiv) cardsContainer.appendChild(animalDiv);
  if (ribbonDiv) cardsContainer.appendChild(ribbonDiv);
  if (junkDiv) cardsContainer.appendChild(junkDiv);
}

function renderLastPlay(container, card) {
  container.innerHTML = "";
  if (!card) {
    const placeholder = document.createElement("p");
    placeholder.textContent = "아직 없음";
    container.appendChild(placeholder);
    return;
  }
  container.appendChild(buildCardNode(card));
}

function renderPpukPiles() {
  if (!el.ppukPiles) return;
  el.ppukPiles.innerHTML = "";
  const fragment = document.createDocumentFragment();
  game.ppukPiles.forEach((pile) => {
    const stack = document.createElement("div");
    stack.className = "ppuk-stack";
    pile.cards.slice(0, 4).forEach((card, idx) => {
      const node = buildCardNode(card);
      node.style.transform = `translate(${idx * 2}px, ${idx * 2}px)`;
      stack.appendChild(node);
    });
    fragment.appendChild(stack);
  });
  el.ppukPiles.appendChild(fragment);
}

function buildCardNode(card) {
  const node = document.createElement("div");
  node.className = "card";
  node.dataset.id = card.id;
  const badgeLabel = card.type === "junk" && (card.junkValue || 1) >= 2 ? "쌍피" : TYPE_LABEL[card.type];

  if (card.type === "bonus") {
    node.classList.add("bonus-card");
    const bonusAsset = card.asset || "";
    node.innerHTML = `
      <div class="card-img" style="${bonusAsset ? `background-image:url('${bonusAsset}'); background-size:cover; background-position:center;` : ""}"></div>
      <div class="card-month">보너스</div>
      <div class="card-badge">${badgeLabel}</div>
    `;
    return node;
  }

  const col = typeof card.spriteCol === "number" ? card.spriteCol : (card.month - 1) % 3;
  const row = typeof card.spriteRow === "number" ? card.spriteRow : Math.floor((card.month - 1) / 3);
  const xPos = `${(col / 11) * 100}%`;
  const yPos = `${(row / 3) * 100}%`;
  const cardAsset = card.asset || "";

  node.innerHTML = `
    <div class="card-img" style="${cardAsset ? `background-image:url('${cardAsset}'); background-size:cover; background-position:center;` : `background-position:${xPos} ${yPos}` }"></div>
    <div class="card-month">${card.month}월</div>
    <div class="card-badge">${badgeLabel}</div>
  `;

  return node;
}

function setLastPlay(playerId, card) {
  game.lastPlay[playerId] = { ...card };
}

async function animatePlayCard(card, sourceNode, fromAI) {
  if (!el.tableCards) return;
  game.isAnimating = true;
  soundManager.playSlide();

  const flyNode = buildCardNode(card);
  flyNode.classList.add("card-fly");

  const sourceRect = sourceNode
    ? sourceNode.getBoundingClientRect()
    : fromAI
      ? el.aiHand.getBoundingClientRect()
      : el.humanHand.getBoundingClientRect();

  const tableRect = el.tableCards.getBoundingClientRect();
  const { w: cardW, h: cardH } = getCardSize();
  const srcX = sourceRect.left + sourceRect.width / 2 - cardW / 2;
  const srcY = sourceRect.top + sourceRect.height / 2 - cardH / 2;
  const target = getAnimationTargetNearMatch(card, sourceRect);
  const dstX = target?.x ?? tableRect.left + tableRect.width / 2 - cardW / 2;
  const dstY = target?.y ?? tableRect.top + tableRect.height / 2 - cardH / 2;

  flyNode.style.left = `${srcX}px`;
  flyNode.style.top = `${srcY}px`;
  // Width/height handled by CSS class .card

  if (fromAI) {
    flyNode.classList.add("hand-hidden");
  }

  document.body.appendChild(flyNode);

  await nextFrame();
  const dx = dstX - srcX;
  const dy = dstY - srcY;
  flyNode.style.transform = `translate(${dx}px, ${dy}px)`;
  flyNode.style.opacity = "0.88";

  await wait(ANIM.playMoveMs);
  flyNode.remove();
  soundManager.playStick();

  if (fromAI) {
    // AI 카드는 테이블 도착 시점에 앞면 공개
    setLastPlay("ai", card);
  }

  el.tableCards.classList.add("flash");
  setTimeout(() => el.tableCards.classList.remove("flash"), ANIM.tableFlashMs);
  game.isAnimating = false;
  render();
}

async function showShakeReveal(player, month) {
  game.isAnimating = true;
  const cards = player.hand.filter((c) => c.month === month).slice(0, 3);
  if (cards.length === 0) {
    game.isAnimating = false;
    return;
  }

  if (!player.isAI) {
    render();
    const nodes = [...el.humanHand.querySelectorAll(`.card[data-month="${month}"]`)];
    nodes.forEach((n) => n.classList.add("shake-mark"));
    await wait(ANIM.humanShakeMs);
    nodes.forEach((n) => n.classList.remove("shake-mark"));
  } else {
    const panel = document.createElement("div");
    panel.className = "shake-reveal";
    cards.forEach((c) => panel.appendChild(buildCardNode(c)));
    document.body.appendChild(panel);
    await nextFrame();
    panel.classList.add("on");
    await wait(ANIM.aiShakeMs);
    panel.classList.remove("on");
    await wait(220);
    panel.remove();
  }

  game.isAnimating = false;
  render();
}

async function animateDeckDraw(card) {
  if (!el.tableCards || !el.deckCount) return;
  game.isAnimating = true;
  soundManager.playSlide();

  const flyNode = buildCardNode(card);
  flyNode.classList.add("card-fly", "deck-draw");

  const deckRect = el.deckCount.getBoundingClientRect();
  const tableRect = el.tableCards.getBoundingClientRect();
  const { w: cardW, h: cardH } = getCardSize();

  const srcX = deckRect.left + deckRect.width / 2 - cardW / 2;
  const srcY = deckRect.top + deckRect.height / 2 - cardH / 2;
  const target = getAnimationTargetNearMatch(card);
  const endX = target?.x ?? tableRect.left + tableRect.width / 2 - cardW / 2;
  const endY = target?.y ?? tableRect.top + tableRect.height / 2 - cardH / 2;
  const midX = srcX + (endX - srcX) * 0.55;
  const midY = srcY + (endY - srcY) * 0.55;

  flyNode.style.left = `${srcX}px`;
  flyNode.style.top = `${srcY}px`;
  // Width/height handled by CSS class .card
  flyNode.classList.add("hand-hidden");
  document.body.appendChild(flyNode);

  await nextFrame();
  flyNode.style.transform = `translate(${midX - srcX}px, ${midY - srcY}px)`;
  await wait(ANIM.deckToMidMs);
  flyNode.classList.remove("hand-hidden");
  flyNode.classList.add("flip-open");
  await wait(ANIM.deckFlipMs);

  flyNode.style.transform = `translate(${endX - srcX}px, ${endY - srcY}px)`;
  flyNode.style.opacity = "0.9";
  await wait(ANIM.deckToTableMs);
  flyNode.remove();
  soundManager.playStick();

  el.tableCards.classList.add("flash");
  setTimeout(() => el.tableCards.classList.remove("flash"), ANIM.tableFlashMs);
  game.isAnimating = false;
}

function getAnimationTargetNearMatch(card, sourceRect = null) {
  if (!card || !el.tableCards) return null;
  const matches = game.table.filter((t) => t.month === card.month);
  if (!matches.length) return null;

  const candidates = matches
    .map((m) => {
      const node = el.tableCards.querySelector(`.card[data-id="${m.id}"]`);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      const x = r.left + 10;
      const y = r.top - 10;
      if (!sourceRect) return { x, y, dist: 0 };
      const sx = sourceRect.left + sourceRect.width / 2;
      const sy = sourceRect.top + sourceRect.height / 2;
      const tx = r.left + r.width / 2;
      const ty = r.top + r.height / 2;
      const dist = (sx - tx) ** 2 + (sy - ty) ** 2;
      return { x, y, dist };
    })
    .filter(Boolean);

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.dist - b.dist);
  return { x: candidates[0].x, y: candidates[0].y };
}

function drawToHand(player) {
  if (game.deck.length === 0) {
    endByDeck();
    return;
  }
  const drawn = game.deck.pop();
  player.hand.push(drawn);
  if (player.isAI) {
    logLine(`${player.name}: 보너스피로 패 1장 보충`);
  } else {
    logLine("나: 보너스피로 손패 1장 보충");
  }
}

function processDealtTableBonus() {
  const starter = game.players[game.turn];
  if (!starter) return;

  while (true) {
    const idx = game.table.findIndex((c) => c.type === "bonus");
    if (idx === -1) break;
    const [bonus] = game.table.splice(idx, 1);
    starter.captured.push(bonus);
    logLine(`초기 보너스피: ${starter.name} 획득`);
    if (game.deck.length === 0) break;
    const refill = game.deck.pop();
    game.table.push(refill);
  }

  game.players.forEach((p) => updatePlayerScore(p));
}

function markPpukIfNeeded(player, playedCard, handResult, deckOutcome) {
  const state = game.turnState;
  if (!state || !playedCard || !handResult || !deckOutcome || deckOutcome.deckEmpty) return;
  const handMatched = !handResult.laidToTable;
  const deckNoMatch = Boolean(deckOutcome.placement?.laidToTable);
  const sameMonth = deckOutcome.drawn?.month === playedCard.month;
  const bonusBuffer = deckOutcome.bonusBuffer || [];

  if (handMatched && deckNoMatch && sameMonth) {
    state.ppuk = true;
    const pickedTableCard = (handResult.captured || []).find(
      (c) => c.id !== playedCard.id && c.month === playedCard.month
    );

    const ppukCards = [playedCard];
    if (pickedTableCard) ppukCards.push(pickedTableCard);
    ppukCards.push(deckOutcome.drawn);
    if (bonusBuffer.length) {
      ppukCards.push(...bonusBuffer);
      state.deckBonusBuffer = [];
    }

    removeCapturedCards(player, [playedCard.id, pickedTableCard?.id].filter(Boolean));
    removeTableCards([deckOutcome.drawn.id]);
    game.ppukPiles.push({
      id: `ppuk-${Date.now()}-${getSecureRandom().toString(16).slice(2)}`,
      month: playedCard.month,
      cards: ppukCards
    });

    logLine(`${MONTH_NAMES[playedCard.month] || playedCard.month + "월"} 뻑!`);
    soundManager.playWarning();
    speak("앗");
    return;
  }

  if (bonusBuffer.length) {
    takeCards(player, bonusBuffer);
    state.deckBonusBuffer = [];
    logLine(`${player.name}: 더미 보너스피 ${bonusBuffer.length}장 획득`);
  }
}

function claimPpukPileByMonth(player, month) {
  const matched = game.ppukPiles.filter((p) => p.month === month);
  if (!matched.length) return [];
  const opponent = game.players.find((p) => p.id !== player.id);
  const collected = [];

  matched.forEach((pile) => {
    collected.push(...pile.cards);
    takeCards(player, pile.cards);
    stealJunkFromOpponent(player, 1, opponent);
    logLine(`${player.name}: 뻑 더미 회수 + 상대 피 1장`);
  });
  game.ppukPiles = game.ppukPiles.filter((p) => p.month !== month);
  speak("앗싸~ 피 한장 내놔");
  return collected;
}

function finalizeBonusAfterTurn(player, opponent) {
  const state = game.turnState;
  if (!state || state.playerId !== player.id) return;
  if (!state.usedBonusCards.length) return;

  if (state.ppuk) {
    player.buriedBonus = (player.buriedBonus || 0) + state.usedBonusCards.length;
    logLine(`${player.name}: 뻑으로 보너스피 ${state.usedBonusCards.length}장 묻힘`);
    state.usedBonusCards = [];
    state.pendingSteal = 0;
    return;
  }

  player.captured.push(...state.usedBonusCards);
  if (state.pendingSteal > 0) {
    stealJunkFromOpponent(player, state.pendingSteal, opponent);
  }
  state.usedBonusCards = [];
  state.pendingSteal = 0;
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeCard(card) {
  if (card.type === "bonus") return "보너스피";
  if (card.type === "junk" && (card.junkValue || 1) >= 2) return `${card.month}월 쌍피`;
  return `${card.month}월 ${TYPE_LABEL[card.type]}`;
}

function formatScoreLine(player) {
  const d = player.scoreDetail || {};
  const nineTag = player.nineAnimalAsJunk ? "9열끗:피" : "9열끗:열끗";
  const yaks = [];
  if (d.hasGodori) yaks.push("고도리");
  if (d.hasHongdan) yaks.push("홍단");
  if (d.hasCheongdan) yaks.push("청단");
  if (d.hasChodan) yaks.push("초단");
  const animalBreakdown = `${d.animalPoint || 0}점(기본 ${d.animalBasePoint || 0} + 약 ${d.animalYakPoint || 0})`;
  const ribbonBreakdown = `${d.ribbonPoint || 0}점(기본 ${d.ribbonBasePoint || 0} + 약 ${d.ribbonYakPoint || 0})`;
  const yakText = yaks.length ? `, 약: ${yaks.join("/")}` : "";
  return `점수 ${player.score} (스톱정산 ${player.stopScore || 0}) (광 ${d.gwang || 0}/${d.gwangPoint || 0}점, 열끗 ${d.animals || 0}/${animalBreakdown}, 띠 ${d.ribbons || 0}/${ribbonBreakdown}, 피 ${d.junk || 0}/${d.junkPoint || 0}점${yakText}, ${nineTag})`;
}

function maybeAskNineAnimalChoice(player, opponent) {
  const hasNineAnimal = player.captured.some((c) => c.type === "animal" && c.month === 9);
  if (!hasNineAnimal) return;
  if (player.nineAnimalChoiceLocked) return;
  if (game.awaitingGoStop) return;

  const asAnimalDetail = scoreDetailWithOption(player.captured, false);
  const asJunkDetail = scoreDetailWithOption(player.captured, true);
  const asAnimalSettlement = calculateStopSettlement(
    { ...player, goCount: player.goCount, shakeMultiplier: player.shakeMultiplier },
    asAnimalDetail,
    opponent
  ).stopScore;
  const asJunkSettlement = calculateStopSettlement(
    { ...player, goCount: player.goCount, shakeMultiplier: player.shakeMultiplier },
    asJunkDetail,
    opponent
  ).stopScore;

  const canStopWithJunk = asJunkDetail.base >= WIN_THRESHOLD;
  if (!canStopWithJunk) return;
  if (asAnimalSettlement === asJunkSettlement && player.nineAnimalAsJunk) return;

  const diff = asJunkSettlement - asAnimalSettlement;
  const msg =
    `9월 열끗이를 피로 보낼까요?\n` +
    `열끗 유지: 스톱정산 ${asAnimalSettlement}점\n` +
    `피 처리: 스톱정산 ${asJunkSettlement}점\n` +
    `차이: ${diff >= 0 ? "+" : ""}${diff}점`;
  const chooseJunk = confirm(msg);
  player.nineAnimalAsJunk = chooseJunk;
  player.nineAnimalChoiceLocked = true;
}

function logLine(text) {
  if (!el.logList) {
    console.log(text);
    return;
  }
  const li = document.createElement("li");
  li.textContent = text;
  el.logList.appendChild(li);
  while (el.logList.children.length > 40) {
    el.logList.removeChild(el.logList.firstChild);
  }
  el.logList.scrollTop = el.logList.scrollHeight;
}

function scheduleReminder() {
  clearReminder();
  game.reminderTimer = setTimeout(() => {
    if (!game.gameOver && game.turn === 0 && !game.awaitingGoStop && !game.isAnimating) {
      speak(game.pendingChoice ? "빨리 골라" : "빨리 좀 해");
      startHumanCountdown();
    }
  }, ANIM.reminderMs);
}

function clearReminder() {
  if (game.reminderTimer) {
    clearTimeout(game.reminderTimer);
    game.reminderTimer = null;
  }
  if (game.actionTimeoutTimer) {
    clearTimeout(game.actionTimeoutTimer);
    game.actionTimeoutTimer = null;
  }
  if (game.countdownTimer) {
    clearInterval(game.countdownTimer);
    game.countdownTimer = null;
  }
  game.countdownSeconds = 0;
  hideCountdown();
}

function startHumanCountdown() {
  if (game.gameOver || game.turn !== 0 || game.awaitingGoStop || game.isAnimating) return;
  game.countdownSeconds = Math.floor(ANIM.timeoutAfterReminderMs / 1000);
  showCountdown(game.countdownSeconds);
  game.countdownTimer = setInterval(() => {
    game.countdownSeconds -= 1;
    if (game.countdownSeconds <= 0) {
      hideCountdown();
      if (game.countdownTimer) clearInterval(game.countdownTimer);
      game.countdownTimer = null;
      return;
    }
    showCountdown(game.countdownSeconds);
  }, 1000);

  game.actionTimeoutTimer = setTimeout(() => {
    clearReminder();
    autoPlayHumanTurn();
  }, ANIM.timeoutAfterReminderMs);
}

function showCountdown(num) {
  if (!el.turnCountdown) return;
  el.turnCountdown.classList.remove("hidden");
  el.turnCountdown.textContent = String(num);
}

function hideCountdown() {
  if (!el.turnCountdown) return;
  el.turnCountdown.classList.add("hidden");
  el.turnCountdown.textContent = "";
}

function renderGoStopModal(me) {
  if (!el.goStopModal) return;
  const open = game.awaitingGoStop && game.turn === 0 && !game.gameOver;
  el.goStopModal.classList.toggle("hidden", !open);
  if (!open) return;

  const d = me.scoreDetail || {};
  const mods = me.settlementMods || [];

  el.goStopTitle.textContent = "고 / 스톱 결정";
  el.goStopScore.textContent = `현재 진행 점수 ${me.score}점 | 스톱 시 최종 ${me.stopScore || 0}점`;
  const yaks = [];
  if (d.hasGodori) yaks.push("고도리");
  if (d.hasHongdan) yaks.push("홍단");
  if (d.hasCheongdan) yaks.push("청단");
  if (d.hasChodan) yaks.push("초단");
  const animalBreakdown = `${d.animalPoint || 0}점(기본 ${d.animalBasePoint || 0} + 약 ${d.animalYakPoint || 0})`;
  const ribbonBreakdown = `${d.ribbonPoint || 0}점(기본 ${d.ribbonBasePoint || 0} + 약 ${d.ribbonYakPoint || 0})`;
  el.goStopDetail.textContent =
    `광 ${d.gwang || 0}/${d.gwangPoint || 0}점, 열끗 ${d.animals || 0}/${animalBreakdown}, 띠 ${d.ribbons || 0}/${ribbonBreakdown}, 피 ${d.junk || 0}/${d.junkPoint || 0}점` +
    (yaks.length ? `, 약: ${yaks.join("/")}` : "") +
    (mods.length ? ` | 배수: ${mods.join(", ")}` : "");
}

function autoPlayHumanTurn() {
  if (game.gameOver || game.turn !== 0 || game.awaitingGoStop || game.isAnimating) return;
  if (game.pendingChoice) {
    const choices = game.pendingChoice.matches;
    const pick = choices[Math.floor(getSecureRandom() * choices.length)];
    if (typeof pick === "number") {
      onTableCardChoice(pick);
    }
    return;
  }

  const me = game.players[0];
  const autoCard = chooseAutoCardForHuman(me);
  if (!autoCard) return;
  const sourceNode = el.humanHand.querySelector(`.card[data-id="${autoCard.id}"]`) || null;
  onHumanCardClick(autoCard.id, sourceNode);
}

function chooseAutoCardForHuman(player) {
  const scored = player.hand.map((card) => {
    const matches = game.table.filter((t) => t.month === card.month).length;
    const bonus = card.type === "bonus" ? HUMAN_AUTO_BONUS_PRIORITY : 0;
    return {
      card,
      score: matches * AI_SCORE_MATCH_MULTIPLIER + bonus + Math.random() * AI_SCORE_RANDOM_WEIGHT
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.card || null;
}

function stealJunkFromOpponent(player, count, explicitOpponent = null) {
  const opponent = explicitOpponent || game.players.find((p) => p.id !== player.id);
  if (!opponent || count <= 0) return;

  for (let i = 0; i < count; i += 1) {
    // Priority 1: Single Junk (value 1)
    let idx = opponent.captured.findIndex(
      (c) => c.type === "junk" && (c.junkValue === 1 || c.junkValue === undefined)
    );

    // Priority 2: Double Junk (value >= 2 or bonus)
    if (idx === -1) {
      idx = opponent.captured.findIndex(
        (c) => c.type === "bonus" || (c.type === "junk" && c.junkValue >= 2)
      );
    }

    if (idx === -1) break;
    const [stolen] = opponent.captured.splice(idx, 1);
    player.captured.push(stolen);
    logLine(`${player.name}: 보너스피로 ${opponent.name}의 피 1장 가져옴`);
  }
}

function speak(text) {
  if (!game.voiceEnabled || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ko-KR";
  utter.rate = 1;
  utter.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const ko = chooseKoreanVoice(voices);
  if (ko) utter.voice = ko;

  const p = getSpeechProfile(text);
  utter.rate = p.rate;
  utter.pitch = p.pitch;
  utter.volume = p.volume;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function chooseKoreanVoice(voices) {
  const koVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("ko"));
  if (!koVoices.length) return null;
  const preferred = ["Yuna", "Siri", "Narae", "Google", "Microsoft"];
  for (const key of preferred) {
    const found = koVoices.find((v) => v.name.includes(key));
    if (found) return found;
  }
  return koVoices[0];
}

function getSpeechProfile(text) {
  if (text.includes("앗싸")) return { rate: 1.06, pitch: 1.28, volume: 1 };
  if (text.includes("앗")) return { rate: 1.18, pitch: 1.32, volume: 1 };
  if (text.includes("흔들어")) return { rate: 1.04, pitch: 1.2, volume: 1 };
  if (text.includes("고")) return { rate: 1.08, pitch: 1.18, volume: 1 };
  if (text.includes("스톱")) return { rate: 0.94, pitch: 0.9, volume: 1 };
  if (text.includes("빨리")) return { rate: 1.2, pitch: 1.08, volume: 1 };
  if (text.includes("묻고")) return { rate: 1.05, pitch: 1.05, volume: 1 };
  return { rate: 1.0, pitch: 1.0, volume: 1 };
}

function getSecureRandom() {
  if (typeof window !== "undefined" && (window.crypto || window.msCrypto)) {
    const array = new Uint32Array(1);
    (window.crypto || window.msCrypto).getRandomValues(array);
    return array[0] / 4294967296;
  }
  if (typeof require !== "undefined") {
    try {
      const crypto = require("crypto");
      return crypto.randomBytes(4).readUInt32LE(0) / 4294967296;
    } catch (e) {
      console.warn("Crypto module not available, falling back to Math.random");
      return Math.random();
    }
  }
  return Math.random();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(getSecureRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function checkChongTong() {
  for (const p of game.players) {
    const counts = {};
    for (const c of p.hand) {
      counts[c.month] = (counts[c.month] || 0) + 1;
    }
    for (const m in counts) {
      if (counts[m] === 4) {
        return { winner: p, month: m };
      }
    }
  }
  return null;
}

function endGameWithChongTong(res) {
  const winner = res.winner;
  const baseScore = 10;
  const mult = game.currentMultiplier || 1;
  const finalScore = baseScore * mult;

  // 총통은 기본 10점에 배수만 적용 (고/스톱 없음)
  winner.score = baseScore;
  winner.stopScore = finalScore;

  // 상대방 점수 0 처리
  const loser = game.players.find(p => p.id !== winner.id);
  loser.score = 0;
  loser.stopScore = 0;

  endGame(winner, `총통 (${res.month}월 4장) 승리`, finalScore);
}

if (typeof document !== "undefined") {
  startGame();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculateStopSettlement,
    getGoMultiplier,
    getOpponentDetailForPigbak,
    scoreDetailWithOption,
    scoreDetail,
    HONGDAN_MONTHS,
    CHEONGDAN_MONTHS,
    CHODAN_MONTHS,
    GODORI_MONTHS,
    getSecureRandom,
    shuffle,
    stealJunkFromOpponent
  };
}

function showMatchEffect(cardIds) {
  if (!el.tableCards) return;
  cardIds.forEach(id => {
    const node = el.tableCards.querySelector('.card[data-id="' + id + '"]');
    if (!node) return;
    const rect = node.getBoundingClientRect();

    const ghost = node.cloneNode(true);
    ghost.className = "card match-effect";
    ghost.style.position = "fixed";
    ghost.style.left = rect.left + "px";
    ghost.style.top = rect.top + "px";
    ghost.style.margin = "0";
    ghost.style.zIndex = "1000";
    ghost.style.pointerEvents = "none";

    document.body.appendChild(ghost);
    setTimeout(() => ghost.remove(), 450);
  });
}

function showFloatingText(text, targetNode, isNegative) {
  if (!targetNode) return;
  const rect = targetNode.getBoundingClientRect();
  const div = document.createElement("div");
  div.className = "floating-text" + (isNegative ? " negative" : "");
  div.textContent = text;

  // Center roughly
  div.style.left = (rect.left + rect.width / 2) + "px";
  div.style.top = (rect.top + rect.height / 2) + "px";

  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1300);
}

function showStamp(text, className) {
  const div = document.createElement("div");
  div.className = className;
  div.textContent = text;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2500);
}

function getCardSize() {
  if (typeof getComputedStyle === "undefined" || typeof document === "undefined") {
    return { w: 64, h: 96 };
  }
  const style = getComputedStyle(document.documentElement);
  const w = parseFloat(style.getPropertyValue("--card-w")) || 64;
  const h = parseFloat(style.getPropertyValue("--card-h")) || 96;
  return { w, h };
}
