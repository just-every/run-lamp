# Security and compatibility review

Author: Run Edit Run fleet (Codex), 2026-11-15.

The two CodeQL locations operate in test helpers, not production HTML sinks. theme-flow.mjs checks human-readable sanitizer removal descriptions; it does not filter HTML. Its new literal membership checks require the script element, p onclick attribute and external img src removal descriptions, preserving the prior assertions. The production boundary in src/core/features/page-settings/theme-html.ts already parses with parse5 and enforces element, attribute, namespace and URL allowlists.

status-journey.mjs converts responses into text for substring readiness checks. It never inserts that output into an HTML sink. The prior regex mishandles greater-than signs inside quoted attributes, comments and HTML entities. The replacement uses the existing pinned parse5 dependency and recursively joins text nodes, matching nearby test conventions. Parsing once preserves escaped literal markup and keeps doubly encoded references encoded. No parser output is treated as sanitized HTML.

Direct callers include incident, maintenance and public readiness, Atom/RSS feeds, and a widget.js wording assertion. The 11-case probe covers linked prose, quoted delimiters, escaped tags, decimal and hexadecimal entities, double encoding, comments, malformed and nested tag-shaped input, Atom, RSS and the existing widget wording. The full publishing-contract suite checks native source-to-publication behavior including the actual widget route.

One independent read-only security-boundary investigator inspected implementations and callers before editing. One fresh independent read-only candidate reviewer inspected the diff and callers after focused validation. The reviewer reported no concrete surviving bypass or introduced regression. No production source, contract clauses, dependency versions or test registrations change.

Both reported patterns are removed. This is test-helper correctness and alert remediation; no exploitable production HTML sink was established from either alert. Provider-side CodeQL alert closure is left to its analysis of the landed change.
