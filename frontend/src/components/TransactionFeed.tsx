/**
 * Transaction Feed component - Live transaction list.
 */

import type { Transaction } from '../types';
import { formatCurrency, formatRelativeTime, getRiskColor } from '../utils/formatters';
import { FileText } from 'lucide-react';

interface TransactionFeedProps {
  transactions: Transaction[];
  selectedId?: string;
  onSelect: (transaction: Transaction) => void;
  loading?: boolean;
}

export function TransactionFeed({ transactions, selectedId, onSelect, loading }: TransactionFeedProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">
            <FileText size={18} />
            Transaction Feed
          </h3>
        </div>
        <div className="cardContent">
          <div className="flex itemsCenter justifyBetween" style={{ padding: '2rem' }}>
            <div className="spinner" />
            <span className="textMuted">Loading transactions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="cardHeader">
        <h3 className="cardTitle">
          <FileText size={18} />
          Transaction Feed
        </h3>
        <span className="textMuted">{transactions.length} transactions</span>
      </div>
      <div className="cardContent" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {transactions.length === 0 ? (
          <p className="textMuted">No transactions found</p>
        ) : (
          transactions.map((tx, idx) => (
            <div
              key={tx.transaction_id}
              className={`transactionItem ${tx.is_fraud ? 'fraud' : ''} ${selectedId === tx.transaction_id ? 'selected' : ''} slideIn`}
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => onSelect(tx)}
            >
              <div className="flex justifyBetween itemsCenter mb-sm">
                <span style={{ fontWeight: 600 }}>{tx.transaction_id}</span>
                <span className={`badge ${getRiskColor(tx.is_fraud ? 'High' : 'Low')}`}>
                  {tx.is_fraud ? 'FRAUD' : 'OK'}
                </span>
              </div>
              
              <div className="flex justifyBetween itemsCenter mb-sm">
                <span className="textSecondary">
                  {tx.from_account} → {tx.to_account}
                </span>
                <span style={{ fontWeight: 600, color: tx.amount > 1000 ? 'var(--warning)' : 'var(--text)' }}>
                  {formatCurrency(tx.amount)}
                </span>
              </div>
              
              <div className="flex justifyBetween itemsCenter">
                <span className="textMuted" style={{ fontSize: '0.75rem' }}>
                  {tx.merchant_category} • {tx.location}
                </span>
                <span className="textMuted" style={{ fontSize: '0.75rem' }}>
                  {formatRelativeTime(tx.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
