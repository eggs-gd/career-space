# Playbook: workspace-validate

Trigger: "перевір workspace/data" / "validate workspace" / "is my data layout ok" — the candidate
or developer wants deterministic workspace layout/schema checks.

Call `workspace_validate` (MCP tool, or `node scripts/dist/workspace_validate.js` if the server
isn't connected). Report errors first, then warnings. Keep each issue tied to its returned path,
code, and message.

Do not inspect unrelated `data/` contents manually. This playbook validates structure; it does
not judge CV quality, rewrite files, render artifacts, or infer missing candidate facts.
