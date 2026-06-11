import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import SettingsPage from "./Settings";

const mockInvoke = vi.mocked(invoke);

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
  open: vi.fn(),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_all_app_settings") return [];
      return undefined;
    });
  });

  it("renders page heading", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeTruthy();
  });

  it("renders BWOC Agent section", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("BWOC Agent")).toBeTruthy();
      expect(screen.getByText("Save BWOC settings")).toBeTruthy();
      expect(screen.getByText("Test Connection")).toBeTruthy();
    });
  });

  it("renders Google Fit section", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Google Fit")).toBeTruthy();
      expect(screen.getByText("Save Google Fit settings")).toBeTruthy();
    });
  });

  it("renders Backup & Restore section", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Backup & Restore")).toBeTruthy();
      expect(screen.getByText("Export Backup")).toBeTruthy();
      expect(screen.getByText("Restore from Backup")).toBeTruthy();
    });
  });

  it("renders About section", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("About")).toBeTruthy();
      expect(screen.getByText(/Self Growth v\d+\.\d+\.\d+/)).toBeTruthy();
    });
  });

  it("renders Reset Settings section", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Reset Settings")).toBeTruthy();
      expect(screen.getByText("Reset to defaults")).toBeTruthy();
    });
  });

  it("shows confirmation on reset click", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Reset to defaults"));
    });
    expect(screen.getByText("Are you sure?")).toBeTruthy();
    expect(screen.getByText("Yes, reset all")).toBeTruthy();
  });

  it("saves BWOC settings", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Save BWOC settings")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Save BWOC settings"));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("set_app_setting", {
        key: "bwoc_transport",
        value: "a2a",
      });
      expect(mockInvoke).toHaveBeenCalledWith("set_app_setting", {
        key: "bwoc_agent_id",
        value: "agent-growth-coach",
      });
    });
  });

  it("displays stored settings", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_all_app_settings")
        return [["bwoc_agent_id", "agent-growth-coach"]];
      return undefined;
    });

    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Stored Settings")).toBeTruthy();
      expect(screen.getByText("bwoc_agent_id")).toBeTruthy();
    });
  });
});
