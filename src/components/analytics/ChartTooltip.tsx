interface ChartTooltipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number | string;
    color?: string;
  }[];
  label?: string;
  valueFormatter?: (value: number) => string;
}

// Recharts passes active/payload/label in; we only choose how values are shown
const ChartTooltip = ({
  active,
  payload,
  label,
  valueFormatter = (value) => value.toLocaleString(),
}: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      {label && <p className="chart-tooltip__label">{label}</p>}

      {payload.map((entry) => (
        <p key={entry.name} className="chart-tooltip__row">
          <span
            className="chart-tooltip__swatch"
            style={{ background: entry.color }}
          />
          {entry.name}: {valueFormatter(Number(entry.value))}
        </p>
      ))}
    </div>
  );
};

export default ChartTooltip;
