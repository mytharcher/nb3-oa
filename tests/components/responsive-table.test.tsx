import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { ResponsiveTable } from '#components/responsive-table';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function I18n({ children }: { children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}
let width: number;
let contentWidth: number;
let resize: () => void;
let disconnect: ReturnType<typeof vi.fn>;
const scrollBy = vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
  this.scrollLeft = Math.max(
    0,
    Math.min(contentWidth - width, this.scrollLeft + (options.left ?? 0)),
  );
  this.dispatchEvent(new Event('scroll'));
});
beforeEach(() => {
  width = 300;
  contentWidth = 900;
  disconnect = vi.fn();
  scrollBy.mockClear();
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    () => width,
  );
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
    () => contentWidth,
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      callback: () => void;
      constructor(callback: () => void) {
        this.callback = callback;
      }
      observe(element: HTMLElement) {
        if (element.dataset.slot === 'table-container') {
          resize = this.callback;
          disconnect = this.disconnect;
        }
      }
      disconnect = vi.fn();
    },
  );
  Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
    configurable: true,
    value: scrollBy,
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as Partial<HTMLElement>).scrollBy;
});
function sample() {
  return render(
    <ResponsiveTable>
      <TableHeader>
        <TableRow>
          <TableHead>Record</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>
            <button>Row action</button>
          </TableCell>
        </TableRow>
      </TableBody>
    </ResponsiveTable>,
    { wrapper: I18n },
  );
}
describe('ResponsiveTable', () => {
  it('exposes overflow, scrolls to either edge and observes width changes', async () => {
    const user = userEvent.setup();
    const { unmount } = sample();
    const region = screen.getByRole('region', {
      name: enUS.tableScroll.region,
    });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.getByText(enUS.tableScroll.hint)).toBeInTheDocument();
    const left = screen.getByRole('button', { name: enUS.tableScroll.left });
    const right = screen.getByRole('button', { name: enUS.tableScroll.right });
    expect(left).toBeDisabled();
    for (let step = 0; step < 3; step++) await user.click(right);
    expect(right).toBeDisabled();
    expect(left).toBeEnabled();
    await user.click(left);
    expect(right).toBeEnabled();
    act(() => {
      contentWidth = width;
      resize();
    });
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByText(enUS.tableScroll.hint)).toBeNull();
    act(() => {
      contentWidth = 900;
      resize();
    });
    expect(screen.getByRole('region')).toBeInTheDocument();
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
  it('scrolls with focused-region arrows and preserves nested control keyboard events', () => {
    sample();
    const region = screen.getByRole('region');
    region.focus();
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(scrollBy).toHaveBeenCalledOnce();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Row action' }), {
      key: 'ArrowRight',
    });
    expect(scrollBy).toHaveBeenCalledOnce();
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(scrollBy).toHaveBeenCalledTimes(2);
  });
});
