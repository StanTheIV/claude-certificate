// Parses DOMAIN_NOTES markdown ("# Domain N: Title (weight%)" / "## N.M Title" / "### Core ideas" ...)
// into a structure the /notes route can render with a table of contents and stable anchors.
export interface NoteTaskStatement {
  id: string;
  title: string;
  body: string;
}

export interface NoteDomain {
  id: number;
  title: string;
  raw: string;
  taskStatements: NoteTaskStatement[];
}

export interface ParsedDomainNotes {
  attribution: string;
  domains: NoteDomain[];
}

export function noteAnchorId(taskStatementId: string): string {
  return `notes-${taskStatementId}`;
}

export function parseDomainNotes(raw: string): ParsedDomainNotes {
  const text = raw.replace(/\r\n/g, '\n');
  const lines = text.split('\n');

  const attributionLines: string[] = [];
  const domains: NoteDomain[] = [];
  let curDomain: NoteDomain | null = null;
  let curTs: NoteTaskStatement | null = null;
  let curLines: string[] = [];
  let inFence = false;
  let sawHeading = false;

  const flushTs = () => {
    if (curTs && curDomain) {
      curTs.body = curLines.join('\n').trim();
      curDomain.taskStatements.push(curTs);
    }
    curTs = null;
    curLines = [];
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;

    if (!inFence && !sawHeading && /^>/.test(line)) {
      attributionLines.push(line);
      continue;
    }

    if (!inFence && /^# /.test(line)) {
      sawHeading = true;
      flushTs();
      if (curDomain) domains.push(curDomain);
      const titleLine = line.slice(2).trim();
      const m = titleLine.match(/^Domain\s+(\d+)\s*:\s*(.*)$/i);
      curDomain = { id: m ? Number(m[1]) : domains.length + 1, title: m ? m[2] : titleLine, raw: titleLine, taskStatements: [] };
      continue;
    }

    if (!inFence && /^## /.test(line)) {
      sawHeading = true;
      flushTs();
      const t = line.slice(3).trim();
      const m = t.match(/^(\d+\.\d+)\s+(.*)$/);
      curTs = { id: m ? m[1] : t, title: m ? m[2] : t, body: '' };
      continue;
    }

    if (curTs) curLines.push(line);
  }
  flushTs();
  if (curDomain) domains.push(curDomain);

  return { attribution: attributionLines.join('\n').trim(), domains };
}
