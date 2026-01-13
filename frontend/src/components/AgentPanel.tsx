/**
 * Agent Panel component - Shows agent status and results.
 */

import type { AgentState } from '../types';
import { RiskBadge } from './RiskBadge';
import { Pause, Loader, CheckCircle, XCircle, AlertTriangle, Check, Info, ChevronRight } from 'lucide-react';

interface AgentPanelProps {
  agent: AgentState;
}

export function AgentPanel({ agent }: AgentPanelProps) {
  const getStatusIcon = (status: AgentState['status']) => {
    switch (status) {
      case 'idle': return <Pause size={16} />;
      case 'thinking': return <Loader size={16} className="spinnerIcon" />;
      case 'complete': return <CheckCircle size={16} style={{ color: 'var(--success)' }} />;
      case 'error': return <XCircle size={16} style={{ color: 'var(--danger)' }} />;
    }
  };

  return (
    <div className="agentPanel fadeIn">
      <div className="agentName">
        <span>{getStatusIcon(agent.status)}</span>
        <span>{agent.name}</span>
        <span className={`agentStatus ${agent.status}`}>
          {agent.status === 'thinking' ? 'Analyzing...' : agent.status}
        </span>
      </div>

      {agent.status === 'thinking' && (
        <div className="flex itemsCenter gap-sm mt-md">
          <div className="spinner" />
          <span className="textMuted">Processing transaction data...</span>
        </div>
      )}

      {agent.status === 'complete' && agent.result && (
        <div className="mt-md">
          {renderAgentResult(agent.name, agent.result)}
        </div>
      )}
    </div>
  );
}

/**
 * Explanation Box component - Displays agent reasoning in a highlighted box.
 */
function ExplanationBox({ title, explanation, variant = 'info' }: { 
  title: string; 
  explanation: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
}) {
  const variantStyles: Record<string, { bg: string; border: string; icon: string }> = {
    info: { bg: 'var(--surface)', border: 'var(--accent)', icon: 'var(--accent)' },
    success: { bg: 'rgba(29, 129, 2, 0.1)', border: 'var(--success)', icon: 'var(--success)' },
    warning: { bg: 'rgba(255, 153, 0, 0.1)', border: 'var(--warning)', icon: 'var(--warning)' },
    danger: { bg: 'rgba(209, 50, 18, 0.1)', border: 'var(--danger)', icon: 'var(--danger)' },
  };
  
  const style = variantStyles[variant];
  
  return (
    <div style={{ 
      backgroundColor: style.bg, 
      padding: '0.75rem', 
      borderRadius: 'var(--radius-md)',
      borderLeft: `3px solid ${style.border}`,
      marginTop: '0.75rem'
    }}>
      <div className="flex itemsCenter gap-sm" style={{ marginBottom: '0.25rem' }}>
        <Info size={14} style={{ color: style.icon }} />
        <span className="textSecondary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>{explanation}</p>
    </div>
  );
}

/**
 * Score Breakdown component - Shows contributing factors.
 */
