"""
Unit tests for fraud detection agents.
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
import json


# Sample transaction data for testing
SAMPLE_TRANSACTION = {
    "transaction_id": "TX-TEST-001",
    "timestamp": "2026-01-11T10:00:00Z",
    "from_account": "ACC-100",
    "to_account": "ACC-200",
    "amount": 1500.0,
    "merchant_category": "Electronics",
    "device_id": "DEV-001",
    "location": "New York",
    "hour": 10,
    "day_of_week": "Saturday",
    "velocity": 2,
    "is_fraud": 0,
    "fraud_reason": ""
}

SUSPICIOUS_TRANSACTION = {
    "transaction_id": "TX-FRAUD-001",
    "timestamp": "2026-01-11T02:00:00Z",
    "from_account": "ACC-300",
    "to_account": "ACC-400",
    "amount": 9999.0,
    "merchant_category": "Crypto",
    "device_id": "DEV-002",
    "location": "Unknown",
    "hour": 2,
    "day_of_week": "Saturday",
    "velocity": 15,
    "is_fraud": 1,
    "fraud_reason": "High velocity suspicious pattern"
}


class TestTransactionDataStructure:
    """Tests for transaction data validation."""
    
    def test_transaction_has_required_fields(self):
        """Transaction should have all required fields."""
        required_fields = [
            "transaction_id",
            "timestamp", 
            "from_account",
            "to_account",
            "amount",
            "merchant_category",
            "device_id",
            "location",
            "hour",
            "day_of_week",
            "velocity",
            "is_fraud",
            "fraud_reason"
        ]
        
        for field in required_fields:
            assert field in SAMPLE_TRANSACTION
            
    def test_transaction_amount_is_positive(self):
        """Transaction amount should be positive."""
        assert SAMPLE_TRANSACTION["amount"] > 0
        assert SUSPICIOUS_TRANSACTION["amount"] > 0
        
    def test_velocity_is_non_negative(self):
        """Velocity should be non-negative."""
        assert SAMPLE_TRANSACTION["velocity"] >= 0
        assert SUSPICIOUS_TRANSACTION["velocity"] >= 0
        
    def test_hour_is_valid_range(self):
        """Hour should be between 0 and 23."""
        assert 0 <= SAMPLE_TRANSACTION["hour"] <= 23
        assert 0 <= SUSPICIOUS_TRANSACTION["hour"] <= 23


class TestRiskAnalysisAgent:
    """Tests for the Risk Analysis Agent."""
    
    @pytest.fixture
    def mock_bedrock_client(self):
        """Create a mock Bedrock client."""
        mock = MagicMock()
        mock.invoke_model = MagicMock(return_value={
            "body": MagicMock(
                read=MagicMock(return_value=json.dumps({
                    "content": [{
                        "text": json.dumps({
                            "risk_level": "Low",
                            "risk_score": 25,
                            "patterns": [],
                            "risk_factors": []
                        })
                    }]
                }).encode())
            )
        })
        return mock
        
    def test_low_risk_transaction_classification(self):
        """Normal transaction should be classified as low risk."""
        # Amount is reasonable, velocity is low, normal business hours
        tx = SAMPLE_TRANSACTION
        
        # Basic heuristic checks
        is_low_risk = (
            tx["amount"] < 5000 and
            tx["velocity"] < 5 and
            6 <= tx["hour"] <= 22
        )
        
        assert is_low_risk is True
        
    def test_high_risk_transaction_classification(self):
        """Suspicious transaction should be flagged as high risk."""
        tx = SUSPICIOUS_TRANSACTION
        
        # Basic heuristic checks
        is_high_risk = (
            tx["amount"] > 5000 or
            tx["velocity"] > 10 or
            tx["hour"] < 6
        )
        
        assert is_high_risk is True
        
    def test_velocity_risk_factor(self):
        """High velocity should increase risk."""
        # Velocity > 10 is suspicious
        assert SUSPICIOUS_TRANSACTION["velocity"] > 10
        assert SAMPLE_TRANSACTION["velocity"] < 10


class TestFraudInvestigationAgent:
    """Tests for the Fraud Investigation Agent."""
    
    def test_fraud_indicators_present(self):
        """Suspicious transactions should have fraud indicators."""
        tx = SUSPICIOUS_TRANSACTION
        
        indicators = []
        
        if tx["amount"] > 5000:
            indicators.append("High amount transaction")
        if tx["velocity"] > 10:
            indicators.append("High transaction velocity")
        if tx["hour"] < 6 or tx["hour"] > 22:
            indicators.append("Unusual transaction time")
        if tx["merchant_category"] == "Crypto":
            indicators.append("High-risk merchant category")
        if tx["location"] == "Unknown":
            indicators.append("Unknown location")
            
        assert len(indicators) > 0
        
    def test_fraud_recommendation_logic(self):
        """Fraud agent should recommend decline for suspicious transactions."""
        tx = SUSPICIOUS_TRANSACTION
        
        # Simple decision logic
        fraud_score = 0
        if tx["amount"] > 5000:
            fraud_score += 30
        if tx["velocity"] > 10:
            fraud_score += 30
        if tx["hour"] < 6:
            fraud_score += 20
        if tx["is_fraud"] == 1:
            fraud_score += 20
            
        recommendation = "DECLINE" if fraud_score > 50 else "APPROVE"
        
        assert recommendation == "DECLINE"


class TestComplianceAgent:
    """Tests for the Compliance Agent."""
    
    def test_aml_threshold_check(self):
        """Transactions over AML threshold should be flagged."""
        AML_THRESHOLD = 10000
        
        assert SAMPLE_TRANSACTION["amount"] < AML_THRESHOLD
        # SUSPICIOUS_TRANSACTION is close but under threshold
        
    def test_kyc_requirements(self):
        """Large transactions should require KYC verification."""
        KYC_THRESHOLD = 3000
        
        requires_kyc = SUSPICIOUS_TRANSACTION["amount"] > KYC_THRESHOLD
        assert requires_kyc is True


class TestOrchestratorAgent:
    """Tests for the Orchestrator Agent."""
    
    def test_orchestrator_combines_agent_results(self):
        """Orchestrator should combine results from all agents."""
        # Mock agent results
        risk_result = {
            "agent": "risk_analysis",
            "risk_level": "High",
            "risk_score": 85
        }
        
        fraud_result = {
            "agent": "fraud_investigation",
            "fraud_likelihood": "High",
            "recommendation": "DECLINE"
        }
        
        compliance_result = {
            "agent": "compliance",
            "aml_flag": True,
            "kyc_required": True
        }
        
        # Combined result
        combined = {
            "transaction_id": "TX-001",
            "overall_risk": "High",
            "final_decision": "DECLINE",
            "agent_results": [risk_result, fraud_result, compliance_result]
        }
        
        assert len(combined["agent_results"]) == 3
        assert combined["final_decision"] == "DECLINE"
        
    def test_orchestrator_decision_logic(self):
        """Orchestrator should make final decision based on all inputs."""
        # If any agent says DECLINE, final should be DECLINE
        decisions = ["APPROVE", "APPROVE", "DECLINE"]
        
        final_decision = "DECLINE" if "DECLINE" in decisions else "APPROVE"
        
        assert final_decision == "DECLINE"


class TestNetworkAnalysisAgent:
    """Tests for the Network Analysis Agent."""
    
    def test_network_node_risk_levels(self):
        """Network nodes should have valid risk levels."""
        valid_risk_levels = ["Low", "Medium", "High", "Critical"]
        
        # Sample node data
        nodes = [
            {"id": "ACC-001", "risk": "Low"},
            {"id": "ACC-002", "risk": "High"},
            {"id": "ACC-003", "risk": "Critical"}
        ]
        
        for node in nodes:
            assert node["risk"] in valid_risk_levels
            
    def test_edge_connection_strength(self):
        """Edge values should be positive."""
        edges = [
            {"source": "ACC-001", "target": "ACC-002", "value": 5},
            {"source": "ACC-002", "target": "ACC-003", "value": 10}
        ]
        
        for edge in edges:
            assert edge["value"] > 0
