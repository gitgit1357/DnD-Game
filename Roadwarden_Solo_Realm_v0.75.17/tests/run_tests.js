const vm = require("vm");
const { loadGameContext } = require("./harness.js");
const sandbox = loadGameContext();
const x = sandbox.__exposed;

function testHero(overrides = {}) {
  return Object.assign({
    name: "Test Hero", class: "Warrior", level: 1, ancestry: "Human",
    stats: { STR: 12, DEX: 12, CON: 12, INT: 10, WIS: 10, CHA: 10 },
    hp: 13, maxHp: 13, equipment: { weapon: "Longsword", armor: "Chain Mail", offhand: "No Off-Hand" }
  }, overrides);
}

let pass = 0, fail = 0;
const results = [];
function check(name, fn) {
  try {
    const ok = fn();
    if (ok) { pass++; results.push(`PASS: ${name}`); }
    else { fail++; results.push(`FAIL: ${name}`); }
  } catch (e) {
    fail++;
    results.push(`FAIL: ${name} (threw: ${e.message})`);
  }
}

// ---------- Version sync ----------
check("GAME_VERSION constant is set and non-empty", () => typeof x.GAME_VERSION === "string" && x.GAME_VERSION.length > 0);
check("freshState().version matches GAME_VERSION", () => {
  const s = x.freshState();
  return s.version === x.GAME_VERSION;
});
check("normalizeState() stamps state.version to GAME_VERSION (not stale 0.70.0)", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.version = "some-legacy-value";
  x.setState(s);
  x.normalizeState();
  return x.getState().version === x.GAME_VERSION;
});
check("normalizeState() is a no-op before a hero exists (uncreated character)", () => {
  const s = x.freshState();
  s.hero = null;
  s.version = "untouched";
  x.setState(s);
  x.normalizeState();
  return x.getState().version === "untouched";
});
check("document.title reflects GAME_VERSION", () => {
  return sandbox.document.title === `Roadwarden: Solo Realm v${x.GAME_VERSION}`;
});

// ---------- Arrival Engine ----------
check("ARRIVAL_STAGES has the expected 7-stage sequence", () => {
  const expected = ["fade","title","map","approach","narration","choice","outcome"];
  return JSON.stringify(x.ARRIVAL_STAGES) === JSON.stringify(expected);
});
check("ArrivalEngine.choose('help') records choice and jumps to outcome stage", () => {
  const s = x.freshState();
  x.setState(s);
  x.ArrivalEngine.active = true;
  x.ArrivalEngine.choose("help");
  const st = x.getState();
  return st.flags.arrivalChoice === "help"
    && st.flags.arrivalConsequenceApplied === false
    && x.ArrivalEngine.stageIndex === x.ARRIVAL_STAGES.indexOf("outcome");
});
check("ArrivalEngine.skip() marks arrivalChoice as 'skipped'", () => {
  const s = x.freshState();
  x.setState(s);
  x.ArrivalEngine.active = true;
  x.ArrivalEngine.skip();
  return x.getState().flags.arrivalChoice === "skipped";
});

// ---------- Arrival consequence application ----------
check("'help' choice grants reputation, karma, +2 hours, Bandage, Trade Token, Greenmarch rep", () => {
  const s = x.freshState();
  s.flags = { arrivalChoice: "help" };
  s.hour = 8;
  x.setState(s);
  x.applyArrivalConsequence();
  const st = x.getState();
  return st.reputation === 1
    && st.karma === 1
    && st.hour === 10
    && (st.inventory["Bandage"] || 0) >= 1
    && (st.inventory["Merchant's Trade Token"] || 0) === 1
    && typeof st.world.reputations.greenmarch === "object"
    && st.world.reputations.greenmarch.renown === 1
    && st.flags.merchantRescued === true;
});
check("v0.75.3: 'help' choice reputation update doesn't corrupt greenmarch's reputation object into a bare number (the actual bug found in real play)", () => {
  const s = x.freshState();
  s.flags = { arrivalChoice: "help" };
  s.hour = 8;
  x.setState(s);
  x.applyArrivalConsequence();
  const st = x.getState();
  const rep = st.world.reputations.greenmarch;
  return typeof rep === "object" && rep !== null
    && Number.isFinite(rep.renown) && Number.isFinite(rep.fear)
    && Number.isFinite(rep.peakRenown);
});
check("v0.75.3: a pre-corrupted (bare-number) reputation entry self-heals via ensureWorldState() instead of poisoning renown/fear checks with NaN", () => {
  const s = x.freshState();
  s.world = s.world || {};
  s.world.reputations = { greenmarch: 3 }; // simulates a save hit by the old (pre-v0.75.3) bug
  x.setState(s);
  x.ensureWorldState();
  const rep = x.getState().world.reputations.greenmarch;
  const renown = x.effectiveRenown("greenmarch");
  const fear = x.effectiveFear("greenmarch");
  return typeof rep === "object" && rep !== null
    && rep.renown === 3 && rep.fear === 0
    && Number.isFinite(renown) && Number.isFinite(fear);
});
check("v0.75.3: adjustReputation() on greenmarch correctly increments the existing renown object rather than replacing it with a number", () => {
  const s = x.freshState();
  x.setState(s);
  x.adjustReputation(1, 0, "greenmarch", 0, "");
  const rep = x.regionRep("greenmarch");
  return typeof rep === "object" && rep.renown === 1
    && Number.isFinite(x.effectiveRenown("greenmarch"));
});
check("'continue' choice records roadside-disappearances lead without spending time", () => {
  const s = x.freshState();
  s.flags = { arrivalChoice: "continue" };
  s.hour = 8;
  x.setState(s);
  x.applyArrivalConsequence();
  const st = x.getState();
  return st.flags.roadsideDisappearancesLead === true
    && st.flags.arrivedBeforeStorm === true
    && st.hour === 8;
});
check("applyArrivalConsequence() is idempotent (guarded by arrivalConsequenceApplied)", () => {
  const s = x.freshState();
  s.flags = { arrivalChoice: "help", arrivalConsequenceApplied: true };
  s.reputation = 0;
  x.setState(s);
  x.applyArrivalConsequence();
  return x.getState().reputation === 0; // must NOT re-apply
});

