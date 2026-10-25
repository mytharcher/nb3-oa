import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '#components/ui/combobox';
import { Badge } from '#components/ui/badge';
import { useTranslation } from '@nocobase/i18n/client';
export function ChoicePicker({
  choices,
  value,
  onChange,
  label,
  disabled = false,
}: {
  choices: { value: string; label: string; disabled?: boolean }[];
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col gap-2'>
      <Combobox
        multiple
        items={choices}
        value={choices.filter((item) => value.includes(item.value))}
        onValueChange={(items) => onChange(items.map((item) => item.value))}
        disabled={disabled}
        itemToStringLabel={(item) => item.label}
        isItemEqualToValue={(a, b) => a.value === b.value}
      >
        <ComboboxInput aria-label={label} placeholder={label} />
        <ComboboxContent>
          <ComboboxEmpty>{t('access.noResults')}</ComboboxEmpty>
          <ComboboxList>
            {(item: { value: string; label: string; disabled?: boolean }) => (
              <ComboboxItem
                key={item.value}
                value={item}
                disabled={item.disabled}
              >
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <div className='flex flex-wrap gap-1'>
        {choices
          .filter((item) => value.includes(item.value))
          .map((item) => (
            <Badge variant='secondary' key={item.value}>
              {item.label}
            </Badge>
          ))}
      </div>
    </div>
  );
}
