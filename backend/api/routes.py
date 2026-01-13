"""
FastAPI REST API routes for fraud investigation system.
"""

import json
from pathlib import Path
from typing import Any, Optional, List, Dict

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["api"])

# Data path
DATA_DIR = Path(__file__).parent.parent / "data"


class TransactionResponse(BaseModel):
    """Transaction response model."""
    transaction_id: str
    timestamp: str
    from_account: str
    to_account: str
    amount: float
    merchant_category: str
    device_id: str
    location: str
    hour: int
    day_of_week: str
    velocity: int
    is_fraud: int
    fraud_reason: str


class MetricsResponse(BaseModel):
    """Dashboard metrics response."""
    total_transactions: int
    fraud_detected: int
    fraud_rate: float
    money_saved: float
    avg_response_time_ms: int
    transactions_today: int
    high_risk_count: int


class FraudRing(BaseModel):
    """Fraud ring model."""
    ring_id: int
    accounts: List[str]
    modus_operandi: str


def load_transactions() -> pd.DataFrame:
    """Load transactions from CSV."""
    csv_path = DATA_DIR / "transactions.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="Transaction data not found. Run generate_fraud_data.py first.")
    return pd.read_csv(csv_path)


def load_fraud_rings() -> List[Dict[str, Any]]:
    """Load fraud rings from JSON."""
    json_path = DATA_DIR / "fraud_rings.json"
    if not json_path.exists():
        return []
    with open(json_path) as f:
        return json.load(f)


