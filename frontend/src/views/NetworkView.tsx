/**
 * Network View - 3D fraud network visualization.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { NetworkData, NetworkNode, FraudRing } from '../types';
import { FraudGraph3D } from '../components/FraudGraph3D';
import { fetchNetworkData } from '../utils/api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { 
  User, 
  Link2, 
  BarChart3, 
  Palette, 
  PanelRightOpen, 
  PanelRightClose,
  Maximize2,
  Minimize2,
  Filter,
  RefreshCw,
  X,
  Info,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

type RiskFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type EdgeLimit = 100 | 250 | 500 | 1000 | 2000;

export function NetworkView() {
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [edgeLimit, setEdgeLimit] = useState<EdgeLimit>(500);
  const loadingRef = useRef(false);
  const [showFraudRingInfo, setShowFraudRingInfo] = useState(false);

  const loadData = useCallback(async (limit: EdgeLimit) => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    try {
      setLoading(true);
      const data = await fetchNetworkData(limit);
      setNetworkData(data as NetworkData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load network data');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadData(edgeLimit);
  }, [edgeLimit, loadData]);

  const handleNodeClick = useCallback((node: NetworkNode) => {
    setSelectedNode(node);
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  }, [sidebarCollapsed]);

  const handleEdgeLimitChange = useCallback((newLimit: EdgeLimit) => {
    setEdgeLimit(newLimit);
  }, []);

  // Build node lookup map for O(1) access
  const nodeMap = useMemo(() => {
    if (!networkData) return new Map<string, NetworkNode>();
    return new Map(networkData.nodes.map(n => [n.id, n]));
  }, [networkData]);

  // Filter network data by risk level with optimized O(n) lookup
  const filteredNetworkData = useMemo(() => {
    if (!networkData) return null;
    
    if (riskFilter === 'all') {
      return networkData;
    }
    
    const filteredNodes = networkData.nodes.filter(n => n.risk === riskFilter);
    
    // O(n) filter using Map lookup instead of O(n²) .find()
    const filteredLinks = networkData.links.filter(l => {
      const sourceNode = nodeMap.get(String(l.source));
      const targetNode = nodeMap.get(String(l.target));
      return sourceNode?.risk === riskFilter || targetNode?.risk === riskFilter;
    });
    
    return {
      ...networkData,
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [networkData, riskFilter, nodeMap]);

  if (error) {
    return (
      <div className="card fadeIn">
        <div className="cardContent">
          <div className="textDanger">Error: {error}</div>
        </div>
      </div>
    );
  }

  const graphWidth = isFullscreen 
    ? window.innerWidth - 40 
    : sidebarCollapsed 
      ? window.innerWidth - 120 
      : window.innerWidth - 450;

  return (
    <div className={`networkViewContainer fadeIn ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Toolbar */}
      <div className="networkToolbar">
        <div className="flex itemsCenter gap-md">
          <div className="flex itemsCenter gap-sm">
            <Filter size={16} />
            <span className="textMuted">Risk:</span>
          </div>
          <div className="riskFilterGroup">
            {(['all', 'critical', 'high', 'medium', 'low'] as RiskFilter[]).map((filter) => (
              <button
                key={filter}
                className={`riskFilterBtn ${riskFilter === filter ? 'active' : ''} ${filter}`}
                onClick={() => setRiskFilter(filter)}
              >
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex itemsCenter gap-sm" style={{ marginLeft: '1rem' }}>
            <Link2 size={16} />
            <span className="textMuted">Edges:</span>
          </div>
          <select
            className="edgeLimitSelect"
            value={edgeLimit}
            onChange={(e) => handleEdgeLimitChange(Number(e.target.value) as EdgeLimit)}
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.375rem 0.75rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <option value={100}>Top 100</option>
            <option value={250}>Top 250</option>
            <option value={500}>Top 500</option>
            <option value={1000}>Top 1000</option>
            <option value={2000}>Top 2000</option>
          </select>
          
          <button
            className="btn btnSecondary"
            onClick={() => loadData(edgeLimit)}
            disabled={loading}
            title="Refresh network data"
            style={{ marginLeft: '0.5rem' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
        <div className="flex itemsCenter gap-sm">
          <button 
            className="btn btnSecondary"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button 
            className="btn btnSecondary"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {sidebarCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
          </button>
        </div>
      </div>

      <div className="networkContent">
        {/* Main Area: Graph + Sidebar */}
        <div style={{ 
          display: 'flex', 
          flex: '0 0 auto',
          height: isFullscreen ? 'calc(100vh - 300px)' : '450px',
          borderBottom: '2px solid var(--border)'
        }}>
          {/* 3D Graph */}
          <div className="networkGraphContainer" style={{ overflow: 'hidden' }}>
            <FraudGraph3D
              data={filteredNetworkData}
              onNodeClick={handleNodeClick}
              selectedNode={selectedNode}
              width={graphWidth}
              height={isFullscreen ? window.innerHeight - 300 : 450}
            />
            
            {/* Stats Overlay */}
            {filteredNetworkData && (
              <div className="graphStatsOverlay">
                <span>{filteredNetworkData.nodes.length} nodes</span>
                <span>{filteredNetworkData.links.length} connections</span>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {!sidebarCollapsed && (
            <div className="networkSidebar fadeIn" style={{ height: '100%', overflowY: 'auto' }}>
              {/* Selected Node Details */}
              {selectedNode && (
                <div className="card" style={{ flexShrink: 0 }}>
                  <div className="cardHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="cardTitle">
                      <User size={18} />
                      Account Details
                    </h3>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedNode(null); }}
                      style={{
                        background: 'var(--danger)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}
                      title="Clear selection"
                    >
                      <X size={14} />
                      Clear
                    </button>
                  </div>
                  <div className="cardContent">
                    <div className="mb-md">
                      <span className="textMuted">Account ID</span>
                      <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{selectedNode.name}</p>
                    </div>
                    
                    {/* KPI Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      padding: '0.5rem',
                      backgroundColor: 'var(--bg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ textAlign: 'center', padding: '0.4rem', backgroundColor: 'rgba(96, 165, 250, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa' }}>
                          {selectedNode.transactions}
                        </div>
                        <div className="textMuted" style={{ fontSize: '0.65rem' }}>Transactions</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '0.4rem', backgroundColor: 'rgba(167, 139, 250, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a78bfa' }}>
                          {formatCurrency(selectedNode.total_amount)}
                        </div>
                        <div className="textMuted" style={{ fontSize: '0.65rem' }}>Total Volume</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '0.4rem', backgroundColor: selectedNode.fraud_rate > 0.1 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(52, 211, 153, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ 
                          fontSize: '1.25rem', fontWeight: 700,
                          color: selectedNode.fraud_rate > 0.2 ? '#f87171' : selectedNode.fraud_rate > 0.1 ? '#fbbf24' : '#34d399'
                        }}>
                          {formatPercent(selectedNode.fraud_rate)}
                        </div>
                        <div className="textMuted" style={{ fontSize: '0.65rem' }}>Fraud Rate</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '0.4rem', backgroundColor: selectedNode.fraud_rate > 0.1 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(156, 163, 175, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ 
                          fontSize: '1.25rem', fontWeight: 700,
                          color: selectedNode.fraud_rate > 0.1 ? '#f87171' : '#9ca3af'
                        }}>
                          {Math.round(selectedNode.transactions * selectedNode.fraud_rate)}
                        </div>
                        <div className="textMuted" style={{ fontSize: '0.65rem' }}>Flagged</div>
                      </div>
                    </div>
                    
                    {/* Risk Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="textMuted">Risk Level:</span>
                      <span className={`badge ${selectedNode.risk}`}>
                        {selectedNode.risk.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Network Stats */}
              <div className="card" style={{ flexShrink: 0 }}>
                <div className="cardHeader">
                  <h3 className="cardTitle">
                    <BarChart3 size={18} />
                    Network Statistics
                  </h3>
                </div>
                <div className="cardContent">
                  {loading ? (
                    <div className="flex itemsCenter gap-sm">
                      <div className="spinner" />
                      <span className="textMuted">Loading...</span>
                    </div>
                  ) : networkData ? (
                    <div className="grid2" style={{ gap: '0.5rem' }}>
                      <div>
                        <span className="textMuted" style={{ fontSize: '0.7rem' }}>Total Accounts</span>
                        <p style={{ fontWeight: 600, fontSize: '1rem' }}>{networkData.nodes.length}</p>
                      </div>
                      <div>
                        <span className="textMuted" style={{ fontSize: '0.7rem' }}>Connections</span>
                        <p style={{ fontWeight: 600, fontSize: '1rem' }}>{networkData.links.length}</p>
                      </div>
                      <div>
                        <span className="textMuted" style={{ fontSize: '0.7rem' }}>High Risk</span>
                        <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--danger)' }}>
                          {networkData.nodes.filter(n => n.risk === 'high' || n.risk === 'critical').length}
                        </p>
                      </div>
                      <div>
                        <span className="textMuted" style={{ fontSize: '0.7rem' }}>Fraud Rings</span>
                        <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--warning)' }}>
                          {networkData.fraud_rings.length}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Color Legend */}
              <div className="card" style={{ flexShrink: 0 }}>
                <div className="cardHeader">
                  <h3 className="cardTitle">
                    <Palette size={18} />
                    Risk Legend
                  </h3>
                </div>
                <div className="cardContent">
                  <div className="flexCol gap-sm">
                    <div className="flex itemsCenter gap-sm">
                      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#d13212', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem' }}>Critical (Fraud Ring)</span>
                    </div>
                    <div className="flex itemsCenter gap-sm">
                      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff6b6b', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem' }}>High (&gt;30%)</span>
                    </div>
                    <div className="flex itemsCenter gap-sm">
                      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff9900', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem' }}>Medium (10-30%)</span>
                    </div>
                    <div className="flex itemsCenter gap-sm">
                      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1d8102', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem' }}>Low (&lt;10%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fraud Rings Section - Below Graph */}
        <div style={{ 
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--bg)',
          flex: '0 0 auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
              <Link2 size={18} />
              Fraud Rings Detected
              <span className="badge" style={{ backgroundColor: 'var(--warning)', marginLeft: '0.25rem' }}>
                {networkData?.fraud_rings.length || 0}
              </span>
            </h3>
            <button 
              onClick={() => setShowFraudRingInfo(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--primary)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              title="What are fraud rings?"
            >
              <Info size={14} />
              Learn more
            </button>
          </div>
          
          {/* Horizontal scrolling fraud rings */}
          <div style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            overflowX: 'auto',
            paddingBottom: '12px',
            minHeight: '120px'
          }}>
            {networkData?.fraud_rings.map((ring, idx) => {
              const colors = ['#d13212', '#ff9900', '#8b5cf6', '#06b6d4', '#ec4899'];
              const color = colors[idx % colors.length];
              return (
                <div
                  key={ring.ring_id}
                  className="slideIn"
                  style={{
                    minWidth: '480px',
                    flex: '0 0 480px',
                    backgroundColor: 'var(--surface)',
                    padding: '1.25rem 1.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    borderLeft: `5px solid ${color}`,
                    animationDelay: `${idx * 100}ms`,
                  }}
                >
                  <div className="flex justifyBetween itemsCenter mb-sm">
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Ring #{ring.ring_id + 1}</span>
                    <span className="badge" style={{ backgroundColor: color, color: 'white', fontSize: '0.85rem', padding: '6px 12px' }}>
                      {ring.accounts.length} accounts
                    </span>
                  </div>
                  <p className="textMuted" style={{ fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    {ring.modus_operandi}
                  </p>
                  <div>
                    <span className="textMuted" style={{ fontSize: '0.7rem' }}>Accounts: </span>
                    <span style={{ fontSize: '0.7rem' }}>
                      {ring.accounts.slice(0, 3).join(', ')}
                      {ring.accounts.length > 3 && ` +${ring.accounts.length - 3} more`}
                    </span>
                  </div>
                </div>
              );
            })}
            {!networkData?.fraud_rings.length && (
              <p className="textMuted" style={{ fontSize: '0.85rem' }}>No fraud rings detected</p>
            )}
          </div>
        </div>
      </div>

      {/* Fraud Ring Info Modal */}
      {showFraudRingInfo && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowFraudRingInfo(false)}
        >
          <div 
            className="card fadeIn"
            style={{ 
              maxWidth: '500px', 
              margin: '1rem',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="cardHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="cardTitle">
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                Understanding Fraud Rings
              </h3>
              <button 
                onClick={() => setShowFraudRingInfo(false)}
                style={{
                  background: 'var(--surface-hover)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="cardContent" style={{ lineHeight: 1.6 }}>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Fraud rings</strong> are clusters of accounts that exhibit coordinated suspicious behavior patterns, suggesting organized fraudulent activity.
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={16} color="var(--primary)" />
                  Detection Method
                </h4>
                <p className="textSecondary" style={{ fontSize: '0.85rem' }}>
                  Our system uses <strong>Graph Neural Networks (GNN)</strong> to analyze transaction patterns and identify accounts with unusual connectivity patterns, synchronized activity, or money flow loops.
                </p>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Key Indicators</h4>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }} className="textSecondary">
                  <li style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Multiple accounts transacting with each other in circular patterns</li>
                  <li style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Accounts created around the same time period</li>
                  <li style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Similar transaction amounts or frequencies</li>
                  <li style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Rapid money movement through the network</li>
                </ul>
              </div>
              
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: 'rgba(255, 153, 0, 0.1)', 
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--warning)'
              }}>
                <strong style={{ fontSize: '0.8rem' }}>Risk Implication</strong>
                <p className="textSecondary" style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                  Accounts identified as fraud ring members are automatically classified as <strong>Critical Risk</strong> and flagged for immediate review.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
