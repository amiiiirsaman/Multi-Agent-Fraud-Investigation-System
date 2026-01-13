/**
 * TransactionDrawer - Slide-in drawer showing full transaction details.
 */

import type { Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  X,
  Play,
  User,
  MapPin,
  Smartphone,
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Building2,
} from 'lucide-react';

interface TransactionDrawerProps {
  transaction: Transaction | null;
  onClose: () => void;
  onInvestigate: (tx: Transaction) => void;
  isOpen: boolean;
}

export function TransactionDrawer({
  transaction,
  onClose,
  onInvestigate,
  isOpen,
}: TransactionDrawerProps) {
  if (!transaction || !isOpen) {
    return null;
  }

  const handleInvestigate = () => {
    onInvestigate(transaction);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="drawerBackdrop" onClick={onClose} />
      
      {/* Drawer */}
      <div className="transactionDrawer slideInRight">
        {/* Header */}
        <div className="drawerHeader">
          <div>
            <h2 className="drawerTitle">Transaction Details</h2>
            <span className="drawerSubtitle">{transaction.transaction_id}</span>
          </div>
          <button className="drawerCloseBtn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="drawerContent">
          {/* Status Banner */}
          <div className={`statusBanner ${transaction.is_fraud ? 'fraud' : 'normal'}`}>
            {transaction.is_fraud ? (
              <>
                <AlertTriangle size={20} />
                <span>Flagged as Potential Fraud</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>Normal Transaction</span>
              </>
            )}
          </div>

          {/* Amount Section */}
          <div className="drawerSection">
            <div className="amountDisplay">
              <span className="amountLabel">Transaction Amount</span>
              <span className={`amountValue ${transaction.amount > 5000 ? 'high' : ''}`}>
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Account Details */}
          <div className="drawerSection">
            <h3 className="sectionHeader">
              <CreditCard size={16} />
              Account Information
            </h3>
            <div className="detailGrid">
              <div className="detailItem">
                <User size={14} />
                <div>
                  <span className="detailLabel">From Account</span>
                  <span className="detailValue">{transaction.from_account}</span>
                </div>
              </div>
              <div className="detailItem">
                <User size={14} />
                <div>
                  <span className="detailLabel">To Account</span>
                  <span className="detailValue">{transaction.to_account}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="drawerSection">
            <h3 className="sectionHeader">
              <Building2 size={16} />
              Transaction Information
            </h3>
            <div className="detailGrid">
              <div className="detailItem">
                <Building2 size={14} />
                <div>
                  <span className="detailLabel">Merchant Category</span>
                  <span className="detailValue">{transaction.merchant_category}</span>
                </div>
              </div>
              <div className="detailItem">
                <MapPin size={14} />
                <div>
                  <span className="detailLabel">Location</span>
                  <span className="detailValue">{transaction.location}</span>
                </div>
              </div>
              <div className="detailItem">
                <Smartphone size={14} />
                <div>
                  <span className="detailLabel">Device ID</span>
                  <span className="detailValue">{transaction.device_id}</span>
                </div>
              </div>
              <div className="detailItem">
                <TrendingUp size={14} />
                <div>
                  <span className="detailLabel">Velocity</span>
                  <span className="detailValue">{transaction.velocity} tx/hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timing Info */}
          <div className="drawerSection">
            <h3 className="sectionHeader">
              <Clock size={16} />
              Timing Information
            </h3>
            <div className="detailGrid">
              <div className="detailItem">
                <Clock size={14} />
                <div>
                  <span className="detailLabel">Timestamp</span>
                  <span className="detailValue">{formatDateTime(transaction.timestamp)}</span>
                </div>
              </div>
              <div className="detailItem">
                <Calendar size={14} />
                <div>
                  <span className="detailLabel">Day of Week</span>
                  <span className="detailValue">{transaction.day_of_week}</span>
                </div>
              </div>
              <div className="detailItem">
                <Clock size={14} />
                <div>
                  <span className="detailLabel">Hour</span>
                  <span className="detailValue">{transaction.hour}:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fraud Reason (if flagged) */}
          {transaction.is_fraud && transaction.fraud_reason && (
            <div className="drawerSection">
              <h3 className="sectionHeader">
                <AlertTriangle size={16} />
                Fraud Indicators
              </h3>
              <div className="fraudReasonBox">
                <p>{transaction.fraud_reason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="drawerFooter">
          <button className="btn btnSecondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btnPrimary" onClick={handleInvestigate}>
            <Play size={16} />
            Run Investigation
          </button>
        </div>
      </div>
    </>
  );
}
