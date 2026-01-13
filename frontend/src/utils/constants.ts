/**
 * Application constants.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/investigations';

export const AGENT_NAMES = {
  RISK_ANALYST: 'Risk Analyst',
  FRAUD_INVESTIGATOR: 'Fraud Investigator',
  COMPLIANCE_OFFICER: 'Compliance Officer',
} as const;

export const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;

export const DECISIONS = ['APPROVE', 'DECLINE', 'REVIEW'] as const;

export const MERCHANT_CATEGORIES = {
  NORMAL: ['Groceries', 'Gas', 'Restaurant', 'Shopping', 'Bills', 'Entertainment'],
  HIGH_RISK: ['Electronics', 'Gift Cards', 'Wire Transfer', 'Crypto', 'Jewelry'],
} as const;

export const COLORS = {
  primary: '#1e3a8a',
  primaryLight: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  bg: '#0a0e27',
  surface: '#111827',
  panel: '#1f2937',
  text: '#ffffff',
  textSecondary: '#9ca3af',
} as const;

export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  pink: '#ec4899',
} as const;
