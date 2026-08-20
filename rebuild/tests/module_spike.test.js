import test from "node:test";
import assert from "node:assert/strict";
import { BUILD_INFO } from "../src/core/build_info.js";
import { renderArchitectureSpike } from "../src/app.js";

test("production modules import under Node", () => {
  assert.equal(BUILD_INFO.architecture, "production-rebuild");
});

test("browser-facing module is independently testable", () => {
  const root = { textContent: "" };
  renderArchitectureSpike(root);
  assert.match(root.textContent, /P1-architecture-spike/);
});
