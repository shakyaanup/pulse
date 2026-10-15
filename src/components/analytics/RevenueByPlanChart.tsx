import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RevenueByPlanPoint } from '../../types';
import { formatCurrency } from '../../utils';
import ChartTooltip from './ChartTooltip';
import {
  AXIS_TICK,
  CHART_COLORS,
  GRID_COLOR,
  LEGEND_STYLE,
  compactNumber,
} from './chartTheme';

interface RevenueByPlanChartProps {
  data: RevenueByPlanPoint[];
}

// Bars sharing a stackId are drawn on top of each other
const RevenueByPlanChart = ({ data }: RevenueByPlanChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `$${compactNumber(value)}`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
          content={<ChartTooltip valueFormatter={formatCurrency} />}
        />
        {/* itemSorter={null} keeps legend in drawing order (default is A-Z) */}
        <Legend wrapperStyle={LEGEND_STYLE} itemSorter={null} />
        <Bar
          dataKey="starter"
          name="Starter"
          stackId="revenue"
          fill={CHART_COLORS.accent}
        />
        <Bar
          dataKey="growth"
          name="Growth"
          stackId="revenue"
          fill={CHART_COLORS.primary}
        />
        <Bar
          dataKey="enterprise"
          name="Enterprise"
          stackId="revenue"
          fill={CHART_COLORS.amber}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueByPlanChart;
