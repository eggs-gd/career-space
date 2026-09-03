#!/usr/bin/env node
/**
 * MCP wrapper for the deterministic `scripts/` layer. Handlers stay thin; core behavior lives in
 * the same modules used by CLI fallbacks.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { z } from "zod";
// If type-checking this file becomes unexpectedly slow, check SDK/zod compatibility first.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import * as rendering from "./rendering";
import * as scoreFit from "./score_fit";
import * as vacancyStore from "./vacancy_store";
import { LOCATION_ELIGIBILITY_STATUSES } from "./eligibility";
import { generate as generateLinkedinSearches } from "./linkedin_searches";
import { renderBoard } from "./render_board";
import { runScout } from "./scout_fetch";
import { resolveVacancyFromUrl } from "./resolve_vacancy_url";

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

const eligibilitySchema = z
  .object({
    location: z
      .object({
        status: z.enum(LOCATION_ELIGIBILITY_STATUSES),
        reason: z.string().optional(),
      })
      .optional(),
  })
  .optional();

function renderBoardResult(): { output_path: string; markdown_path: string } {
  const { htmlPath, mdPath } = renderBoard();
  return { output_path: htmlPath, markdown_path: mdPath };
}

server.registerTool(
  "render_resume",
  {
    description:
      "Render a CV Markdown file to styled HTML and PDF. Returns the written paths; pdf_path is null if PDF rendering fails.",
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
      "Render a cover letter Markdown file to plain text, styled HTML, and PDF. Returns the written paths; pdf_path is null if PDF rendering fails.",
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
      "Score a structured fitment assessment and return score, fit_category, eligibility, and rendered Markdown.",
    inputSchema: {
      job_summary: z.string(),
      clusters: z.array(z.record(z.string(), z.unknown())),
      risk: z.string().default(""),
      appeal: z.string().default(""),
      fit_category: z.string().default("unclear"),
      eligibility: eligibilitySchema,
    },
  },
  async ({ job_summary, clusters, risk, appeal, fit_category, eligibility }): Promise<CallToolResult> => {
    const assessment = {
      job_summary,
      clusters: clusters as scoreFit.Assessment["clusters"],
      risk,
      appeal,
      fit_category,
      eligibility,
    };
    return respond(scoreFit.evaluate(assessment));
  }
);

server.registerTool(
  "scout_fetch",
  {
    description:
      "Fetch configured public job sources, prefilter and dedup postings, and return new candidates plus funnel counts and fetch errors.",
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
  "resolve_vacancy_url",
  {
    description:
      "Resolve one supported vacancy URL into a scout-shaped candidate. Returns matched=false for unsupported URL shapes.",
    inputSchema: {
      url: z.string(),
      sources_path: z.string().optional(),
    },
  },
  async ({ url, sources_path }): Promise<CallToolResult> => {
    const resolved = sources_path ? resolvePath(sources_path) : undefined;
    return respond(await resolveVacancyFromUrl(url, resolved));
  }
);

server.registerTool(
  "vacancy_mark_seen",
  {
    description:
      "Append one judged posting outcome to data/vacancies/seen.jsonl.",
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
  "record_scout_outcomes",
  {
    description:
      "Record judged scout/add-from-url outcomes: append seen ledger entries, create matched vacancy folders, write fitment.md, and render the board if changed.",
    inputSchema: {
      min_fit_score: z.number().int().default(4),
      render_board: z.boolean().default(true),
      items: z.array(
        z.object({
          candidate: z.object({
            posting_id: z.string(),
            content_id: z.string(),
            company: z.string(),
            title: z.string(),
            job_post_text: z.string(),
            url: z.string().optional(),
            apply_url: z.string().optional(),
            location: z.string().optional(),
            remote: z.boolean().optional(),
            source: z.string().optional(),
            posted_at: z.string().optional(),
            track_label: z.string().nullable().optional(),
          }),
          fit: z.object({
            score: z.number().int(),
            fit_category: z.string(),
            reason: z.string().optional(),
            markdown: z.string(),
            eligibility: eligibilitySchema,
          }),
        })
      ),
    },
  },
  async ({ min_fit_score, render_board, items }): Promise<CallToolResult> => {
    const results = items.map((item) =>
      vacancyStore.recordScoutOutcome({
        candidate: item.candidate,
        fit: item.fit,
        minFitScore: min_fit_score,
      })
    );
    const board = render_board && results.some((item) => item.outcome === "matched") ? renderBoardResult() : null;
    return respond({ results, board });
  }
);

server.registerTool(
  "vacancy_upsert",
  {
    description:
      "Create or update data/vacancies/<slug>/ record metadata and posting.md. Omitted enrichment fields preserve existing values.",
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
      eligibility_location_status: z.enum(LOCATION_ELIGIBILITY_STATUSES).optional(),
      eligibility_location_reason: z.string().optional(),
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
        eligibility: args.eligibility_location_status
          ? { location: { status: args.eligibility_location_status, reason: args.eligibility_location_reason } }
          : undefined,
      })
    );
  }
);

server.registerTool(
  "vacancy_set_status",
  {
    description:
      "Set a vacancy pipeline status, append status_history on real transitions, and render the board.",
    inputSchema: {
      slug: z.string(),
      status: z.enum(vacancyStore.VALID_STATUSES),
      note: z.string().optional(),
    },
  },
  async ({ slug, status, note }): Promise<CallToolResult> => {
    const record = vacancyStore.setStatus(slug, status, note);
    return respond({ record, board: renderBoardResult() });
  }
);

server.registerTool(
  "vacancy_set_archived",
  {
    description:
      "Set a vacancy archive flag and render the board.",
    inputSchema: {
      slug: z.string(),
      archived: z.boolean(),
    },
  },
  async ({ slug, archived }): Promise<CallToolResult> => {
    const record = vacancyStore.setArchived(slug, archived);
    return respond({ record, board: renderBoardResult() });
  }
);

server.registerTool(
  "vacancy_attach_artifact",
  {
    description:
      "Copy an existing file into data/vacancies/<slug>/ as <kind>.<extension>. Returns the written path.",
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
      "Regenerate data/linkedin-searches.md from data/sources.yaml tracks. Returns the written path.",
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
      "List tracked vacancies with status, fit, URL, eligibility, archive flag, and files. Excludes archived vacancies unless requested.",
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
      "Render data/board.html and data/board.md from current vacancy records. Excludes archived vacancies unless requested.",
    inputSchema: {
      output_path: z.string().optional(),
      include_archived: z.boolean().optional(),
    },
  },
  async ({ output_path, include_archived }): Promise<CallToolResult> => {
    const resolved = output_path ? resolvePath(output_path) : undefined;
    const { htmlPath, mdPath } = renderBoard(resolved, include_archived);
    return respond({ output_path: htmlPath, markdown_path: mdPath });
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) {
  main();
}
