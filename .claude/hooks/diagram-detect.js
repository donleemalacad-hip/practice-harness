#!/usr/bin/env node
/*
 * PostToolUse hook: diagram-detect
 *
 * After the MAIN agent writes/edits a file, scan it for a Mermaid diagram. If one
 * is present and not already gold-standard compliant, emit `additionalContext`
 * nudging the agent to run the `diagram-checker` (Haiku) subagent.
 *
 * Notes:
 *  - Session-level hooks do NOT fire for subagent tool calls, so the checker's own
 *    edits cannot re-trigger this hook (no loop).
 *  - Fails OPEN: any error => no output, exit 0. It must never block the user.
 *  - Idempotent: if the diagram already carries the gold font signature, stay silent.
 */
'use strict';

const fs = require('fs');

const GOLD_MARKER = 'Inter, Segoe UI, Roboto'; // R9 idempotency signature
const SCAN_EXT = /\.(md|markdown|mdx|mmd|mermaid)$/i; // also read these from disk
const MERMAID_FILE_EXT = /\.(mmd|mermaid)$/i;
const FENCE_RE = /```\s*mermaid/i;
const KEYWORD_RE = /^(?:%%[^\n]*\n\s*)*\s*(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|stateDiagram(?:-v2)?|gantt|pie|journey|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|sankey(?:-beta)?|xychart(?:-beta)?|block(?:-beta)?|C4Context|C4Container|C4Component)\b/;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (_) {
    return '';
  }
}

function safeRead(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (_) {
    return '';
  }
}

function collectInputText(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return '';
  const parts = [];
  if (typeof toolInput.content === 'string') parts.push(toolInput.content); // Write
  if (typeof toolInput.new_string === 'string') parts.push(toolInput.new_string); // Edit
  if (Array.isArray(toolInput.edits)) { // MultiEdit
    for (const e of toolInput.edits) {
      if (e && typeof e.new_string === 'string') parts.push(e.new_string);
    }
  }
  return parts.join('\n');
}

function containsMermaid(text, filePath) {
  if (!text) return false;
  if (FENCE_RE.test(text)) return true; // ```mermaid block (markdown)
  if (filePath && MERMAID_FILE_EXT.test(filePath) && KEYWORD_RE.test(text.replace(/^﻿/, '').trimStart())) {
    return true; // standalone .mmd / .mermaid file
  }
  return false;
}

function main() {
  const raw = readStdin();
  if (!raw.trim()) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    return;
  }

  const toolInput = payload.tool_input || {};
  const filePath = typeof toolInput.file_path === 'string' ? toolInput.file_path : '';

  let text = collectInputText(toolInput);

  // For markdown / mermaid files, also scan the on-disk (post-write) content so we
  // catch diagrams that were not part of the Edit diff itself.
  if (filePath && SCAN_EXT.test(filePath)) {
    const onDisk = safeRead(filePath);
    if (onDisk) text = text + '\n' + onDisk;
  }

  if (!containsMermaid(text, filePath)) return;
  if (text.indexOf(GOLD_MARKER) !== -1) return; // R9: already compliant

  const out = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext:
        'A Mermaid diagram was written/edited in ' + (filePath || 'a file') +
        '. Per the diagram gold standard, delegate to the `diagram-checker` subagent ' +
        '(runs on the Haiku model) to validate and auto-fix its fonts, spacing, and ' +
        'connection-label wrapping before continuing. Pass the file path to the subagent.'
    }
  };

  process.stdout.write(JSON.stringify(out));
}

try {
  main();
} catch (_) {
  // Fail open: never block the user's workflow.
}