// ---------- Provisions / food rebalance ----------
check("ensureProvisionStock() seeds stock when market predates the food rebalance (0/undefined)", () => {
  const s = x.freshState();
  s.town = { market: { stock: {}, funds: 50 } };
  x.setState(s);
  const stock = x.ensureProvisionStock(18);
  return stock >= 18 && stock <= 30 && x.getState().town.market.stock["Rations"] === stock;
});
check("ensureProvisionStock() leaves existing positive stock untouched", () => {
  const s = x.freshState();
  s.town = { market: { stock: { Rations: 7 }, funds: 50 } };
  x.setState(s);
  const stock = x.ensureProvisionStock(18);
  return stock === 7;
});
check("buyProvisionBundle() moves stock from market to hero inventory and spends coin", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { market: { stock: { Rations: 10 }, funds: 0 } };
  s.gold = 5; s.silver = 0;
  s.inventory = {};
  x.setState(s);
  const before = x.getState().town.market.stock["Rations"];
  x.buyProvisionBundle(3, "market");
  const st = x.getState();
  return st.town.market.stock["Rations"] === before - 3
    && (st.inventory["Rations"] || 0) === 3;
});
check("buyProvisionBundle() refuses purchase beyond available stock", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { market: { stock: { Rations: 2 }, funds: 0 } };
  s.gold = 5; s.silver = 0;
  s.inventory = {};
  x.setState(s);
  x.buyProvisionBundle(5, "market");
  const st = x.getState();
  return (st.inventory["Rations"] || 0) === 0 && st.town.market.stock["Rations"] === 2;
});
check("forage() is exposed and uses WIS DC 9 per the v0.73.0 rebalance", () => {
  return x.forage.toString().includes('"WIS",9');
});

// ---------- Watch Deserter (vertical-slice companion) ----------
check("generateWatchDeserter() produces a fixed-narrative companion, not randomized", () => {
  const s = x.freshState();
  s.hero = testHero();
  x.setState(s);
  const c = x.generateWatchDeserter();
  return c.storyId === "watchDeserter"
    && c.name === "Wren Halloway"
    && c.role === "Watch Deserter"
    && c.className === "Ranger"
    && c.goal.includes("patrol")
    && c.secret.includes("pulled")
    && c.secretRevealed === false;
});
check("generateWatchDeserter() survives normalizeCompanion() unchanged (storyId, goal, secret preserved)", () => {
  const s = x.freshState();
  s.hero = testHero();
  x.setState(s);
  const c = x.generateWatchDeserter();
  const renormalized = x.normalizeCompanion({...c});
  return renormalized.storyId === "watchDeserter"
    && renormalized.goal === c.goal
    && renormalized.secret === c.secret
    && renormalized.boundary === c.boundary;
});
check("confirmCompanions() sets deserterRecruited=true when the deserter is selected", () => {
  const s = x.freshState();
  s.hero = testHero();
  const deserter = x.generateWatchDeserter();
  deserter.selected = true;
  s.candidates = [deserter];
  x.setState(s);
  x.confirmCompanions();
  const st = x.getState();
  return st.flags.deserterRecruited === true
    && st.flags.deserterMet === true
    && st.companions.some(c => c.storyId === "watchDeserter");
});
check("confirmCompanions() sets deserterRecruited=false when the deserter is passed over", () => {
  const s = x.freshState();
  s.hero = testHero();
  const deserter = x.generateWatchDeserter();
  deserter.selected = false;
  s.candidates = [deserter];
  x.setState(s);
  x.confirmCompanions();
  const st = x.getState();
  return st.flags.deserterRecruited === false
    && st.flags.deserterMet === true
    && !st.companions.some(c => c.storyId === "watchDeserter");
});

// ---------- "What the Reeds Took" (vertical-slice quest) ----------
check("generateReedsQuest() produces a well-formed site-objective quest compatible with the existing engine", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = {};
  x.setState(s);
  const q = x.generateReedsQuest();
  return q.place === "the flooded watchtower"
    && q.foe === "a revenant of the drowned patrol"
    && q.objective.type === "site"
    && q.objective.required === 1
    && q.questType === "story"
    && q.originRegion === "greenmarch"
    && q.targetRegion === "greenmarch" // local quest, no region crossing
    && typeof q.reward === "number" && q.reward > 0;
});
check("generateReedsQuest() branches to Wren as patron when the deserter was recruited", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = { deserterRecruited: true, merchantRescued: false };
  x.setState(s);
  const q = x.generateReedsQuest();
  return q.patron === "Wren Halloway";
});
check("generateReedsQuest() branches to the watch sergeant when neither flag is set", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = {};
  x.setState(s);
  const q = x.generateReedsQuest();
  return q.patron === "the watch sergeant";
});
check("generateReedsQuest() branches to the merchant when only merchantRescued is set", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = { deserterRecruited: false, merchantRescued: true };
  x.setState(s);
  const q = x.generateReedsQuest();
  return q.patron === "the rescued merchant";
});
check("generateReedsQuest()'s twist references both threads when the player recruited Wren AND helped the merchant", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = { deserterRecruited: true, merchantRescued: true };
  x.setState(s);
  const q = x.generateReedsQuest();
  return q.patron === "Wren Halloway" && q.twist.includes("same causeway");
});
check("dungeonEnemyFor('objective', quest) turns the reeds quest's foe into a named undead boss", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = {};
  x.setState(s);
  const q = x.generateReedsQuest();
  const boss = x.dungeonEnemyFor("objective", q);
  return boss.name === "A revenant of the drowned patrol"
    && boss.kind === "undead"
    && boss.fanatical === true
    && boss.hp > 0;
});

