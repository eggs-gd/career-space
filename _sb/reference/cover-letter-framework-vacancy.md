# Cover letter & resume framework -- job applications (ported from career-wizard, not yet wired)

Ported verbatim (content, not the career-wizard-specific integration notes) from career-wizard's
`docs/frameworks/apply-cv-cover.en.md` on 2026-08-29, after confirming it was never actually
applied there either -- career-wizard's own cover-letter code (`career_cover_letters/drafting.py`)
is entirely grounded in its `freelance-proposal.en.md` framework; this vacancy-specific one existed
only as a captured design doc, marked "reference framework only" in its own header. It had never
been ported into career-space at all until now.

**Status here: the captured design doc for the whole system this was ported from, not the
operational instructions.** Section 6's Blocks 1-4 and Section 7's validator are now operationalized
as `policies/cover-letter-shape-b.md`, which `playbooks/cover-letter.md` actually calls (chosen by
a per-posting judgment call — human-read-likely vs ATS/formal-pipeline-likely, independent of
task/long-term mode; the other shape is `cover-letter-shape-a.md`, shared rules for both in
`cover-letter-writing-policy.md`). This file stays as the fuller reference — read it for the
whole shared model (Section 8) and the reasoning behind the shape, not as something a playbook
reads directly. The resume-structure guidance (Sections 1-5: header fields, bullet framing, ATS
contract) still isn't wired anywhere and still overlaps with `policies/cv-writing-policy.md`;
reconciling the two remains open, a separate decision from the cover-letter shape one.

> Original source note (career-wizard): a job-search course lesson on modern resume/CV formatting
> ("Урок 3"), cross-checked against 8 attached resume template `.docx` files (chronological,
> functional, hybrid, and a senior/"6-figure" template with worked examples).
>
> Scope: this is about **job-application cover letters** (applying to a specific vacancy), a
> different genre from the freelance/Upwork-proposal framework `cover-letter.md`'s current
> Problem/Differentiator/Evidence/Scope/Core Message structure is built on -- different reader,
> different goal, different validator criteria. Don't merge the two; cross-reference instead.

## 1. Resume = targeted evidence, not a biography

Input shape: `Master CV + Job Description -> Targeted Resume`. Every resume version answers one
question: *why is this candidate relevant to this specific vacancy?* Pull out what proves fit,
rank it up, compress what isn't relevant -- not an attempt to represent the whole career evenly.

## 2. Resume structure

