/** Small string helpers that replace regexes SonarQube flags for super-linear backtracking
 * (`S8786`) and the bare `Array.prototype.sort()` (`S2871`). Each is linear and keeps the exact
 * result of the expression it replaced. */

/** Order of two strings by UTF-16 code unit: the order the default `sort()` gives, made explicit. */
export function compareText(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

/** `text` without leading and trailing runs of `char` (one character). */
export function trimChar(text: string, char: string): string {
  let start = 0;
  let end = text.length;
  while (start < end && text[start] === char) start += 1;
  while (end > start && text[end - 1] === char) end -= 1;
  return text.slice(start, end);
}

/** `text` without trailing runs of `char` (one character). */
export function trimEndChar(text: string, char: string): string {
  let end = text.length;
  while (end > 0 && text[end - 1] === char) end -= 1;
  return text.slice(0, end);
}

/** Each newline, with the whitespace around it, becomes one space; whitespace that does not touch a
 * newline is kept; the ends are trimmed. */
export function oneLine(text: string): string {
  return text
    .split("\n")
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .join(" ");
}

/** Each en or em dash, with the whitespace around it, becomes `replacement`. */
export function replaceDashes(text: string, replacement: string): string {
  const parts = text.split(/[–—]/);
  const last = parts.length - 1;
  return parts
    .map((part, index) => {
      const withoutLead = index > 0 ? part.trimStart() : part;
      return index < last ? withoutLead.trimEnd() : withoutLead;
    })
    .join(replacement);
}
