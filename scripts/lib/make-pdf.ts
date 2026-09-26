import fs from 'fs';

function buildPdf(title: string, targetBytes: number): string {
  let body = '';
  const header = '%PDF-1.4\n';
  const offsets: number[] = [];

  function addObject(str: string): void {
    offsets.push(header.length + body.length);
    body += str;
  }

  const content = `BT /F1 24 Tf 72 700 Td (${title}) Tj ET`;
  addObject(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  addObject(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
  addObject(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  addObject(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  addObject(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

  const baseLen = header.length + body.length;
  const overhead = 60;
  const padLen = Math.max(0, targetBytes - baseLen - overhead);
  const padding = 'A'.repeat(padLen);
  addObject(`6 0 obj\n<< /Length ${padding.length} >>\nstream\n${padding}\nendstream\nendobj\n`);

  const xrefOffset = header.length + body.length;
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return header + body + xref + trailer;
}

export function generatePdf(filePath: string, targetBytes: number, title = 'QA Test Document'): number {
  const pdf = buildPdf(title, targetBytes);
  fs.writeFileSync(filePath, pdf, 'binary');
  return fs.statSync(filePath).size;
}
