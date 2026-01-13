/**
 * TypeScript types for the Fraud Investigation System.
 */

// Risk levels
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// Decision types
export type Decision = 'APPROVE' | 'DECLINE' | 'REVIEW';

// Transaction interface
export interface Transaction {
  transaction_id: string;
  timestamp: string;
  from_account: string;
  to_account: string;
  amount: number;
  merchant_category: string;
  device_id: string;
  location: string;
  hour: number;
  day_of_week: string;
  velocity: number;
  is_fraud: number;
  fraud_reason: string;
}

// Agent result interfaces
export interface ScoreBreakdownFactor {
  name: string;
  contribution: number;
  reason: string;
}

export interface ScoreBreakdown {
  method: string;
  factors: ScoreBreakdownFactor[];
  total_score: number;
}

export interface RiskAnalysisResult {
  agent: string;
  risk_level: RiskLevel;
  risk_score: number;
  patterns: string[];
  risk_factors: string[];
  monitoring_actions: string[];
  prevention_strategies: string[];
  network_analysis?: string;
  // New explanation fields
  explanation?: string;
  score_breakdown?: ScoreBreakdown;
  routing_reason?: string;
  escalated?: boolean;
}

export interface FraudInvestigationResult {
  agent: string;
  fraud_likelihood: RiskLevel | 'Unknown';
  recommendation: Decision;
  fraud_indicators: string[];
  explanation: string;
  confidence: number;
  suggested_actions: string[];
}

export interface ComplianceCheckResult {
  agent: string;
  sar_required: boolean;
  sar_reason: string;
  ctr_required: boolean;
  aml_violations: string[];
  kyc_flags: string[];
  regulatory_actions: string[];
  compliance_notes: string;
  risk_rating: RiskLevel;
  reporting_deadline?: string;
  // New explanation field
  compliance_summary?: string;
}

// Full investigation result
export interface InvestigationResult {
  transaction_id: string;
  timestamp: string;
  steps: string[];
  risk_analysis: RiskAnalysisResult | null;
  fraud_investigation: FraudInvestigationResult | null;
  compliance_check: ComplianceCheckResult | null;
  final_decision: Decision | '';
  decision_reason?: string;
  status: 'pending' | 'completed' | 'error';
  error?: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  total_transactions: number;
  fraud_detected: number;
  fraud_rate: number;
  money_saved: number;
  avg_response_time_ms: number;
  transactions_today: number;
  high_risk_count: number;
}

// Fraud ring
export interface FraudRing {
  ring_id: number;
  accounts: string[];
  modus_operandi: string;
}

// Network graph data
export interface NetworkNode {
  id: string;
  name: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  group: number;
  transactions: number;
  total_amount: number;
  fraud_rate: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  count: number;
  total_amount: number;
  fraud_count: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  fraud_rings: FraudRing[];
}

// Statistics
export interface HourlyStat {
  hour: number;
  count: number;
  fraud_count: number;
  total_amount: number;
  fraud_rate: number;
}

export interface DailyStat {
  day: string;
  count: number;
  fraud_count: number;
  total_amount: number;
  fraud_rate: number;
}

export interface MerchantStat {
  category: string;
  count: number;
  fraud_count: number;
  total_amount: number;
  avg_amount: number;
  fraud_rate: number;
}

// WebSocket message types
export type WSMessageType =
  | 'connected'
  | 'subscribed'
  | 'transaction_new'
  | 'investigation_start'
  | 'agent_thinking'
  | 'agent_result'
  | 'investigation_complete'
  | 'investigation_error'
  | 'metrics_update'
  | 'pong'
  | 'error';

export interface WSMessage {
  type: WSMessageType;
  timestamp?: string;
  transaction_id?: string;
  data?: unknown;
  result?: InvestigationResult;
  transaction?: Transaction;
  message?: string;
  error?: string;
}

// App state
export interface AppState {
  transactions: Transaction[];
  metrics: DashboardMetrics | null;
  activeInvestigation: InvestigationResult | null;
  investigationHistory: InvestigationResult[];
  networkData: NetworkData | null;
  wsConnected: boolean;
  loading: boolean;
  error: string | null;
}

// View types
export type ViewType = 'dashboard' | 'investigation' | 'network';

// Agent status
export type AgentStatus = 'idle' | 'thinking' | 'complete' | 'error';

export interface AgentState {
  name: string;
  status: AgentStatus;
  result: RiskAnalysisResult | FraudInvestigationResult | ComplianceCheckResult | null;
}