// ---------- End-to-end integration: quest site generation through combat victory ----------
check("generateDungeonSite() builds a full room graph for the reeds quest with the boss in the objective room", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = {};
  x.setState(s);
  const q = x.generateReedsQuest();
  q.targetRegion = "greenmarch";
  const site = x.generateDungeonSite(q);
  const expectedRooms = ["entrance","guard","water","stores","refuse","shrine","objective"];
  return expectedRooms.every(r => !!site.rooms[r])
    && site.rooms.objective.enemy.name === "A revenant of the drowned patrol"
    && site.objectiveRoom === "objective"
    && site.currentRoom === "entrance";
});
check("winCombat() against the reeds-quest boss advances the site objective and routes to questEnd", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = {};
  s.companions = [];
  s.day = 1; s.hour = 8;
  x.setState(s);
  const q = x.generateReedsQuest();
  q.accepted = true; q.targetRegion = "greenmarch";
  x.normalizeQuest(q);
  const site = x.generateDungeonSite(q);
  q.site = site;
  let st = x.getState();
  st.quest = q; st.quests = [q]; st.phase = "dungeon"; st.location = q.place;
  x.setState(st);
  const bossEnemy = site.rooms.objective.enemy;
  bossEnemy.hp = 1; // about to be defeated
  st = x.getState();
  st.encounter = { enemy: bossEnemy, returnPhase: "dungeon", roomId: "objective", objective: true, questId: q.id, siteKey: q.objective.siteKey };
  x.setState(st);
  x.winCombat();
  const finalQuest = x.questById(q.id) || x.getState().quest;
  return x.getState().phase === "loot"
    && x.getState().afterLootPhase === "questEnd"
    && finalQuest.objective.current === finalQuest.objective.required;
});

// ---------- Guaranteed Wren secret-reveal at the reeds-quest climax ----------
check("winCombat() against the reeds boss reveals Wren's secret when she's in the party", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = { deserterRecruited: true };
  const wren = x.generateWatchDeserter();
  const loyaltyBefore = wren.loyalty; // capture before mutation — wren is the same object as state.companions[0]
  s.companions = [wren];
  s.day = 1; s.hour = 8;
  x.setState(s);
  const q = x.generateReedsQuest();
  q.accepted = true; q.targetRegion = "greenmarch";
  x.normalizeQuest(q);
  const site = x.generateDungeonSite(q);
  q.site = site;
  let st = x.getState();
  st.quest = q; st.quests = [q]; st.phase = "dungeon"; st.location = q.place;
  x.setState(st);
  const bossEnemy = site.rooms.objective.enemy;
  bossEnemy.hp = 1;
  st = x.getState();
  st.encounter = { enemy: bossEnemy, returnPhase: "dungeon", roomId: "objective", objective: true, questId: q.id, siteKey: q.objective.siteKey };
  x.setState(st);
  x.winCombat();
  const finalWren = x.getState().companions.find(c => c.storyId === "watchDeserter");
  return finalWren.secretRevealed === true && finalWren.loyalty === loyaltyBefore + 1;
});
check("revealWrenSecretAtReedsClimax() does nothing if Wren isn't in the party", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.quest = { storyId: "reedsQuest" };
  x.setState(s);
  x.revealWrenSecretAtReedsClimax(); // must not throw with no Wren present
  return true;
});
check("revealWrenSecretAtReedsClimax() does nothing for quests other than the reeds quest", () => {
  const s = x.freshState();
  s.hero = testHero();
  const wren = x.generateWatchDeserter();
  s.companions = [wren];
  s.quest = { storyId: "someOtherQuest" };
  x.setState(s);
  x.revealWrenSecretAtReedsClimax();
  return x.getState().companions[0].secretRevealed === false;
});
check("revealWrenSecretAtReedsClimax() is idempotent (won't re-reveal or re-grant loyalty)", () => {
  const s = x.freshState();
  s.hero = testHero();
  const wren = x.generateWatchDeserter();
  wren.secretRevealed = true;
  wren.loyalty = 5;
  s.companions = [wren];
  s.quest = { storyId: "reedsQuest", place: "the flooded watchtower" };
  x.setState(s);
  x.revealWrenSecretAtReedsClimax();
  return x.getState().companions[0].loyalty === 5;
});

// ---------- True permadeath + persistent chronicle ----------
check("failing to flee while critically hurt now triggers permadeath, not rescue", () => {
  const s = x.freshState();
  s.hero = testHero({ hp: 3, maxHp: 13, name: "Doomed Hero" });
  s.companions = [];
  s.town = { regionId: "greenmarch", name: "Alderwick", market: { stock: {}, funds: 50 } };
  s.flags = {};
  s.inventory = {};
  s.gold = 20; s.silver = 5;
  s.day = 3; s.hour = 8; s.seed = 1972;
  x.setState(s);
  const q = x.generateReedsQuest();
  q.accepted = true; q.targetRegion = "greenmarch";
  x.normalizeQuest(q);
  const site = x.generateDungeonSite(q);
  q.site = site;
  let st = x.getState();
  st.quest = q; st.quests = [q]; st.phase = "dungeon"; st.location = q.place;
  st.encounter = { enemy: { name: "A marsh thug", hp: 10, maxHp: 10, attack: 8, damage: 8 }, distance: 1, returnPhase: "dungeon" };
  x.setState(st);
  x.combatAction("flee");
  sandbox.window._rollCallback(false, -3, 1);
  const finalState = x.getState();
  const chronicle = x.loadChronicleLog();
  const lastEntry = chronicle[chronicle.length - 1];
  return finalState.hero.hp <= 0 // real lethal HP, not revived to 1 like the old rescue mechanic
    && sandbox.localStorage.getItem(x.AUTOSAVE_KEY) === null // cleared — can't be resumed
    && lastEntry.name === "Doomed Hero"
    && lastEntry.cause === "A marsh thug"
    && lastEntry.place === "the flooded watchtower"
    && lastEntry.epitaph.includes("Doomed Hero")
    && lastEntry.epitaph.includes("A marsh thug");
});
check("recordChronicleDeath() persists across separate loadChronicleLog() calls (real localStorage round-trip)", () => {
  const before = x.loadChronicleLog().length;
  const s = x.freshState();
  s.hero = testHero({ hp: 1, maxHp: 10, name: "Second Doomed Hero" });
  s.companions = [];
  s.town = { regionId: "greenmarch", name: "Alderwick" };
  s.day = 5;
  x.setState(s);
  let st = x.getState();
  st.encounter = { enemy: { name: "A bandit" } };
  x.setState(st);
  x.defeat();
  return x.loadChronicleLog().length === before + 1;
});

