// Only import jest-dom matchers when running in jsdom environment
// Pure Node.js tests (like market-analysis filters) don't need DOM matchers
if (typeof document !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@testing-library/jest-dom')
}
