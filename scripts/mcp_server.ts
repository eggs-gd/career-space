#!/usr/bin/env node
/**
 * Local MCP server wrapping this repo's deterministic scripts (`rendering.ts`, `score_fit.ts`,
 * `scout_fetch.ts`, `vacancy_store.ts`) as proper MCP tools, instead of a playbook shelling out
 * to `node scripts/dist/*.js` via Bash or hand-editing `data/vacancies/<slug>/record.yaml`
 * itself. Same underlying functions, same reasoning for why these stay real code, not something
 * a playbook asks an agent to eyeball or freehand-edit -- see each module's own docstring. This
 * just gives an MCP-capable agent (Claude Code, Cursor, ...) direct, typed tool calls instead of
 * a freehand shell invocation or file write. An agent without MCP support still works fine via
 * the plain CLI paths documented in each script and in AGENTS.md -- this server is an
 * additional, nicer interface over the same functions, not a replacement for them.
 *
 * Smoke test directly: `node scripts/dist/mcp_server.js` (blocks on stdio -- Ctrl-C to stop;
 * useful to confirm it starts without error, not a normal way to invoke it).
 *
 * Registered per-agent in `.mcp.json` / `.codex/config.toml` / `.gemini/settings.json` /
 * `.cursor/mcp.json` (via `scripts/mcp_bootstrap.js`) -- see AGENTS.md's "Scripts and the MCP
 * server" section.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { z } from "zod";
// A version-compat note for future maintenance, since the history here is genuinely confusing:
// @modelcontextprotocol/sdk was pinned to exactly 1.12.3 for a while, paired with zod v3 --
// SDK >=1.26 combined with zod v3.25.x made `tsc` hang/OOM on this file's `registerTool`/`.tool()`
// calls (a real, reproduced zod-compat type-inference pathology, isolated down to a single
// trivial `z.string()` schema at the time). Bumping to zod v4 (alongside SDK ^1.30.0) made that
// pathology disappear entirely -- it was specifically about the SDK's dual zod v3/v4 "compat"
// bridging layer, not the SDK version by itself. If `tsc` ever starts hanging/OOMing again after
// touching this file, check the zod version first before assuming it's this file's fault.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import * as rendering from "./rendering";
import * as scoreFit from "./score_fit";
import * as vacancyStore from "./vacancy_store";
import { generate as generateLinkedinSearches } from "./linkedin_searches";
import { renderBoard } from "./render_board";
import { runScout } from "./scout_fetch";

/** Expands a leading `~` to the home directory, then resolves to an absolute path. */
function resolvePath(input: string): string {
  const expanded = input.startsWith("~") ? path.join(os.homedir(), input.slice(1)) : input;
  return path.resolve(expanded);
}

/** Every tool below returns a plain value (a dict/list/str) from its own handler logic, but the
 * MCP SDK's `registerTool` callback must return a `CallToolResult` explicitly -- this does that
 * one wrapping step uniformly, so no individual tool has to -- a string passes through as-is
 * (matches `score_fit`'s Markdown return), anything else is pretty-printed JSON text. */
function respond(value: unknown): CallToolResult {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: "text", text }] };
}

const server = new McpServer({ name: "career-space", version: "1.0.0" });

server.registerTool(
  "render_resume",
  {
    description:
      "Render a CV Markdown file (written by playbooks/cv-universal.md or playbooks/cv-targeted.md) " +
      "to styled HTML, and to PDF too (via a headless Chromium print step, unless that fails). " +
      "Deterministic formatting -- never hand-produce styled HTML/PDF-like output yourself instead " +
      "of calling this. Returns the paths actually written.",
    inputSchema: {
      markdown_path: z.string(),
      style: z.enum(rendering.RESUME_STYLES).default("default"),
      title: z.string().optional(),
    },
  },
  async ({ markdown_path, style, title }): Promise<CallToolResult> => {
    const resolved = resolvePath(markdown_path);
    const markdownText = fs.readFileSync(resolved, "utf-8");
    const resolvedTitle = title || path.basename(resolved, path.extname(resolved));
    const html = rendering.renderHtml(markdownText, resolvedTitle, style);

    const stem = rendering.resumeOutputStem(resolved);
    const htmlPath = path.join(path.dirname(resolved), `${stem}.html`);
    fs.writeFileSync(htmlPath, html, "utf-8");

    const pdfPath = path.join(path.dirname(resolved), `${stem}.pdf`);
    const pdfWritten = await rendering.writePdf(html, pdfPath);

    return respond({
      html_path: htmlPath,
      pdf_path: pdfWritten ? pdfPath : null,
      note: pdfWritten
        ? null
        : "PDF rendering failed in this server's environment -- HTML written, open it in a browser and print to PDF as a fallback.",
    });
  }
);

