"""
Enhanced Fraud Dataset Generator
Generates 10,000 transactions with fraud rings and realistic patterns.
"""

import pandas as pd
import numpy as np
from faker import Faker
from datetime import datetime, timedelta
import random
import json
from pathlib import Path
from typing import Optional, List, Dict

fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)


def generate_fraud_rings(num_rings: int = 5) -> List[Dict]:
    """Create fraud rings with distinct modus operandi."""
    modus_operandi_options = [
        "Card testing with small transactions",
        "Account takeover with rapid withdrawals",
        "Money mule network",
        "Synthetic identity fraud",
        "Business email compromise",
    ]

    fraud_rings = []
    for ring_id in range(num_rings):
        ring_size = random.randint(3, 8)
        ring_accounts = [f"ACC{random.randint(1000, 9999)}" for _ in range(ring_size)]
        fraud_rings.append({
            "ring_id": ring_id,
            "accounts": ring_accounts,
            "modus_operandi": modus_operandi_options[ring_id % len(modus_operandi_options)],
        })

    return fraud_rings


def generate_enhanced_transactions(
    num_transactions: int = 10000,
    fraud_rate: float = 0.05,
    fraud_rings: Optional[List[Dict]] = None,
) -> pd.DataFrame:
    """Generate transactions with rich features for fraud detection."""
    if fraud_rings is None:
        fraud_rings = generate_fraud_rings()

    # Flatten fraud ring accounts for quick lookup
    fraud_ring_accounts = {
        acc: ring
        for ring in fraud_rings
        for acc in ring["accounts"]
    }

    transactions = []
    base_time = datetime.now()

    # Normal merchant categories
    normal_merchants = ["Groceries", "Gas", "Restaurant", "Shopping", "Bills", "Entertainment"]
    # High-risk merchant categories
    high_risk_merchants = ["Electronics", "Gift Cards", "Wire Transfer", "Crypto", "Jewelry"]

    for i in range(num_transactions):
        is_fraud = random.random() < fraud_rate
        
        # Determine accounts
        if is_fraud and random.random() < 0.6:
            # 60% of fraud is part of rings
            ring = random.choice(fraud_rings)
            from_account = random.choice(ring["accounts"])
            # Sometimes transfer within ring, sometimes to external
            if random.random() < 0.7:
                to_account = random.choice(ring["accounts"])
            else:
                to_account = f"ACC{random.randint(1000, 9999)}"
            fraud_reason = ring["modus_operandi"]
        else:
            from_account = f"ACC{random.randint(1000, 9999)}"
            to_account = f"ACC{random.randint(1000, 9999)}"
            fraud_reason = random.choice([
                "Card testing",
                "Account takeover",
                "Money laundering",
                "Synthetic identity",
                "BEC scam",
            ]) if is_fraud else "Not fraud"

        # Generate transaction features based on fraud status
        if is_fraud:
            # Fraudulent transaction patterns
            amount_pattern = random.choice(["micro", "medium", "large"])
            if amount_pattern == "micro":
                amount = random.uniform(0.01, 1.00)  # Card testing
            elif amount_pattern == "medium":
                amount = random.uniform(500, 2000)  # Account takeover
            else:
                amount = random.uniform(5000, 15000)  # Large fraud

            hour = random.choice([0, 1, 2, 3, 4, 23])  # Unusual hours
            merchant_category = random.choice(high_risk_merchants)
            device_id = f"DEV{random.randint(1, 100)}"  # Shared devices in rings
            location = random.choice(["Unknown", "Foreign", "VPN", "Proxy"])
            velocity = random.randint(5, 20)  # High transaction velocity
        else:
            # Normal transaction patterns
            amount = random.uniform(5, 500)
            hour = random.randint(6, 22)  # Normal business hours
            merchant_category = random.choice(normal_merchants)
            device_id = f"DEV{random.randint(100, 5000)}"  # Unique devices
            location = random.choice(["Home", "Work", "Local", "Domestic"])
            velocity = random.randint(1, 3)  # Normal velocity

        # Generate timestamp (within last 30 days)
        days_ago = random.randint(0, 30)
        transaction_time = base_time - timedelta(
            days=days_ago,
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )

        transaction = {
            "transaction_id": f"TXN{i:08d}",
            "timestamp": transaction_time.isoformat(),
            "from_account": from_account,
            "to_account": to_account,
            "amount": round(amount, 2),
            "merchant_category": merchant_category,
            "device_id": device_id,
            "location": location,
            "hour": hour,
            "day_of_week": transaction_time.strftime("%A"),
            "velocity": velocity,
            "is_fraud": int(is_fraud),
            "fraud_reason": fraud_reason,
        }

        transactions.append(transaction)

    return pd.DataFrame(transactions)


def main():
    """Generate and save fraud dataset."""
    output_dir = Path(__file__).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    print("Generating fraud rings...")
    fraud_rings = generate_fraud_rings(num_rings=5)

    print("Generating transactions...")
    df = generate_enhanced_transactions(
        num_transactions=10000,
        fraud_rate=0.05,
        fraud_rings=fraud_rings,
    )

    # Save transactions
    transactions_path = output_dir / "transactions.csv"
    df.to_csv(transactions_path, index=False)
    print(f"Saved {len(df)} transactions to {transactions_path}")

    # Save fraud rings
    fraud_rings_path = output_dir / "fraud_rings.json"
    with open(fraud_rings_path, "w") as f:
        json.dump(fraud_rings, f, indent=2)
    print(f"Saved {len(fraud_rings)} fraud rings to {fraud_rings_path}")

    # Print statistics
    print("\n--- Dataset Statistics ---")
    print(f"Total transactions: {len(df):,}")
    print(f"Fraud transactions: {df['is_fraud'].sum():,}")
    print(f"Fraud rate: {df['is_fraud'].mean():.2%}")
    print(f"Unique accounts: {df['from_account'].nunique() + df['to_account'].nunique():,}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

    print("\nFraud by merchant category:")
    fraud_by_merchant = df[df["is_fraud"] == 1].groupby("merchant_category").size()
    for merchant, count in fraud_by_merchant.items():
        print(f"  {merchant}: {count}")

    print("\nFraud rings:")
    for ring in fraud_rings:
        print(f"  Ring {ring['ring_id']}: {len(ring['accounts'])} accounts - {ring['modus_operandi']}")


if __name__ == "__main__":
    main()
