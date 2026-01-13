# 🔍 Multi-Agent Fraud Investigation System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![AWS](https://img.shields.io/badge/AWS_Bedrock-Nova_Pro-FF9900?logo=amazonaws&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**A production-grade AI system for real-time fraud detection using Multi-Agent Architecture, Graph Neural Networks, and 3D Network Visualization**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Reference](#-api-reference)

</div>

---

## 🎯 Overview

This system demonstrates an enterprise-grade fraud investigation platform that combines:

- **🤖 Multi-Agent AI Architecture** - Three specialized AI agents (Risk Analyst, Fraud Investigator, Compliance Officer) orchestrated via LangGraph for comprehensive fraud analysis
- **🧠 Graph Neural Networks** - PyTorch Geometric 3-layer GCN model for fraud ring detection and risk scoring
- **⚡ Real-time Investigation** - WebSocket-powered live updates showing AI agent reasoning as it happens
- **🌐 3D Network Visualization** - Interactive force-directed graph with orbit controls for exploring fraud networks
- **📊 Explainable AI** - Every decision comes with human-readable explanations of GNN scores and agent reasoning

## ✨ Features

### 📊 Dashboard
- **Real-time KPIs** - Total transactions, fraud rate, active alerts, pending reviews
- **Live Transaction Feed** - Scrolling list with risk indicators and status badges
- **Risk Heatmap** - Hour-by-day visualization of fraud patterns
- **Category Distribution** - Pie chart breakdown of fraud by transaction type
- **Time Series Analysis** - Fraud trends over time with interactive charts

### 🔬 Investigation Panel
- **Transaction Deep-Dive** - Select any transaction for AI-powered analysis
- **Live Agent Updates** - Watch each AI agent analyze in real-time via WebSocket
- **Explainable Scores** - See exactly why the GNN assigned a risk probability:
  - Feature contributions (amount, velocity, time patterns)
  - Network position analysis
  - Historical pattern matching
- **Decision Summary** - Bulleted breakdown with Risk Score, Fraud Likelihood, Compliance Status, and Final Verdict
- **Agent Reasoning** - Each agent explains their conclusions in business terms

### 🌐 Network View
- **3D Interactive Graph** - Force-directed visualization with orbit controls (rotate, zoom, pan)
- **Risk-Based Coloring**:
  - 🔴 Critical (Fraud Ring Member)
  - 🟠 High Risk (>30% probability)
  - 🟡 Medium Risk (10-30%)
  - 🟢 Low Risk (<10%)
- **Account Details Panel** - Click any node to see:
  - Account KPIs (transactions, volume, fraud rate, flags)
  - Transaction history
  - Connected accounts
- **Fraud Ring Detection** - Horizontal scrollable cards showing:
  - Ring ID and member count
  - Modus operandi description
  - Account list preview
- **Risk Filtering** - Filter nodes by risk level (All/Critical/High/Medium/Low)
- **Edge Limiting** - Control connection density (Top 100-2000)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React Frontend (Vite)                        │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │  Dashboard  │  │  Investigation   │  │   Network View (3D)   │  │
│  │  - KPIs     │  │  - Agent Status  │  │   - Force Graph       │  │
│  │  - Charts   │  │  - Explanations  │  │   - Fraud Rings       │  │
│  │  - Feed     │  │  - Decision      │  │   - Account Details   │  │
│  └─────────────┘  └──────────────────┘  └───────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST API + WebSocket
┌────────────────────────────┴────────────────────────────────────────┐
│                      FastAPI Backend                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                  LangGraph Orchestrator                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │ │
│  │  │    Risk      │  │    Fraud     │  │    Compliance      │   │ │
│  │  │   Analyst    │──│ Investigator │──│      Officer       │   │ │
│  │  │  (GNN+LLM)   │  │  (Bedrock)   │  │    (Bedrock)       │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘   │ │
│  │         │                                                       │ │
│  │         ▼                                                       │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │              GNN Model (PyTorch Geometric)                │  │ │
│  │  │   • 3-layer Graph Convolutional Network                   │  │ │
│  │  │   • 8 input features → 64 hidden → 32 → 1 output          │  │ │
│  │  │   • Fraud ring detection via community analysis           │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- AWS Account with Bedrock access (Amazon Nova Pro enabled)
- AWS CLI configured with credentials

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template and configure
cp .env.example .env
# Edit .env with your AWS credentials

# Generate synthetic fraud data (10,000 transactions)
python -m data.generate_fraud_data

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173** to view the application.

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance async web framework |
| **LangGraph** | Multi-agent workflow orchestration |
| **AWS Bedrock** | Amazon Nova Pro for AI reasoning |
| **PyTorch Geometric** | Graph Neural Network implementation |
| **WebSocket** | Real-time bidirectional communication |
| **Pydantic** | Data validation and serialization |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | Modern UI with hooks and concurrent features |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast build tooling |
| **react-force-graph-3d** | 3D network visualization with Three.js |
| **Recharts** | Responsive data visualization |
| **Lucide React** | Beautiful icon library |

