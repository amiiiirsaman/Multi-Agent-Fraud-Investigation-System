/**
 * Risk Heatmap component - Transaction risk by hour/day.
 */

import type { HourlyStat } from '../types';
import { CHART_COLORS } from '../utils/constants';

interface RiskHeatmapProps {
  data: HourlyStat[];
}

export function RiskHeatmap({ data }: RiskHeatmapProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxFraudRate = Math.max(...data.map(d => d.fraud_rate), 0.1);

  const getColor = (hour: number) => {
    const stat = data.find(d => d.hour === hour);
    if (!stat) return 'rgba(55, 65, 81, 0.5)';
    
    const intensity = stat.fraud_rate / maxFraudRate;
    if (intensity > 0.7) return CHART_COLORS.danger;
    if (intensity > 0.4) return CHART_COLORS.warning;
    if (intensity > 0.2) return CHART_COLORS.primary;
    return 'rgba(16, 185, 129, 0.5)';
  };

  const getOpacity = (hour: number) => {
    const stat = data.find(d => d.hour === hour);
    if (!stat) return 0.3;
    return 0.4 + (stat.fraud_rate / maxFraudRate) * 0.6;
  };

  return (
    <div className="card">
      <div className="cardHeader">
        <h3 className="cardTitle">🔥 Risk by Hour</h3>
      </div>
      <div className="cardContent">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(12, 1fr)', 
          gap: '4px',
          marginBottom: '1rem'
        }}>
          {hours.map(hour => {
            const stat = data.find(d => d.hour === hour);
            return (
              <div
                key={hour}
                style={{
                  aspectRatio: '1',
                  backgroundColor: getColor(hour),
                  opacity: getOpacity(hour),
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.625rem',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                title={`Hour ${hour}: ${stat ? (stat.fraud_rate * 100).toFixed(1) : 0}% fraud rate, ${stat?.count || 0} transactions`}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                {hour}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex itemsCenter justifyBetween">
          <span className="textMuted" style={{ fontSize: '0.75rem' }}>Low Risk</span>
          <div style={{ 
            display: 'flex', 
            gap: '2px',
            height: '8px',
          }}>
            <div style={{ width: '24px', backgroundColor: 'rgba(16, 185, 129, 0.5)', borderRadius: '2px' }} />
            <div style={{ width: '24px', backgroundColor: CHART_COLORS.primary, borderRadius: '2px' }} />
            <div style={{ width: '24px', backgroundColor: CHART_COLORS.warning, borderRadius: '2px' }} />
            <div style={{ width: '24px', backgroundColor: CHART_COLORS.danger, borderRadius: '2px' }} />
          </div>
          <span className="textMuted" style={{ fontSize: '0.75rem' }}>High Risk</span>
        </div>
      </div>
    </div>
  );
}
