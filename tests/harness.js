// Roadwarden: Solo Realm — test harness
// Loads the production index.html's inline script into a stubbed-DOM Node vm
// context so game-logic functions can be exercised directly, without a browser.
//
// Usage: node tests/run_tests.js   (paths below are resolved relative to this file)

const path = require("path");
const fsMod = require("fs");
const vm = require("vm");

const INDEX_HTML = path.join(__dirname, "..", "index.html");

function extractScript() {
  const html = fsMod.readFileSync(INDEX_HTML, "utf8");
  const match = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Could not find <script> block in index.html");
  return match[1];
}

// ---- minimal stub DOM ----
function makeElement(id) {
  const el = {
    id,
    _html: "",
    classList: {
      _set: new Set(),
      add(...c) { c.forEach(x => this._set.add(x)); },
      remove(...c) { c.forEach(x => this._set.delete(x)); },
      toggle(c) { this._set.has(c) ? this._set.delete(c) : this._set.add(c); },
      contains(c) { return this._set.has(c); }
    },
    dataset: {},
    style: {},
    children: [],
    firstElementChild: null,
    attributes: {},
    set innerHTML(v) { this._html = v; },
    get innerHTML() { return this._html; },
    textContent: "",
    value: "",
    appendChild() {},
    insertAdjacentHTML() {},
    addEventListener() {},
    removeEventListener() {},
    remove() {},
    click() {},
    focus() {},
    querySelector() { return makeElement("stub"); },
    querySelectorAll() { return []; },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; }
  };
  return el;
}

const localStorageStore = {};
const localStorage = {
  getItem(k) { return Object.prototype.hasOwnProperty.call(localStorageStore, k) ? localStorageStore[k] : null; },
  setItem(k, v) { localStorageStore[k] = String(v); },
  removeItem(k) { delete localStorageStore[k]; }
};

const documentStub = {
  body: makeElement("body"),
  documentElement: makeElement("html"),
  title: "",
  getElementById(id) { return makeElement(id); },
  querySelector() { return makeElement("stub"); },
  querySelectorAll() { return []; },
  addEventListener() {},
  createElement(tag) { return makeElement(tag); },
  visibilityState: "visible"
};

function buildSandbox() {
  const sandbox = {
    window: {},
    document: documentStub,
    localStorage,
    console,
    confirm: () => true,
    alert: () => {},
    Math, Date, JSON, Set, Map, Array, Object, Number, String, Boolean,
    isFinite, parseInt, parseFloat,
    URL: { createObjectURL: () => "blob:stub", revokeObjectURL: () => {} },
    Blob: function Blob() {},
    setTimeout: (fn) => { try { fn(); } catch (e) {} return 0; },
    clearTimeout: () => {},
    requestAnimationFrame: (fn) => { try { fn(); } catch (e) {} return 0; },
    navigator: { userAgent: "node-harness" }
  };
  sandbox.window.addEventListener = () => {};
  sandbox.window.localStorage = localStorage;
  sandbox.globalThis = sandbox;
  return sandbox;
}

function loadGameContext() {
  const sandbox = buildSandbox();
  vm.createContext(sandbox);
  const src = extractScript();
  try {
    vm.runInContext(src, sandbox, { filename: "index-extracted.js" });
  } catch (e) {
    // Expected: the final top-level render() call exercises real character-creator
    // DOM logic our minimal stub can't fully satisfy. Everything defined before that
    // point (all functions/consts, and `state`) is already bound in the realm's
    // shared lexical scope, which is all we need below.
    sandbox.__loadError = e.message;
  }
  // Pull the top-level let/const bindings we need onto an exposed object —
  // vm contexts don't reflect let/const as context properties, only `var`/function decls.
  vm.runInContext(`
    globalThis.__exposed = {
      GAME_VERSION, ArrivalEngine, ARRIVAL_STAGES, applyArrivalConsequence,
      ensureProvisionStock, dailyRationsNeeded, buyProvisionBundle,
      normalizeState, freshState, forage,
      generateWatchDeserter, confirmCompanions, normalizeCompanion,
      generateReedsQuest, dungeonEnemyFor, generateDungeonSite, winCombat,
      revealWrenSecretAtReedsClimax, combatAction, attemptFlee, defeat, coinTotal,
      loadChronicleLog, heroConditionTier, maybeWarnCriticalCondition,
      applyHeroDamageMercyCap, enemyAttack,
      AUTOSAVE_KEY, CHRONICLE_KEY,
      activeQuests, questById, normalizeQuest,
      ensureWorldState, effectiveRenown, effectiveFear, adjustReputation, regionRep,
      killCompanion, companionDeathItems, mergeFallenCompanionLoot, resolveSurrender,
      trackAmmoSpent, recoverSpentAmmo, weaponAttack, companionWeaponAttack,
      weaponConditionAccuracyPenalty, weaponConditionDamagePenalty, damageGear,
      getState: () => state, setState: (s) => { state = s; }
    };
  `, sandbox);
  return sandbox;
}

module.exports = { loadGameContext, makeElement };
