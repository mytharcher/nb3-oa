/** Chinese names use one character; Latin names use two initials (or two letters for one word). */
export function userInitials(name: string): string {
  const text = name.trim();
  if (!text) return '?';
  const characters = Array.from(text);
  if (/\p{Script=Han}/u.test(characters[0])) return characters[0];
  const words = text.split(/\s+/u);
  return (
    words.length > 1
      ? words
          .slice(0, 2)
          .map((word) => Array.from(word)[0])
          .join('')
      : characters.slice(0, 2).join('')
  ).toUpperCase();
}

// A name-based hash keeps the requested random color consistent across lists, pickers and refreshes.
// Fixed dark colors keep white initials readable in both themes; these are identity colors, not status colors.
const colors = [
  '#b91c1c',
  '#b45309',
  '#4d7c0f',
  '#047857',
  '#0e7490',
  '#1d4ed8',
  '#6d28d9',
  '#a21caf',
  '#be185d',
];
export function userAvatarColor(name: string): string {
  let hash = 0;
  for (const character of name.trim())
    hash = (Math.imul(hash, 31) + character.codePointAt(0)!) | 0;
  return colors[(hash >>> 0) % colors.length];
}