// ---------- Low-HP warning system ----------
check("heroConditionTier() correctly buckets healthy/wounded/critical/fallen at the new 75%/50% thresholds", () => {
  return x.heroConditionTier({ hp: 8, maxHp: 10 }) === "healthy"   // 80% — above 75%
    && x.heroConditionTier({ hp: 6, maxHp: 10 }) === "wounded"     // 60% — 50% < x <= 75%
    && x.heroConditionTier({ hp: 4, maxHp: 10 }) === "critical"    // 40% — at or below 50%
    && x.heroConditionTier({ hp: 0, maxHp: 10 }) === "fallen";
});
check("maybeWarnCriticalCondition() fires exactly once per encounter when crossing into critical", () => {
  const s = x.freshState();
  s.hero = testHero({ hp: 10, maxHp: 10 });
  x.setState(s);
  let st = x.getState();
  st.encounter = { enemy: { name: "test" } };
  x.setState(st);
  x.maybeWarnCriticalCondition(); // healthy — should not flag
  let mid = x.getState();
  mid.hero.hp = 2; // now critical
  x.setState(mid);
  x.maybeWarnCriticalCondition();
  const afterFirst = x.getState().encounter.criticalWarningShown;
  x.maybeWarnCriticalCondition(); // calling again should not error or double-fire
  const afterSecond = x.getState().encounter.criticalWarningShown;
  return afterFirst === true && afterSecond === true;
});

// ---------- Mercy cap: no one-shot kills from full HP ----------
check("mercy cap: a hero at full HP takes a would-be-lethal hit and survives at 1 HP, no death", () => {
  const s = x.freshState();
  s.hero = testHero({ hp: 13, maxHp: 13, name: "Full Health Hero" });
  s.companions = [];
  s.town = { regionId: "greenmarch", name: "Alderwick" };
  s.flags = {};
  s.day = 1; s.hour = 8; s.seed = 1972;
  x.setState(s);
  let st = x.getState();
  st.quest = null; st.phase = "combat"; st.location = "the flooded watchtower";
  st.encounter = { enemy: { name: "A crushing brute", hp: 20, maxHp: 20, attack: 30, damage: 999, ac: 1 }, distance: 1, round: 1 };
  x.setState(st);
  const before = x.loadChronicleLog().length;
  x.enemyAttack();
  const finalState = x.getState();
  return finalState.hero.hp === 1
    && x.loadChronicleLog().length === before // no death recorded — mercy cap prevented it
    && finalState.encounter !== null; // still in the fight, not routed to a death screen
});
check("mercy cap: an already-wounded hero (not at full HP) can still be killed by a lethal hit", () => {
  const s = x.freshState();
  s.hero = testHero({ hp: 5, maxHp: 13, name: "Already Wounded Hero" });
  s.companions = [];
  s.town = { regionId: "greenmarch", name: "Alderwick" };
  s.flags = {};
  s.day = 1; s.hour = 8; s.seed = 1972;
  x.setState(s);
  let st = x.getState();
  st.quest = null; st.phase = "combat"; st.location = "the flooded watchtower";
  st.encounter = { enemy: { name: "A crushing brute", hp: 20, maxHp: 20, attack: 30, damage: 999, ac: 1 }, distance: 1, round: 1 };
  x.setState(st);
  const before = x.loadChronicleLog().length;
  x.enemyAttack();
  return x.loadChronicleLog().length === before + 1; // real death recorded — no mercy cap once already hurt
});

function testCompanion(overrides = {}) {
  return Object.assign({
    id: "c1", name: "Elowen", className: "Warrior", ancestry: "Human", level: 1,
    hp: 0, maxHp: 14, loyalty: 50,
    gear: { weapon: { name: "Longsword", magic: null, condition: 20 }, armor: { name: "Leather Armor", magic: null, condition: 15 }, offhand: null },
    carriedItems: [{ name: "Bandage", qty: 2, condition: null, magic: null }]
  }, overrides);
}

check("v0.75.4: killCompanion() records the fallen companion's weapon, armor, and carried items for recovery, and removes them from the active party", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [testCompanion()];
  s.encounter = { fallenCompanions: [] };
  x.setState(s);
  const c = x.getState().companions[0];
  x.killCompanion(c);
  const st = x.getState();
  const fallen = st.encounter.fallenCompanions.find(f => f.name === "Elowen");
  const names = fallen.items.map(it => it.name);
  return st.companions.length === 0
    && !!fallen
    && names.includes("Longsword") && names.includes("Leather Armor") && names.includes("Bandage");
});

check("v0.75.4: killCompanion() shows a death-alert modal (parity with the hero's critical-HP warning) naming the fallen companion and their gear", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [testCompanion()];
  s.encounter = { fallenCompanions: [] };
  x.setState(s);
  let captured = "";
  vm.runInContext(`
    globalThis.__origShowModal = showModal;
    showModal = function(html){ globalThis.__capturedModal = html; };
  `, sandbox);
  const c = x.getState().companions[0];
  x.killCompanion(c);
  captured = vm.runInContext(`__capturedModal`, sandbox);
  vm.runInContext(`showModal = globalThis.__origShowModal;`, sandbox);
  return /Elowen/.test(captured) && /Fallen/i.test(captured) && /Longsword/.test(captured);
});

check("v0.75.4: mergeFallenCompanionLoot() appends every fallen companion's items into an existing loot object", () => {
  const s = x.freshState();
  x.setState(s);
  const loot = { items: [{ name: "Rusty Dagger", qty: 1 }] };
  const enc = { fallenCompanions: [{ name: "Pella", items: [{ name: "Quarterstaff", qty: 1, condition: 10, magic: null }] }] };
  x.mergeFallenCompanionLoot(loot, enc);
  return loot.items.length === 2 && loot.items.some(it => it.name === "Quarterstaff");
});

check("v0.75.4: resolveSurrender('accept') with a fallen companion now routes to the loot screen so their gear is recoverable (previously this path skipped loot entirely and their gear was lost forever)", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.quest = null;
  s.encounter = {
    enemy: { name: "Bog Raider", kind: "humanoid", weapon: "Mace", armor: "Leather Armor" },
    fallenCompanions: [{ name: "Elowen", items: [{ name: "Longsword", qty: 1, condition: 20, magic: null }] }],
    objective: null
  };
  x.setState(s);
  x.resolveSurrender("accept", true);
  const st = x.getState();
  return st.phase === "loot"
    && !!st.pendingLoot
    && st.pendingLoot.items.some(it => it.name === "Longsword");
});

