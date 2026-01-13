"""
FastAPI Main Application - Multi-Agent Fraud Investigation System.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict

import pandas as pd
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from api.websocket import websocket_endpoint, simulate_transaction_feed
from agents.orchestrator import FraudInvestigationOrchestrator
from models.gnn_model import create_mock_gnn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global state
app_state: Dict[str, Any] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Starting Fraud Investigation System...")

    # Load data
    data_path = Path(__file__).parent / "data" / "transactions.csv"
    if data_path.exists():
        app_state["transactions_df"] = pd.read_csv(data_path)
        logger.info(f"Loaded {len(app_state['transactions_df'])} transactions")
    else:
        logger.warning("Transaction data not found. Run generate_fraud_data.py first.")
        app_state["transactions_df"] = pd.DataFrame()

    # Initialize GNN model
    try:
        app_state["gnn_model"] = create_mock_gnn()
        logger.info("GNN model initialized")
    except Exception as e:
        logger.error(f"Failed to initialize GNN model: {e}")
        app_state["gnn_model"] = None

    # Initialize orchestrator
    app_state["orchestrator"] = FraudInvestigationOrchestrator(
        gnn_model=app_state.get("gnn_model"),
        region="us-east-1",
    )
    logger.info("Orchestrator initialized")

    # Start transaction feed simulation (for demo)
    feed_task = asyncio.create_task(simulate_transaction_feed(interval_seconds=10.0))

    yield

    # Cleanup
    feed_task.cancel()
    logger.info("Fraud Investigation System shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Multi-Agent Fraud Investigation System",
    description="Production-ready fraud detection with AI agents and Graph Neural Networks",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST routes
app.include_router(router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Multi-Agent Fraud Investigation System",
        "version": "1.0.0",
        "status": "operational",
        "agents": ["Fraud Investigator", "Risk Analyst", "Compliance Officer"],
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "data_loaded": len(app_state.get("transactions_df", [])) > 0,
        "gnn_model": app_state.get("gnn_model") is not None,
        "orchestrator": app_state.get("orchestrator") is not None,
    }


@app.websocket("/ws/investigations")
async def websocket_investigations(websocket: WebSocket):
    """WebSocket endpoint for real-time investigation updates."""
    await websocket_endpoint(
        websocket=websocket,
        orchestrator=app_state.get("orchestrator"),
        transactions_df=app_state.get("transactions_df", pd.DataFrame()),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
