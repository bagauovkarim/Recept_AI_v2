function escapeForJsonString(rawTail: string): string {
    let out = '';
    let i = 0;
    while (i < rawTail.length) {
        const c = rawTail[i];
        if (c === '\\') {
            if (i + 1 < rawTail.length) {
                out += c + rawTail[i + 1];
                i += 2;
                continue;
            }
            i += 1;
            continue;
        }
        if (c === '"') {
            out += '\\"';
            i += 1;
            continue;
        }
        if (c === '\n') { out += '\\n'; i += 1; continue; }
        if (c === '\r') { out += '\\r'; i += 1; continue; }
        if (c === '\t') { out += '\\t'; i += 1; continue; }
        if (c.charCodeAt(0) < 0x20) {
            i += 1;
            continue;
        }
        out += c;
        i += 1;
    }
    return out;
}

function safeParse(s: string): any | null {
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
}

export function tryParsePartial(s: string): any | null {
    if (!s) return null;
    const firstBrace = s.indexOf('{');
    if (firstBrace < 0) return null;
    const body = s.slice(firstBrace);

    type Frame = '{' | '[' | '"';
    const stack: Frame[] = [];
    let escape = false;
    let stringStart = -1;
    let lastBalancedEnd = -1;

    for (let i = 0; i < body.length; i++) {
        const ch = body[i];
        const top = stack[stack.length - 1];

        if (escape) {
            escape = false;
            continue;
        }

        if (top === '"') {
            if (ch === '\\') {
                escape = true;
            } else if (ch === '"') {
                stack.pop();
            }
            continue;
        }

        if (ch === '"') {
            stack.push('"');
            stringStart = i;
        } else if (ch === '{') {
            stack.push('{');
        } else if (ch === '[') {
            stack.push('[');
        } else if (ch === '}' || ch === ']') {
            stack.pop();
        }

        if (stack.length === 0) {
            lastBalancedEnd = i + 1;
        }
    }

    let cand = body;

    if (stack[stack.length - 1] === '"' && stringStart >= 0) {
        const head = cand.slice(0, stringStart + 1);
        const tail = cand.slice(stringStart + 1);
        cand = head + escapeForJsonString(tail) + '"';
        stack.pop();
    }

    cand = cand.replace(/,\s*"[^"]*"\s*:\s*$/s, '');
    cand = cand.replace(/\{\s*"[^"]*"\s*:\s*$/s, '{');
    cand = cand.replace(/,\s*$/s, '');
    cand = cand.replace(/:\s*$/s, '');

    for (let i = stack.length - 1; i >= 0; i--) {
        const f = stack[i];
        if (f === '{') cand += '}';
        else if (f === '[') cand += ']';
    }

    const parsed = safeParse(cand);
    if (parsed !== null) return parsed;

    if (lastBalancedEnd > 0) {
        const fallback = safeParse(body.slice(0, lastBalancedEnd));
        if (fallback !== null) return fallback;
    }

    return null;
}
