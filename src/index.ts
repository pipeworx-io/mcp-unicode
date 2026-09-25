interface McpToolDefinition {
  name: string;
  description: string;
  /** Human-facing one-liner (fleet #1967). Optional; consumers fall back to
   *  description. Kept in step with shared/src/types.ts — scripts/lib/
   *  check-inlined-types.mjs reports drift at publish time. */
  summary?: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    anyOf?: Array<{ required: string[] }>;
    oneOf?: Array<{ required: string[] }>;
    allOf?: Array<{ required: string[] }>;
  };
  outputSchema?: Record<string, unknown>;
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Unicode character MCP.
 *
 * Keyless, offline: inspect the characters of a string (code point, UTF-8/UTF-16
 * encodings, HTML entity, general category) and escape/unescape strings in JS
 * (\uXXXX), HTML (&#x), and URL (percent) forms. Pure functions — no API, no key.
 */


function category(ch: string): string {
  if (/\p{L}/u.test(ch)) return 'Letter';
  if (/\p{N}/u.test(ch)) return 'Number';
  if (/\p{P}/u.test(ch)) return 'Punctuation';
  if (/\p{S}/u.test(ch)) return 'Symbol';
  if (/\p{Z}/u.test(ch)) return 'Separator/Space';
  if (/\p{M}/u.test(ch)) return 'Mark';
  return 'Other/Control';
}

const tools: McpToolExport['tools'] = [
  {
    name: 'char_info',
    description: 'Inspect each character of a string (up to 64): Unicode code point (U+ hex + decimal), UTF-8 byte sequence, UTF-16 code units, HTML numeric entity, and general category. Keyless, offline.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'The text to inspect.' } }, required: ['text'] },
  },
  {
    name: 'escape_string',
    description: 'Escape a string. format = "js" (\\uXXXX), "html" (&#xNN;), "url" (percent-encoding), or "all-nonascii" (js-escape only non-ASCII). Keyless, offline.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'The text to escape.' }, format: { type: 'string', description: 'js | html | url | all-nonascii (default js).' } }, required: ['text'] },
  },
  {
    name: 'unescape_string',
    description: 'Unescape a string containing \\uXXXX / \\xNN / &#NN; / &#xNN; / percent-encoding back to plain text. Keyless, offline.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'The escaped text.' } }, required: ['text'] },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const text = reqStr(args, 'text', '"A€😀"');
  switch (name) {
    case 'char_info': {
      const chars = [...text].slice(0, 64);
      return {
        length_chars: [...text].length, length_utf16: text.length,
        characters: chars.map((ch) => {
          const cp = ch.codePointAt(0)!;
          return {
            char: ch, code_point: cp, hex: 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'),
            utf8_bytes: [...new TextEncoder().encode(ch)].map((b) => b.toString(16).padStart(2, '0').toUpperCase()),
            utf16_units: [...ch].length === 1 ? [ch.charCodeAt(0), ...(ch.length > 1 ? [ch.charCodeAt(1)] : [])].map((u) => u.toString(16).toUpperCase().padStart(4, '0')) : undefined,
            html_entity: `&#${cp};`, category: category(ch),
          };
        }),
      };
    }
    case 'escape_string': {
      const fmt = (typeof args.format === 'string' ? args.format : 'js').toLowerCase();
      if (fmt === 'url') return { format: fmt, escaped: encodeURIComponent(text) };
      let out = '';
      for (const ch of text) {
        const cp = ch.codePointAt(0)!;
        if (fmt === 'all-nonascii' && cp < 128) { out += ch; continue; }
        if (fmt === 'html') out += `&#x${cp.toString(16).toUpperCase()};`;
        else out += cp > 0xffff ? [...ch].map((c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('') : '\\u' + cp.toString(16).padStart(4, '0');
      }
      return { format: fmt, escaped: out };
    }
    case 'unescape_string': {
      const out = text
        .replace(/\\u\{([0-9a-f]+)\}/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
        .replace(/%[0-9a-f]{2}/gi, (m) => { try { return decodeURIComponent(m); } catch { return m; } });
      return { unescaped: out };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, ex: string): string {
  const v = args[key];
  if (typeof v !== 'string' || v.length === 0) throw new Error(`Required argument "${key}" is missing. Pass a string like ${ex}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
