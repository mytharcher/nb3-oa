/** Snapshot only the selected, authorized reading surface; never the surrounding app. */
export function createPrintSnapshot(surface: HTMLElement): HTMLElement {
  const copy = surface.cloneNode(true) as HTMLElement;
  if (document.documentElement.classList.contains('dark'))
    copy.dataset.printDark = 'true';
  const sourceNodes = [surface, ...surface.querySelectorAll<HTMLElement>('*')];
  const copyNodes = [copy, ...copy.querySelectorAll<HTMLElement>('*')];
  sourceNodes.forEach((source, index) => {
    const target = copyNodes[index];
    const style = getComputedStyle(source);
    // Capture layout without waiting for external stylesheets in the print document.
    for (const key of Array.from(style))
      target.style.setProperty(key, style.getPropertyValue(key));
    // Computed auto heights become pixels. Let normal-flow content grow when
    // printing unfolds history, while retaining badge, avatar and field sizing.
    if (
      ['block', 'flex', 'grid', 'flow-root'].includes(style.display) &&
      !['absolute', 'fixed'].includes(style.position) &&
      !source.matches('input, textarea, select')
    ) {
      target.style.height = 'auto';
      target.style.maxHeight = 'none';
    }
    for (const attribute of Array.from(target.attributes))
      if (attribute.name.startsWith('on'))
        target.removeAttribute(attribute.name);
    if (source instanceof HTMLInputElement) {
      if (source.type === 'hidden' || source.type === 'file') target.remove();
      else {
        const value = document.createElement('span');
        value.className = 'print-field';
        value.style.cssText = target.style.cssText;
        value.textContent = ['checkbox', 'radio'].includes(source.type)
          ? source.checked
            ? '☑'
            : '☐'
          : source.type === 'password'
            ? '••••'
            : source.value || '________________';
        target.replaceWith(value);
      }
    } else if (
      source instanceof HTMLTextAreaElement ||
      source instanceof HTMLSelectElement
    ) {
      const value = document.createElement('div');
      value.className = 'print-field';
      value.style.cssText = target.style.cssText;
      value.textContent =
        source instanceof HTMLSelectElement
          ? Array.from(source.selectedOptions)
              .map((option) => option.text)
              .join(', ')
          : source.value || '\n\n';
      target.replaceWith(value);
    }
  });
  copy
    .querySelectorAll(
      'script, iframe, object, embed, [data-print-exclude], [data-slot="dialog-close"], [data-slot="route-overlay-footer"], [data-slot="route-overlay-content"]',
    )
    .forEach((node) => node.remove());
  copy.querySelectorAll('button, a').forEach((node) => {
    if (
      node instanceof HTMLButtonElement &&
      node.type === 'submit' &&
      !['switch', 'checkbox', 'radio'].includes(node.getAttribute('role') ?? '')
    ) {
      node.remove();
      return;
    }
    const text = document.createElement('span');
    text.className = 'print-field';
    text.style.cssText = (node as HTMLElement).style.cssText;
    if (
      ['switch', 'checkbox', 'radio'].includes(node.getAttribute('role') ?? '')
    )
      text.textContent =
        node.getAttribute('aria-checked') === 'true' ? '☑' : '☐';
    else text.append(...Array.from(node.childNodes));
    node.replaceWith(text);
  });
  return copy;
}

export const printSurfaceStyles = `
  @page { size: A4; margin: 15mm; }
  html, body { margin: 0; background: white; color: black; font: 12pt/1.5 sans-serif; }
  * { box-shadow: none !important; text-shadow: none !important;
    overflow: visible !important; max-height: none !important;
    animation: none !important; transition: none !important;
    print-color-adjust: exact; -webkit-print-color-adjust: exact;
  }
  /* Keep the original padding, gaps, typography, borders and inner layout.
     Only the modal shell and its scroll viewport need a paper presentation. */
  [data-slot="route-overlay-content"] {
    position: static !important; transform: none !important;
    display: block !important; height: auto !important; min-height: 0 !important;
    max-width: 100% !important; margin: 0 auto !important;
  }
  [data-slot="route-overlay-header"], [data-slot="route-overlay-body"] {
    width: auto !important; height: auto !important; min-height: 0 !important;
  }
  [data-print-expanded] { display: block !important; height: auto !important; }
  .sr-only, [data-slot="skeleton"] { display: none !important; }
  [data-print-dark], [data-print-dark] * {
    color: #171717 !important; background: white !important; border-color: #d4d4d4 !important;
  }
  h1, h2, h3, dt { break-after: avoid; }
  tr, .print-field { break-inside: avoid; }
  .print-field { min-width: 2em; white-space: pre-wrap !important; }
  .truncate { white-space: normal !important; overflow-wrap: anywhere !important; }
  table { max-width: 100% !important; }
`;

/** Native printing supports paper and the browser's Save as PDF destination. */
export async function printSurface(surface: HTMLElement): Promise<void> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText =
    'position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0';
  document.body.append(frame);
  try {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) throw new Error('Print document unavailable');
    doc.title =
      surface.querySelector('[data-slot="dialog-title"]')?.textContent ??
      document.title;
    doc.documentElement.lang = document.documentElement.lang;
    const style = doc.createElement('style');
    style.textContent = printSurfaceStyles;
    doc.head.append(style);
    doc.body.append(doc.importNode(createPrintSnapshot(surface), true));
    await doc.fonts?.ready;
    win.addEventListener('afterprint', () => frame.remove(), { once: true });
    win.focus();
    win.print();
  } catch (error) {
    frame.remove();
    throw error;
  }
}
