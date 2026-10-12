import { useEffect, type ComponentProps } from 'react';
import { Toaster } from '#components/ui/toast';

/** The public toast host has no viewport-position option. Measure application overlays here without changing its generated primitive. */
export function ApplicationToaster(props: ComponentProps<typeof Toaster>) {
  useEffect(() => {
    let frame = 0;
    const root = document.documentElement;
    const observed = new Set<Element>();
    const measure = () => {
      frame = 0;
      const footers = [
        ...document.querySelectorAll('[data-slot="route-overlay-footer"]'),
      ];
      for (const footer of observed) {
        if (!footers.includes(footer)) {
          resize.unobserve(footer);
          observed.delete(footer);
        }
      }
      let bottom = 16;
      for (const footer of footers) {
        if (!observed.has(footer)) {
          observed.add(footer);
          resize.observe(footer);
        }
        const rect = footer.getBoundingClientRect();
        if (rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight)
          bottom = Math.max(bottom, window.innerHeight - rect.top + 8);
      }
      root.style.setProperty('--oa-toast-bottom', `${bottom}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
      window.removeEventListener('resize', schedule);
      root.style.removeProperty('--oa-toast-bottom');
    };
  }, []);
  return <Toaster {...props} />;
}
