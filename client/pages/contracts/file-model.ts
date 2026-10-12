export function validFile(file: File, purpose: 'text' | 'evidence') {
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const ext = file.name.split('.').at(-1)?.toLowerCase() ?? '';
  return (
    file.size > 0 &&
    file.size <= 5 * 1024 * 1024 &&
    types[ext] === file.type &&
    (purpose !== 'text' || ext === 'pdf')
  );
}