@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=10000),
    is_fraud: Optional[bool] = None,
    merchant_category: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """Get paginated list of transactions with optional filters."""
    df = load_transactions()

    # Apply filters
    if is_fraud is not None:
        df = df[df["is_fraud"] == int(is_fraud)]

    if merchant_category:
        df = df[df["merchant_category"] == merchant_category]

    if min_amount is not None:
        df = df[df["amount"] >= min_amount]

    if max_amount is not None:
        df = df[df["amount"] <= max_amount]

    # Sort by timestamp descending
    df = df.sort_values("timestamp", ascending=False)

    # Paginate
    start = (page - 1) * page_size
    end = start + page_size
    df_page = df.iloc[start:end]

    return df_page.to_dict(orient="records")


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str) -> Dict[str, Any]:
    """Get a single transaction by ID."""
    df = load_transactions()
    transaction = df[df["transaction_id"] == transaction_id]

    if transaction.empty:
        raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found")

    return transaction.iloc[0].to_dict()


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics() -> Dict[str, Any]:
    """Get dashboard metrics."""
    df = load_transactions()

    total = len(df)
    fraud_count = df["is_fraud"].sum()
    fraud_rate = fraud_count / total if total > 0 else 0

    # Calculate estimated money saved (sum of fraud amounts)
    fraud_df = df[df["is_fraud"] == 1]
    money_saved = fraud_df["amount"].sum()

    # High risk transactions (using heuristics)
    high_risk_mask = (
        (df["amount"] > 5000) |
        (df["merchant_category"].isin(["Gift Cards", "Crypto", "Wire Transfer"])) |
        (df["location"].isin(["Unknown", "Foreign", "VPN"]))
    )
    high_risk_count = high_risk_mask.sum()

    return {
        "total_transactions": int(total),
        "fraud_detected": int(fraud_count),
        "fraud_rate": float(fraud_rate),
        "money_saved": float(money_saved),
        "avg_response_time_ms": 47,  # Simulated
        "transactions_today": int(total // 30),  # Approximate daily average
        "high_risk_count": int(high_risk_count),
    }


@router.get("/fraud-rings", response_model=List[FraudRing])
async def get_fraud_rings() -> List[Dict[str, Any]]:
    """Get fraud ring network data for visualization."""
    return load_fraud_rings()


@router.get("/network-data")
async def get_network_data(
    edge_limit: int = Query(500, ge=10, le=5000, description="Maximum number of edges to return"),
) -> Dict[str, Any]:
    """Get graph network data for 3D visualization."""
    df = load_transactions()
    fraud_rings = load_fraud_rings()

    # Build all edges first (prioritize by fraud)
    edge_map: Dict[tuple, Dict[str, Any]] = {}

    for _, row in df.iterrows():
        from_acc = row["from_account"]
        to_acc = row["to_account"]
        key = (from_acc, to_acc)
        if key not in edge_map:
            edge_map[key] = {
                "source": from_acc,
                "target": to_acc,
                "count": 0,
                "total_amount": 0,
                "fraud_count": 0,
            }
        edge_map[key]["count"] += 1
        edge_map[key]["total_amount"] += row["amount"]
        edge_map[key]["fraud_count"] += int(row["is_fraud"])

    # Sort edges by fraud count descending, then by count
    all_edges = sorted(
        edge_map.values(),
        key=lambda e: (-e["fraud_count"], -e["count"])
    )
    
    # Take top edges based on limit
    selected_edges = all_edges[:edge_limit]
    
    # Collect accounts from selected edges
    selected_account_ids = set()
    for edge in selected_edges:
        selected_account_ids.add(edge["source"])
        selected_account_ids.add(edge["target"])

    # Also include fraud ring accounts
    fraud_ring_accounts = {acc for ring in fraud_rings for acc in ring["accounts"]}
    selected_account_ids.update(fraud_ring_accounts)

    # Build nodes only for accounts in selected edges
    nodes = []
    for account in selected_account_ids:
        mask = (df["from_account"] == account) | (df["to_account"] == account)
        account_txns = df[mask]
        fraud_rate = account_txns["is_fraud"].mean() if len(account_txns) > 0 else 0
        total_amount = account_txns["amount"].sum()

        # Determine risk level
        if account in fraud_ring_accounts:
            risk = "critical"
            group = next(
                (ring["ring_id"] for ring in fraud_rings if account in ring["accounts"]),
                0,
            )
        elif fraud_rate > 0.3:
            risk = "high"
            group = 10
        elif fraud_rate > 0.1:
            risk = "medium"
            group = 11
        else:
            risk = "low"
            group = 12

        nodes.append({
            "id": account,
            "name": account,
            "risk": risk,
            "group": group,
            "transactions": len(account_txns),
            "total_amount": round(total_amount, 2),
            "fraud_rate": round(fraud_rate, 3),
        })

    return {
        "nodes": nodes,
        "links": selected_edges,
        "fraud_rings": fraud_rings,
    }


@router.get("/merchant-categories")
async def get_merchant_categories() -> List[str]:
    """Get list of unique merchant categories."""
    df = load_transactions()
    return df["merchant_category"].unique().tolist()


@router.get("/stats/hourly")
async def get_hourly_stats() -> List[Dict[str, Any]]:
    """Get transaction statistics by hour."""
    df = load_transactions()
    grouped = df.groupby("hour").agg({
        "transaction_id": "count",
        "is_fraud": "sum",
        "amount": "sum",
    }).reset_index()

    grouped.columns = ["hour", "count", "fraud_count", "total_amount"]
    grouped["fraud_rate"] = grouped["fraud_count"] / grouped["count"]

    return grouped.to_dict(orient="records")


@router.get("/stats/daily")
async def get_daily_stats() -> List[Dict[str, Any]]:
    """Get transaction statistics by day of week."""
    df = load_transactions()
    grouped = df.groupby("day_of_week").agg({
        "transaction_id": "count",
        "is_fraud": "sum",
        "amount": "sum",
    }).reset_index()

    grouped.columns = ["day", "count", "fraud_count", "total_amount"]
    grouped["fraud_rate"] = grouped["fraud_count"] / grouped["count"]

    # Order days
    day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    grouped["day_order"] = grouped["day"].apply(lambda x: day_order.index(x) if x in day_order else 7)
    grouped = grouped.sort_values("day_order").drop("day_order", axis=1)

    return grouped.to_dict(orient="records")


@router.get("/stats/merchant")
async def get_merchant_stats() -> List[Dict[str, Any]]:
    """Get transaction statistics by merchant category."""
    df = load_transactions()
    grouped = df.groupby("merchant_category").agg({
        "transaction_id": "count",
        "is_fraud": "sum",
        "amount": ["sum", "mean"],
    }).reset_index()

    grouped.columns = ["category", "count", "fraud_count", "total_amount", "avg_amount"]
    grouped["fraud_rate"] = grouped["fraud_count"] / grouped["count"]
    grouped = grouped.sort_values("fraud_rate", ascending=False)

    return grouped.to_dict(orient="records")