function ScoreBreakdown({ breakdown }: { breakdown: { method: string; factors: Array<{ name: string; contribution: number; reason: string }> } }) {
  if (!breakdown?.factors?.length) return null;
  
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <span className="textSecondary" style={{ fontSize: '0.75rem' }}>Score Breakdown ({breakdown.method}):</span>
      <div style={{ marginTop: '0.5rem' }}>
        {breakdown.factors.map((factor, i) => (
          <div key={i} className="flex itemsCenter gap-sm" style={{ marginBottom: '0.35rem' }}>
            <ChevronRight size={12} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{factor.name}</span>
            <span style={{ 
              fontSize: '0.7rem', 
              backgroundColor: 'var(--accent)', 
              color: 'var(--bg)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontWeight: 600
            }}>
              +{(factor.contribution * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderAgentResult(_agentName: string, result: AgentState['result']) {
  if (!result) return null;

  // Risk Analyst result
  if ('risk_score' in result) {
    const variant = result.risk_level === 'Low' ? 'success' : 
                    result.risk_level === 'Medium' ? 'warning' : 'danger';
    
    return (
      <div>
        <div className="flex itemsCenter gap-sm mb-sm">
          <span className="textSecondary">Risk Level:</span>
          <RiskBadge level={result.risk_level} score={result.risk_score} />
        </div>
        
        {/* Primary Explanation */}
        {result.explanation && (
          <ExplanationBox 
            title="Why this score?" 
            explanation={result.explanation}
            variant={variant}
          />
        )}
        
        {/* Score Breakdown */}
        {result.score_breakdown && (
          <ScoreBreakdown breakdown={result.score_breakdown} />
        )}
        
        {/* Routing Decision */}
        {result.routing_reason && (
          <ExplanationBox 
            title={result.escalated ? "Escalation Reason" : "Approval Reason"}
            explanation={result.routing_reason}
            variant={result.escalated ? 'warning' : 'success'}
          />
        )}
        
        {result.patterns && result.patterns.length > 0 && (
          <div className="mb-sm" style={{ marginTop: '0.75rem' }}>
            <span className="textSecondary">Patterns Detected:</span>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              {result.patterns.map((pattern, i) => (
                <li key={i} className="textMuted" style={{ fontSize: '0.875rem' }}>{pattern}</li>
              ))}
            </ul>
          </div>
        )}

        {result.risk_factors && result.risk_factors.length > 0 && (
          <div>
            <span className="textSecondary">Risk Factors:</span>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              {result.risk_factors.map((factor, i) => (
                <li key={i} className="textMuted" style={{ fontSize: '0.875rem' }}>{factor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Fraud Investigator result
  if ('recommendation' in result && 'fraud_indicators' in result) {
    const variant = result.recommendation === 'APPROVE' ? 'success' :
                    result.recommendation === 'REVIEW' ? 'warning' : 'danger';
    
    return (
      <div>
        <div className="flex itemsCenter gap-sm mb-sm">
          <span className="textSecondary">Recommendation:</span>
          <span className={`decision ${result.recommendation.toLowerCase()}`}>
            {result.recommendation}
          </span>
        </div>
        
        <div className="flex itemsCenter gap-sm mb-sm">
          <span className="textSecondary">Fraud Likelihood:</span>
          <RiskBadge level={result.fraud_likelihood} />
        </div>

        <div className="flex itemsCenter gap-sm mb-sm">
          <span className="textSecondary">Confidence:</span>
          <span>{(result.confidence * 100).toFixed(0)}%</span>
        </div>

        {result.fraud_indicators && result.fraud_indicators.length > 0 && (
          <div className="mb-sm">
            <span className="textSecondary">Fraud Indicators:</span>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              {result.fraud_indicators.map((indicator, i) => (
                <li key={i} className="textDanger" style={{ fontSize: '0.875rem' }}>{indicator}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Explanation with variant styling */}
        {result.explanation && (
          <ExplanationBox 
            title="Investigation Reasoning" 
            explanation={result.explanation}
            variant={variant}
          />
        )}
      </div>
    );
  }

  // Compliance result
  if ('sar_required' in result) {
    const hasIssues = result.sar_required || result.ctr_required || 
                      (result.aml_violations?.length > 0) || (result.kyc_flags?.length > 0);
    
    return (
      <div>
        <div className="flex itemsCenter gap-sm mb-sm">
          <span className="textSecondary">SAR Required:</span>
          <span className={result.sar_required ? 'textDanger flex itemsCenter gap-sm' : 'textSuccess flex itemsCenter gap-sm'}>
            {result.sar_required ? <><AlertTriangle size={14} /> Yes</> : <><Check size={14} /> No</>}
          </span>
        </div>
        
        {result.ctr_required && (
          <div className="flex itemsCenter gap-sm mb-sm">
            <span className="textSecondary">CTR Required:</span>
            <span className="textWarning flex itemsCenter gap-sm">
              <AlertTriangle size={14} /> Yes (transaction &gt;$10,000)
            </span>
          </div>
        )}

        {/* Compliance Summary Explanation */}
        {result.compliance_summary && (
          <ExplanationBox 
            title="Compliance Summary" 
            explanation={result.compliance_summary}
            variant={hasIssues ? 'warning' : 'success'}
          />
        )}

        {result.sar_required && result.sar_reason && (
          <div className="mb-sm" style={{ marginTop: '0.5rem' }}>
            <span className="textSecondary">SAR Reason:</span>
            <p className="textMuted" style={{ fontSize: '0.875rem' }}>{result.sar_reason}</p>
          </div>
        )}

        {result.aml_violations && result.aml_violations.length > 0 && (
          <div className="mb-sm">
            <span className="textSecondary">AML Violations:</span>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              {result.aml_violations.map((violation, i) => (
                <li key={i} className="textDanger" style={{ fontSize: '0.875rem' }}>{violation}</li>
              ))}
            </ul>
          </div>
        )}

        {result.regulatory_actions && result.regulatory_actions.length > 0 && (
          <div>
            <span className="textSecondary">Required Actions:</span>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              {result.regulatory_actions.map((action, i) => (
                <li key={i} className="textWarning" style={{ fontSize: '0.875rem' }}>{action}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return null;
}