check("v0.75.4: resolveSurrender('accept') with no fallen companions keeps the original no-loot-phase shortcut (no behavior change for the common case)", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.quest = { id: "q1", place: "Gallows Fen", task: "test", reward: 10, accepted: true, progress: 0, status: "active" };
  s.encounter = { enemy: { name: "Bog Raider", kind: "humanoid", weapon: "Mace", armor: "Leather Armor" }, fallenCompanions: [], objective: null };
  x.setState(s);
  x.resolveSurrender("accept", true);
  return x.getState().phase !== "loot";
});

check("v0.75.4: resolveSurrender('disarm') still includes a fallen companion's gear alongside the enemy's disarm loot", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.quest = null;
  s.encounter = {
    enemy: { name: "Bog Raider", kind: "humanoid", weapon: "Mace", armor: "Leather Armor", gold: [1, 1], silver: [5, 5] },
    fallenCompanions: [{ name: "Pella", items: [{ name: "Quarterstaff", qty: 1, condition: 10, magic: null }] }],
    objective: null
  };
  x.setState(s);
  x.resolveSurrender("disarm", true);
  const st = x.getState();
  return st.phase === "loot" && st.pendingLoot.items.some(it => it.name === "Quarterstaff");
});

function combatState(overrides = {}) {
  const s = x.freshState();
  s.hero = testHero({ hp: 13, maxHp: 13, equipment: { weapon: "Longsword", armor: "Chain Mail", offhand: "No Off-Hand" } });
  s.companions = [];
  s.quest = { id: "q1", place: "Gallows Fen", task: "test", reward: 10, accepted: true, progress: 0, status: "active" };
  s.phase = "combat";
  s.encounter = Object.assign({
    enemy: { name: "Bog Raider", kind: "humanoid", attack: 4, damage: 6, ac: 11, range: 0, hp: 14, maxHp: 14 },
    distance: 0, round: 1, guardById: {}, guard: 0, fallenCompanions: [], partyOrder: ["hero"], turnIndex: 0
  }, overrides);
  return s;
}

check("v0.75.5: fleeing with a fallen companion's gear still on the field shows a warning naming their gear before attempting to flee (does not roll the escape check yet)", () => {
  const s = combatState({ fallenCompanions: [{ name: "Elowen", items: [{ name: "Longsword", qty: 1, condition: 20, magic: null }] }] });
  x.setState(s);
  vm.runInContext(`
    globalThis.__origShowModal = showModal;
    showModal = function(html){ globalThis.__capturedModal = html; };
  `, sandbox);
  x.combatAction("flee");
  const captured = vm.runInContext(`__capturedModal`, sandbox);
  vm.runInContext(`showModal = globalThis.__origShowModal;`, sandbox);
  return /Elowen/.test(captured) && /Longsword/.test(captured) && /Flee Anyway/.test(captured)
    && x.getState().phase === "combat"; // no escape attempt made yet — waiting on confirmation
});

check("v0.75.5: fleeing with no fallen companion gear on the field proceeds straight to the escape attempt, no warning shown (unchanged behavior)", () => {
  const s = combatState({ fallenCompanions: [] });
  x.setState(s);
  vm.runInContext(`
    globalThis.__origShowModal = showModal;
    showModal = function(html){ globalThis.__capturedModal = html; };
  `, sandbox);
  x.combatAction("flee");
  const captured = vm.runInContext(`__capturedModal`, sandbox);
  vm.runInContext(`showModal = globalThis.__origShowModal;`, sandbox);
  return /Escape combat/.test(captured) && !/Flee Anyway/.test(captured);
});

check("v0.75.5: attemptFlee() (invoked after confirming the warning) still runs the real escape-check flow", () => {
  const s = combatState({ fallenCompanions: [{ name: "Pella", items: [{ name: "Quarterstaff", qty: 1, condition: 10, magic: null }] }] });
  x.setState(s);
  vm.runInContext(`
    globalThis.__origShowModal = showModal;
    showModal = function(html){ globalThis.__capturedModal = html; };
  `, sandbox);
  x.attemptFlee();
  const captured = vm.runInContext(`__capturedModal`, sandbox);
  vm.runInContext(`showModal = globalThis.__origShowModal;`, sandbox);
  return /Escape combat/.test(captured);
});

check("v0.75.6: renderTown() shows a prominent Travel button immediately (not buried below the Quest Board / Suggested Next Step cards several screens down)", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.phase = "town";
  s.town = { regionId: "greenmarch", name: "Alderwick", dominantCulture: "Free Cities", ancestryAttitudes: {} };
  s.quest = null;
  s.questOffer = null;
  x.setState(s);
  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`render();`, sandbox);
  sandbox.document.getElementById = origGetById;
  const html = cache["sceneContent"].innerHTML;
  const travelIdx = html.indexOf("showTravelDestinations()");
  const questBoardIdx = html.indexOf("Quest Board");
  return travelIdx !== -1 && questBoardIdx !== -1 && travelIdx < questBoardIdx;
});

check("v0.75.7: weapon condition penalties are loosened — no damage penalty until below half durability, no accuracy penalty until below 15% (playtest balance fix)", () => {
  return x.weaponConditionDamagePenalty(1) === 0
    && x.weaponConditionDamagePenalty(0.6) === 0
    && x.weaponConditionDamagePenalty(0.5) === 1
    && x.weaponConditionDamagePenalty(0.2) === 2
    && x.weaponConditionDamagePenalty(0) === 3
    && x.weaponConditionAccuracyPenalty(0.5) === 0
    && x.weaponConditionAccuracyPenalty(0.15) === -1
    && x.weaponConditionAccuracyPenalty(0) === -2;
});

