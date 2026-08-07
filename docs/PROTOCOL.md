# Mobile Viewport Bridge Protocol

## Architecture

```
Cursor Agent --stdio MCP--> mcp-server --WebSocket:3847--> Extension
                                                      |
                                               PreviewProxy:3848
                                                      |
                                               iframe (injected picker)
```

## Tools

| Tool | Description |
|------|-------------|
| `viewport_open` | Open/load URL |
| `viewport_set_device` | Switch device preset |
| `viewport_get_overview` | Session state |
| `viewport_screenshot` | Screenshot metadata (MVP) |
| `viewport_highlight` | Highlight selector |
| `viewport_get_dom_snippet` | DOM snippet |
| `viewport_get_pending_edits` | Pending visual edits |
| `viewport_apply_edit_result` | Clear applied edits |
| `viewport_reload` | Reload iframe |
| `viewport_list_devices` | Device list |
| `viewport_simulate_edit` | Enqueue fake edit (dev) |

## Events (`notifications/message`)

Channel: `viewportEventStream`

```json
{
  "channel": "viewportEventStream",
  "event": {
    "eventSource": "viewport_user_action",
    "eventType": "selection_change|text_change|prop_change|image_replace|apply_requested",
    "payload": {},
    "timestamp": "ISO-8601",
    "sessionId": "..."
  }
}
```

## Apply-to-code workflow

1. User edits in panel → `pending_upsert` (extension ↔ MCP store)
2. User clicks **应用到代码**:
   - **text** ops → extension rewrites workspace source locally (selector → file heuristics)
   - **style / attr / move** (and failed text) → open Cursor Agent with MCP apply prompt
3. Before prompting Agent, position/spacing values are snapped to a **4px layout grid** (avoids noisy drag offsets)
4. Agent must: `viewport_get_pending_edits` → apply ops strictly → **verify** values → fix only rewrite-induced errors → `viewport_apply_edit_result` → optional `viewport_reload`

Manual clipboard paste is only a fallback when Agent UI cannot be opened automatically.
