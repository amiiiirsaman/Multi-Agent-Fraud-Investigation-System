/**
 * Tests for useInvestigation hook.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvestigation } from '../useInvestigation';
import type { WSMessage } from '../../types';
import { AGENT_NAMES } from '../../utils/constants';

describe('useInvestigation', () => {
  describe('initial state', () => {
    it('should have null investigation initially', () => {
      const { result } = renderHook(() => useInvestigation());
      expect(result.current.investigation).toBeNull();
    });

    it('should have idle agents initially', () => {
      const { result } = renderHook(() => useInvestigation());
      
      expect(result.current.agentStates).toHaveLength(3);
      result.current.agentStates.forEach(agent => {
        expect(agent.status).toBe('idle');
        expect(agent.result).toBeNull();
      });
    });

    it('should have empty timeline initially', () => {
      const { result } = renderHook(() => useInvestigation());
      expect(result.current.timeline).toHaveLength(0);
    });

    it('should not be investigating initially', () => {
      const { result } = renderHook(() => useInvestigation());
      expect(result.current.isInvestigating).toBe(false);
    });
  });

  describe('startInvestigation', () => {
    it('should set isInvestigating to true', () => {
      const { result } = renderHook(() => useInvestigation());
      
      act(() => {
        result.current.startInvestigation('TXN001');
      });
      
      expect(result.current.isInvestigating).toBe(true);
    });

    it('should add timeline event for start', () => {
      const { result } = renderHook(() => useInvestigation());
      
      act(() => {
        result.current.startInvestigation('TXN001');
      });
      
      expect(result.current.timeline).toHaveLength(1);
      expect(result.current.timeline[0].agent).toBe('System');
      expect(result.current.timeline[0].status).toBe('started');
    });

    it('should initialize investigation with transaction_id', () => {
      const { result } = renderHook(() => useInvestigation());
      
      act(() => {
        result.current.startInvestigation('TXN001');
      });
      
      expect(result.current.investigation?.transaction_id).toBe('TXN001');
      expect(result.current.investigation?.status).toBe('pending');
    });
  });

  describe('handleWSMessage', () => {
    describe('investigation_start', () => {
      it('should set isInvestigating to true', () => {
        const { result } = renderHook(() => useInvestigation());
        
        const message: WSMessage = {
          type: 'investigation_start',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
        };
        
        act(() => {
          result.current.handleWSMessage(message);
        });
        
        expect(result.current.isInvestigating).toBe(true);
      });
    });

    describe('agent_thinking', () => {
      it('should update agent status to thinking', () => {
        const { result } = renderHook(() => useInvestigation());
        
        const message: WSMessage = {
          type: 'agent_thinking',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
          data: {
            agent: AGENT_NAMES.RISK_ANALYST,
            message: 'Analyzing transaction...',
          },
        };
        
        act(() => {
          result.current.handleWSMessage(message);
        });
        
        const riskAgent = result.current.agentStates.find(
          a => a.name === AGENT_NAMES.RISK_ANALYST
        );
        expect(riskAgent?.status).toBe('thinking');
      });

      it('should add timeline event', () => {
        const { result } = renderHook(() => useInvestigation());
        
        const message: WSMessage = {
          type: 'agent_thinking',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
          data: {
            agent: AGENT_NAMES.RISK_ANALYST,
            message: 'Analyzing transaction...',
          },
        };
        
        act(() => {
          result.current.handleWSMessage(message);
        });
        
        expect(result.current.timeline).toHaveLength(1);
        expect(result.current.timeline[0].agent).toBe(AGENT_NAMES.RISK_ANALYST);
        expect(result.current.timeline[0].status).toBe('started');
      });
    });

    describe('agent_result', () => {
      it('should update agent status to complete', () => {
        const { result } = renderHook(() => useInvestigation());
        
        const message: WSMessage = {
          type: 'agent_result',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
          data: {
            agent: AGENT_NAMES.RISK_ANALYST,
            result: {
              risk_score: 0.85,
              risk_level: 'HIGH',
              factors: ['large_amount'],
            },
          },
        };
        
        act(() => {
          result.current.handleWSMessage(message);
        });
        
        const riskAgent = result.current.agentStates.find(
          a => a.name === AGENT_NAMES.RISK_ANALYST
        );
        expect(riskAgent?.status).toBe('complete');
        expect(riskAgent?.result).toBeDefined();
      });

      it('should update investigation with agent result', () => {
        const { result } = renderHook(() => useInvestigation());
        
        // First start investigation
        act(() => {
          result.current.startInvestigation('TXN001');
        });
        
        const message: WSMessage = {
          type: 'agent_result',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
          data: {
            agent: AGENT_NAMES.RISK_ANALYST,
            result: {
              risk_score: 0.85,
              risk_level: 'HIGH',
              factors: ['large_amount'],
            },
          },
        };
        
        act(() => {
          result.current.handleWSMessage(message);
        });
        
        expect(result.current.investigation?.risk_analysis).toBeDefined();
        expect(result.current.investigation?.risk_analysis?.risk_score).toBe(0.85);
      });
    });

    describe('investigation_complete', () => {
      it('should set isInvestigating to false', () => {
        const { result } = renderHook(() => useInvestigation());
        
        // Start first
        act(() => {
          result.current.startInvestigation('TXN001');
        });
        
        const message: WSMessage = {
          type: 'investigation_complete',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
          result: {
            transaction_id: 'TXN001',
            timestamp: new Date().toISOString(),
            steps: [],
            risk_analysis: { risk_score: 0.85 },
            fraud_investigation: { is_fraud: true },
            compliance_check: { compliant: false },
            final_decision: 'DECLINE',
            status: 'completed',
          },
        };
        
        act(() => {
          result.current.handleWSMessage(message);
        });
        
        expect(result.current.isInvestigating).toBe(false);
      });

      it('should set final decision', () => {
        const { result } = renderHook(() => useInvestigation());
        
        const message: WSMessage = {
          type: 'investigation_complete',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
          result: {
            transaction_id: 'TXN001',
            timestamp: new Date().toISOString(),
            steps: [],
            risk_analysis: null,
            fraud_investigation: null,
            compliance_check: null,
            final_decision: 'DECLINE',
            status: 'completed',
          },
        };
        
        act(() => {
          result.current.handleWSMessage(message);
        });
        
        expect(result.current.finalDecision).toBe('DECLINE');
      });

      it('should add complete event to timeline', () => {
        const { result } = renderHook(() => useInvestigation());
        
        const message: WSMessage = {
          type: 'investigation_complete',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
          result: {
            transaction_id: 'TXN001',
            timestamp: new Date().toISOString(),
            steps: [],
            risk_analysis: null,
            fraud_investigation: null,
            compliance_check: null,
            final_decision: 'APPROVE',
            status: 'completed',
          },
        };
        
        act(() => {
          result.current.handleWSMessage(message);
        });
        
        const completeEvent = result.current.timeline.find(
          e => e.status === 'completed' && e.agent === 'System'
        );
        expect(completeEvent).toBeDefined();
      });
    });

    describe('investigation_error', () => {
      it('should set isInvestigating to false', () => {
        const { result } = renderHook(() => useInvestigation());
        
        act(() => {
          result.current.startInvestigation('TXN001');
        });
        
        const message: WSMessage = {
          type: 'investigation_error',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
          error: 'Something went wrong',
        };
        
        act(() => {
          result.current.handleWSMessage(message);
        });
        
        expect(result.current.isInvestigating).toBe(false);
      });

      it('should add error event to timeline', () => {
        const { result } = renderHook(() => useInvestigation());
        
        act(() => {
          result.current.startInvestigation('TXN001');
        });
        
        const message: WSMessage = {
          type: 'investigation_error',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
          error: 'Connection failed',
        };
        
        act(() => {
          result.current.handleWSMessage(message);
        });
        
        const errorEvent = result.current.timeline.find(e => e.status === 'error');
        expect(errorEvent).toBeDefined();
        expect(errorEvent?.message).toContain('Connection failed');
      });
    });
  });

  describe('resetInvestigation', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useInvestigation());
      
      // Start and complete investigation
      act(() => {
        result.current.startInvestigation('TXN001');
      });
      
      act(() => {
        result.current.handleWSMessage({
          type: 'investigation_complete',
          transaction_id: 'TXN001',
          timestamp: new Date().toISOString(),
          result: {
            transaction_id: 'TXN001',
            timestamp: new Date().toISOString(),
            steps: [],
            risk_analysis: null,
            fraud_investigation: null,
            compliance_check: null,
            final_decision: 'APPROVE',
            status: 'completed',
          },
        });
      });
      
      // Reset
      act(() => {
        result.current.resetInvestigation();
      });
      
      expect(result.current.investigation).toBeNull();
      expect(result.current.timeline).toHaveLength(0);
      expect(result.current.finalDecision).toBeNull();
      expect(result.current.isInvestigating).toBe(false);
      result.current.agentStates.forEach(agent => {
        expect(agent.status).toBe('idle');
      });
    });
  });
});

describe('Agent name matching', () => {
  it('should have correct agent names from constants', () => {
    expect(AGENT_NAMES.RISK_ANALYST).toBe('Risk Analyst');
    expect(AGENT_NAMES.FRAUD_INVESTIGATOR).toBe('Fraud Investigator');
    expect(AGENT_NAMES.COMPLIANCE_OFFICER).toBe('Compliance Officer');
  });
});
