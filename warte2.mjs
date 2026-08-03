import { chromium } from "playwright";
import fs from "node:fs";
const env = fs.readFileSync(".env.local", "utf8");
for (const l of env.split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const B = "https://oldtimer-docs.com", V = process.env.E2E_VEHICLE_ID;
const b = await chromium.launch();
for (let i = 1; i <= 25; i++) {
  const c = await b.newContext({ viewport: { width: 1440, height: 760 } });
  const p = await c.newPage();
  try {
    await p.goto(`${B}/login`);
    await p.locator("#email").fill(process.env.E2E_EMAIL);
    await p.locator("#password").fill(process.env.E2E_PASSWORD);
    await p.getByRole("button", { name: /Anmelden/ }).click();
    await p.waitForURL(/dashboard|vehicles/, { timeout: 45000 });
    await p.goto(`${B}/vehicles/${V}/kosten`, { waitUntil: "networkidle" });
    const bb = await p.locator('[data-sidebar="sidebar"]').first().boundingBox();
    const w = Math.round(bb?.width ?? 0);
    console.log(`Versuch ${i}: Breite = ${w} px`);
    if (w > 0 && w < 240) {
      await p.evaluate(() => localStorage.setItem("cookie-consent", JSON.stringify({necessary:true,analytics:false,comfort:false})));
      await p.reload({ waitUntil: "networkidle" });
      await p.waitForTimeout(600);
      await p.screenshot({ path: "prod-nav.png" });
      console.log("NEUE DARSTELLUNG IST LIVE");
      await c.close();
      break;
    }
  } catch (e) { console.log(`Versuch ${i}: ${String(e).slice(0, 60)}`); }
  await c.close();
  await new Promise(r => setTimeout(r, 30000));
}
await b.close();