check("v0.75.7: hero weapon only wears down on a successful hit, not on a miss", () => {
  const s = combatState({ enemy: { name: "Test Dummy", kind: "humanoid", attack: 0, damage: 1, ac: 5, range: 0, hp: 20, maxHp: 20 } });
  s.hero = testHero({ hp: 13, maxHp: 13, equipment: { weapon: "Longsword", armor: "Chain Mail", offhand: "No Off-Hand" } });
  s.inventory = Object.assign({ Longsword: 1 }, s.inventory);
  x.setState(s);
  vm.runInContext(`globalThis.__origRoll = roll; roll = (n=20) => 1; ensureCondition("Longsword");`, sandbox); // force natural-1 (guaranteed miss); seed the condition array first
  const before = vm.runInContext(`(state.itemCondition["Longsword"]||[])[0]`, sandbox);
  x.weaponAttack();
  const afterMiss = vm.runInContext(`(state.itemCondition["Longsword"]||[])[0]`, sandbox);
  vm.runInContext(`roll = (n=20) => 20;`, sandbox); // force natural-20 (guaranteed hit)
  x.weaponAttack();
  const afterHit = vm.runInContext(`(state.itemCondition["Longsword"]||[])[0]`, sandbox);
  vm.runInContext(`roll = globalThis.__origRoll;`, sandbox);
  return afterMiss === before && afterHit === before - 1;
});

check("v0.75.7: trackAmmoSpent() tallies spent ammo per encounter", () => {
  const s = x.freshState();
  s.encounter = { fallenCompanions: [] };
  x.setState(s);
  x.trackAmmoSpent("Arrow");
  x.trackAmmoSpent("Arrow");
  x.trackAmmoSpent("Crossbow Bolt");
  const spent = x.getState().encounter.ammoSpent;
  return spent.Arrow === 2 && spent["Crossbow Bolt"] === 1;
});

check("v0.75.7: recoverSpentAmmo() recovers a reasonable (not 0%, not 100%) fraction of spent ammo and never more than was spent", () => {
  const s = x.freshState();
  s.encounter = { ammoSpent: { Arrow: 1000 }, fallenCompanions: [] };
  x.setState(s);
  const loot = { items: [] };
  x.recoverSpentAmmo(loot, x.getState().encounter);
  const entry = loot.items.find(it => it.name === "Arrow");
  return !!entry && entry.qty > 300 && entry.qty < 800 && entry.source === "Recovered ammunition";
});

check("v0.75.7: resolveSurrender('accept') also routes to the loot screen when ammo was spent, even with no fallen companions (arrows are the party's own, not the enemy's)", () => {
  const s = combatState({ enemy: { name: "Bog Raider", kind: "humanoid" }, fallenCompanions: [], ammoSpent: { Arrow: 4 } });
  x.setState(s);
  x.resolveSurrender("accept", true);
  const st = x.getState();
  return st.phase === "loot" && !!st.pendingLoot;
});

check("v0.75.10: every intro slide renders with real embedded painted art (a base64 background image) instead of the retired procedural CSS/SVG scenery, and each scene has a distinct image", () => {
  const scenes = ["road", "wilds", "conflict", "people", "realm", "heroic"];
  const urls = scenes.map(scene => {
    const slide = { scene, title: "t", text: "x" };
    const html = vm.runInContext(`landingSlideVisual(${JSON.stringify(slide)})`, sandbox);
    const m = html.match(/background-image:url\('(data:image\/jpeg;base64,[^']+)'\)/);
    return m ? m[1] : null;
  });
  const allPresent = urls.every(u => u && u.length > 1000);
  const allDistinct = new Set(urls).size === urls.length;
  const firstSlideHtml = vm.runInContext(`landingSlideVisual(INTRO_SLIDES[0])`, sandbox);
  return allPresent && allDistinct && /The Old Road/.test(firstSlideHtml) && !/scene-moon/.test(firstSlideHtml);
});

check("v0.75.9: renderFullScreenIntroSlide() falls back to a plain caption instead of leaving the slide blank if a scene's visual generator throws (defends against the white-flash bug report)", () => {
  const s = x.freshState();
  x.setState(s);
  const cache = {};
  const { makeElement } = require("./harness.js");
  const origGetById = sandbox.document.getElementById;
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`
    globalThis.__origLandingSlideVisual = landingSlideVisual;
    landingSlideVisual = function(){ throw new Error("simulated render failure"); };
  `, sandbox);
  vm.runInContext(`renderFullScreenIntroSlide(0);`, sandbox);
  vm.runInContext(`landingSlideVisual = globalThis.__origLandingSlideVisual;`, sandbox);
  sandbox.document.getElementById = origGetById;
  const html = cache["introVisual"].innerHTML;
  return html.length > 0 && /The Old Road/.test(html) && !/undefined/.test(html);
});

check("v0.75.10: the main menu hero background uses the real embedded art via CSS, not the retired procedural moon/mountains/fortress divs", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const cssMatch = src.match(/\.landing-hero\{background-image:url\('data:image\/jpeg;base64,([^']+)'\)/);
  return !!cssMatch && cssMatch[1].length > 1000;
});

check("v0.75.11: nothing opaque sits between the viewer and the menu background photo — .landing-hero::before (the old placeholder layer, painted on top of the parent's own background per CSS stacking rules) must not carry an opaque background", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const m = src.match(/\.landing-hero::before\{[^}]*\}/);
  if (!m) return false;
  const rule = m[0];
  // background must be none/transparent — not a solid color or an opaque multi-stop gradient
  return /background:\s*(none|transparent)/.test(rule) && !/linear-gradient\(180deg,#/.test(rule);
});

check("v0.75.13: the menu title can't clip OR mid-word-break 'ROADWARDEN' — no artificial ch-based max-width, and word-breaking is explicitly disallowed (word-break:keep-all / overflow-wrap:normal), relying on the title's real container width instead", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const m = src.match(/\.landing-title\{[^}]*\}/);
  if (!m) return false;
  const rule = m[0];
  const hasChLimit = /max-width:\d+ch/.test(rule);
  const disallowsBreaking = /word-break:\s*keep-all/.test(rule) && /overflow-wrap:\s*normal/.test(rule);
  return !hasChLimit && disallowsBreaking;
});

