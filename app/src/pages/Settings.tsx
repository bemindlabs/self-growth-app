import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";

type BwocTransport = "a2a" | "cli" | "gateway";

interface BwocSettingsState {
  transport: BwocTransport;
  agentId: string;
  agentUrl: string;
  workspacePath: string;
  token: string;
}

interface GfitSettingsState {
  clientId: string;
  clientSecret: string;
}

const defaultBwocSettings: BwocSettingsState = {
  transport: "a2a",
  agentId: "agent-growth-coach",
  agentUrl: "",
  workspacePath: "",
  token: "",
};

const defaultGfitSettings: GfitSettingsState = {
  clientId: "",
  clientSecret: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<[string, string][]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [bwocSettings, setBwocSettings] = useState<BwocSettingsState>(defaultBwocSettings);
  const [gfitSettings, setGfitSettings] = useState<GfitSettingsState>(defaultGfitSettings);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    transport?: string;
    agent?: string;
    detail?: string;
    error?: string;
  } | null>(null);

  const refreshSettings = async () => {
    const allSettings = await invoke<[string, string][]>("get_all_app_settings");
    setSettings(allSettings);

    const settingsMap = new Map(allSettings);
    setBwocSettings({
      transport: (settingsMap.get("bwoc_transport") as BwocTransport) ?? defaultBwocSettings.transport,
      agentId: settingsMap.get("bwoc_agent_id") ?? defaultBwocSettings.agentId,
      agentUrl: settingsMap.get("bwoc_agent_url") ?? defaultBwocSettings.agentUrl,
      workspacePath: settingsMap.get("bwoc_workspace_path") ?? defaultBwocSettings.workspacePath,
      token: settingsMap.get("bwoc_token") ?? defaultBwocSettings.token,
    });
    setGfitSettings({
      clientId: settingsMap.get("gfit_client_id") ?? defaultGfitSettings.clientId,
      clientSecret: settingsMap.get("gfit_client_secret") ?? defaultGfitSettings.clientSecret,
    });
  };

  useEffect(() => {
    refreshSettings().catch(console.error);
    invoke<boolean>("is_mobile_platform")
      .then((mobile) => {
        setIsMobile(mobile);
        // On mobile the CLI transport is unavailable — fall back to A2A.
        if (mobile) {
          setBwocSettings((c) => (c.transport === "cli" ? { ...c, transport: "a2a" } : c));
        }
      })
      .catch(console.error);
  }, []);

  const showTemporaryMessage = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const persistBwocSettings = async () => {
    const entries: Array<[string, string]> = [
      ["bwoc_transport", bwocSettings.transport],
      ["bwoc_agent_id", bwocSettings.agentId],
      ["bwoc_agent_url", bwocSettings.agentUrl],
      ["bwoc_workspace_path", bwocSettings.workspacePath],
      ["bwoc_token", bwocSettings.token],
    ];
    for (const [key, value] of entries) {
      await invoke("set_app_setting", { key, value });
    }
  };

  const handleSaveBwocSettings = async () => {
    await persistBwocSettings();
    await refreshSettings();
    showTemporaryMessage("Saved BWOC settings.");
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Persist the current field values first — test_bwoc_connection reads the
      // saved config, not the form state, so testing before saving would report
      // "No agent URL configured" even when the field is filled.
      await persistBwocSettings();
      const result = await invoke<{
        ok: boolean;
        transport?: string;
        agent?: string;
        detail?: string;
        error?: string;
      }>("test_bwoc_connection");
      setTestResult(result);
    } catch (e) {
      setTestResult({ ok: false, error: String(e) });
    } finally {
      setTesting(false);
    }
  };

  const handleResetSettings = async () => {
    await invoke("reset_app_settings");
    setConfirmReset(false);
    await refreshSettings();
    showTemporaryMessage("All settings reset to defaults.");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-medium mb-1">BWOC Agent</h3>
            <p className="text-xs text-muted-foreground">
              AI coaching, insights, stories, and OCR are handled by an agent in
              your BWOC fleet. Choose how the app reaches it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Transport</label>
              <select
                value={bwocSettings.transport}
                onChange={(e) =>
                  setBwocSettings((c) => ({ ...c, transport: e.target.value as BwocTransport }))
                }
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              >
                <option value="a2a">A2A over HTTP (local or hosted)</option>
                {!isMobile && <option value="cli">Local bwoc CLI</option>}
                <option value="gateway">Gateway relay (coming soon)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Agent ID</label>
              <input
                type="text"
                placeholder="agent-growth-coach"
                value={bwocSettings.agentId}
                onChange={(e) =>
                  setBwocSettings((c) => ({ ...c, agentId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              />
            </div>

            {bwocSettings.transport === "a2a" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Agent URL (A2A)</label>
                  <input
                    type="url"
                    placeholder="http://127.0.0.1:9999  or  https://host.tailnet.ts.net:10600"
                    value={bwocSettings.agentUrl}
                    onChange={(e) =>
                      setBwocSettings((c) => ({ ...c, agentUrl: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Token (optional)</label>
                  <input
                    type="password"
                    placeholder="Bearer token, if the endpoint requires one"
                    value={bwocSettings.token}
                    onChange={(e) =>
                      setBwocSettings((c) => ({ ...c, token: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                  />
                </div>
              </>
            )}

            {bwocSettings.transport === "cli" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Workspace path (optional)
                </label>
                <input
                  type="text"
                  placeholder="/Users/you/workspaces/bwoc  (leave empty to auto-resolve)"
                  value={bwocSettings.workspacePath}
                  onChange={(e) =>
                    setBwocSettings((c) => ({ ...c, workspacePath: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                />
              </div>
            )}
          </div>

          {bwocSettings.transport === "gateway" && (
            <p className="text-xs text-muted-foreground">
              The native gateway (WS relay) transport is on the roadmap. To reach a
              gateway-hosted agent today without running your own server, use the
              <span className="font-medium"> A2A</span> transport and point the Agent URL
              at the hosted endpoint.
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSaveBwocSettings}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Save BWOC settings
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 border border-border rounded-md text-sm disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {testResult && (
            <div
              className={`rounded-md p-3 text-sm ${
                testResult.ok
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {testResult.ok ? (
                <div className="space-y-1">
                  <p className="font-medium">Reachable</p>
                  <p className="text-xs opacity-80">
                    {testResult.transport?.toUpperCase()} · {testResult.agent}
                  </p>
                  {testResult.detail && (
                    <p className="text-xs opacity-80">{testResult.detail}</p>
                  )}
                </div>
              ) : (
                <p>{testResult.error}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-medium mb-1">Google Fit</h3>
            <p className="text-xs text-muted-foreground">
              Configure OAuth credentials for Google Fit sync. Create a Desktop
              app in Google Cloud Console with Fitness API enabled.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Client ID</label>
              <input
                type="text"
                placeholder="your-client-id.apps.googleusercontent.com"
                value={gfitSettings.clientId}
                onChange={(e) =>
                  setGfitSettings((c) => ({ ...c, clientId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Client Secret</label>
              <input
                type="password"
                placeholder="Client secret"
                value={gfitSettings.clientSecret}
                onChange={(e) =>
                  setGfitSettings((c) => ({ ...c, clientSecret: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              />
            </div>
          </div>

          <button
            onClick={async () => {
              const entries: [string, string][] = [
                ["gfit_client_id", gfitSettings.clientId],
                ["gfit_client_secret", gfitSettings.clientSecret],
              ];
              for (const [key, value] of entries) {
                await invoke("set_app_setting", { key, value });
              }
              await refreshSettings();
              showTemporaryMessage("Saved Google Fit settings.");
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            Save Google Fit settings
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div>
            <h3 className="font-medium mb-1">Backup & Restore</h3>
            <p className="text-xs text-muted-foreground">
              Export your entire database to a file, or restore from a previous backup.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={async () => {
                const path = await save({
                  defaultPath: `self-growth-backup-${new Date().toISOString().split("T")[0]}.db`,
                  filters: [{ name: "SQLite Database", extensions: ["db"] }],
                });
                if (path) {
                  try {
                    await invoke("export_backup", { destPath: path });
                    showTemporaryMessage(`Backup saved to ${path}`);
                  } catch (e) {
                    showTemporaryMessage(`Backup failed: ${e}`);
                  }
                }
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Export Backup
            </button>
            <button
              onClick={async () => {
                const path = await open({
                  multiple: false,
                  filters: [{ name: "SQLite Database", extensions: ["db"] }],
                });
                if (path) {
                  const confirmed = window.confirm(
                    "This will replace ALL your current data with the backup. This cannot be undone. Continue?"
                  );
                  if (confirmed) {
                    try {
                      await invoke("import_backup", { srcPath: path });
                      showTemporaryMessage("Backup restored. Please restart the app.");
                    } catch (e) {
                      showTemporaryMessage(`Restore failed: ${e}`);
                    }
                  }
                }
              }}
              className="px-4 py-2 border border-border rounded-md text-sm"
            >
              Restore from Backup
            </button>
            <button
              onClick={async () => {
                try {
                  const info = await invoke<{ db_path: string; size_display: string }>("get_backup_info");
                  showTemporaryMessage(`DB: ${info.db_path} (${info.size_display})`);
                } catch (e) {
                  showTemporaryMessage(`${e}`);
                }
              }}
              className="px-4 py-2 border border-border rounded-md text-sm"
            >
              DB Info
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium mb-1">Reset Settings</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Clear all stored settings and revert to defaults.
          </p>
          {confirmReset ? (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-destructive">Are you sure?</span>
              <button
                onClick={handleResetSettings}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm"
              >
                Yes, reset all
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 border border-border rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 border border-destructive text-destructive rounded-md text-sm"
            >
              Reset to defaults
            </button>
          )}
        </div>

        {saveMessage && (
          <div className="bg-success/10 text-success rounded-md p-3 text-sm">{saveMessage}</div>
        )}

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">About</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Self Growth v{__APP_VERSION__}</p>
            <p>Self-development tracking app with AI-powered recommendations.</p>
            <p>Data is stored locally on your device.</p>
          </div>
        </div>

        {settings.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Stored Settings</h3>
            <div className="space-y-2">
              {settings.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-mono text-xs break-all text-right">
                    {key.includes("token") ? "••••••••" : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
