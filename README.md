# mcp-unicode

Unicode character MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1160+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `char_info` | Inspect each character of a string (up to 64): Unicode code point (U+ hex + decimal), UTF-8 byte sequence, UTF-16 code units, HTML numeric entity, and general category. Keyless, offline. |
| `escape_string` | Escape a string. format = "js" (\\uXXXX), "html" (&#xNN;), "url" (percent-encoding), or "all-nonascii" (js-escape only non-ASCII). Keyless, offline. |
| `unescape_string` | Unescape a string containing \\uXXXX / \\xNN / &#NN; / &#xNN; / percent-encoding back to plain text. Keyless, offline. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "unicode": {
      "url": "https://gateway.pipeworx.io/unicode/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1160+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Unicode data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
