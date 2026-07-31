// Registers the @testing-library/jest-dom matchers (toBeInTheDocument,
// toHaveAttribute, ...) with Vitest's `expect` for TypeScript.
// The matchers are loaded at runtime in ./setup.ts.
import "@testing-library/jest-dom/vitest";
