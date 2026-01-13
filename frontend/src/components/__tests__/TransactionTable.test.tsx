/**
 * Unit tests for TransactionTable component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionTable } from '../TransactionTable';
import type { Transaction } from '../../types';

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount }: { children: (props: { index: number; style: React.CSSProperties }) => React.ReactNode; itemCount: number }) => (
    <div data-testid="virtual-list">
      {Array.from({ length: Math.min(itemCount, 10) }).map((_, index) => (
        <div key={index}>{children({ index, style: {} })}</div>
      ))}
    </div>
  ),
}));

const mockTransactions: Transaction[] = [
  {
    transaction_id: 'TX-001',
    timestamp: '2026-01-11T10:00:00Z',
    from_account: 'ACC-100',
    to_account: 'ACC-200',
    amount: 1500.0,
    merchant_category: 'Retail',
    device_id: 'DEV-001',
    location: 'New York',
    hour: 10,
    day_of_week: 'Saturday',
    velocity: 2,
    is_fraud: 0,
    fraud_reason: '',
  },
  {
    transaction_id: 'TX-002',
    timestamp: '2026-01-11T11:00:00Z',
    from_account: 'ACC-300',
    to_account: 'ACC-400',
    amount: 5000.0,
    merchant_category: 'Electronics',
    device_id: 'DEV-002',
    location: 'Los Angeles',
    hour: 11,
    day_of_week: 'Saturday',
    velocity: 5,
    is_fraud: 1,
    fraud_reason: 'High velocity',
  },
];

const merchantCategories = ['Retail', 'Electronics', 'Travel'];
const locations = ['New York', 'Los Angeles', 'Chicago'];

describe('TransactionTable', () => {
  it('renders loading state correctly', () => {
    render(
      <TransactionTable
        transactions={[]}
        onSelectTransaction={vi.fn()}
        loading={true}
        merchantCategories={[]}
        locations={[]}
      />
    );
    
    expect(screen.getByText(/loading transactions/i)).toBeInTheDocument();
  });

  it('renders transaction count in toolbar', () => {
    render(
      <TransactionTable
        transactions={mockTransactions}
        onSelectTransaction={vi.fn()}
        loading={false}
        merchantCategories={merchantCategories}
        locations={locations}
      />
    );
    
    expect(screen.getByText(/2 of 2 transactions/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(
      <TransactionTable
        transactions={mockTransactions}
        onSelectTransaction={vi.fn()}
        loading={false}
        merchantCategories={merchantCategories}
        locations={locations}
      />
    );
    
    expect(screen.getByPlaceholderText(/search transactions/i)).toBeInTheDocument();
  });

  it('renders filter button', () => {
    render(
      <TransactionTable
        transactions={mockTransactions}
        onSelectTransaction={vi.fn()}
        loading={false}
        merchantCategories={merchantCategories}
        locations={locations}
      />
    );
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders export button', () => {
    render(
      <TransactionTable
        transactions={mockTransactions}
        onSelectTransaction={vi.fn()}
        loading={false}
        merchantCategories={merchantCategories}
        locations={locations}
      />
    );
    
    expect(screen.getByText(/export csv/i)).toBeInTheDocument();
  });

  it('toggles filter panel when filter button clicked', () => {
    render(
      <TransactionTable
        transactions={mockTransactions}
        onSelectTransaction={vi.fn()}
        loading={false}
        merchantCategories={merchantCategories}
        locations={locations}
      />
    );
    
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);
    
    // Filter panel should now be visible
    expect(screen.getByText('From Account')).toBeInTheDocument();
    expect(screen.getByText('To Account')).toBeInTheDocument();
    expect(screen.getByText('Merchant Category')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('filters transactions by search text', () => {
    render(
      <TransactionTable
        transactions={mockTransactions}
        onSelectTransaction={vi.fn()}
        loading={false}
        merchantCategories={merchantCategories}
        locations={locations}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/search transactions/i);
    fireEvent.change(searchInput, { target: { value: 'TX-001' } });
    
    // After filtering, should show "1 of 2 transactions"
    expect(screen.getByText(/1 of 2 transactions/i)).toBeInTheDocument();
  });

  it('calls onSelectTransaction when row is clicked', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <TransactionTable
        transactions={mockTransactions}
        onSelectTransaction={mockOnSelect}
        loading={false}
        merchantCategories={merchantCategories}
        locations={locations}
      />
    );
    
    // Find and click on a transaction row
    const row = screen.getByText('TX-001').closest('.tableRow');
    if (row) {
      fireEvent.click(row);
    }
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('renders sort icons in header', () => {
    render(
      <TransactionTable
        transactions={mockTransactions}
        onSelectTransaction={vi.fn()}
        loading={false}
        merchantCategories={merchantCategories}
        locations={locations}
      />
    );
    
    expect(screen.getByText('Transaction ID')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('shows fraud badge for fraud transactions', () => {
    render(
      <TransactionTable
        transactions={mockTransactions}
        onSelectTransaction={vi.fn()}
        loading={false}
        merchantCategories={merchantCategories}
        locations={locations}
      />
    );
    
    expect(screen.getByText('FRAUD')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