check("v0.75.12: intro caption boxes (both compact and fullscreen) are meaningfully more transparent than before, so the art shows through more", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const compact = src.match(/\.intro-caption\{[^}]*background:rgba\(11,8,6,([\d.]+)\)/);
  const full = src.match(/\.fullscreen-intro \.intro-caption\{[^}]*background:linear-gradient\(145deg,rgba\(12,8,5,([\d.]+)\)/);
  if (!compact || !full) return false;
  const compactAlpha = parseFloat(compact[1]);
  const fullAlpha = parseFloat(full[1]);
  // previously .66 and .8 respectively — must now be noticeably lower
  return compactAlpha <= 0.5 && fullAlpha <= 0.5;
});

check("v0.75.13: the mobile title font-size scales down more aggressively on narrow screens (10vw, not 13vw) to leave headroom for the unbroken word", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const m = src.match(/@media\(max-width:820px\)\{[^]*?\.landing-title\{font-size:clamp\(([\d.]+)rem,(\d+)vw/);
  if (!m) return false;
  const vwFactor = parseInt(m[2], 10);
  return vwFactor <= 10;
});

check("v0.75.14: renderTown() shows the real town backdrop image", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.phase = "town";
  s.town = { regionId: "greenmarch", name: "Alderwick", dominantCulture: "Free Cities", ancestryAttitudes: {} };
  s.quest = null; s.questOffer = null;
  x.setState(s);
  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`render();`, sandbox);
  sandbox.document.getElementById = origGetById;
  return cache["sceneContent"].innerHTML.includes("scene-art-town");
});

check("v0.75.14: showShop() shows the real market backdrop image", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.town = { regionId: "greenmarch", name: "Alderwick", dominantCulture: "Free Cities", ancestryAttitudes: {}, market: { stock: {}, funds: 100 } };
  s.quest = null; s.questOffer = null; s.inventory = {};
  x.setState(s);
  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`showShop();`, sandbox);
  sandbox.document.getElementById = origGetById;
  return cache["sceneContent"].innerHTML.includes("scene-art-market");
});

check("v0.75.14: showInn() shows the real inn backdrop image", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.town = { regionId: "greenmarch", name: "Alderwick", dominantCulture: "Free Cities", ancestryAttitudes: {} };
  x.setState(s);
  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`showInn();`, sandbox);
  sandbox.document.getElementById = origGetById;
  return cache["sceneContent"].innerHTML.includes("scene-art-inn");
});

check("v0.75.14: the travel screens (renderTravel/renderQuestTravel/renderCityTravel) use the real travel backdrop image and no longer contain the retired CSS moon/hills/road/walker divs", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const oldMarkupCount = (src.match(/<div class="moon"><\/div><div class="hills">/g) || []).length;
  const newMarkupCount = (src.match(/<div class="scene-art scene-art-travel"><\/div>/g) || []).length;
  return oldMarkupCount === 0 && newMarkupCount === 3;
});

check("v0.75.14: the combat backdrop (.combat-stage) uses the real combat art image, not the old flat gradient", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const m = src.match(/\.combat-stage\{[^}]*\}/);
  if (!m) return false;
  return /background-image:url\('data:image\/jpeg;base64,/.test(m[0]) && !/linear-gradient\(180deg,#242b2c/.test(m[0]);
});

check("v0.75.15: renderDungeon()'s markup conditionally picks the reeds-quest dungeon backdrop vs. the generic one based on state.quest.storyId", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const hasConditional = /state\.quest\?\.storyId===["']reedsQuest["']\?["']scene-art-reeds-dungeon["']:["']scene-art-dungeon["']/.test(src);
  const hasGenericCss = /\.scene-art-dungeon\{background-image:url\('data:image\/jpeg;base64,/.test(src);
  const hasReedsCss = /\.scene-art-reeds-dungeon\{background-image:url\('data:image\/jpeg;base64,/.test(src);
  return hasConditional && hasGenericCss && hasReedsCss;
});

check("v0.75.15: renderDungeon() actually renders the reeds-specific backdrop when the active quest's storyId is 'reedsQuest', and the generic one otherwise", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = {};
  x.setState(s);
  const q = x.generateReedsQuest();
  q.accepted = true; q.targetRegion = "greenmarch";
  x.normalizeQuest(q);
  const site = x.generateDungeonSite(q);
  q.site = site;
  const s2 = x.getState();
  s2.quest = q;
  s2.phase = "dungeon";
  x.setState(s2);

  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`renderDungeon();`, sandbox);
  sandbox.document.getElementById = origGetById;
  const reedsHtml = cache["sceneContent"].innerHTML;

  const s3 = x.freshState();
  s3.hero = testHero();
  s3.companions = [];
  s3.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s3.flags = {};
  x.setState(s3);
  const q2 = x.generateReedsQuest();
  q2.storyId = "other";
  q2.accepted = true; q2.targetRegion = "greenmarch";
  x.normalizeQuest(q2);
  const site2 = x.generateDungeonSite(q2);
  q2.site = site2;
  const s4 = x.getState();
  s4.quest = q2;
  s4.phase = "dungeon";
  x.setState(s4);
  const cache2 = {};
  sandbox.document.getElementById = (id) => cache2[id] || (cache2[id] = makeElement(id));
  vm.runInContext(`renderDungeon();`, sandbox);
  sandbox.document.getElementById = origGetById;
  const genericHtml = cache2["sceneContent"].innerHTML;

  return reedsHtml.includes("scene-art-reeds-dungeon") && !reedsHtml.includes('"scene-art scene-art-dungeon"')
    && genericHtml.includes('"scene-art scene-art-dungeon"') && !genericHtml.includes("scene-art-reeds-dungeon");
});

check("v0.75.15: the character-creation sidebar (.creation-intro) uses the real embedded art with a legible dark scrim, not the old flat gradient alone", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const m = src.match(/\.creation-intro\{[^}]*\}/);
  if (!m) return false;
  return /background-image|url\('data:image\/jpeg;base64,/.test(m[0]) && /rgba\(33,22,14/.test(m[0]);
});

