import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import type {
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent';

type CustomTooltipProps = {
  active?: boolean;
  payload?: {
    name: string;
    value: number | string;
    color?: string;
  }[];
  label?: string;
};

interface RevenueChartProps {
  data: {
    month: string;
    revenue: number;
    target: number;
  }[];
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="revenue__chart-tooltip">
      <p>{label}</p>

      {payload.map((entry, index) => (
        <p key={index}>
          <span style={{ background: entry.color }} />
          {entry.name}: ${Number(entry.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const RevenueChart = ({ data }: RevenueChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <defs>
          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="hsl(234, 89%, 64%)"
              stopOpacity={0.3}
            />
            <stop
              offset="100%"
              stopColor="hsl(234, 89%, 64%)"
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="expGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="hsl(173, 58%, 39%)"
              stopOpacity={0.2}
            />
            <stop
              offset="100%"
              stopColor="hsl(173, 58%, 39%)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#2e2e4a"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fill: '#9999bb', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#9999bb', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #2e2e4a',
            borderRadius: '8px',
            color: '#f8f8ff',
          }}
          content={<CustomTooltip />}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="hsl(234, 89%, 64%)"
          strokeWidth={2.5}
          fill="url(#revGradient)"
        />
        <Area
          type="monotone"
          dataKey="target"
          name="Target"
          stroke="hsl(173, 58%, 39%)"
          strokeWidth={2}
          fill="url(#expGradient)"
        />
        <Legend
          wrapperStyle={{
            fontSize: '13px',
            color: '#9999bb',
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
