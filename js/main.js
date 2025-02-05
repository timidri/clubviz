import { defaultConfig } from "./config.js";
import { Dashboard } from "./visualization/Dashboard.js";

document.addEventListener("DOMContentLoaded", () => {
  const dashboard = new Dashboard();

  // Initial parameter application
  dashboard.applyParameters();
});
