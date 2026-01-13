/**
 * Unit tests for TransactionDrawer component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionDrawer } from '../TransactionDrawer';
import type { Transaction } from '../../types';

const mockTransaction: Transaction = {
  transaction_id: 'TX-12345',
  timestamp: '2026-01-11T10:30:00Z',
  from_account: 'ACC-100',
  to_account: 'ACC-200',
  amount: 2500.0,
  merchant_category: 'Electronics',
  device_id: 'DEV-001',
  location: 'New York',
  hour: 10,
  day_of_week: 'Saturday',
  velocity: 3,
  is_fraud: 0,
  fraud_reason: '',
};

const mockFraudTransaction: Transaction = {
  transaction_id: 'TX-FRAUD',
  timestamp: '2026-01-11T02:00:00Z',
  from_account: 'ACC-300',
  to_account: 'ACC-400',
  amount: 9999.0,
  merchant_category: 'Crypto',
  device_id: 'DEV-002',
  location: 'Unknown',
  hour: 2,
  day_of_week: 'Saturday',
  velocity: 10,
  is_fraud: 1,
  fraud_reason: 'High velocity suspicious pattern',
};

describe('TransactionDrawer', () => {
  it('does not render when transaction is null', () => {
    const { container } = render(
      <TransactionDrawer
        transaction={null}
        onClose={vi.fn()}
        onInvestigate={vi.fn()}
      />
    );
    
    expect(container.querySelector('.drawer')).not.toBeInTheDocument();
  });

  it('renders transaction details when open', () => {
    render(
      <TransactionDrawer
        transaction={mockTransaction}
        onClose={vi.fn()}
        onInvestigate={vi.fn()}
      />
    );
    
    expect(screen.getByText('TX-12345')).toBeInTheDocument();
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();
  });

  it('shows "OK" status banner for non-fraud transaction', () => {
    render(
      <TransactionDrawer
        transaction={mockTransaction}
        onClose={vi.fn()}
        onInvestigate={vi.fn()}
      />
    );
    
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('shows "FRAUD" status banner for fraud transaction', () => {
    render(
      <TransactionDrawer
        transaction={mockFraudTransaction}
        onClose={vi.fn()}
        onInvestigate={vi.fn()}
      />
    );
    
    expect(screen.getByText('FRAUD')).toBeInTheDocument();
    expect(screen.getByText('High velocity suspicious pattern')).toBeInTheDocument();
  });

  it('displays account information section', () => {
    render(
      <TransactionDrawer
        transaction={mockTransaction}
        onClose={vi.fn()}
        onInvestigate={vi.fn()}
      />
    );
    
    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('From Account')).toBeInTheDocument();
    expect(screen.getByText('ACC-100')).toBeInTheDocument();
    expect(screen.getByText('To Account')).toBeInTheDocument();
    expect(screen.getByText('ACC-200')).toBeInTheDocument();
  });

  it('displays transaction details section', () => {
    render(
      <TransactionDrawer
        transaction={mockTransaction}
        onClose={vi.fn()}
        onInvestigate={vi.fn()}
      />
    );
    
    expect(screen.getByText('Transaction Details')).toBeInTheDocument();
    expect(screen.getByText('Merchant Category')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('Device ID')).toBeInTheDocument();
    expect(screen.getByText('DEV-001')).toBeInTheDocument();
  });

  it('displays timing information section', () => {
    render(
      <TransactionDrawer
        transaction={mockTransaction}
        onClose={vi.fn()}
        onInvestigate={vi.fn()}
      />
    );
    
    expect(screen.getByText('Timing Information')).toBeInTheDocument();
    expect(screen.getByText('Hour')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Day of Week')).toBeInTheDocument();
    expect(screen.getByText('Saturday')).toBeInTheDocument();
    expect(screen.getByText('Velocity')).toBeInTheDocument();
    expect(screen.getByText('3 txn/hr')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockClose = vi.fn();
    
    render(
      <TransactionDrawer
        transaction={mockTransaction}
        onClose={mockClose}
        onInvestigate={vi.fn()}
      />
    );
    
    const closeButton = screen.getByLabelText('Close drawer');
    fireEvent.click(closeButton);
    
    expect(mockClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const mockClose = vi.fn();
    
    render(
      <TransactionDrawer
        transaction={mockTransaction}
        onClose={mockClose}
        onInvestigate={vi.fn()}
      />
    );
    
    const backdrop = document.querySelector('.drawerBackdrop');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    expect(mockClose).toHaveBeenCalled();
  });

  it('calls onInvestigate when investigate button is clicked', () => {
    const mockInvestigate = vi.fn();
    
    render(
      <TransactionDrawer
        transaction={mockTransaction}
        onClose={vi.fn()}
        onInvestigate={mockInvestigate}
      />
    );
    
    const investigateButton = screen.getByRole('button', { name: /run investigation/i });
    fireEvent.click(investigateButton);
    
    expect(mockInvestigate).toHaveBeenCalledWith('TX-12345');
  });

  it('does not call onClose when drawer content is clicked', () => {
    const mockClose = vi.fn();
    
    render(
      <TransactionDrawer
        transaction={mockTransaction}
        onClose={mockClose}
        onInvestigate={vi.fn()}
      />
    );
    
    const drawerContent = document.querySelector('.drawer');
    if (drawerContent) {
      fireEvent.click(drawerContent);
    }
    
    // Should not be called when clicking inside drawer
    expect(mockClose).not.toHaveBeenCalled();
  });

  it('formats amount with currency symbol', () => {
    render(
      <TransactionDrawer
        transaction={mockFraudTransaction}
        onClose={vi.fn()}
        onInvestigate={vi.fn()}
      />
    );
    
    expect(screen.getByText('$9,999.00')).toBeInTheDocument();
  });
});