## 📁 Project Structure

```
Multi-Agent Fraud Investigation System/
├── backend/
│   ├── agents/
│   │   ├── base_agent.py           # AWS Bedrock base class
│   │   ├── fraud_investigator.py   # Deep transaction analysis
│   │   ├── risk_analyst.py         # GNN-based scoring
│   │   ├── compliance_agent.py     # AML/KYC checks
│   │   └── orchestrator.py         # LangGraph workflow
│   ├── models/
│   │   └── gnn_model.py            # PyTorch Geometric GNN
│   ├── api/
│   │   ├── routes.py               # REST endpoints
│   │   └── websocket.py            # WebSocket handlers
│   ├── data/
│   │   └── generate_fraud_data.py  # Synthetic data generator
│   ├── tests/                      # pytest test suite
│   ├── config.py                   # Configuration management
│   ├── main.py                     # FastAPI application entry
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FraudGraph3D.tsx    # 3D network visualization
│   │   │   ├── TransactionList.tsx # Transaction feed
│   │   │   └── ...
│   │   ├── views/
│   │   │   ├── DashboardView.tsx   # Main dashboard
│   │   │   ├── InvestigationView.tsx # Investigation panel
│   │   │   └── NetworkView.tsx     # Network analysis
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts     # WebSocket hook
│   │   ├── utils/
│   │   │   └── api.ts              # API client
│   │   ├── types.ts                # TypeScript interfaces
│   │   ├── styles.css              # Global styles
│   │   └── App.tsx                 # Root component
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Bedrock Model
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0

# Optional: LangFuse Observability
LANGFUSE_PUBLIC_KEY=pk_...
LANGFUSE_SECRET_KEY=sk_...
LANGFUSE_HOST=https://cloud.langfuse.com
```

## 📊 API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions` | List transactions with pagination & filters |
| `GET` | `/api/transactions/{id}` | Get transaction details |
| `GET` | `/api/metrics` | Dashboard KPI metrics |
| `GET` | `/api/fraud-rings` | Detected fraud rings |
| `GET` | `/api/network-data` | Network graph nodes & edges |
| `POST` | `/api/investigate/{id}` | Start investigation (returns via WebSocket) |

### WebSocket

```javascript
// Connect to investigations WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/investigations');

// Receive real-time agent updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type: 'agent_update' | 'investigation_complete'
  // data.agent: 'risk_analyst' | 'fraud_investigator' | 'compliance'
  // data.status: 'analyzing' | 'complete'
  // data.analysis: { ... agent findings ... }
};

// Start investigation
ws.send(JSON.stringify({ 
  type: 'investigate', 
  transaction_id: 'TXN123' 
}));
```

## 🧠 Multi-Agent Workflow

```
┌─────────────────┐
│   Transaction   │
│     Input       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Provides:
│  Risk Analyst   │───► • GNN fraud probability (0-100%)
│    (GNN+LLM)    │     • Score breakdown by feature
└────────┬────────┘     • Network position analysis
         │
         ▼
┌─────────────────┐     Provides:
│     Fraud       │───► • Pattern analysis
│  Investigator   │     • Behavioral red flags
└────────┬────────┘     • Historical comparison
         │
         ▼
┌─────────────────┐     Provides:
│   Compliance    │───► • AML/KYC assessment
│    Officer      │     • Regulatory flags
└────────┬────────┘     • Required actions
         │
         ▼
┌─────────────────┐     Outputs:
│  Orchestrator   │───► • Final verdict
│   (Finalizer)   │     • Consolidated reasoning
└─────────────────┘     • Recommended actions
```

## 📈 Performance

| Metric | Value |
|--------|-------|
| Transaction Dataset | 10,000+ synthetic transactions |
| GNN Inference | <100ms per transaction |
| WebSocket Latency | ~50ms round-trip |
| 3D Graph Rendering | 60 FPS with 1000+ nodes |
| Agent Analysis | 3-5 seconds total |

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm run test
```

## 🔮 Future Enhancements

- [ ] Historical investigation replay
- [ ] Batch investigation mode
- [ ] Custom GNN model training UI
- [ ] Alert rule configuration
- [ ] Export investigation reports (PDF)
- [ ] Multi-user collaboration
- [ ] Integration with external fraud databases

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for demonstrating AI Director-level technical capabilities**

*Multi-Agent Systems • Graph Neural Networks • Real-time AI • Explainable Decisions*

</div>
