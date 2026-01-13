/**
 * Category Chart component - Fraud by merchant category.
 */

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { MerchantStat } from '../types';
import { CHART_COLORS } from '../utils/constants';
import { formatPercent } from '../utils/formatters';

interface CategoryChartProps {
  data: MerchantStat[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const sortedData = [...data]
    .sort((a, b) => b.fraud_rate - a.fraud_rate)
    .slice(0, 8);

  const getBarColor = (fraudRate: number) => {
    if (fraudRate > 0.15) return CHART_COLORS.danger;
    if (fraudRate > 0.08) return CHART_COLORS.warning;
    if (fraudRate > 0.03) return CHART_COLORS.primary;
    return CHART_COLORS.success;
  };

  return (
    <div className="card">
      <div className="cardHeader">
        <h3 className="cardTitle">📊 Fraud by Category</h3>
      </div>
      <div className="cardContent" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={sortedData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis 
              type="number"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => formatPercent(value, 0)}
            />
            <YAxis 
              type="category"
              dataKey="category"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              width={75}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number) => [formatPercent(value), 'Fraud Rate']}
            />
            <Bar dataKey="fraud_rate" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.fraud_rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
