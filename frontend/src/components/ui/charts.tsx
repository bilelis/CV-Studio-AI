import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  Tooltip,
} from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function BentoSparkline({ data, color = '#111111', height = 50 }: SparklineProps) {
  const chartData = data.map((val, idx) => ({ index: idx, value: val }));

  return (
    <div style={{ width: '100%', height }} className="overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.12}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SlimBarProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

export function BentoSlimBars({ data, color = '#111111', height = 80 }: SlimBarProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#71717A' }}
            dy={4}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-md bg-[#111111] px-2 py-1 text-[11px] text-white shadow-md font-mono">
                    {payload[0].value}%
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} barSize={10} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DonutProps {
  percentage: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function BentoDonut({
  percentage,
  color = '#111111',
  size = 110,
  strokeWidth = 10,
  label,
}: DonutProps) {
  const data = [
    { name: 'Completed', value: percentage },
    { name: 'Remaining', value: Math.max(0, 100 - percentage) },
  ];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            innerRadius={size / 2 - strokeWidth}
            outerRadius={size / 2}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={color} />
            <Cell fill="rgba(0, 0, 0, 0.06)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold font-mono tracking-tight text-[var(--text-main)] tabular-nums">
          {percentage}%
        </span>
        {label && <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{label}</span>}
      </div>
    </div>
  );
}
