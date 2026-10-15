import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { TrafficSource } from '../../types';
import ChartTooltip from './ChartTooltip';
import { SERIES_COLORS } from './chartTheme';

interface TrafficSourcesChartProps {
  data: TrafficSource[];
}

const TrafficSourcesChart = ({ data }: TrafficSourcesChartProps) => {
  const total = data.reduce((sum, source) => sum + source.visitors, 0);

  return (
    <div className="traffic-sources">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="visitors"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((source, index) => (
              <Cell
                key={source.name}
                fill={SERIES_COLORS[index % SERIES_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* The legend doubles as a mini breakdown table */}
      <ul className="traffic-sources__list">
        {data.map((source, index) => (
          <li key={source.name} className="traffic-sources__item">
            <span
              className="traffic-sources__swatch"
              style={{
                background: SERIES_COLORS[index % SERIES_COLORS.length],
              }}
            />
            <span className="traffic-sources__name">{source.name}</span>
            <span className="traffic-sources__value">
              {source.visitors.toLocaleString()}
            </span>
            <span className="traffic-sources__share">
              {((source.visitors / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrafficSourcesChart;
