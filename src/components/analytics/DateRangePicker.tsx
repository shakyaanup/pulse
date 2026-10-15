import clsx from 'clsx';
import { DateRange } from '../../types';

export const DATE_RANGE_OPTIONS: {
  value: DateRange;
  label: string;
  description: string;
}[] = [
  { value: '7d', label: '7D', description: 'Last 7 days' },
  { value: '30d', label: '30D', description: 'Last 30 days' },
  { value: '90d', label: '90D', description: 'Last 90 days' },
  { value: '12m', label: '12M', description: 'Last 12 months' },
];

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
  return (
    <div className="date-range-picker" role="group" aria-label="Date range">
      {DATE_RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.description}
          aria-pressed={option.value === value}
          className={clsx(
            'date-range-picker__option',
            option.value === value && 'date-range-picker__option--active'
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangePicker;