server.registerTool(
  "render_cover_letter",
  {
    description:
      "Render a cover letter draft (written by playbooks/cover-letter.md) to a plain .txt file, " +
      "styled HTML, and PDF too (via a headless Chromium print step, unless that fails). The .txt " +
      "output matters specifically because some application forms have a file-upload field for the " +
      "cover letter instead of a text box -- chat text alone isn't attachable. Returns the paths " +
      "actually written.",
    inputSchema: {
      markdown_path: z.string(),
      title: z.string().optional(),
    },
  },
  async ({ markdown_path, title }): Promise<CallToolResult> => {
    const resolved = resolvePath(markdown_path);
    const draftText = fs.readFileSync(resolved, "utf-8");
    const resolvedTitle = title || path.basename(resolved, path.extname(resolved));
    const stem = rendering.coverLetterOutputStem(resolved);

    const txtPath = path.join(path.dirname(resolved), `${stem}.txt`);
    rendering.writeTxt(draftText, txtPath);

    const html = rendering.renderCoverLetterHtml(draftText, resolvedTitle);
    const htmlPath = path.join(path.dirname(resolved), `${stem}.html`);
    fs.writeFileSync(htmlPath, html, "utf-8");

    const pdfPath = path.join(path.dirname(resolved), `${stem}.pdf`);
    const pdfWritten = await rendering.writePdf(html, pdfPath);

    return respond({
      txt_path: txtPath,
      html_path: htmlPath,
      pdf_path: pdfWritten ? pdfPath : null,
      note: pdfWritten
        ? null
        : "PDF rendering failed in this server's environment -- .txt and HTML written, open the HTML in a browser and print to PDF as a fallback.",
    });
  }
);

server.registerTool(
  "score_fit",
  {
    description:
      "Deterministically score a fitment assessment -- a fixed formula weighted by each requirement " +
      "cluster's importance/evidence/blocking -- and render it as Markdown, grouped by evidence state " +
      "(Major gaps / Minor gaps / Transferable / Strong overlap, then risk/appeal). See scripts/" +
      "score_fit.ts's module docstring for exactly what each cluster object needs. Never compute or " +
      "state this score yourself -- that's what this tool exists to replace, see playbooks/fitment.md.",
    inputSchema: {
      job_summary: z.string(),
      clusters: z.array(z.record(z.string(), z.unknown())),
      risk: z.string().default(""),
      appeal: z.string().default(""),
      fit_category: z.string().default("unclear"),
    },
  },
  async ({ job_summary, clusters, risk, appeal, fit_category }): Promise<CallToolResult> => {
    const assessment = {
      job_summary,
      clusters: clusters as scoreFit.Assessment["clusters"],
      risk,
      appeal,
      fit_category,
    };
    return respond(scoreFit.render(assessment));
  }
);

server.registerTool(
  "scout_fetch",
  {
    description:
      "Fetch public ATS/job-board postings, run the cheap prefilter + repost-collapse, and drop " +
      "anything already in data/vacancies/seen.jsonl. Returns `candidates` -- postings worth the " +
      "agent's own fitment judgment (see playbooks/scout.md), each with a `track_label` (which of " +
      "data/sources.yaml's tracks it matched on title, or null if it only cleared the prefilter via " +
      "the role_signals-only recall lane -- pass this straight through to vacancy_upsert, don't drop " +
      "it) -- plus counts at each stage (fetched/survived_prefilter/collapsed/considered/returned/" +
      "capped) and any per-source fetch errors. Does no judgment and writes nothing; call " +
      "vacancy_mark_seen/vacancy_upsert per candidate after judging it. `feeds`, if given, restricts " +
      "this run to that subset of data/sources.yaml's own `feeds:` list (e.g. the candidate asking " +
      "for just the Ukrainian boards this time) -- an intersection, never a way to run a feed that " +
      "isn't actually configured there; anything requested but not configured comes back in " +
      "`ignored_feeds` instead of silently doing nothing. Omit to run every configured feed.",
    inputSchema: {
      sources_path: z.string().optional(),
      feeds: z.array(z.string()).optional(),
    },
  },
  async ({ sources_path, feeds }): Promise<CallToolResult> => {
    const resolved = sources_path ? resolvePath(sources_path) : undefined;
    return respond(await runScout(resolved, { feeds }));
  }
);

