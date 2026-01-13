/**
 * Trend Chart component - Fraud rate over time.
 */

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { CHART_COLORS } from '../utils/constants';
import { formatPercent } from '../utils/formatters';

interface TrendChartProps {
  data: Array<{
    date: string;
    fraud_rate: number;
    count: number;
  }>;
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="card">
      <div className="cardHeader">
        <h3 className="cardTitle">📈 Fraud Detection Trend</h3>
      </div>
      <div className="cardContent" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.danger} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.danger} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => formatPercent(value, 0)}
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
            <Area
              type="monotone"
              dataKey="fraud_rate"
              stroke={CHART_COLORS.danger}
              fillOpacity={1}
              fill="url(#colorFraud)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