**Header:**
```
NAME
Target Professional Title

Location
LinkedIn
Email
[Phone]
```
No decorative elements. Phone: include for local applications; for a foreign-market application,
better to omit -- a foreign country code can read as an unwanted implicit location filter to an
ATS or a skimming recruiter. (career-space's own version of this rule now lives in
`policies/cv-writing-policy.md`'s header section.)

**Summary:** 2-3 sentences -- who you are -> relevant scope -> why you're a fit for *this*
vacancy. Regenerates per vacancy; never a frozen chunk of the Master CV pasted in unchanged.

**Professional Experience**, reverse chronological:
```
Role at Company
Month YYYY - Month YYYY
Location

- accomplishment
- accomplishment
- accomplishment
```
For a lesser-known company, 1-3 lines of context (what the business does, scale, geography,
employee/revenue size) help the reader correctly calibrate the achievement that follows. The core
unit of Experience is evidence, not responsibility -- don't list duties.

**Education**: keep even for senior candidates -- `Institution` / `Degree / Field` / `Period`.
Stressed as important for the Western market specifically.

**Languages**: `English -- Professional`, `Ukrainian -- Native` -- not `English -- B2/C1`.
Vocabulary: Native / Professional / Conversational.

**Additional Information / Skills**: two semantic buckets, not a technology dump.
- Hard Skills -- what the vacancy expects; without these the candidate reads as not relevant.
- Soft Skills / Core Competencies -- the traits that explain why to hire this candidate.

Algorithm: `JD requirements -> identify must-have skills -> verify against Master CV -> include
supported matches`. Never add a keyword the evidence doesn't support.

## 3. Bullet framework

Naming varies (PAR / CAR / Google's XYZ) but it's one underlying model:
`Problem/Challenge -> Action -> Result`. Google's formula: `Accomplished [X], as measured by [Y],
by doing [Z]`. Structured evidence shape for a generator:
```
context/problem
action
tools/method
result
metric
```
Result-first / impact-first where possible. Numbers should never be invented to satisfy the shape
-- quantify only when the evidence actually supports it.

## 4. ATS contract

Not yet enforced anywhere in career-space (no validator step checks these) -- listed here as a
real gap, not implemented:
- standard section names: `Summary`, `Experience`, `Education`, `Skills`;
- exact JD terminology where it's genuinely true of the candidate;
- spell out acronyms at least once;
- dates as `Month YYYY`, never a bare year;
- PDF or DOCX output;
- single-column layout;
- no graphics/images/screenshots, no emoji/exotic symbols, no dark background;
- no underline/italic used as structural formatting (headings + bold are fine);
- font size 11pt or larger;
- minimize hyperlinks.

Architectural conclusion from the source lesson: **the resume renderer should be intentionally
boring.** A profile or portfolio can look good; a resume is a machine-readable document first.

## 5. Filename is part of the UX

Not `resume_final_v7.pdf`, but `Alex_Morgan_Resume.pdf`, or for a targeted application,
`Alex_Morgan_Resume_Engineering_Manager.pdf`. Not an ATS concern -- makes life easier for a
recruiter who's downloaded 30 files with generic names. Enforced by `render_resume.ts`/
`render_cover_letter.ts` today (see `rendering.resume_output_stem`/`cover_letter_output_stem`).

## 6. Cover letter != compressed resume

(For job applications specifically -- see the scope note at the top.)

- **Block 1 -- What.** Who I am + what role I'm applying for.
- **Block 2 -- Why me.** 2-3 concrete reasons I'm a fit -- evidence, not "I am passionate and
  highly motivated...".
- **Block 3 -- Why them.** Why this specific vacancy/company. Critical: the letter has to show
  it was written for *them* specifically.
- **Block 4 -- CTA.** Short close: "I'd be happy to discuss...".

The worked example this was derived from follows exactly this shape: opening -> quantified
evidence -> a concrete reason for interest in the specific company -> invitation to interview.

## 7. Cover letter validator

Reject/regenerate when the letter:
- is generic enough to send to another company unchanged;
- retells the resume;
- is mostly motivation/enthusiasm with no substance;
- talks about the candidate's own problems/needs instead of the employer's;
- runs too long;
- has no evidence;
- has no concrete "why this company/job";
- doesn't use the vacancy's own vocabulary;
- makes unsupported claims.

Green flags: job keywords + evidence + company-specific interest + concise transitions + CTA.

## 8. The shared model (conceptual)

```
Job Description
      |
Job Requirements
      |
Candidate Evidence
      |
Relevance Ranking
      |
+-----------------+-----------------+
| Targeted Resume | Cover Letter    |
|  Evidence-heavy | Argument-heavy  |
+-----------------+-----------------+
      |                   |
 ATS Validator       CL Validator
```
Sequence: (1) what does the vacancy actually need? (2) what from the Master CV proves it? (3)
which 5-10 pieces of evidence are strongest? (4) what evidence is missing? (5) which keywords need
to appear naturally? -- only then: Resume packs the evidence densely; Cover Letter builds a hiring
argument from that *same* evidence. Retrieval should be requirement-driven (does this evidence
prove requirement X?), not similarity-driven (does this text look like the JD's words?) --
`cover-letter-shape-a.md`'s own Evidence step already does this by decomposing requirements into
underlying capabilities first, not searching by keyword overlap.
