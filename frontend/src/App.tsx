/**
 * Main App component with tab navigation.
 */

import { useState, useCallback, useEffect } from 'react';
import type { Transaction, WSMessage } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { useInvestigation } from './hooks/useInvestigation';
import { DashboardView } from './views/DashboardView';
import { InvestigationView } from './views/InvestigationView';
import { NetworkView } from './views/NetworkView';
import { 
  LayoutDashboard, 
  Search, 
  Network, 
  Shield,
  type LucideIcon 
} from 'lucide-react';

type Tab = 'dashboard' | 'investigation' | 'network';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'investigation', label: 'Investigation', icon: Search },
  { id: 'network', label: 'Network', icon: Network },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const {
    connected,
    connectionStatus,
    subscribe,
    investigate,
  } = useWebSocket();

  const {
    agentStates,
    timeline,
    finalDecision,
    isInvestigating,
    handleWSMessage,
    resetInvestigation,
  } = useInvestigation();

  // Handle WebSocket message
  const onMessage = useCallback((msg: WSMessage) => {
    handleWSMessage(msg);
  }, [handleWSMessage]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    const unsubscribe = subscribe(onMessage);
    return () => unsubscribe();
  }, [subscribe, onMessage]);

  // Handle transaction selection
  const handleSelectTransaction = useCallback((tx: Transaction) => {
    setSelectedTransaction(tx);
    setActiveTab('investigation');
    resetInvestigation();
  }, [resetInvestigation]);

  // Handle start investigation
  const handleInvestigate = useCallback(() => {
    if (selectedTransaction) {
      resetInvestigation();
      investigate(selectedTransaction);
    }
  }, [selectedTransaction, investigate, resetInvestigation]);

  // Handle custom transaction investigation (from LiveInvestigationPanel)
  const handleInvestigateCustom = useCallback((tx: Transaction) => {
    setSelectedTransaction(tx);
    resetInvestigation();
    investigate(tx);
  }, [investigate, resetInvestigation]);

  // Handle reset
  const handleReset = useCallback(() => {
    setSelectedTransaction(null);
    resetInvestigation();
  }, [resetInvestigation]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="flex itemsCenter gap-md">
          <Shield size={28} className="headerIcon" />
          <h1 className="headerTitle" style={{
            background: 'linear-gradient(135deg, #fff 0%, #60a5fa 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
          }}>Fraud Investigation System</h1>
          <span className="badge" style={{ 
            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
            fontSize: '0.7rem',
            padding: '0.25rem 0.5rem'
          }}>
            Multi-Agent AI
          </span>
        </div>
        <div className="flex itemsCenter gap-md">
          {/* Connection Status */}
          <div className="flex itemsCenter gap-sm">
            <div
              className="pulseIndicator"
              style={{
                backgroundColor: connected ? 'var(--success)' : 'var(--danger)',
                animation: connected ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span className="textMuted" style={{ fontSize: '0.75rem' }}>
              {connectionStatus}
            </span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="tabNav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tabButton ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              {tab.id === 'investigation' && isInvestigating && (
                <div className="spinner" style={{ width: '12px', height: '12px' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="main">
        {activeTab === 'dashboard' && (
          <DashboardView onSelectTransaction={handleSelectTransaction} />
        )}
        {activeTab === 'investigation' && (
          <InvestigationView
            transaction={selectedTransaction}
            agentStates={agentStates}
            timeline={timeline}
            finalDecision={finalDecision}
            isInvestigating={isInvestigating}
            onInvestigate={handleInvestigate}
            onInvestigateCustom={handleInvestigateCustom}
            onReset={handleReset}
          />
        )}
        {activeTab === 'network' && <NetworkView />}
      </main>
    </div>
  );
}
