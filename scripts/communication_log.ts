#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import { REPO_ROOT } from "./repo_paths";
import { VacancyStoreError } from "./vacancy_store";

export type OpportunityKind = "vacancy" | "engagement";

export interface AppendCommunicationOptions {
  kind: OpportunityKind;
  slug: string;
  title: string;
  source: string;
  rawText: string;
  summary?: string;
  observedAt?: string;
  direction?: string;
  status?: string;
  dataDir?: string;
}

export interface AppendCommunicationResult {
  path: string;
}

function rootDir(kind: OpportunityKind, dataDir?: string): string {
  if (dataDir) return dataDir;
  return path.join(REPO_ROOT, "data", kind === "vacancy" ? "vacancies" : "engagements");
}

function communicationPath(kind: OpportunityKind, slug: string, dataDir?: string): string {
  return path.join(rootDir(kind, dataDir), slug, "communication.md");
}

function normalizeDate(input?: string): string {
  if (!input) return new Date().toISOString().slice(0, 10);
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function quoteBlock(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

function initialDocument(summary?: string): string {
  return `# Communication

Summary:
${summary?.trim() || "No summary yet."}
`;
}

function replaceSummary(document: string, summary?: string): string {
  const clean = summary?.trim();
  if (!clean) return document;
  const firstEvent = document.search(/\n## \d{4}-\d{2}-\d{2} /);
  const headEnd = firstEvent === -1 ? document.length : firstEvent;
  const head = document.slice(0, headEnd);
  const rest = firstEvent === -1 ? "" : document.slice(firstEvent);
  const replaced = head.match(/^# Communication\n\nSummary:\n[\s\S]*$/)
    ? `# Communication\n\nSummary:\n${clean}\n`
    : `# Communication\n\nSummary:\n${clean}\n\n${head.trim()}\n`;
  return `${replaced}${rest}`;
}

export function appendCommunication(opts: AppendCommunicationOptions): AppendCommunicationResult {
  if (opts.kind !== "vacancy" && opts.kind !== "engagement") {
    throw new VacancyStoreError("kind must be vacancy or engagement");
  }
  const filePath = communicationPath(opts.kind, opts.slug, opts.dataDir);
  const folder = path.dirname(filePath);
  if (!fs.existsSync(folder)) {
    throw new VacancyStoreError(`Opportunity folder not found: ${folder}`);
  }
  if (!opts.rawText.trim()) {
    throw new VacancyStoreError("rawText is required");
  }

  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : initialDocument(opts.summary);
  const withSummary = replaceSummary(current, opts.summary);
  const date = normalizeDate(opts.observedAt);
  const meta = [
    `Source: ${opts.source || "unknown"}`,
    opts.direction ? `Direction: ${opts.direction}` : "",
    opts.status ? `Related status: ${opts.status}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const section = `\n\n## ${date} — ${opts.title.trim()}\n\n${meta}\n\n${quoteBlock(opts.rawText.trim())}\n`;
  fs.writeFileSync(filePath, `${withSummary.trimEnd()}${section}`, "utf-8");
  return { path: filePath };
}

function main(): void {
  const { values } = parseArgs({
    options: {
      kind: { type: "string" },
      slug: { type: "string" },
      title: { type: "string" },
      source: { type: "string" },
      raw: { type: "string" },
      raw_file: { type: "string" },
      summary: { type: "string" },
      observed_at: { type: "string" },
      direction: { type: "string" },
      status: { type: "string" },
      data_dir: { type: "string" },
    },
  });
  if (values.kind !== "vacancy" && values.kind !== "engagement") {
    throw new VacancyStoreError("communication log requires --kind vacancy|engagement");
  }
  if (!values.slug || !values.title) {
    throw new VacancyStoreError("communication log requires --slug and --title");
  }
  const rawText = values.raw_file ? fs.readFileSync(path.resolve(values.raw_file), "utf-8") : values.raw ?? "";
  const result = appendCommunication({
    kind: values.kind,
    slug: values.slug,
    title: values.title,
    source: values.source ?? "",
    rawText,
    summary: values.summary,
    observedAt: values.observed_at,
    direction: values.direction,
    status: values.status,
    dataDir: values.data_dir ? path.resolve(values.data_dir) : undefined,
  });
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main();
}
