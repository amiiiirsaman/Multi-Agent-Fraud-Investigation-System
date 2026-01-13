import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Shield, Scale, FileCheck, ArrowRight } from 'lucide-react';

/**
 * HowItWorksPanel - A collapsible panel explaining the fraud detection system
 * in business-friendly language for the Investigation page.
 */
const HowItWorksPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="howItWorksPanel">
      <button
        className="howItWorksPanelHeader"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="howItWorksPanelTitle">
          <Brain size={20} />
          <span>How It Works - Understanding the Investigation Process</span>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="howItWorksPanelContent">
          {/* Overview Section */}
          <div className="howItWorksOverview">
            <h3>System Overview</h3>
            <p>
              Our Multi-Agent Fraud Investigation System combines <strong>machine learning</strong> with 
              <strong> specialized AI agents</strong> to analyze transactions in real-time. Each transaction 
              goes through a comprehensive 4-step process that mimics how expert fraud analysts work together.
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="howItWorksFlow">
            <div className="flowStep">
              <div className="flowStepIcon gnn">
                <Brain size={24} />
              </div>
              <div className="flowStepLabel">GNN Analysis</div>
              <div className="flowStepNum">1</div>
            </div>
            <ArrowRight className="flowArrow" size={20} />
            <div className="flowStep">
              <div className="flowStepIcon risk">
                <Shield size={24} />
              </div>
              <div className="flowStepLabel">Risk Analyst</div>
              <div className="flowStepNum">2</div>
            </div>
            <ArrowRight className="flowArrow" size={20} />
            <div className="flowStep">
              <div className="flowStepIcon investigator">
                <Scale size={24} />
              </div>
              <div className="flowStepLabel">Fraud Investigator</div>
              <div className="flowStepNum">3</div>
            </div>
            <ArrowRight className="flowArrow" size={20} />
            <div className="flowStep">
              <div className="flowStepIcon compliance">
                <FileCheck size={24} />
              </div>
              <div className="flowStepLabel">Compliance Officer</div>
              <div className="flowStepNum">4</div>
            </div>
          </div>

          {/* Detailed Cards */}
          <div className="howItWorksCards">
            {/* GNN Card */}
            <div className="howItWorksCard gnn">
              <div className="howItWorksCardHeader">
                <Brain size={20} />
                <h4>Step 1: Graph Neural Network (GNN) Analysis</h4>
              </div>
              <div className="howItWorksCardBody">
                <p><strong>What it does:</strong> Analyzes transaction patterns using relationship graphs.</p>
                <p><strong>How it works:</strong> The GNN looks at 8 key features of each transaction:</p>
                <ul>
                  <li><strong>Transaction Amount</strong> - Size of the transaction</li>
                  <li><strong>Time of Day</strong> - When the transaction occurred</li>
                  <li><strong>Merchant Type</strong> - Category of the merchant</li>
                  <li><strong>Location Risk</strong> - Geographic risk factors</li>
                  <li><strong>Velocity</strong> - How fast transactions are happening</li>
                  <li><strong>Transaction Count</strong> - Number of recent transactions</li>
                  <li><strong>Historical Fraud Rate</strong> - Past fraud patterns</li>
                  <li><strong>Average Amount</strong> - Typical spending behavior</li>
                </ul>
                <p><strong>Output:</strong> A fraud probability score from 0% to 100%.</p>
              </div>
            </div>

            {/* Risk Analyst Card */}
            <div className="howItWorksCard risk">
              <div className="howItWorksCardHeader">
                <Shield size={20} />
                <h4>Step 2: Risk Analyst Agent</h4>
              </div>
              <div className="howItWorksCardBody">
                <p><strong>What it does:</strong> Performs initial risk assessment using expert heuristics.</p>
                <p><strong>Risk Factors Evaluated:</strong></p>
                <ul>
                  <li><strong>Card Testing Detection</strong> - Multiple small transactions (+30% risk)</li>
                  <li><strong>Large Transaction Alert</strong> - Unusually high amounts (+20% risk)</li>
                  <li><strong>Unusual Hours</strong> - Late night/early morning activity (+20% risk)</li>
                  <li><strong>Suspicious Location</strong> - High-risk geographic areas (+25% risk)</li>
                  <li><strong>High-Risk Merchant</strong> - Categories prone to fraud (+15% risk)</li>
                  <li><strong>Velocity Check</strong> - Rapid transaction patterns (+10% risk)</li>
                </ul>
                <p><strong>Decision:</strong> If combined risk exceeds 40%, escalates to full investigation.</p>
              </div>
            </div>

            {/* Fraud Investigator Card */}
            <div className="howItWorksCard investigator">
              <div className="howItWorksCardHeader">
                <Scale size={20} />
                <h4>Step 3: Fraud Investigator Agent</h4>
              </div>
              <div className="howItWorksCardBody">
                <p><strong>What it does:</strong> Conducts deep analysis and makes transaction recommendations.</p>
                <p><strong>Analysis Includes:</strong></p>
                <ul>
                  <li>Cross-references transaction patterns with known fraud schemes</li>
                  <li>Evaluates merchant reputation and transaction history</li>
                  <li>Analyzes behavioral anomalies and account patterns</li>
                  <li>Reviews geographic and temporal inconsistencies</li>
                </ul>
                <p><strong>Recommendations:</strong></p>
                <ul>
                  <li><strong>APPROVE</strong> - Transaction appears legitimate</li>
                  <li><strong>DECLINE</strong> - High fraud confidence, block transaction</li>
                  <li><strong>REVIEW</strong> - Needs manual review by human analyst</li>
                </ul>
              </div>
            </div>

            {/* Compliance Officer Card */}
            <div className="howItWorksCard compliance">
              <div className="howItWorksCardHeader">
                <FileCheck size={20} />
                <h4>Step 4: Compliance Officer Agent</h4>
              </div>
              <div className="howItWorksCardBody">
                <p><strong>What it does:</strong> Ensures regulatory compliance and filing requirements.</p>
                <p><strong>Regulatory Checks:</strong></p>
                <ul>
                  <li><strong>BSA (Bank Secrecy Act)</strong> - Anti-money laundering requirements</li>
                  <li><strong>AML (Anti-Money Laundering)</strong> - Suspicious activity patterns</li>
                  <li><strong>KYC (Know Your Customer)</strong> - Customer verification status</li>
                  <li><strong>FinCEN</strong> - Financial crimes network reporting</li>
                  <li><strong>OFAC</strong> - Sanctions list screening</li>
                </ul>
                <p><strong>Automatic Filings:</strong></p>
                <ul>
                  <li><strong>CTR (Currency Transaction Report)</strong> - Auto-filed for transactions &gt;$10,000</li>
                  <li><strong>SAR (Suspicious Activity Report)</strong> - Auto-triggered for transactions &gt;$5,000 with suspicious indicators</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Decision Logic Summary */}
          <div className="howItWorksDecision">
            <h4>Final Decision Logic</h4>
            <div className="decisionGrid">
              <div className="decisionItem approve">
                <strong>✓ APPROVE</strong>
                <span>Low risk score (&lt;40%) and no red flags detected</span>
              </div>
              <div className="decisionItem review">
                <strong>⚠ REVIEW</strong>
                <span>Moderate risk (40-70%) or mixed signals requiring human judgment</span>
              </div>
              <div className="decisionItem decline">
                <strong>✕ DECLINE</strong>
                <span>High risk (&gt;70%) with multiple fraud indicators confirmed</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HowItWorksPanel;
