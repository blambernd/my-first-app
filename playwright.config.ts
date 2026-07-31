import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// Playwright lädt .env.local nicht selbst (anders als Next.js). Damit E2E_EMAIL
// und E2E_PASSWORD ankommen, lesen wir die Datei hier ein — bewusst ohne neue
// Abhängigkeit. Bereits gesetzte Umgebungsvariablen haben Vorrang.
function loadEnvLocal() {
  const file = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key] !== undefined) continue
    process.env[key] = rawValue.replace(/^["']|["']$/g, '')
  }
}
loadEnvLocal()

const AUTH_FILE = path.join(process.cwd(), 'playwright/.auth/user.json')

// Angemeldete Specs tragen die Endung -auth.spec.ts. Sie laufen nur im Projekt
// "chromium-auth", das zuvor die Anmeldung durchführt. Die übrigen Projekte
// klammern sie aus, weil sie unangemeldet zwangsläufig scheitern würden.
const AUTH_SPECS = /.*-auth\.spec\.ts/

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: AUTH_SPECS,
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
      testIgnore: AUTH_SPECS,
    },
    {
      name: 'chromium-auth',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      testMatch: AUTH_SPECS,
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // Next.js braucht mit Turbopack beim ersten Start deutlich länger als die
    // voreingestellten 60s — der bisherige Wert ließ E2E-Läufe scheitern.
    timeout: 180_000,
  },
})
