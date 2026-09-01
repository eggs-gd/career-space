# dou.ua / Djinni category values

Static reference for `sources.yaml`'s per-track `ua_categories:` field (see `playbooks/scout.md`'s
Step 0). Both platforms filter their public feeds by an exact match against a small, fixed
taxonomy -- not by arbitrary title text. A value that isn't an exact match from one of the two
lists below either matches nothing (dou.ua) or is silently ignored, with the platform falling back
to its unfiltered "latest vacancies" feed instead of an error (Djinni) -- see `scripts/
scout_sources.ts`'s `fetchDouUa`/`fetchDjinni` docstrings for how that was confirmed live.

Not relevant to `jobico` (career-space's third Ukraine-focused scout source) -- that one searches
by a track's own `titles` directly, genuine free text, same as `workable`/`smartrecruiters`; no
fixed category list to pick from, nothing to look up in this file for it.

**Never guess or invent a value for a candidate -- read the real list below and let them pick from
it.** The two vocabularies overlap for common single-word disciplines (`Python`, `Java`, `DevOps`)
but aren't identical in form for anything else -- if a track should show up on both platforms, add
both spellings (dou.ua's and Djinni's) to that track's `ua_categories:` list; each fetcher just
ignores whichever values aren't its own.

Verified live 2026-08-31 by fetching each site's own real category listing (dou.ua: the `<select>`
on `https://jobs.dou.ua/vacancies/`; Djinni: the `/jobs/keyword-<slug>` URLs in
`https://djinni.co/sitemap.xml`) -- not typed from memory. Re-verify the same way before trusting
this file again if it's been untouched for a long time; either site can add or rename categories.

## dou.ua -- `?category=` (case-insensitive)

59 values. Note there's no generic "Backend" -- it's split by language.

```
.NET, Account Manager, AI/ML, Analyst, Android, Animator, Architect, Artist, Assistant, Big Data,
Blockchain, C++, C-level, Copywriter, Data Engineer, Data Science, DBA, Design, DevOps, Embedded,
Engineering Manager, Erlang, ERP/CRM, Finance, Flutter, Front End, Golang, Hardware, HR, iOS/macOS,
Java, Legal, Marketing, No-code, Node.js, Office Manager, Other, PHP, Procurement, Product Manager,
Project Manager, Python, QA, React Native, Ruby, Rust, Sales, Salesforce, SAP, Scala, Scrum Master,
Security, SEO, Support, SysAdmin, Technical Writer, Unity, Unreal Engine, Військова справа
```

## Djinni -- `?primary_keyword=` (case-sensitive -- use these exact slugs, already lowercase)

123 values, from Djinni's own `/jobs/keyword-<slug>` URLs.

```
2d_animation, 2d_artist, 3d_animation, 3d_artist, account_manager, accountant, android, angular,
architect, artist, asp_net, business_analyst, business_development, c, cbdo, cco, ceo, cfo, cio,
cmo, content_design, content_manager, content_marketing, content_writing, coo, cplusplus, cpo, cpp,
cto, data_analyst, data_engineer, data_science, delivery_manager, design, dev_ops,
digital_marketing, digital_marketing_manager, dotnet, dotnet_cloud, dotnet_desktop, dotnet_web,
drupal, elixir, embedded, engineering_manager, erp_systems, finance_manager, finances,
financial_analyst, finops, flutter, fullstack, game_design, game_developer, gamedev, golang,
graphic_design, head_chief, hr, illustrator, information_security, ios, java, javascript, kotlin,
laravel, lead, lead_generation, level_design, magento, marketing, marketing_analyst, markup,
ml_ai, motion_design, ms_dynamics, no_code, node_js, odoo, other, penetration_tester,
performance_marketing, php, pr_manager, product_design, product_manager, product_owner,
project_manager, python, qa_automation, qa_manual, react, react_native, recruiter, ruby, rust,
sales, sales_leadership, sales_manager, salesforce, sap, scala, scrum_master, security,
security_analyst, seo, social_media, sql_dba, support, symfony, sysadmin, technical_writing,
ui_ux, unity, unreal, ux_research, vfx_artist, video_editor, vue, web_analyst, winforms,
wordpress, wpf
```
