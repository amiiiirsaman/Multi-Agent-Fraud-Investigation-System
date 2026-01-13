/**
 * TransactionTable component - Large dataset table with virtual scrolling and filters.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { ListChildComponentProps } from 'react-window';
import type { Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronUp, 
  ChevronDown, 
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export interface TransactionFilters {
  search: string;
  fromAccount: string;
  toAccount: string;
  merchantCategory: string;
  location: string;
  isFraud: 'all' | 'fraud' | 'normal';
  minAmount: string;
  maxAmount: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  selectedId?: string;
  loading?: boolean;
  merchantCategories: string[];
  locations: string[];
}

type SortField = 'timestamp' | 'amount' | 'from_account' | 'to_account' | 'merchant_category' | 'is_fraud';
type SortDirection = 'asc' | 'desc';

const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 48;

export function TransactionTable({
  transactions,
  onSelectTransaction,
  selectedId,
  loading,
  merchantCategories,
  locations,
}: TransactionTableProps) {
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    fromAccount: '',
    toAccount: '',
    merchantCategory: '',
    location: '',
    isFraud: 'all',
    minAmount: '',
    maxAmount: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const listRef = useRef<List>(null);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(tx =>
        tx.transaction_id.toLowerCase().includes(searchLower) ||
        tx.from_account.toLowerCase().includes(searchLower) ||
        tx.to_account.toLowerCase().includes(searchLower) ||
        tx.merchant_category.toLowerCase().includes(searchLower)
      );
    }

    // Apply specific filters
    if (filters.fromAccount) {
      result = result.filter(tx => 
        tx.from_account.toLowerCase().includes(filters.fromAccount.toLowerCase())
      );
    }
    if (filters.toAccount) {
      result = result.filter(tx => 
        tx.to_account.toLowerCase().includes(filters.toAccount.toLowerCase())
      );
    }
    if (filters.merchantCategory) {
      result = result.filter(tx => tx.merchant_category === filters.merchantCategory);
    }
    if (filters.location) {
      result = result.filter(tx => tx.location === filters.location);
    }
    if (filters.isFraud !== 'all') {
      result = result.filter(tx => 
        filters.isFraud === 'fraud' ? tx.is_fraud === 1 : tx.is_fraud === 0
      );
    }
    if (filters.minAmount) {
      result = result.filter(tx => tx.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      result = result.filter(tx => tx.amount <= parseFloat(filters.maxAmount));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'from_account':
          comparison = a.from_account.localeCompare(b.from_account);
          break;
        case 'to_account':
          comparison = a.to_account.localeCompare(b.to_account);
          break;
        case 'merchant_category':
          comparison = a.merchant_category.localeCompare(b.merchant_category);
          break;
        case 'is_fraud':
          comparison = a.is_fraud - b.is_fraud;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, filters, sortField, sortDirection]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const handleFilterChange = useCallback((key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    listRef.current?.scrollTo(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      fromAccount: '',
      toAccount: '',
      merchantCategory: '',
      location: '',
      isFraud: 'all',
      minAmount: '',
      maxAmount: '',
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.fromAccount) count++;
    if (filters.toAccount) count++;
    if (filters.merchantCategory) count++;
    if (filters.location) count++;
    if (filters.isFraud !== 'all') count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    return count;
  }, [filters]);

  const exportToCSV = useCallback(() => {
    const headers = ['Transaction ID', 'Timestamp', 'From Account', 'To Account', 'Amount', 'Merchant', 'Location', 'Fraud'];
    const rows = filteredTransactions.map(tx => [
      tx.transaction_id,
      tx.timestamp,
      tx.from_account,
      tx.to_account,
      tx.amount.toString(),
      tx.merchant_category,
      tx.location,
      tx.is_fraud ? 'Yes' : 'No',
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredTransactions]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const Row = ({ index, style }: ListChildComponentProps) => {
    const tx = filteredTransactions[index];
    const isSelected = tx.transaction_id === selectedId;
    
    return (
      <div
        style={style}
        className={`tableRow ${isSelected ? 'selected' : ''} ${tx.is_fraud ? 'fraud' : ''}`}
        onClick={() => onSelectTransaction(tx)}
      >
        <div className="tableCell" style={{ width: '15%' }}>
          <span className="transactionId">{tx.transaction_id}</span>
        </div>
        <div className="tableCell" style={{ width: '12%' }}>
          {formatDateTime(tx.timestamp)}
        </div>
        <div className="tableCell" style={{ width: '12%' }}>
          {tx.from_account}
        </div>
        <div className="tableCell" style={{ width: '12%' }}>
          {tx.to_account}
        </div>
        <div className="tableCell" style={{ width: '10%', textAlign: 'right' }}>
          <span className={tx.amount > 5000 ? 'highAmount' : ''}>
            {formatCurrency(tx.amount)}
          </span>
        </div>
        <div className="tableCell" style={{ width: '15%' }}>
          {tx.merchant_category}
        </div>
        <div className="tableCell" style={{ width: '12%' }}>
          {tx.location}
        </div>
        <div className="tableCell" style={{ width: '12%' }}>
          {tx.is_fraud ? (
            <span className="badge high">
              <AlertTriangle size={12} />
              FRAUD
            </span>
          ) : (
            <span className="badge low">
              <CheckCircle size={12} />
              OK
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="cardContent" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <span className="textMuted">Loading transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="transactionTableContainer">
      {/* Toolbar */}
      <div className="tableToolbar">
        <div className="flex itemsCenter gap-md">
          <div className="searchInput">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
          </div>
          <button 
            className={`btn btnSecondary ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="filterBadge">{activeFilterCount}</span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button className="btn btnSecondary" onClick={clearFilters}>
              <X size={16} />
              Clear
            </button>
          )}
        </div>
        <div className="flex itemsCenter gap-md">
          <span className="textMuted">
            {filteredTransactions.length.toLocaleString()} of {transactions.length.toLocaleString()} transactions
          </span>
          <button className="btn btnSecondary" onClick={exportToCSV}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filtersPanel fadeIn">
          <div className="filterGrid">
            <div className="filterGroup">
              <label>From Account</label>
              <input
                type="text"
                placeholder="Filter by account..."
                value={filters.fromAccount}
                onChange={e => handleFilterChange('fromAccount', e.target.value)}
              />
            </div>
            <div className="filterGroup">
              <label>To Account</label>
              <input
                type="text"
                placeholder="Filter by account..."
                value={filters.toAccount}
                onChange={e => handleFilterChange('toAccount', e.target.value)}
              />
            </div>
            <div className="filterGroup">
              <label>Merchant Category</label>
              <select
                value={filters.merchantCategory}
                onChange={e => handleFilterChange('merchantCategory', e.target.value)}
              >
                <option value="">All Categories</option>
                {merchantCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="filterGroup">
              <label>Location</label>
              <select
                value={filters.location}
                onChange={e => handleFilterChange('location', e.target.value)}
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="filterGroup">
              <label>Status</label>
              <select
                value={filters.isFraud}
                onChange={e => handleFilterChange('isFraud', e.target.value)}
              >
                <option value="all">All Transactions</option>
                <option value="fraud">Fraud Only</option>
                <option value="normal">Normal Only</option>
              </select>
            </div>
            <div className="filterGroup">
              <label>Amount Range</label>
              <div className="flex gap-sm">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount}
                  onChange={e => handleFilterChange('minAmount', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChange={e => handleFilterChange('maxAmount', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="tableHeader" style={{ height: HEADER_HEIGHT }}>
        <div 
          className="tableHeaderCell sortable" 
          style={{ width: '15%' }}
          onClick={() => handleSort('timestamp')}
        >
          Transaction ID <SortIcon field="timestamp" />
        </div>
        <div 
          className="tableHeaderCell sortable" 
          style={{ width: '12%' }}
          onClick={() => handleSort('timestamp')}
        >
          Timestamp <SortIcon field="timestamp" />
        </div>
        <div 
          className="tableHeaderCell sortable" 
          style={{ width: '12%' }}
          onClick={() => handleSort('from_account')}
        >
          From <SortIcon field="from_account" />
        </div>
        <div 
          className="tableHeaderCell sortable" 
          style={{ width: '12%' }}
          onClick={() => handleSort('to_account')}
        >
          To <SortIcon field="to_account" />
        </div>
        <div 
          className="tableHeaderCell sortable" 
          style={{ width: '10%', textAlign: 'right' }}
          onClick={() => handleSort('amount')}
        >
          Amount <SortIcon field="amount" />
        </div>
        <div 
          className="tableHeaderCell sortable" 
          style={{ width: '15%' }}
          onClick={() => handleSort('merchant_category')}
        >
          Merchant <SortIcon field="merchant_category" />
        </div>
        <div className="tableHeaderCell" style={{ width: '12%' }}>
          Location
        </div>
        <div 
          className="tableHeaderCell sortable" 
          style={{ width: '12%' }}
          onClick={() => handleSort('is_fraud')}
        >
          Status <SortIcon field="is_fraud" />
        </div>
      </div>

      {/* Virtual List */}
      <List
        ref={listRef}
        height={600}
        width="100%"
        itemCount={filteredTransactions.length}
        itemSize={ROW_HEIGHT}
        className="tableBody"
      >
        {Row}
      </List>
    </div>
  );
}