check("v0.75.15: the Arrival Engine's non-map stages (fade/title/approach and narration/choice/outcome) each get a real embedded backdrop image, keyed off data-stage", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const approachRule = /\.arrival-overlay\[data-stage="fade"\] \.arrival-shell,\.arrival-overlay\[data-stage="title"\] \.arrival-shell,\.arrival-overlay\[data-stage="approach"\] \.arrival-shell\{background-image:url\('data:image\/jpeg;base64,/.test(src);
  const reedsRule = /\.arrival-overlay\[data-stage="narration"\] \.arrival-shell,\.arrival-overlay\[data-stage="choice"\] \.arrival-shell,\.arrival-overlay\[data-stage="outcome"\] \.arrival-shell\{background-image:url\('data:image\/jpeg;base64,/.test(src);
  return approachRule && reedsRule;
});


check("v0.75.16: renderRecruit() (companion recruitment at The Lantern & Stag) reuses the existing inn art — same physical location as showInn()", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.candidates = [];
  x.setState(s);
  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`renderRecruit();`, sandbox);
  sandbox.document.getElementById = origGetById;
  return cache["sceneContent"].innerHTML.includes("scene-art-inn");
});

check("v0.75.16: showLevelUp() (Character Growth) shows the real campfire-reflection backdrop", () => {
  const s = x.freshState();
  s.hero = testHero({ levelPoints: 1 });
  s.companions = [];
  x.setState(s);
  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`showLevelUp();`, sandbox);
  sandbox.document.getElementById = origGetById;
  return cache["sceneContent"].innerHTML.includes("scene-art-levelup");
});

check("v0.75.16: renderQuestEnd() shows the Wren-reveal art only for the reeds quest, and no scene-art at all for other quests (no generic quest-end art exists yet)", () => {
  const s = x.freshState();
  s.hero = testHero();
  s.companions = [];
  s.town = { regionId: "greenmarch", market: { stock: {}, funds: 50 } };
  s.flags = {};
  x.setState(s);
  const q = x.generateReedsQuest();
  q.accepted = true; q.targetRegion = "greenmarch";
  x.normalizeQuest(q);
  const st = x.getState();
  st.quest = q;
  x.setState(st);
  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`renderQuestEnd();`, sandbox);
  sandbox.document.getElementById = origGetById;
  const reedsHtml = cache["sceneContent"].innerHTML;

  const q2 = x.generateReedsQuest();
  q2.storyId = "other";
  q2.accepted = true; q2.targetRegion = "greenmarch";
  x.normalizeQuest(q2);
  const st2 = x.getState();
  st2.quest = q2;
  x.setState(st2);
  const cache2 = {};
  sandbox.document.getElementById = (id) => cache2[id] || (cache2[id] = makeElement(id));
  vm.runInContext(`renderQuestEnd();`, sandbox);
  sandbox.document.getElementById = origGetById;
  const otherHtml = cache2["sceneContent"].innerHTML;

  return reedsHtml.includes("scene-art-wren-reveal") && !otherHtml.includes("scene-art-wren-reveal");
});

check("v0.75.17: renderLibraryOfChronicles() shows 3 empty-slot cards with a 'Begin a New Chronicle' action when no saves exist", () => {
  const store = {};
  sandbox.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; }
  };
  const s = x.freshState();
  x.setState(s);
  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`renderLibraryOfChronicles();`, sandbox);
  sandbox.document.getElementById = origGetById;
  const html = cache["sceneContent"].innerHTML;
  return (html.match(/— Empty/g) || []).length === 3 && html.includes("Begin a New Chronicle");
});

check("v0.75.17: renderLibraryOfChronicles() shows real saved hero/companion/region data from an actual characterSavePayload(), with working Continue and Erase actions", () => {
  const store = {};
  sandbox.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; }
  };
  const s = x.freshState();
  s.hero = testHero({ name: "Alederen", level: 5, background: "Outlander" });
  s.companions = [{ name: "Wren Halloway", hp: 14, maxHp: 14, className: "Warrior" }];
  s.world = { currentRegion: "greenmarch", visited: ["greenmarch"], reputations: {}, global: { renown: 0, fear: 0 } };
  s.town = { regionId: "greenmarch", name: "Alderwick" };
  x.setState(s);
  vm.runInContext(`localStorage.setItem(saveKey("character",1), JSON.stringify(characterSavePayload()));`, sandbox);
  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`renderLibraryOfChronicles();`, sandbox);
  sandbox.document.getElementById = origGetById;
  const html = cache["sceneContent"].innerHTML;
  return html.includes("Alederen") && html.includes("Wren Halloway")
    && html.includes("loadSaveSlot('character',1)") && html.includes("eraseLibrarySlot(1)")
    && (html.match(/— Empty/g) || []).length === 2;
});

check("v0.75.17: eraseLibrarySlot() removes the save and immediately re-renders the Library, showing that slot as empty again", () => {
  const store = {};
  sandbox.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; }
  };
  const origConfirm = sandbox.confirm;
  sandbox.confirm = () => true;
  const s = x.freshState();
  s.hero = testHero({ name: "Alederen" });
  s.companions = [];
  s.world = { currentRegion: "greenmarch", visited: ["greenmarch"], reputations: {}, global: { renown: 0, fear: 0 } };
  s.town = { regionId: "greenmarch", name: "Alderwick" };
  x.setState(s);
  vm.runInContext(`localStorage.setItem(saveKey("character",1), JSON.stringify(characterSavePayload()));`, sandbox);
  const cache = {};
  const origGetById = sandbox.document.getElementById;
  const { makeElement } = require("./harness.js");
  sandbox.document.getElementById = (id) => cache[id] || (cache[id] = makeElement(id));
  vm.runInContext(`eraseLibrarySlot(1);`, sandbox);
  sandbox.document.getElementById = origGetById;
  sandbox.confirm = origConfirm;
  const html = cache["sceneContent"].innerHTML;
  return html.includes("Slot 1 — Empty") && !html.includes("Alederen");
});

check("v0.75.17: the main menu's character-loading buttons now open the Library of Chronicles instead of the old save-manager modal (the in-game DM Journal panel's own load button is a separate context and intentionally untouched)", () => {
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf-8");
  const oldButtonCount = (src.match(/onclick="showSaveManager\('character','load'\)"/g) || []).length;
  const newButtonCount = (src.match(/onclick="renderLibraryOfChronicles\(\)"/g) || []).length;
  return oldButtonCount === 1 && newButtonCount === 2;
});

console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
