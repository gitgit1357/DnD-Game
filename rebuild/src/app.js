import { BUILD_INFO } from "./core/build_info.js";

export function renderArchitectureSpike(root) {
  if (!root) throw new Error("Architecture spike requires a root element.");
  root.textContent = `${BUILD_INFO.project} — ${BUILD_INFO.phase}`;
}

if (typeof document !== "undefined") {
  renderArchitectureSpike(document.getElementById("app"));
}
