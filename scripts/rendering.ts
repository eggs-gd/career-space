/**
 * Rendering helpers for CVs, cover letters, and the vacancy board.
 *
 * Resume/cover-letter templates use flat string substitution. Board rendering is built in TS
 * because it needs loops over statuses, files, and folder links.
 */

import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import * as yaml from "js-yaml";
import MarkdownIt from "markdown-it";
// @ts-expect-error -- markdown-it-footnote ships no types of its own
import markdownItFootnote from "markdown-it-footnote";
import { REPO_ROOT } from "./repo_paths";
import { formatCvMarkdown } from "./markdown_normalize";
import { vacancyDir as defaultVacancyDir } from "./vacancy_store";
import { matchesLocalKeywords } from "./scout_prefilter";

const TEMPLATE_DIR = path.join(__dirname, "..", "templates");
const CONFIG_PATH = path.join(REPO_ROOT, "data", "config.yaml");

// Raw HTML is allowed for agent-authored artifacts; board-embedded external text is escaped first.
const md = new MarkdownIt({ html: true, linkify: false, typographer: false }).use(markdownItFootnote);

export const RESUME_STYLES = ["default", "compact", "whitepaper"] as const;
export type ResumeStyle = (typeof RESUME_STYLES)[number];

export function listResumeStyles(): string[] {
  return [...RESUME_STYLES];
}

/** MarkupSafe/Jinja2's HTML-autoescape mapping, exactly -- `&` first (so it doesn't double-
 * escape the entities the other replacements introduce), then `<`, `>`, `'`, `"`. Used for every
 * value the original Jinja templates rendered via a bare `{{ ... }}` (autoescaped by
 * `select_autoescape`), never for a value the original marked `| safe`. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&#34;");
}

/** One filename-safe segment: non-alphanumerics collapse to a single underscore, no leading/
 * trailing underscore. Used to build recruiter-facing output filenames -- never applied to
 * anything that ends up as page content, only to the literal filename. */
