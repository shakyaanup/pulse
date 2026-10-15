import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrafficPoint } from '../../types';
import ChartTooltip from './ChartTooltip';
import {
  AXIS_TICK,
  CHART_COLORS,
  GRID_COLOR,
  LEGEND_STYLE,
  compactNumber,
} from './chartTheme';

interface TrafficChartProps {
  data: TrafficPoint[];
}

// Visitors and sign-ups differ ~30x in size, so each line gets its own Y axis
const TrafficChart = ({ data }: TrafficChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={GRID_COLOR}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          yAxisId="visitors"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={compactNumber}
        />
        <YAxis
          yAxisId="signups"
          orientation="right"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={compactNumber}
        />
        <Tooltip content={<ChartTooltip />} />
        {/* itemSorter={null} keeps legend in drawing order (default is A-Z) */}
        <Legend wrapperStyle={LEGEND_STYLE} itemSorter={null} />
        <Line
          yAxisId="visitors"
          type="monotone"
          dataKey="visitors"
          name="Visitors"
          stroke={CHART_COLORS.primary}
          strokeWidth={2.5}
          dot={false}
        />
        <Line
          yAxisId="signups"
          type="monotone"
          dataKey="signups"
          name="Sign-ups"
          stroke={CHART_COLORS.accent}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrafficChart;
