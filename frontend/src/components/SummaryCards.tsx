/**
 * Summary Cards component - KPI metrics display.
 */

import type { DashboardMetrics } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { BarChart3, AlertTriangle, Wallet, Zap, type LucideIcon } from 'lucide-react';

interface SummaryCardsProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

interface MetricCard {
  label: string;
  value: string;
  delta: string;
  deltaType: 'neutral' | 'positive' | 'negative';
  icon: LucideIcon;
  iconColor: string;
}

export function SummaryCards({ metrics, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="metricCard">
            <div className="spinner" />
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const cards: MetricCard[] = [
    {
      label: 'Total Transactions',
      value: formatNumber(metrics.total_transactions),
      delta: `${metrics.transactions_today} today`,
      deltaType: 'neutral',
      icon: BarChart3,
      iconColor: 'var(--accent)',
    },
    {
      label: 'Fraud Detected',
      value: formatNumber(metrics.fraud_detected),
      delta: formatPercent(metrics.fraud_rate),
      deltaType: 'negative',
      icon: AlertTriangle,
      iconColor: 'var(--danger)',
    },
    {
      label: 'Money Saved',
      value: formatCurrency(metrics.money_saved),
      delta: '↑ 18% vs last month',
      deltaType: 'positive',
      icon: Wallet,
      iconColor: 'var(--success)',
    },
    {
      label: 'Avg Response Time',
      value: `${metrics.avg_response_time_ms}ms`,
      delta: '↓ 12ms improvement',
      deltaType: 'positive',
      icon: Zap,
      iconColor: 'var(--warning)',
    },
  ];

  return (
    <div className="grid4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="metricCard fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex itemsCenter justifyBetween mb-sm">
              <Icon size={24} style={{ color: card.iconColor }} />
            </div>
            <div className="metricValue">{card.value}</div>
            <div className="metricLabel">{card.label}</div>
            <div className={`metricDelta ${card.deltaType}`}>
              {card.delta}
            </div>
          </div>
        );
      })}
    </div>
  );
}
