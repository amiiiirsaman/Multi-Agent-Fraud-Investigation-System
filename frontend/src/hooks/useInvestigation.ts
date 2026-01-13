/**
 * Investigation hook for managing investigation state.
 */

import { useCallback, useState } from 'react';
import type { InvestigationResult, AgentState, WSMessage } from '../types';
import { AGENT_NAMES } from '../utils/constants';

export interface TimelineEvent {
  timestamp: string;
  agent: string;
  status: 'started' | 'completed' | 'error';
  message?: string;
}

interface UseInvestigationReturn {
  investigation: InvestigationResult | null;
  agentStates: AgentState[];
  timeline: TimelineEvent[];
  finalDecision: string | null;
  isInvestigating: boolean;
  startInvestigation: (transactionId: string) => void;
  handleWSMessage: (message: WSMessage) => void;
  resetInvestigation: () => void;
}

const initialAgents: AgentState[] = [
  { name: AGENT_NAMES.RISK_ANALYST, status: 'idle', result: null },
  { name: AGENT_NAMES.FRAUD_INVESTIGATOR, status: 'idle', result: null },
  { name: AGENT_NAMES.COMPLIANCE_OFFICER, status: 'idle', result: null },
];

export function useInvestigation(): UseInvestigationReturn {
  const [investigation, setInvestigation] = useState<InvestigationResult | null>(null);
  const [agentStates, setAgentStates] = useState<AgentState[]>(initialAgents);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [finalDecision, setFinalDecision] = useState<string | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);

  const addTimelineEvent = useCallback((event: TimelineEvent) => {
    setTimeline(prev => [...prev, event]);
  }, []);

  const updateAgentStatus = useCallback((agentName: string, status: AgentState['status'], result?: AgentState['result']) => {
    setAgentStates(prev => prev.map(agent => 
      agent.name === agentName 
        ? { ...agent, status, result: result ?? agent.result }
        : agent
    ));
  }, []);

  const startInvestigation = useCallback((transactionId: string) => {
    setIsInvestigating(true);
    setAgentStates(initialAgents);
    setTimeline([]);
    setFinalDecision(null);
    setInvestigation({
      transaction_id: transactionId,
      timestamp: new Date().toISOString(),
      steps: [],
      risk_analysis: null,
      fraud_investigation: null,
      compliance_check: null,
      final_decision: '',
      status: 'pending',
    });
    addTimelineEvent({
      timestamp: new Date().toISOString(),
      agent: 'System',
      status: 'started',
      message: 'Investigation started',
    });
  }, [addTimelineEvent]);

  const handleWSMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'investigation_start':
        setIsInvestigating(true);
        break;

      case 'agent_thinking':
        if (message.data && typeof message.data === 'object') {
          const data = message.data as { agent?: string; message?: string };
          if (data.agent) {
            updateAgentStatus(data.agent, 'thinking');
            addTimelineEvent({
              timestamp: new Date().toISOString(),
              agent: data.agent,
              status: 'started',
              message: data.message || `${data.agent} analyzing...`,
            });
          }
        }
        break;

      case 'agent_result':
        if (message.data && typeof message.data === 'object') {
          const data = message.data as { agent?: string; result?: AgentState['result'] };
          if (data.agent && data.result) {
            updateAgentStatus(data.agent, 'complete', data.result);
            addTimelineEvent({
              timestamp: new Date().toISOString(),
              agent: data.agent,
              status: 'completed',
              message: `${data.agent} completed analysis`,
            });
            
            // Update investigation with agent result
            setInvestigation(prev => {
              if (!prev) return prev;
              const agentKey = data.agent === AGENT_NAMES.RISK_ANALYST 
                ? 'risk_analysis'
                : data.agent === AGENT_NAMES.FRAUD_INVESTIGATOR
                ? 'fraud_investigation'
                : 'compliance_check';
              
              return {
                ...prev,
                [agentKey]: data.result,
              };
            });
          }
        }
        break;

      case 'investigation_complete':
        setIsInvestigating(false);
        if (message.result) {
          setInvestigation(message.result);
          setFinalDecision(message.result.final_decision || null);
        }
        addTimelineEvent({
          timestamp: new Date().toISOString(),
          agent: 'System',
          status: 'completed',
          message: 'Investigation complete',
        });
        break;

      case 'investigation_error':
        setIsInvestigating(false);
        setInvestigation(prev => prev ? {
          ...prev,
          status: 'error',
          error: message.error,
        } : null);
        addTimelineEvent({
          timestamp: new Date().toISOString(),
          agent: 'System',
          status: 'error',
          message: message.error || 'Investigation failed',
        });
        break;
    }
  }, [updateAgentStatus, addTimelineEvent]);

  const resetInvestigation = useCallback(() => {
    setInvestigation(null);
    setAgentStates(initialAgents);
    setTimeline([]);
    setFinalDecision(null);
    setIsInvestigating(false);
  }, []);

  return {
    investigation,
    agentStates,
    timeline,
    finalDecision,
    isInvestigating,
    startInvestigation,
    handleWSMessage,
    resetInvestigation,
  };
}
