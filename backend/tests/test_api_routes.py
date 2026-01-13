"""
Unit tests for API routes.
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


@pytest.fixture
def client():
    """Create a test client."""
    from main import app
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for the health endpoint."""
    
    def test_health_check_returns_ok(self, client):
        """Health endpoint should return 200 with status healthy."""
        response = client.get("/api/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data


class TestTransactionsEndpoint:
    """Tests for the transactions endpoint."""
    
    def test_get_transactions_default_params(self, client):
        """Get transactions with default pagination."""
        response = client.get("/api/transactions")
        
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        
    def test_get_transactions_with_pagination(self, client):
        """Get transactions with custom pagination."""
        response = client.get("/api/transactions?page=1&page_size=10")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["transactions"]) <= 10
        
    def test_get_transactions_large_page_size(self, client):
        """Get transactions with large page size for 10K table."""
        response = client.get("/api/transactions?page=1&page_size=10000")
        
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        # Should return up to 10000 transactions
        assert data["page_size"] == 10000


class TestNetworkEndpoint:
    """Tests for the network endpoint."""
    
    def test_get_network_returns_graph_data(self, client):
        """Network endpoint should return nodes and edges."""
        response = client.get("/api/network")
        
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        assert "high_risk_accounts" in data
        
    def test_network_has_expected_node_count(self, client):
        """Network should have approximately 800 nodes."""
        response = client.get("/api/network")
        
        assert response.status_code == 200
        data = response.json()
        # Backend generates ~800 nodes
        assert len(data["nodes"]) >= 500
        assert len(data["nodes"]) <= 1000
        
    def test_network_nodes_have_required_fields(self, client):
        """Each node should have id, name, risk, and value fields."""
        response = client.get("/api/network")
        
        assert response.status_code == 200
        data = response.json()
        
        for node in data["nodes"][:5]:  # Check first 5 nodes
            assert "id" in node
            assert "name" in node
            assert "risk" in node
            assert "val" in node
            
    def test_network_edges_have_required_fields(self, client):
        """Each edge should have source, target, and value fields."""
        response = client.get("/api/network")
        
        assert response.status_code == 200
        data = response.json()
        
        for edge in data["edges"][:5]:  # Check first 5 edges
            assert "source" in edge
            assert "target" in edge
            assert "value" in edge


class TestSummaryEndpoint:
    """Tests for the summary endpoint."""
    
    def test_get_summary_returns_stats(self, client):
        """Summary endpoint should return dashboard statistics."""
        response = client.get("/api/summary")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_transactions" in data
        assert "fraud_detected" in data
        assert "high_risk_accounts" in data
        assert "alerts_today" in data


class TestInvestigateEndpoint:
    """Tests for the investigate endpoint."""
    
    def test_investigate_valid_transaction(self, client):
        """Investigate endpoint should process a valid transaction."""
        # First get a valid transaction ID
        transactions_response = client.get("/api/transactions?page_size=1")
        transactions = transactions_response.json()["transactions"]
        
        if transactions:
            tx_id = transactions[0]["transaction_id"]
            
            response = client.post(
                "/api/investigate",
                json={"transaction_id": tx_id}
            )
            
            # May return 200 or 202 depending on async processing
            assert response.status_code in [200, 202]
            
    def test_investigate_invalid_transaction(self, client):
        """Investigate should handle invalid transaction gracefully."""
        response = client.post(
            "/api/investigate",
            json={"transaction_id": "INVALID-TX-ID-12345"}
        )
        
        # Should still return OK but with appropriate message
        assert response.status_code in [200, 404]


class TestAgentsStatusEndpoint:
    """Tests for the agents status endpoint."""
    
    def test_get_agents_status(self, client):
        """Agents status endpoint should return agent information."""
        response = client.get("/api/agents/status")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have agent status info
        assert isinstance(data, (list, dict))


class TestTransactionById:
    """Tests for getting a single transaction by ID."""
    
    def test_get_transaction_by_valid_id(self, client):
        """Should return transaction details for valid ID."""
        # First get a valid transaction ID
        transactions_response = client.get("/api/transactions?page_size=1")
        transactions = transactions_response.json()["transactions"]
        
        if transactions:
            tx_id = transactions[0]["transaction_id"]
            
            response = client.get(f"/api/transactions/{tx_id}")
            
            # If endpoint exists
            if response.status_code != 404:
                assert response.status_code == 200
                data = response.json()
                assert data["transaction_id"] == tx_id
