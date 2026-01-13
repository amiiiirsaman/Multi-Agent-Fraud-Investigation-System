/**
 * LiveInvestigationPanel - Allow users to input custom transactions for real-time investigation.
 * Results are displayed in the Multi-Agent Analysis section below, not in this panel.
 */

import { useState, useCallback, useEffect } from 'react';
import type { Transaction } from '../types';
import {
  PlusCircle,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface LiveInvestigationPanelProps {
  onInvestigate: (transaction: Transaction) => void;
  isInvestigating: boolean;
  onReset: () => void;
  /** External control to collapse the panel */
  forceCollapse?: boolean;
}

interface CustomTransactionForm {
  transaction_id: string;
  amount: string;
  from_account: string;
  to_account: string;
  merchant_category: string;
  location: string;
  device_id: string;
}

const MERCHANT_CATEGORIES = [
  'Retail',
  'Electronics',
  'Travel',
  'Entertainment',
  'Groceries',
  'Restaurants',
  'Gas Stations',
  'Online Shopping',
  'Money Transfer',
  'Cryptocurrency',
];

const LOCATIONS = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Miami',
  'Seattle',
  'Boston',
  'San Francisco',
  'London',
  'Tokyo',
];

export function LiveInvestigationPanel({
  onInvestigate,
  isInvestigating,
  onReset,
  forceCollapse,
}: LiveInvestigationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [form, setForm] = useState<CustomTransactionForm>({
    transaction_id: '',
    amount: '',
    from_account: '',
    to_account: '',
    merchant_category: '',
    location: '',
    device_id: '',
  });

  // Collapse panel when forceCollapse changes to true
  useEffect(() => {
    if (forceCollapse) {
      setIsExpanded(false);
    }
  }, [forceCollapse]);

  const generateTransactionId = useCallback(() => {
    const id = `CUSTOM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setForm(prev => ({ ...prev, transaction_id: id }));
  }, []);

  const handleInputChange = useCallback((field: keyof CustomTransactionForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.amount || !form.from_account || !form.to_account) {
      return;
    }

    const transaction: Transaction = {
      transaction_id: form.transaction_id || `CUSTOM-${Date.now()}`,
      timestamp: new Date().toISOString(),
      from_account: form.from_account,
      to_account: form.to_account,
      amount: parseFloat(form.amount),
      merchant_category: form.merchant_category || 'Unknown',
      device_id: form.device_id || `DEV-${Math.random().toString(36).substr(2, 8)}`,
      location: form.location || 'Unknown',
      hour: new Date().getHours(),
      day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()],
      velocity: 1,
      is_fraud: 0,
      fraud_reason: '',
    };

    // Collapse panel and let parent handle the investigation display
    setIsExpanded(false);
    onInvestigate(transaction);
  }, [form, onInvestigate]);

  const handleReset = useCallback(() => {
    setForm({
      transaction_id: '',
      amount: '',
      from_account: '',
      to_account: '',
      merchant_category: '',
      location: '',
      device_id: '',
    });
    onReset();
  }, [onReset]);

  const isFormValid = form.amount && form.from_account && form.to_account;

  return (
    <div className="liveInvestigationPanel">
      {/* Header - Always visible */}
      <div 
        className="livePanelHeader"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex itemsCenter gap-md">
          <Sparkles size={20} style={{ color: 'var(--accent)' }} />
          <span className="livePanelTitle">Live Investigation</span>
          <span className="textMuted" style={{ fontSize: '0.75rem' }}>
            Test custom transactions in real-time
          </span>
        </div>
        <div className="flex itemsCenter gap-md">
          {isInvestigating && (
            <div className="flex itemsCenter gap-sm">
              <div className="spinner" style={{ width: '14px', height: '14px' }} />
              <span className="textMuted" style={{ fontSize: '0.75rem' }}>Processing...</span>
            </div>
          )}
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expandable Content - Form Only */}
      {isExpanded && (
        <div className="livePanelContent fadeIn">
          <div className="liveInputSection" style={{ maxWidth: '600px' }}>
            <h4 className="sectionTitle">
              <PlusCircle size={16} />
              Custom Transaction
            </h4>
            
            <div className="formGrid">
              <div className="formGroup">
                <label>Transaction ID</label>
                <div className="flex gap-sm">
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value={form.transaction_id}
                    onChange={e => handleInputChange('transaction_id', e.target.value)}
                    disabled={isInvestigating}
                  />
                  <button 
                    className="btn btnSecondary" 
                    onClick={generateTransactionId}
                    disabled={isInvestigating}
                    title="Generate ID"
                  >
                    <Sparkles size={14} />
                  </button>
                </div>
              </div>

              <div className="formGroup">
                <label>Amount *</label>
                <input
                  type="number"
                  placeholder="Enter amount..."
                  value={form.amount}
                  onChange={e => handleInputChange('amount', e.target.value)}
                  disabled={isInvestigating}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="formGroup">
                <label>From Account *</label>
                <input
                  type="text"
                  placeholder="e.g., ACC-12345"
                  value={form.from_account}
                  onChange={e => handleInputChange('from_account', e.target.value)}
                  disabled={isInvestigating}
                />
              </div>

              <div className="formGroup">
                <label>To Account *</label>
                <input
                  type="text"
                  placeholder="e.g., ACC-67890"
                  value={form.to_account}
                  onChange={e => handleInputChange('to_account', e.target.value)}
                  disabled={isInvestigating}
                />
              </div>

              <div className="formGroup">
                <label>Merchant Category</label>
                <select
                  value={form.merchant_category}
                  onChange={e => handleInputChange('merchant_category', e.target.value)}
                  disabled={isInvestigating}
                >
                  <option value="">Select category...</option>
                  {MERCHANT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <label>Location</label>
                <select
                  value={form.location}
                  onChange={e => handleInputChange('location', e.target.value)}
                  disabled={isInvestigating}
                >
                  <option value="">Select location...</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="formGroup fullWidth">
                <label>Device ID</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={form.device_id}
                  onChange={e => handleInputChange('device_id', e.target.value)}
                  disabled={isInvestigating}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-md mt-md">
              <button
                className="btn btnPrimary"
                onClick={handleSubmit}
                disabled={isInvestigating || !isFormValid}
                style={{ flex: 1 }}
              >
                {isInvestigating ? (
                  <>
                    <div className="spinner" style={{ width: '14px', height: '14px' }} />
                    Investigating...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Run Investigation
                  </>
                )}
              </button>
              <button
                className="btn btnSecondary"
                onClick={handleReset}
                disabled={isInvestigating}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
            
            <p className="textMuted mt-md" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
              Investigation results will appear in the Multi-Agent Analysis section below.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
