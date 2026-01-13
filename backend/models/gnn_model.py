"""
GNN Model for fraud detection using PyTorch Geometric.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, global_mean_pool
from torch_geometric.data import Data
import numpy as np
import pandas as pd
from typing import Any, Optional, List, Dict


class FraudGNN(nn.Module):
    """Graph Neural Network for fraud detection."""

    def __init__(
        self,
        num_node_features: int = 8,
        hidden_channels: int = 64,
        num_classes: int = 1,
    ):
        super().__init__()
        self.conv1 = GCNConv(num_node_features, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, hidden_channels)
        self.conv3 = GCNConv(hidden_channels, hidden_channels)
        self.lin = nn.Linear(hidden_channels, num_classes)

    def forward(self, data: Data) -> torch.Tensor:
        x, edge_index, batch = data.x, data.edge_index, data.batch

        # Graph convolutions with ReLU activation
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=0.2, training=self.training)

        x = self.conv2(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=0.2, training=self.training)

        x = self.conv3(x, edge_index)

        # Global pooling
        x = global_mean_pool(x, batch)

        # Classification
        x = self.lin(x)
        x = torch.sigmoid(x)

        return x.squeeze()


class TransactionGraphBuilder:
    """Build transaction graphs for GNN input."""

    def __init__(self):
        self.account_to_idx: Dict[str, int] = {}
        self.merchant_categories = [
            "Groceries", "Gas", "Restaurant", "Shopping", "Bills",
            "Entertainment", "Electronics", "Gift Cards", "Wire Transfer",
            "Crypto", "Jewelry",
        ]
        self.locations = [
            "Home", "Work", "Local", "Domestic",
            "Unknown", "Foreign", "VPN", "Proxy",
        ]

    def build_graph(
        self,
        transaction: Dict[str, Any],
        historical_transactions: Optional[pd.DataFrame] = None,
    ) -> Data:
        """Build a graph centered on a transaction."""
        # Reset account mapping
        self.account_to_idx = {}

        # Get accounts involved
        from_account = transaction["from_account"]
        to_account = transaction["to_account"]

        # Assign indices
        self.account_to_idx[from_account] = 0
        self.account_to_idx[to_account] = 1

        # Build node features
        node_features = []
        for account in [from_account, to_account]:
            features = self._get_account_features(account, transaction, historical_transactions)
            node_features.append(features)

        # Add historical connected accounts if available
        if historical_transactions is not None:
            connected = self._get_connected_accounts(from_account, to_account, historical_transactions)
            for acc in connected[:10]:  # Limit to 10 additional accounts
                if acc not in self.account_to_idx:
                    self.account_to_idx[acc] = len(self.account_to_idx)
                    features = self._get_account_features(acc, None, historical_transactions)
                    node_features.append(features)

        x = torch.tensor(node_features, dtype=torch.float)

        # Build edges
        edge_index = self._build_edges(transaction, historical_transactions)

        # Create batch tensor (single graph)
        batch = torch.zeros(x.size(0), dtype=torch.long)

        return Data(x=x, edge_index=edge_index, batch=batch)

    def _get_account_features(
        self,
        account: str,
        transaction: Optional[Dict[str, Any]],
        historical: Optional[pd.DataFrame],
    ) -> List[float]:
        """Extract features for an account node."""
        features = []

        if transaction and account in [transaction.get("from_account"), transaction.get("to_account")]:
            # Transaction-specific features
            amount = transaction.get("amount", 0)
            features.append(min(amount / 10000, 1.0))  # Normalized amount

            hour = transaction.get("hour", 12)
            features.append(hour / 24.0)  # Normalized hour

            # Merchant category one-hot
            merchant = transaction.get("merchant_category", "")
            merchant_idx = self.merchant_categories.index(merchant) if merchant in self.merchant_categories else -1
            features.append((merchant_idx + 1) / len(self.merchant_categories))

            # Location risk
            location = transaction.get("location", "")
            location_risk = 1.0 if location in ["Unknown", "Foreign", "VPN", "Proxy"] else 0.0
            features.append(location_risk)

            # Velocity
            velocity = transaction.get("velocity", 1)
            features.append(min(velocity / 20, 1.0))

        else:
            # Default features for historical accounts
            features.extend([0.0, 0.5, 0.0, 0.0, 0.1])

        # Historical statistics if available
        if historical is not None:
            mask = (historical["from_account"] == account) | (historical["to_account"] == account)
            account_txns = historical[mask]

            if len(account_txns) > 0:
                features.append(min(len(account_txns) / 100, 1.0))  # Transaction count
                features.append(account_txns["is_fraud"].mean())  # Historical fraud rate
                features.append(min(account_txns["amount"].mean() / 5000, 1.0))  # Avg amount
            else:
                features.extend([0.0, 0.0, 0.0])
        else:
            features.extend([0.0, 0.0, 0.0])

        return features

    def _get_connected_accounts(
        self,
        from_account: str,
        to_account: str,
        historical: pd.DataFrame,
    ) -> List[str]:
        """Get accounts connected to the transaction accounts."""
        connected = set()

        for acc in [from_account, to_account]:
            mask = (historical["from_account"] == acc) | (historical["to_account"] == acc)
            related = historical[mask]

            for _, row in related.iterrows():
                connected.add(row["from_account"])
                connected.add(row["to_account"])

        connected.discard(from_account)
        connected.discard(to_account)

        return list(connected)

    def _build_edges(
        self,
        transaction: Dict[str, Any],
        historical: Optional[pd.DataFrame],
    ) -> torch.Tensor:
        """Build edge index for the graph."""
        edges = []

        # Main transaction edge (bidirectional)
        from_idx = self.account_to_idx[transaction["from_account"]]
        to_idx = self.account_to_idx[transaction["to_account"]]
        edges.append([from_idx, to_idx])
        edges.append([to_idx, from_idx])

        # Historical edges
        if historical is not None:
            for _, row in historical.iterrows():
                if row["from_account"] in self.account_to_idx and row["to_account"] in self.account_to_idx:
                    f_idx = self.account_to_idx[row["from_account"]]
                    t_idx = self.account_to_idx[row["to_account"]]
                    if [f_idx, t_idx] not in edges:
                        edges.append([f_idx, t_idx])
                        edges.append([t_idx, f_idx])

        if not edges:
            edges = [[0, 1], [1, 0]]

        edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
        return edge_index


def create_mock_gnn() -> FraudGNN:
    """Create a mock GNN model for demo purposes."""
    model = FraudGNN()
    model.eval()
    return model
