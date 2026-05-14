import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgressChartProps {
  title: string;
  data: Array<{ date: string; value: number }>;
  unit: string;
  target?: number;
}

export function ProgressChart({ title, data, unit, target }: ProgressChartProps) {
  const chartData = data.map(item => ({
    ...item,
    target: target
  }));

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">{title}</h3>
        {target && (
          <div className="text-sm text-gray-600">
            Target: <span className="font-medium text-teal-600">{target} {unit}</span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            stroke="#e5e7eb"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            stroke="#e5e7eb"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            formatter={(value) => [`${value} ${unit}`, title]}
          />
          <Line
            key="actual-value"
            type="monotone"
            dataKey="value"
            stroke="#00B5BD"
            strokeWidth={2}
            dot={{ fill: '#00B5BD', r: 4 }}
            activeDot={{ r: 6 }}
          />
          {target && (
            <Line
              key="target-line"
              type="monotone"
              dataKey="target"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
