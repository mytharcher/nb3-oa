/** Reject JSON that native parsing would silently alter. Decimal values must survive JSON serialization exactly;
 * integral values must also be safe integers. Numeric-looking text remains ordinary text.
 */
export function validateEvidenceJson(text: string): void {
  let at = 0,
    nodes = 0;
  const fail = (): never => {
    throw new Error('Unsupported JSON evidence');
  };
  const whitespace = () => {
    while (/[\x20\t\r\n]/.test(text[at] ?? '') && at < text.length) at++;
  };
  const string = (): string => {
    if (text[at] !== '"') return fail();
    const start = at++;
    while (at < text.length) {
      const char = text[at++];
      if (char === '\\') {
        at++;
        continue;
      }
      if (char === '"') {
        const parsed: unknown = JSON.parse(text.slice(start, at));
        if (typeof parsed !== 'string') return fail();
        return parsed;
      }
    }
    return fail();
  };
  // Normalize the decimal mathematical value without converting its coefficient to a JS Number.
  const decimal = (token: string): string => {
    const match = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(token);
    if (!match) return fail();
    let coefficient = (match[2] + (match[3] ?? '')).replace(/^0+/, '');
    if (!coefficient) return '0';
    let exponent = Number(match[4] ?? 0) - (match[3]?.length ?? 0);
    if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100000)
      return fail();
    while (coefficient.endsWith('0')) {
      coefficient = coefficient.slice(0, -1);
      exponent++;
    }
    return `${match[1]}${coefficient}e${exponent}`;
  };
  const value = (depth: number): void => {
    whitespace();
    if (++nodes > 10000 || depth > 32) return fail();
    const first = text[at];
    if (first === '"') {
      string();
      return;
    }
    if (first === '{' || first === '[') {
      const object = first === '{',
        end = object ? '}' : ']',
        keys = new Set<string>();
      at++;
      whitespace();
      if (text[at] === end) {
        at++;
        return;
      }
      for (;;) {
        if (object) {
          whitespace();
          const key = string();
          if (keys.has(key)) return fail();
          keys.add(key);
          whitespace();
          if (text[at++] !== ':') return fail();
        }
        value(depth + 1);
        whitespace();
        if (text[at] === end) {
          at++;
          return;
        }
        if (text[at++] !== ',') return fail();
      }
    }
    for (const literal of ['true', 'false', 'null'])
      if (text.startsWith(literal, at)) {
        at += literal.length;
        return;
      }
    const token = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(
      text.slice(at),
    )?.[0];
    if (!token) return fail();
    const number = Number(token);
    if (
      !Number.isFinite(number) ||
      Object.is(number, -0) ||
      (Number.isInteger(number) && !Number.isSafeInteger(number)) ||
      decimal(token) !== decimal(JSON.stringify(number))
    )
      return fail();
    at += token.length;
  };
  value(0);
  whitespace();
  if (at !== text.length) return fail();
}
