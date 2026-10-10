/** The settings item of the page; keep in step with `PLATFORM_SETTINGS.dictionaries` on the server. */
export const DICTIONARIES_SETTINGS = 'oa.platform.dictionaries';

/** The type shown when the URL names none. */
export const DEFAULT_DICTIONARY_TYPE = 'leaveType';

export interface DictionariesOutletContext {
  readonly type: string;
  readonly reload: () => void;
}
