/**
 * Dashboard View - Main overview with KPIs and transaction table.
 */

import { useEffect, useState, useCallback } from 'react';
import type { Transaction, DashboardMetrics, HourlyStat, MerchantStat } from '../types';
import { SummaryCards } from '../components/SummaryCards';
import { TransactionTable } from '../components/TransactionTable';
import { TransactionDrawer } from '../components/TransactionDrawer';
import { RiskHeatmap } from '../components/RiskHeatmap';
import { CategoryChart } from '../components/CategoryChart';
import { 
  fetchTransactions, 
  fetchMetrics, 
  fetchHourlyStats, 
  fetchMerchantStats 
} from '../utils/api';

interface DashboardViewProps {
  onSelectTransaction: (transaction: Transaction) => void;
  selectedTransaction?: Transaction;
}

export function DashboardView({ onSelectTransaction, selectedTransaction }: DashboardViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [hourlyStats, setHourlyStats] = useState<HourlyStat[]>([]);
  const [merchantStats, setMerchantStats] = useState<MerchantStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merchantCategories, setMerchantCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [drawerTransaction, setDrawerTransaction] = useState<Transaction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch all transactions (10K) and other data
        const [txData, metricsData, hourlyData, merchantData] = await Promise.all([
          fetchTransactions({ page_size: 10000 }),
          fetchMetrics(),
          fetchHourlyStats(),
          fetchMerchantStats(),
        ]);
        
        const txArray = txData as Transaction[];
        setTransactions(txArray);
        setMetrics(metricsData as DashboardMetrics);
        setHourlyStats(hourlyData as HourlyStat[]);
        setMerchantStats(merchantData as MerchantStat[]);
        
        // Extract unique categories and locations for filters
        const categories = [...new Set(txArray.map(tx => tx.merchant_category))].sort();
        const locs = [...new Set(txArray.map(tx => tx.location))].sort();
        setMerchantCategories(categories);
        setLocations(locs);
        
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleRowClick = useCallback((tx: Transaction) => {
    setDrawerTransaction(tx);
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleInvestigateFromDrawer = useCallback((tx: Transaction) => {
    onSelectTransaction(tx);
  }, [onSelectTransaction]);

  if (error) {
    return (
      <div className="card">
        <div className="cardContent">
          <div className="textDanger">Error: {error}</div>
          <p className="textMuted mt-md">
            Make sure the backend is running and data has been generated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fadeIn">
      {/* KPI Summary Cards */}
      <div className="mb-lg">
        <SummaryCards metrics={metrics} loading={loading} />
      </div>

      {/* Transaction Table */}
      <div className="mb-lg">
        <TransactionTable
          transactions={transactions}
          onSelectTransaction={handleRowClick}
          selectedId={selectedTransaction?.transaction_id}
          loading={loading}
          merchantCategories={merchantCategories}
          locations={locations}
        />
      </div>

      {/* Charts Row */}
      <div className="grid2">
        <RiskHeatmap data={hourlyStats} />
        <CategoryChart data={merchantStats} />
      </div>

      {/* Transaction Drawer */}
      <TransactionDrawer
        transaction={drawerTransaction}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onInvestigate={handleInvestigateFromDrawer}
      />
    </div>
  );
}
