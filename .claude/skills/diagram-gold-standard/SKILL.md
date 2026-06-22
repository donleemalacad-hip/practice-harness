---
name: diagram-gold-standard
description: Gold standard for authoring Mermaid diagrams — professional Inter-led fonts, readable node/edge spacing, and wrapped connection labels. Use whenever creating, editing, or reviewing any Mermaid diagram, flowchart, sequence diagram, ER diagram, class diagram, state diagram, gantt chart, graph, or chart in any project.
---

# Mermaid Diagram Gold Standard

Apply this to **every** Mermaid diagram you author or edit, in any project. The goal:
professional, well-readable fonts and proper spacing — including the labels on the
connections between nodes.

## Always start a diagram with this (single physical line, as the first line)

```
%%{init: {"fontFamily": "Inter, Segoe UI, Roboto, Helvetica Neue, system-ui, sans-serif", "fontSize": 16, "flowchart": {"nodeSpacing": 60, "rankSpacing": 70, "wrappingWidth": 220, "curve": "basis"}, "sequence": {"messageMargin": 40, "boxMargin": 12, "boxTextMargin": 6, "noteMargin": 12, "wrap": true}}}%%
```

Multi-line `%%{init}%%` breaks rendering in GitHub and Notion — keep it on one line.

## Rules

- **R1–R2 Fonts:** `fontFamily` = `Inter, Segoe UI, Roboto, Helvetica Neue, system-ui, sans-serif`; `fontSize` = 16 (never < 14). Never rely on Mermaid's default Trebuchet MS.
- **R3–R4 Flowchart spacing:** `nodeSpacing` 60, `rankSpacing` 70, `wrappingWidth` 220, `curve` "basis".
- **R5 Sequence spacing:** `messageMargin` 40, `boxMargin` 12, `boxTextMargin` 6, `noteMargin` 12, `wrap` true.
- **R6 Connection labels:** keep edge labels concise; wrap any label longer than ~22 chars with `<br/>` at a word boundary so it does not overlap the edge or nodes — e.g. `A -->|requests payment<br/>authorisation| B`.
- **R7 Direction:** prefer `TD`/`TB` or `LR`; avoid `BT`/`RL` unless the meaning requires it.
- **R8:** the init directive is the first line of the diagram.

## Workflow

1. When you write or edit a Mermaid diagram, include the gold init block from the
   start and follow R1–R8. A diagram born this way is already compliant.
2. After you write the diagram to a file, a PostToolUse hook normally fires and asks
   you to run the **`diagram-checker`** subagent (which runs on the cheap **Haiku**
   model) to validate and auto-fix it. Do so.
3. If the hook does not fire (e.g. the diagram came from pasted/external content, or
   you only displayed it in chat and the user then saves it), invoke the checker
   yourself with the Agent tool: `subagent_type: diagram-checker`, passing the file
   path. Apply the standard to every diagram, always.
