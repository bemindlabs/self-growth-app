-- 009_bwoc_migration: replace the OpenClaw LLM gateway with BWOC transport.
--
-- The app no longer holds an LLM provider endpoint/token/model. AI features now
-- address an agent in the BWOC fleet, so the legacy keys are dropped and BWOC
-- defaults are seeded (transport = A2A, default coach agent).

DELETE FROM settings WHERE key IN ('llm_endpoint', 'llm_token');

INSERT OR IGNORE INTO settings (key, value) VALUES ('bwoc_transport', 'a2a');
INSERT OR IGNORE INTO settings (key, value) VALUES ('bwoc_agent_id', 'agent-growth-coach');
