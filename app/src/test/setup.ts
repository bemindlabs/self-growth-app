import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
// Initialise i18n (default "en") so t() returns English copy in component tests.
import "../i18n";

// Mock @tauri-apps/api/core
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
