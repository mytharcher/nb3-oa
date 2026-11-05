/** Synthetic PDF fixtures with no customer information; xref offsets are byte-accurate. */
export function contractPdf(pages: (string | null)[]) {
  const objects: string[] = [];
  const add = (value: string) => {
    objects.push(value);
    return objects.length;
  };
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('');
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const kids: number[] = [];
  for (const text of pages) {
    const stream = text
      ? 'BT /F1 12 Tf 50 700 Td (' + text.replace(/[()\\]/g, '\\$&') + ') Tj ET'
      : '';
    const content = add(
      '<< /Length ' +
        Buffer.byteLength(stream) +
        ' >>\nstream\n' +
        stream +
        '\nendstream',
    );
    const page = add(
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ' +
        font +
        ' 0 R >> >> /Contents ' +
        content +
        ' 0 R >>',
    );
    kids.push(page);
  }
  objects[1] =
    '<< /Type /Pages /Kids [' +
    kids.map((id) => id + ' 0 R').join(' ') +
    '] /Count ' +
    kids.length +
    ' >>';
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((value, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += i + 1 + ' 0 obj\n' + value + '\nendobj\n';
  });
  const xref = Buffer.byteLength(pdf);
  pdf +=
    'xref\n0 ' +
    (objects.length + 1) +
    '\n0000000000 65535 f \n' +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, '0') + ' 00000 n \n')
      .join('') +
    'trailer\n<< /Size ' +
    (objects.length + 1) +
    ' /Root 1 0 R >>\nstartxref\n' +
    xref +
    '\n%%EOF';
  return Buffer.from(pdf);
}
