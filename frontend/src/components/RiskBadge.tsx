/**
 * Risk Badge component.
 */

import { getRiskColor } from '../utils/formatters';

interface RiskBadgeProps {
  level: string;
  score?: number;
}

export function RiskBadge({ level, score }: RiskBadgeProps) {
  return (
    <span className={`badge ${getRiskColor(level)}`}>
      {level}
      {score !== undefined && ` (${(score * 100).toFixed(0)}%)`}
    </span>
  );
}