function filenamePart(text: string): string {
  return text.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

/** `shared.full_name` from `data/config.yaml`. Falls back to a generic label rather than
 * throwing -- a fresh clone before onboarding, or a config missing this one field, shouldn't
 * make rendering (a deterministic, otherwise-unrelated step) fail outright. */
function candidateFullName(): string {
  try {
    const parsed = (yaml.load(fs.readFileSync(CONFIG_PATH, "utf-8")) ?? {}) as Record<string, any>;
    const name = (parsed.shared ?? {}).full_name;
    if (name && String(name).trim()) return String(name).trim();
  } catch {
    // Missing/unreadable config -- fall through to the generic label below, same as Python's
    // `except OSError: pass`.
  }
  return "Resume";
}

/** [company, title] read from `record.yaml` next to `markdownPath`, when there is one -- every
 * `data/vacancies/<slug>/` file has one, `data/cv/universal-<lens>.md` doesn't. Reading the
 * sibling record rather than requiring the caller to pass company/title explicitly means this
 * works automatically for any file already living in a vacancy folder, no playbook change
 * needed each time a new call site renders one. */
function siblingVacancyContext(markdownPath: string): [company: string, title: string] | null {
  const recordPath = path.join(path.dirname(markdownPath), "record.yaml");
  if (!fs.existsSync(recordPath)) return null;
  try {
    const record = (yaml.load(fs.readFileSync(recordPath, "utf-8")) ?? {}) as Record<string, any>;
    const { company, title } = record;
    if (company && title) return [String(company), String(title)];
  } catch {
    return null;
  }
  return null;
}

function titleCase(text: string): string {
  return text
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

/** Output filename (no extension) for a rendered CV -- `<Full Name>_Resume[_<Role>]`, e.g.
 * `Alex_Morgan_Resume_Engineering_Manager`, instead of the source file's own name (`cv`,
 * identical across every vacancy folder). Role comes from the sibling `record.yaml`'s `title`
 * for a targeted CV (`cv-targeted.md`'s output); for a universal CV (`data/cv/universal-
 * <lens>.md`, no sibling record) falls back to the lens name parsed from the filename itself. */
export function resumeOutputStem(markdownPath: string): string {
  const context = siblingVacancyContext(markdownPath);
  let role: string;
  if (context !== null) {
    role = context[1];
  } else {
    const stem = path.basename(markdownPath, path.extname(markdownPath));
    const withoutPrefix = stem.startsWith("universal-") ? stem.slice("universal-".length) : stem;
    role = titleCase(withoutPrefix.replace(/-/g, " ").replace(/_/g, " "));
  }
  const parts = [candidateFullName(), "Resume"];
  if (role) parts.push(role);
  return parts
    .map(filenamePart)
    .filter((p) => p.length > 0)
    .join("_");
}

/** Output filename (no extension) for a rendered cover letter -- `<Full Name>_Cover_Letter
 * [_<Company>]`, e.g. `Alex_Morgan_Cover_Letter_Acme_Corp`, instead of the source file's own
 * name (`cover-letter`, identical across every vacancy folder). Company comes from the sibling
 * `record.yaml`; omitted entirely if there isn't one (shouldn't normally happen -- every cover
 * letter belongs to a vacancy folder -- but this stays a plain fallback, not an error, since a
 * render call is not the place to enforce that). */
export function coverLetterOutputStem(markdownPath: string): string {
  const context = siblingVacancyContext(markdownPath);
  const parts = [candidateFullName(), "Cover_Letter"];
  if (context !== null) parts.push(context[0]);
  return parts
    .map(filenamePart)
    .filter((p) => p.length > 0)
    .join("_");
}

function loadTemplate(relPath: string): string {
  return fs.readFileSync(path.join(TEMPLATE_DIR, relPath), "utf-8");
}

/** Substitutes the exactly-one `{{ title }}` (escaped) and exactly-one `{{ body_html | safe }}`
 * (raw) placeholder in a flat, control-flow-free template -- see this module's header for why
 * this isn't a real templating engine call. */
function renderFlatTemplate(relPath: string, title: string, bodyHtml: string): string {
  const raw = loadTemplate(relPath);
  return raw.replace("{{ title }}", escapeHtml(title)).replace("{{ body_html | safe }}", bodyHtml);
}

/** CV rendering, against `templates/resume/<style>.html.j2`. */
export function renderHtml(markdownText: string, title: string, style: ResumeStyle = "default"): string {
  if (!RESUME_STYLES.includes(style)) {
    throw new Error(`Unknown style ${JSON.stringify(style)}; expected one of: ${RESUME_STYLES.join(", ")}`);
  }
  const normalized = formatCvMarkdown(markdownText);
  const bodyHtml = md.render(normalized);
  return renderFlatTemplate(`resume/${style}.html.j2`, title, bodyHtml);
}

/** Same Markdown -> HTML pipeline as `renderHtml`, against `templates/cover-letter/default.
 * html.j2` instead of a resume style -- a cover letter draft is plain letter prose, not a CV's
 * structured sections, so it gets one simple template rather than `RESUME_STYLES`' three. For
 * the plain-text (not HTML/PDF) download some application forms need instead of a file-upload-
 * friendly document, the draft's own saved file is already plain text (see playbooks/
 * cover-letter.md's writer rule) -- `writeTxt` below just copies it to a `.txt` extension, no
 * rendering needed for that one. */
export function renderCoverLetterHtml(draftText: string, title: string): string {
  const normalized = formatCvMarkdown(draftText);
  const bodyHtml = md.render(normalized);
  return renderFlatTemplate("cover-letter/default.html.j2", title, bodyHtml);
}

// Display order -- by how much the candidate needs to act on it now, not by pipeline stage.
// Interview first (act now), then the to-do pile (tracked to apply, new to review), then applied
// (waiting on them), then the terminal states. Doesn't need to match VALID_STATUSES' own
// declaration order (that one's about lifecycle logic).
const BOARD_STATUS_ORDER: ReadonlyArray<readonly [string, string]> = [
  ["interview", "Interview"],
  ["tracked", "Tracked"],
  ["new", "New"],
  ["applied", "Applied"],
  ["rejected", "Rejected"],
  ["offer", "Offer"],
  ["skipped", "Skipped"],
];

const BOARD_FILE_LABELS: Record<string, string> = {
  "posting.md": "posting",
  "fitment.md": "fitment",
  "cv.md": "CV",
  "cover-letter.md": "cover",
  "targeting-plan.md": "plan",
  "record.yaml": "record",
};
// record.yaml is real and openable but rarely what a candidate wants a quick link to (it's the
// machine-facing metadata file, everything in it worth a glance at a distance is already a
// column in the table) -- link every other file present, skip this one.
const BOARD_FILE_ORDER = ["fitment.md", "posting.md", "cv.md", "cover-letter.md", "targeting-plan.md"] as const;

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** '2026-08-17T12:42:43...' -> '17 Aug' -- same terse date format a candidate scanning many rows
 * actually wants, not a full timestamp. Falls back to the raw value's first 10 characters
 * (better than crashing) if it's ever not a parseable datetime -- a hand-edited record shouldn't
 * break the whole board render over one bad field. Reads the date in UTC, matching what every
 * stored timestamp's explicit `+00:00`/`Z` offset already means -- reading it in the local
 * timezone instead could show a different calendar date near midnight. */
function boardUpdatedShort(updatedAt: string): string {
  if (!updatedAt) return "";
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return updatedAt.slice(0, 10);
  return `${d.getUTCDate()} ${MONTH_ABBR[d.getUTCMonth()]}`;
}

function formatGeneratedAt(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

type Rec = Record<string, any>;

/** A flat Markdown twin of the board -- one table, no embedded document bodies. Built for handing
 * to another agent (or pasting into a chat): it can match a vacancy by company + title and
 * reconcile status against the candidate's own emails/correspondence, without the HTML board's
 * inline posting/CV/fitment text. Same `listVacancies()` input and the same status-order /
 * fit-desc / company sort as `renderBoardHtml`. */
export function renderBoardMd(vacancies: Rec[]): string {
  const order = new Map(BOARD_STATUS_ORDER.map(([status], i) => [status, i] as const));
  const rows = [...vacancies].sort((a, b) => {
    const oa = order.get(a.status ?? "new") ?? BOARD_STATUS_ORDER.length;
    const ob = order.get(b.status ?? "new") ?? BOARD_STATUS_ORDER.length;
    if (oa !== ob) return oa - ob;
    const fa = -(a.fit_score ?? 0);
    const fb = -(b.fit_score ?? 0);
    if (fa !== fb) return fa - fb;
    return String(a.company ?? "").localeCompare(String(b.company ?? ""));
  });

  const cell = (v: unknown): string => String(v ?? "").replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|").trim();

  const lines = [
    "# Vacancy board",
    "",
    `${rows.length} vacancies · generated ${formatGeneratedAt(new Date())}`,
    "",
    "Flat list for handing to another agent: match a row by company + title, then reconcile its",
    "status against your own emails and correspondence. No posting / CV / cover-letter / fitment",
    "text here -- those stay in each vacancy's own folder (`data/vacancies/<slug>/`).",
    "",
    "| Status | Fit | Company | Title | Updated | Slug | URL |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const v of rows) {
    const status = cell(v.status ?? "new") + (v.archived ? " · archived" : "");
    const fit = v.fit_score !== null && v.fit_score !== undefined ? String(v.fit_score) : "–";
    lines.push(
      `| ${status} | ${fit} | ${cell(v.company)} | ${cell(v.title)} | ${cell(boardUpdatedShort(v.updated_at ?? ""))} | ${cell(v.slug)} | ${cell(v.url)} |`
    );
  }
  lines.push("");
  return lines.join("\n");
}

/** Render the vacancy board from `vacancy_store.listVacancies()` output. */
export function renderBoardHtml(
  vacancies: Rec[],
  opts: { title?: string; vacancyDirFn?: (slug: string) => string; localKeywords?: readonly string[] } = {}
): string {
  const title = opts.title ?? "Vacancy board";
  const vacancyDirFn = opts.vacancyDirFn ?? defaultVacancyDir;
  const localKeywords = opts.localKeywords ?? [];

  const byStatus = new Map<string, Rec[]>();
  for (const v of vacancies) {
    const status = v.status ?? "new";
    if (!byStatus.has(status)) byStatus.set(status, []);
    byStatus.get(status)!.push(v);
  }

  const groupsHtml: string[] = [];
  const chipsHtml: string[] = [];
  let total = 0;

  for (const [status, label] of BOARD_STATUS_ORDER) {
    const rows = [...(byStatus.get(status) ?? [])].sort((a, b) => {
      const fa = -(a.fit_score ?? 0);
      const fb = -(b.fit_score ?? 0);
      if (fa !== fb) return fa - fb;
      const ca = String(a.company ?? "");
      const cb = String(b.company ?? "");
      return ca < cb ? -1 : ca > cb ? 1 : 0;
    });
    total += rows.length;

    const prepared = rows.map((v) => {
      const slug = v.slug ?? "";
      const files: string[] = v.files ?? [];
      const vdir = vacancyDirFn(slug);
      const fileButtons: Array<{ label: string; contentHtml: string }> = [];
      let postingRaw = "";
      for (const fname of BOARD_FILE_ORDER) {
        if (!files.includes(fname)) continue;
        const fpath = path.join(vdir, fname);
        let raw: string;
        try {
          raw = fs.readFileSync(fpath, "utf-8");
        } catch {
          continue;
        }
        if (fname === "posting.md") postingRaw = raw;
        let contentHtml: string;
        if (raw.trim()) {
          // Escape raw HTML in vacancy documents before markdown rendering.
          const escaped = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;");
          contentHtml = md.render(escaped);
        } else {
          contentHtml = "<p><em>Empty.</em></p>";
        }
        fileButtons.push({ label: BOARD_FILE_LABELS[fname] ?? fname, contentHtml });
      }
      // Folder links must be absolute file:// URLs; see _sb/reference/gotchas.md.
      const folderUrl = fs.existsSync(vdir) ? pathToFileURL(vdir + path.sep).href : "";
      const folderFiles = folderUrl
        ? files.map((name) => ({ name, url: pathToFileURL(path.join(vdir, name)).href }))
        : [];
      // Highlight the Folder badge when a CV for this vacancy exists -- a rendered resume file
      // (the attachable artifact) or, failing that, the `cv.md` source it came from.
      const folderHasCv = files.some((f) => /_resume.*\.(pdf|html)$/i.test(f)) || files.includes("cv.md");
      const isLocal = matchesLocalKeywords(`${v.location ?? ""} ${postingRaw}`, localKeywords);
      const locationEligibility = v.eligibility?.location ?? null;
      const requiresLocationException = locationEligibility?.status === "location_exception_candidate";
      // Header-only copy payload; document bodies stay in the vacancy folder.
      const copyPayload = [
        `Title: ${v.title ?? ""}`,
        `Company: ${v.company ?? ""}`,
        `URL: ${v.url ?? ""}`,
        `Status: ${v.status ?? ""}`,
        `Fitment: ${v.fit_score !== null && v.fit_score !== undefined ? `${v.fit_score}/10` : "not yet assessed"}`,
        `Vacancy ID: ${slug}`,
      ].join("\n");
      const result: Rec = { ...v, slug, fileButtons, folderUrl, folderFiles, folderHasCv, copyPayload, updatedShort: boardUpdatedShort(v.updated_at ?? ""), isLocal };
      result.requiresLocationException = requiresLocationException;
      result.locationExceptionReason = requiresLocationException ? locationEligibility.reason ?? "" : "";
      return result;
    });

    // Button navigation avoids same-page fragment links; see _sb/reference/gotchas.md.
    chipsHtml.push(
      `<button type="button" class="chip" data-scroll-target="section-${escapeHtml(status)}"><span class="dot ${escapeHtml(status)}"></span>${escapeHtml(label)} <span class="count">${prepared.length}</span></button>`
    );

    const rowsHtml = prepared
      .map((v) => {
        const fitDisplay = v.fit_score !== null && v.fit_score !== undefined ? String(v.fit_score) : "–";
        const folderUrl: string = v.folderUrl ?? "";
        const folderFiles: Array<{ name: string; url: string }> = v.folderFiles ?? [];
        const folderClass = v.folderHasCv ? "file has-cv" : "file";
        const fileButtonsHtml = (v.fileButtons as Array<{ label: string; contentHtml: string }>)
          .map(
            (f) =>
              `<details class="file" name="panel-${escapeHtml(String(v.slug))}"><summary>${escapeHtml(f.label)}</summary><div class="file-content">${f.contentHtml}</div></details>`
          )
          .join("\n            ");
        const postingLinkHtml = v.url
          ? `<a class="posting-link" href="${escapeHtml(String(v.url))}" target="_blank" rel="noopener">posting&nbsp;&#8599;</a>`
          : "";
        // Same native details widget as the Markdown badges.
        const folderLinksHtml = folderUrl
          ? `<details class="${folderClass}" name="panel-${escapeHtml(String(v.slug))}"><summary>📁&nbsp;Folder</summary>` +
            `<div class="file-content folder-list">` +
            `<a href="${escapeHtml(folderUrl)}" target="_blank" rel="noopener">📂&nbsp;open folder&nbsp;&#8599;</a>` +
            folderFiles
              .map((f) => `<a href="${escapeHtml(f.url)}" target="_blank" rel="noopener">${escapeHtml(f.name)}</a>`)
              .join("") +
            `</div></details>`
          : "";
        const localBadgeHtml = v.isLocal ? `<span class="local-badge" title="Matches your local_keywords">📍 Local</span>` : "";
        const locationExceptionBadgeHtml = v.requiresLocationException
          ? `<span class="location-exception-badge" title="${escapeHtml(
              String(v.locationExceptionReason || "May require a location/payroll exception")
            )}">⚠ Location exception</span>`
          : "";
        const archivedBadgeHtml = v.archived ? `<span class="archived-badge">Archived</span>` : "";
        const copyAttr = escapeHtml(JSON.stringify(v.copyPayload ?? ""));
        const copyButtonHtml = `<button type="button" class="copy-btn" data-copy="${copyAttr}">Copy</button>`;
        return `        <div class="vrow${v.isLocal ? " local" : ""}${v.requiresLocationException ? " location-exception" : ""}${v.archived ? " archived" : ""}">
          <div class="vrow-main">
            <span class="col-fit">${fitDisplay}</span>
            <span class="col-company">${escapeHtml(String(v.company ?? ""))}</span>
            <span class="col-role">${escapeHtml(String(v.title ?? ""))}${localBadgeHtml}${locationExceptionBadgeHtml}${archivedBadgeHtml}</span>
            <span class="col-track">${escapeHtml(String(v.track_label || ""))}</span>
            <span class="col-updated">${escapeHtml(v.updatedShort)}</span>
          </div>
          <div class="vrow-files">
            ${fileButtonsHtml}
            ${folderLinksHtml}
            ${postingLinkHtml}
            ${copyButtonHtml}
          </div>
        </div>`;
      })
      .join("\n");

    const bodyForGroup =
      prepared.length > 0
        ? `      <div class="board">
        <div class="board-head">
          <span class="col-fit">Fit</span>
          <span class="col-company">Company</span>
          <span class="col-role">Role</span>
          <span class="col-track">Track</span>
          <span class="col-updated">Updated</span>
        </div>
${rowsHtml}
      </div>`
        : `      <p class="empty">Nothing here.</p>`;

    groupsHtml.push(
      `    <section id="section-${escapeHtml(status)}">
      <h2><span class="dot ${escapeHtml(status)}"></span>${escapeHtml(label)} <span class="n">(${prepared.length})</span></h2>
${bodyForGroup}
    </section>`
    );
  }

  const headHtml = loadTemplate("board/head.html.j2").replace("{{ title }}", escapeHtml(title));

  const generatedAt = formatGeneratedAt(new Date());
  const document = `<!doctype html>
<html lang="en">
${headHtml}
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">${total} vacancies &middot; generated ${escapeHtml(generatedAt)} &middot; click a file badge to open it in place</p>

    <div class="summary">
      ${chipsHtml.join("\n      ")}
    </div>

${groupsHtml.join("\n")}
  </main>
  <script>
    // Progressive enhancement only; the page is readable without this script.
    (function () {
      document.querySelectorAll("button.chip[data-scroll-target]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var target = document.getElementById(btn.getAttribute("data-scroll-target"));
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });

      // Clipboard support varies for local files; keep a fallback and never fail the page.
      function fallbackCopy(text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        var ok = false;
        try {
          ok = document.execCommand("copy");
        } catch (e) {
          ok = false;
        }
        document.body.removeChild(ta);
        return ok;
      }

      document.querySelectorAll("button.copy-btn[data-copy]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var text;
          try {
            text = JSON.parse(btn.getAttribute("data-copy"));
          } catch (e) {
            return;
          }
          var showCopied = function () {
            btn.textContent = "Copied";
            setTimeout(function () {
              btn.textContent = "Copy";
            }, 1500);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(showCopied, function () {
              if (fallbackCopy(text)) showCopied();
            });
          } else if (fallbackCopy(text)) {
            showCopied();
          }
        });
      });
    })();
  </script>
</body>
</html>
`;

  return document;
}

export function writeTxt(text: string, txtPath: string): void {
  fs.mkdirSync(path.dirname(txtPath), { recursive: true });
  fs.writeFileSync(txtPath, text.trim() + "\n", "utf-8");
}

/** Returns false (and prints a note) instead of throwing if the PDF step fails -- the HTML file
 * is still useful on its own (open it, print to PDF from a browser). Ported from weasyprint to
 * Puppeteer (headless Chromium print-to-PDF) -- see AGENTS.md for why. `preferCSSPageSize: true`
 * so each template's own `@page { size: A4; margin: 14mm; }` (or the board/cover-letter
 * variants' own margins) governs the output instead of Puppeteer's API-level defaults. */
export async function writePdf(html: string, pdfPath: string): Promise<boolean> {
  // `any`, not `typeof import("puppeteer")`: under Node16/NodeNext module resolution a type-only
  // import of an ESM-shaped package from this CommonJS file needs an explicit resolution-mode
  // attribute, which isn't worth the ceremony for a lazily-loaded, deliberately-optional
  // dependency -- the try/catch right below already covers a wrong shape at runtime.
  let puppeteer: any;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    console.error(`[rendering] puppeteer not installed -- skipping PDF, HTML is ready at ${pdfPath.replace(/\.pdf$/, ".html")}`);
    return false;
  }
  try {
    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      // None of the current templates load a custom/web font (all system-font stacks -- Inter,
      // ui-sans-serif, etc. -- fall back locally, no @font-face/network fetch involved), so this
      // isn't load-bearing today. Still cheap insurance against the classic "HTML's fine, PDF got
      // painted before the font finished loading" failure mode if a template ever adds one. A
      // string, not a function literal -- `document` is a DOM global this file's own (Node-side,
      // `lib: ["ES2022"]`, no "dom") tsconfig doesn't know about; Puppeteer evaluates a string
      // the same way, awaiting the Promise it resolves to either way.
      await page.evaluate("document.fonts.ready");
      fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
      await page.pdf({ path: pdfPath as `${string}.pdf`, printBackground: true, preferCSSPageSize: true });
    } finally {
      await browser.close();
    }
    return true;
  } catch (error) {
    console.error(
      `[rendering] PDF rendering failed (${(error as Error).message}) -- skipping PDF, HTML is ready at ${pdfPath.replace(/\.pdf$/, ".html")}`
    );
    return false;
  }
}
