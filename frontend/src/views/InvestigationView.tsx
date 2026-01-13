/**
 * Investigation View - Multi-agent investigation panel.
 */

import { useRef, useEffect } from 'react';
import type { Transaction, AgentState } from '../types';
import type { TimelineEvent } from '../hooks/useInvestigation';
import { AgentPanel } from '../components/AgentPanel';
import { TimelineStep } from '../components/TimelineStep';
import { LiveInvestigationPanel } from '../components/LiveInvestigationPanel';
import HowItWorksPanel from '../components/HowItWorksPanel';
import { formatCurrency, formatDateTime, getDecisionColor } from '../utils/formatters';
import { 
  Search, 
  FileText, 
  Scale, 
  ClipboardList, 
  Bot, 
  Play, 
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface InvestigationViewProps {
  transaction: Transaction | null;
  agentStates: AgentState[];
  timeline: TimelineEvent[];
  finalDecision: string | null;
  isInvestigating: boolean;
  onInvestigate: () => void;
  onInvestigateCustom: (tx: Transaction) => void;
  onReset: () => void;
}

export function InvestigationView({
  transaction,
  agentStates,
  timeline,
  finalDecision,
  isInvestigating,
  onInvestigate,
  onInvestigateCustom,
  onReset,
}: InvestigationViewProps) {
  const analysisRef = useRef<HTMLDivElement>(null);

  // Scroll to Multi-Agent Analysis when investigation starts
  useEffect(() => {
    if (isInvestigating && analysisRef.current) {
      analysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isInvestigating]);

  return (
    <div className="fadeIn">
      {/* How It Works - Collapsible explanation panel */}
      <HowItWorksPanel />

      {/* Live Investigation Panel - Form only, collapses on submit */}
      <LiveInvestigationPanel
        onInvestigate={onInvestigateCustom}
        isInvestigating={isInvestigating}
        onReset={onReset}
        forceCollapse={isInvestigating}
      />

      {/* Selected Transaction Investigation */}
      {!transaction ? (
        <div className="card">
          <div className="cardContent" style={{ textAlign: 'center', padding: '4rem' }}>
            <Search size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 className="mb-md">No Transaction Selected</h3>
            <p className="textMuted">
              Select a transaction from the Dashboard or use the Live Investigation panel above to test custom transactions.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid2">
        {/* Left Column - Transaction & Controls */}
        <div>
          {/* Transaction Details Card */}
          <div className="card mb-lg">
            <div className="cardHeader">
              <h3 className="cardTitle">
                <FileText size={18} />
                Transaction Details
              </h3>
              <span className={`badge ${transaction.is_fraud ? 'high' : 'low'}`}>
                {transaction.is_fraud ? 'FLAGGED' : 'NORMAL'}
              </span>
            </div>
            <div className="cardContent">
              <div className="grid2" style={{ gap: '1rem' }}>
                <div>
                  <span className="textMuted">Transaction ID</span>
                  <p style={{ fontWeight: 600 }}>{transaction.transaction_id}</p>
                </div>
                <div>
                  <span className="textMuted">Amount</span>
                  <p style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--warning)' }}>
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
                <div>
                  <span className="textMuted">From Account</span>
                  <p>{transaction.from_account}</p>
                </div>
                <div>
                  <span className="textMuted">To Account</span>
                  <p>{transaction.to_account}</p>
                </div>
                <div>
                  <span className="textMuted">Merchant</span>
                  <p>{transaction.merchant_category}</p>
                </div>
                <div>
                  <span className="textMuted">Location</span>
                  <p>{transaction.location}</p>
                </div>
                <div>
                  <span className="textMuted">Time</span>
                  <p>{formatDateTime(transaction.timestamp)}</p>
                </div>
                <div>
                  <span className="textMuted">Device</span>
                  <p>{transaction.device_id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-md mb-lg">
            <button
              className="btn btnPrimary"
              onClick={onInvestigate}
              disabled={isInvestigating}
              style={{ flex: 1 }}
            >
              {isInvestigating ? (
                <>
                  <div className="spinner" />
                  Investigating...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start Investigation
                </>
              )}
            </button>
            <button
              className="btn btnSecondary"
              onClick={onReset}
              disabled={isInvestigating}
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>

          {/* Final Decision */}
          {finalDecision && (
            <div className="card mb-lg">
              <div className="cardHeader">
                <h3 className="cardTitle">
                  <Scale size={18} />
                  Final Decision
                </h3>
              </div>
              <div className="cardContent" style={{ textAlign: 'center' }}>
                <div
                  className={`decision ${getDecisionColor(finalDecision)}`}
                  style={{ fontSize: '1.5rem', padding: '1rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {finalDecision === 'DECLINE' && <AlertCircle size={24} />}
                  {finalDecision === 'APPROVE' && <CheckCircle2 size={24} />}
                  {finalDecision === 'REVIEW' && <AlertTriangle size={24} />}
                  {finalDecision}
                </div>
                {/* Decision Summary - Bulleted format with all agents */}
                {(() => {
                  const riskAgent = agentStates.find(a => a.name === 'Risk Analyst');
                  const fraudAgent = agentStates.find(a => a.name === 'Fraud Investigator');
                  const complianceAgent = agentStates.find(a => a.name === 'Compliance Officer');
                  const riskResult = riskAgent?.result;
                  const fraudResult = fraudAgent?.result;
                  const complianceResult = complianceAgent?.result;
                  
                  // Build bulleted summary from all agents
                  const summaryItems: Array<{ label: string; value: string; color?: string }> = [];
                  
                  // Risk Assessment
                  if (riskResult && 'risk_score' in riskResult && 'risk_level' in riskResult) {
                    const score = (riskResult.risk_score * 100).toFixed(0);
                    summaryItems.push({
                      label: 'Risk Score',
                      value: `${score}% (${riskResult.risk_level})`,
                      color: riskResult.risk_level === 'Low' ? 'var(--success)' :
                             riskResult.risk_level === 'Medium' ? 'var(--warning)' : 'var(--danger)'
                    });
                  }
                  
                  // Fraud Investigation
                  if (fraudResult && 'fraud_likelihood' in fraudResult && 'confidence' in fraudResult) {
                    const confidence = ((fraudResult.confidence || 0) * 100).toFixed(0);
                    summaryItems.push({
                      label: 'Fraud Likelihood',
                      value: `${fraudResult.fraud_likelihood} (${confidence}% confidence)`,
                      color: fraudResult.fraud_likelihood === 'Low' ? 'var(--success)' :
                             fraudResult.fraud_likelihood === 'Medium' ? 'var(--warning)' : 'var(--danger)'
                    });
                  }
                  
                  // Compliance Status
                  if (complianceResult && 'sar_required' in complianceResult) {
                    const sarStatus = complianceResult.sar_required ? 'SAR Required' : 'No Filing Required';
                    const ctrStatus = complianceResult.ctr_required ? ' • CTR Required' : '';
                    summaryItems.push({
                      label: 'Compliance',
                      value: sarStatus + ctrStatus,
                      color: complianceResult.sar_required ? 'var(--warning)' : 'var(--success)'
                    });
                  }
                  
                  // Final Verdict
                  const verdictText = finalDecision === 'APPROVE' ? 'Transaction cleared for processing' :
                                     finalDecision === 'DECLINE' ? 'Transaction blocked due to fraud indicators' :
                                     'Requires manual analyst review';
                  summaryItems.push({
                    label: 'Verdict',
                    value: verdictText,
                    color: finalDecision === 'APPROVE' ? 'var(--success)' :
                           finalDecision === 'DECLINE' ? 'var(--danger)' : 'var(--warning)'
                  });
                  
                  return (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: finalDecision === 'APPROVE' ? 'rgba(29, 129, 2, 0.1)' :
                                       finalDecision === 'DECLINE' ? 'rgba(209, 50, 18, 0.1)' : 'rgba(255, 153, 0, 0.1)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `3px solid ${finalDecision === 'APPROVE' ? 'var(--success)' :
                                               finalDecision === 'DECLINE' ? 'var(--danger)' : 'var(--warning)'}`,
                      textAlign: 'left',
                      maxWidth: '520px',
                      margin: '1rem auto 0'
                    }}>
                      <span className="textSecondary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        Decision Summary
                      </span>
                      <ul style={{ margin: '0.5rem 0 0', paddingLeft: 0, listStyle: 'none' }}>
                        {summaryItems.map((item, idx) => (
                          <li key={idx} style={{ 
                            fontSize: '0.85rem', 
                            lineHeight: 1.7,
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '0.5rem'
                          }}>
                            <span style={{ color: 'var(--text-secondary)', minWidth: '110px' }}>• {item.label}:</span>
                            <span style={{ color: item.color, fontWeight: 500 }}>{item.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Investigation Timeline */}
          {timeline.length > 0 && (
            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">
                  <ClipboardList size={18} />
                  Investigation Timeline
                </h3>
              </div>
              <div className="cardContent">
                <div className="timeline">
                  {timeline.map((event, idx) => (
                    <TimelineStep
                      key={idx}
                      step={{ timestamp: event.timestamp, agent: event.agent, action: event.message || '' }}
                      index={idx}
                      isComplete={event.status === 'completed'}
                      isError={event.status === 'error'}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Agent Panels */}
        <div ref={analysisRef}>
          <div className="card">
            <div className="cardHeader">
              <h3 className="cardTitle">
                <Bot size={18} />
                Multi-Agent Analysis
              </h3>
              <span className="textMuted">
                {agentStates.filter(a => a.status === 'complete').length}/{agentStates.length} complete
              </span>
            </div>
            <div className="cardContent">
              {agentStates.map((agent, idx) => (
                <AgentPanel key={idx} agent={agent} />
              ))}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