server.registerTool(
  "vacancy_mark_seen",
  {
    description:
      "Append one line to data/vacancies/seen.jsonl. Call this for EVERY scout_fetch candidate the " +
      "agent actually judges, regardless of outcome -- it's what stops the same posting from being " +
      "judged twice on a later scout run. For a `matched` outcome, also call vacancy_upsert to create " +
      "the actual record (status starts at \"new\", not \"tracked\" -- that's a later, candidate-" +
      "confirmed stage); for `rejected`, this call alone is the posting's only trace.",
    inputSchema: {
      posting_id: z.string(),
      content_id: z.string(),
      outcome: z.enum(["matched", "rejected"]),
      company: z.string().default(""),
      title: z.string().default(""),
      fit_score: z.number().int().optional(),
      fit_category: z.string().optional(),
      reason: z.string().optional(),
    },
  },
  async ({ posting_id, content_id, outcome, company, title, fit_score, fit_category, reason }): Promise<CallToolResult> => {
    vacancyStore.markSeen(posting_id, content_id, {
      outcome,
      company,
      title,
      fitScore: fit_score,
      fitCategory: fit_category,
      reason,
    });
    return respond({ ok: true });
  }
);

server.registerTool(
  "vacancy_upsert",
  {
    description:
      "Create or update data/vacancies/<slug>/ for one vacancy worth tracking -- record.yaml " +
      "(metadata) plus posting.md (the posting's own text, written when `posting_text` is given). " +
      "The slug is always derived deterministically -- never pass one in.\n\n" +
      "`status` defaults to omitted, meaning \"no opinion\" -- an update call that omits it leaves " +
      "the vacancy's current status exactly as it was (only defaults to \"new\" when creating a " +
      "brand new record). Pass it explicitly whenever this call is actually meant to set/change " +
      "status; a metadata-only refresh (attaching a document, updating fit) should leave it out " +
      "entirely, never pass it \"just to be safe\" -- doing so would silently regress a " +
      "tracked/applied/interview vacancy back to new.\n\n" +
      "For a posting the SCOUT found: pass `posting_id`/`content_id` through exactly as scout_fetch " +
      "returned them, `status=\"new\"`, and `track_label` too if scout_fetch's candidate had one " +
      "(which track it matched in data/sources.yaml -- null is a valid answer, not an error, for a " +
      "posting that only cleared the prefilter via the role_signals lane).\n\n" +
      "For a posting the CANDIDATE pasted by hand (via playbooks/cover-letter.md, playbooks/" +
      "cv-targeted.md, or a direct ask to track something): omit `posting_id`/`content_id` entirely " +
      "-- they're computed automatically from company/title/posting_text/url, using the same " +
      "hashing the scout uses, so a posting the scout already saw resolves to the same vacancy " +
      "instead of a duplicate. Use `status=\"tracked\"`, not \"new\" -- the candidate already " +
      "decided to act on it by asking for a document, there's no reason to route it through an " +
      "unreviewed state it's already past.\n\n" +
      "Calling this again for the same posting updates the same folder (and appends a " +
      "status_history entry if `status` changed) rather than creating a duplicate -- and every " +
      "enrichment argument (`location`, `remote`, `source`, `posted_at`, `track_label`, " +
      "`fit_score`/`fit_category`/`fit_reason`) you leave out of THIS call is left alone, not " +
      "cleared -- so calling this again with just a status change, or just to attach a document, " +
      "never erases fit data (or anything else) a previous call already recorded. Whatever gets " +
      "generated for this vacancy (a targeted CV, a cover letter) should be written directly into " +
      "this same folder -- never into data/cv/ or data/cover-letters/ for a vacancy that has one of " +
      "these.",
    inputSchema: {
      company: z.string(),
      title: z.string(),
      posting_id: z.string().optional(),
      content_id: z.string().optional(),
      url: z.string().default(""),
      apply_url: z.string().default(""),
      location: z.string().default(""),
      remote: z.boolean().optional(),
      source: z.string().default(""),
      posted_at: z.string().default(""),
      posting_text: z.string().default(""),
      status: z.enum(vacancyStore.VALID_STATUSES).optional(),
      track_label: z.string().optional(),
      fit_score: z.number().int().optional(),
      fit_category: z.string().optional(),
      fit_reason: z.string().optional(),
    },
  },
  async (args): Promise<CallToolResult> => {
    return respond(
      vacancyStore.upsertVacancy({
        postingId: args.posting_id,
        contentId: args.content_id,
        company: args.company,
        title: args.title,
        url: args.url,
        applyUrl: args.apply_url,
        location: args.location,
        remote: args.remote,
        source: args.source,
        postedAt: args.posted_at,
        postingText: args.posting_text,
        status: args.status,
        trackLabel: args.track_label,
        fitScore: args.fit_score,
        fitCategory: args.fit_category,
        fitReason: args.fit_reason,
      })
    );
  }
);

