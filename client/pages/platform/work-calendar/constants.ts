/** The settings item of the page; keep in step with `PLATFORM_SETTINGS.calendar` on the server. */
export const CALENDAR_SETTINGS = 'oa.platform.calendar';

/** The outlet context the special-days card passes to its dialogs. */
export interface SpecialDaysOutletContext {
  /** The year the card shows. */
  readonly year: number;
  /** Refreshes the card's list after a write. */
  readonly reload: () => void;
}

/** The year in `?year=`, else the current year. */
export function yearOf(searchParams: URLSearchParams): number {
  const value = Number(searchParams.get('year'));
  return Number.isInteger(value) && value >= 1970 && value <= 2200
    ? value
    : new Date().getFullYear();
}
