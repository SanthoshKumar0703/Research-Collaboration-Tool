import React from 'react';

function inline(s, keyBase = 'i') {
  const out = [];
  let rest = s;
  let k = 0;
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/;
  while (rest) {
    const m = rest.match(re);
    if (!m) {
      out.push(rest);
      break;
    }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={`${keyBase}${k++}`} className="font-semibold text-ink">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={`${keyBase}${k++}`} className="rounded bg-ink/5 px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/10">{tok.slice(1, -1)}</code>);
    else out.push(<em key={`${keyBase}${k++}`}>{tok.slice(1, -1)}</em>);
    rest = rest.slice(m.index + tok.length);
  }
  return out;
}

/** Lightweight markdown renderer for AI responses: headings, lists, tables, quotes, inline. */
export function Markdown({ text }) {
  const lines = (text || '').split('\n');
  const blocks = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('### ')) {
      blocks.push(<h4 key={k++} className="mb-1.5 mt-4 text-[15px] font-semibold text-ink">{inline(l.slice(4))}</h4>);
      i++; continue;
    }
    if (l.startsWith('## ')) {
      blocks.push(<h3 key={k++} className="mb-1.5 mt-4 font-display text-lg font-semibold text-ink">{inline(l.slice(3))}</h3>);
      i++; continue;
    }
    if (l.startsWith('> ')) {
      const q = [];
      while (i < lines.length && lines[i].startsWith('> ')) { q.push(lines[i].slice(2)); i++; }
      blocks.push(<blockquote key={k++} className="my-2 border-l-2 border-gold pl-3 italic text-ink-2">{inline(q.join(' '))}</blockquote>);
      continue;
    }
    if (l.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) { items.push(lines[i].slice(2)); i++; }
      blocks.push(
        <ul key={k++} className="my-2 space-y-1">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-wine" />
              <span>{inline(it)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    if (/^\d+\. /.test(l)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i++; }
      blocks.push(
        <ol key={k++} className="my-2 space-y-1">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2">
              <span className="mt-px font-mono text-xs text-faint">{j + 1}.</span>
              <span>{inline(it)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }
    if (l.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
      const parse = (r) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const header = parse(rows[0]);
      const body = rows.slice(1).filter((r) => !/^[\s|:-]+$/.test(r)).map(parse);
      blocks.push(
        <div key={k++} className="my-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {header.map((h, j) => (
                  <th key={j} className="border border-line bg-ink/5 px-2.5 py-1.5 text-left font-medium dark:bg-white/5">{inline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, j) => (
                <tr key={j}>
                  {r.map((c, j2) => (
                    <td key={j2} className="border border-line px-2.5 py-1.5">{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3} |> |- |\d+\. |\|)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(<p key={k++} className="my-2 leading-relaxed">{inline(para.join(' '))}</p>);
  }
  return <div className="text-sm leading-relaxed text-ink-2">{blocks}</div>;
}