server.registerTool(
  "vacancy_set_status",
  {
    description:
      "Move a tracked vacancy to a new pipeline stage, appending one {status, at} entry to its " +
      "status_history. No-op (no new history entry) if it's already at that status.",
    inputSchema: {
      slug: z.string(),
      status: z.enum(vacancyStore.VALID_STATUSES),
    },
  },
  async ({ slug, status }): Promise<CallToolResult> => respond(vacancyStore.setStatus(slug, status))
);

server.registerTool(
  "vacancy_set_archived",
  {
    description:
      "Archive or unarchive a vacancy -- orthogonal to status, not a new pipeline stage. An " +
      "archived vacancy is excluded from vacancy_list and render_board by default (nothing is " +
      "deleted; pass include_archived to vacancy_list, or archived: false here, to bring it back). " +
      "Use when the candidate wants stale/no-longer-relevant vacancies off the board without " +
      "losing their history -- a rejected or skipped vacancy from months ago is the common case, " +
      "but any status can be archived.",
    inputSchema: {
      slug: z.string(),
      archived: z.boolean(),
    },
  },
  async ({ slug, archived }): Promise<CallToolResult> => respond(vacancyStore.setArchived(slug, archived))
);

server.registerTool(
  "vacancy_attach_artifact",
  {
    description:
      "Copies an existing file into data/vacancies/<slug>/ as <kind>.<its original extension> -- a " +
      "vacancy folder's contents ARE its association with everything about it, so \"attaching\" " +
      "means physically placing the file there, not recording a pointer. `kind` is a short " +
      "caller-chosen label (e.g. \"cover_letter\", \"cv\"). For output you're generating fresh for " +
      "an already-known vacancy, write directly into its folder instead of calling this -- this is " +
      "for a file that already exists somewhere else. Returns the path actually written.",
    inputSchema: {
      slug: z.string(),
      kind: z.string(),
      path: z.string(),
    },
  },
  async ({ slug, kind, path: sourcePath }): Promise<CallToolResult> =>
    respond(vacancyStore.attachArtifact(slug, kind, sourcePath))
);

server.registerTool(
  "linkedin_searches",
  {
    description:
      "Regenerate data/linkedin-searches.md -- ready-to-click LinkedIn Boolean search links (job " +
      "board, feed posts, people search) built from data/sources.yaml's tracks. Pure URL generation, " +
      "no fetching or scraping -- the candidate opens the resulting links themselves in their own " +
      "logged-in browser. Returns the path written.",
    inputSchema: {
      sources_path: z.string().optional(),
    },
  },
  async ({ sources_path }): Promise<CallToolResult> => {
    const resolved = sources_path ? resolvePath(sources_path) : undefined;
    const written = generateLinkedinSearches(resolved);
    return respond({ output_path: written });
  }
);

server.registerTool(
  "vacancy_list",
  {
    description:
      "List tracked vacancies (slug/status/company/title/fit_score/track_label/url/updated_at/" +
      "location/archived/files -- `files` is every filename actually present in that vacancy's " +
      "folder), optionally filtered to one status. Excludes an archived vacancy (see " +
      "vacancy_set_archived) unless include_archived is true. Doesn't include seen.jsonl's " +
      "rejected-and-not-tracked entries -- use this for \"what am I actually pursuing,\" not a full " +
      "history of everything the scout judged. For a human-readable overview, prefer `render_board` " +
      "over hand-summarizing this list into a table yourself -- same data, real clickable links to " +
      "every vacancy's files, no token cost.",
    inputSchema: {
      status: z.enum(vacancyStore.VALID_STATUSES).optional(),
      include_archived: z.boolean().optional(),
    },
  },
  async ({ status, include_archived }): Promise<CallToolResult> =>
    respond(vacancyStore.listVacancies(status, { includeArchived: include_archived }))
);

server.registerTool(
  "render_board",
  {
    description:
      "Renders data/vacancies/'s current state as one static HTML dashboard -- grouped by status, " +
      "sorted by fit score, with a clickable link to every file actually present in each vacancy's " +
      "folder (fitment, posting, CV, cover letter, targeting plan) plus the original posting URL. An " +
      "archived vacancy (see vacancy_set_archived) is left off the board by default -- pass " +
      "include_archived to show everything anyway. No server -- the candidate opens the written " +
      "file directly in a browser. Prefer this over reading every record.yaml yourself and " +
      "hand-building a summary table: same underlying data as vacancy_list, but deterministic " +
      "formatting and real navigable links, for free. Returns the path written (data/board.html by " +
      "default).",
    inputSchema: {
      output_path: z.string().optional(),
      include_archived: z.boolean().optional(),
    },
  },
  async ({ output_path, include_archived }): Promise<CallToolResult> => {
    const resolved = output_path ? resolvePath(output_path) : undefined;
    return respond({ output_path: renderBoard(resolved, include_archived) });
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) {
  main();
}
