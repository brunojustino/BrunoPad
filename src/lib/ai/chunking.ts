export interface MarkdownChunk {
  index: number;
  text: string;
}

const CHUNK_CAP = 2000;
const HEADING_RE = /^#{1,6}\s/;

function splitOversized(text: string): string[] {
  const pieces: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_CAP, text.length);
    if (end < text.length) {
      const cut = text.lastIndexOf(" ", end);
      if (cut > start) end = cut;
    }
    pieces.push(text.slice(start, end));
    start = end;
    while (start < text.length && text[start] === " ") start++;
  }
  return pieces;
}

export function chunkMarkdown(md: string): MarkdownChunk[] {
  const lines = md.split(/\r?\n/);

  const sections: string[][] = [[]];
  for (const line of lines) {
    const current = sections[sections.length - 1];
    if (HEADING_RE.test(line) && current.length > 0) {
      sections.push([]);
    }
    sections[sections.length - 1].push(line);
  }

  const texts: string[] = [];
  for (const section of sections) {
    const paragraphs: string[] = [];
    let para: string[] = [];
    for (const line of section) {
      if (line.trim() === "") {
        if (para.length > 0) {
          paragraphs.push(para.join("\n"));
          para = [];
        }
      } else {
        para.push(line);
      }
    }
    if (para.length > 0) paragraphs.push(para.join("\n"));

    let buffer = "";
    const pushBuffer = () => {
      if (buffer.length > 0) {
        texts.push(buffer);
        buffer = "";
      }
    };
    for (const paragraph of paragraphs) {
      if (paragraph.length > CHUNK_CAP) {
        pushBuffer();
        texts.push(...splitOversized(paragraph));
      } else if (buffer.length === 0) {
        buffer = paragraph;
      } else if (buffer.length + 2 + paragraph.length <= CHUNK_CAP) {
        buffer += "\n\n" + paragraph;
      } else {
        texts.push(buffer);
        buffer = paragraph;
      }
    }
    pushBuffer();
  }

  return texts.map((text, index) => ({ index, text }));
}
