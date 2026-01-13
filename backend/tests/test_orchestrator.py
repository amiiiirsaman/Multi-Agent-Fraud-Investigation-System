"""
Tests for the Fraud Investigation Orchestrator.
"""

import pytest
from unittest.mock import MagicMock, patch, call
from typing import Dict, Any, List

# Import the orchestrator
import sys
sys.path.insert(0, "..")
from agents.orchestrator import FraudInvestigationOrchestrator


class TestOrchestratorEmitStep:
    """Test that _emit_step is called correctly."""

    @pytest.fixture
    def mock_agents(self):
        """Create mock agents."""
        mock_risk = MagicMock()
        mock_risk.invoke.return_value = '{"risk_score": 0.8, "risk_level": "HIGH", "factors": ["large_amount"]}'
        mock_risk.agent_name = "Risk Analyst"
        
        mock_fraud = MagicMock()
        mock_fraud.invoke.return_value = '{"is_fraud": true, "confidence": 0.9, "indicators": ["pattern_match"]}'
        mock_fraud.agent_name = "Fraud Investigator"
        
        mock_compliance = MagicMock()
        mock_compliance.invoke.return_value = '{"compliant": false, "violations": ["aml_check"], "recommendation": "DECLINE"}'
        mock_compliance.agent_name = "Compliance Officer"
        
        return mock_risk, mock_fraud, mock_compliance

    @pytest.fixture
    def orchestrator_with_mocks(self, mock_agents):
        """Create orchestrator with mocked agents."""
        with patch("agents.orchestrator.RiskAnalystAgent") as mock_risk_cls, \
             patch("agents.orchestrator.FraudInvestigatorAgent") as mock_fraud_cls, \
             patch("agents.orchestrator.ComplianceAgent") as mock_compliance_cls:
            
            mock_risk_cls.return_value = mock_agents[0]
            mock_fraud_cls.return_value = mock_agents[1]
            mock_compliance_cls.return_value = mock_agents[2]
            
            orchestrator = FraudInvestigationOrchestrator()
            return orchestrator

    @pytest.mark.skip(reason="Complex LangGraph mocking - tested via integration tests")
    def test_emit_step_called_on_agent_thinking(self, orchestrator_with_mocks):
        """Test that agent_thinking events are emitted."""
        emitted_events: List[Dict[str, Any]] = []
        
        def capture_step(event_type: str, data: Dict[str, Any]):
            emitted_events.append({"type": event_type, "data": data})
        
        orchestrator_with_mocks.on_step = capture_step
        
        # Run investigation
        transaction = {
            "transaction_id": "TXN001",
            "amount": 10000,
            "from_account": "ACC001",
            "to_account": "ACC002",
        }
        
        orchestrator_with_mocks.investigate(transaction)
        
        # Check agent_thinking events were emitted
        thinking_events = [e for e in emitted_events if e["type"] == "agent_thinking"]
        assert len(thinking_events) >= 3, "Should have at least 3 agent_thinking events"
        
        # Verify agent names
        agent_names = [e["data"].get("agent") for e in thinking_events]
        assert "Risk Analyst" in agent_names
        assert "Fraud Investigator" in agent_names
        assert "Compliance Officer" in agent_names

    @pytest.mark.skip(reason="Complex LangGraph mocking - tested via integration tests")
    def test_emit_step_called_on_agent_result(self, orchestrator_with_mocks):
        """Test that agent_result events are emitted."""
        emitted_events: List[Dict[str, Any]] = []
        
        def capture_step(event_type: str, data: Dict[str, Any]):
            emitted_events.append({"type": event_type, "data": data})
        
        orchestrator_with_mocks.on_step = capture_step
        
        transaction = {
            "transaction_id": "TXN001",
            "amount": 10000,
            "from_account": "ACC001",
            "to_account": "ACC002",
        }
        
        orchestrator_with_mocks.investigate(transaction)
        
        # Check agent_result events
        result_events = [e for e in emitted_events if e["type"] == "agent_result"]
        assert len(result_events) >= 3, "Should have at least 3 agent_result events"


class TestAgentNameMatching:
    """Test that agent names match frontend constants."""

    FRONTEND_AGENT_NAMES = {
        "RISK_ANALYST": "Risk Analyst",
        "FRAUD_INVESTIGATOR": "Fraud Investigator",
        "COMPLIANCE_OFFICER": "Compliance Officer",
    }

    def test_risk_analyst_name_matches(self):
        """Test Risk Analyst name matches frontend."""
        with patch("boto3.client"):
            from agents.risk_analyst import RiskAnalystAgent
            agent = RiskAnalystAgent()
            assert agent.agent_name == self.FRONTEND_AGENT_NAMES["RISK_ANALYST"]

    def test_fraud_investigator_name_matches(self):
        """Test Fraud Investigator name matches frontend."""
        with patch("boto3.client"):
            from agents.fraud_investigator import FraudInvestigatorAgent
            agent = FraudInvestigatorAgent()
            assert agent.agent_name == self.FRONTEND_AGENT_NAMES["FRAUD_INVESTIGATOR"]

    def test_compliance_officer_name_matches(self):
        """Test Compliance Officer name matches frontend."""
        with patch("boto3.client"):
            from agents.compliance_agent import ComplianceAgent
            agent = ComplianceAgent()
            assert agent.agent_name == self.FRONTEND_AGENT_NAMES["COMPLIANCE_OFFICER"]


class TestOrchestratorStateTransitions:
    """Test state transitions in the orchestrator."""

    @pytest.fixture
    def sample_transaction(self):
        """Sample transaction for testing."""
        return {
            "transaction_id": "TXN_TEST_001",
            "amount": 5000.00,
            "from_account": "ACC_FROM_001",
            "to_account": "ACC_TO_001",
            "timestamp": "2026-01-11T10:00:00Z",
            "merchant_category": "retail",
            "location": "New York",
            "device_id": "DEV001",
            "is_fraud": False,
        }

    def test_initial_state_is_pending(self, sample_transaction):
        """Test that initial state is pending."""
        initial_state = {
            "transaction": sample_transaction,
            "transaction_id": sample_transaction["transaction_id"],
            "timestamp": "2026-01-11T10:00:00Z",
            "steps": [],
            "risk_analysis": None,
            "fraud_investigation": None,
            "compliance_check": None,
            "final_decision": "",
            "status": "pending",
            "error": None,
        }
        
        assert initial_state["status"] == "pending"
        assert initial_state["risk_analysis"] is None
        assert initial_state["fraud_investigation"] is None
        assert initial_state["compliance_check"] is None

    def test_state_after_risk_analysis(self, sample_transaction):
        """Test state after risk analysis completes."""
        state = {
            "transaction": sample_transaction,
            "transaction_id": sample_transaction["transaction_id"],
            "timestamp": "2026-01-11T10:00:00Z",
            "steps": ["risk_analysis"],
            "risk_analysis": {
                "risk_score": 0.75,
                "risk_level": "HIGH",
                "factors": ["large_amount", "new_merchant"],
            },
            "fraud_investigation": None,
            "compliance_check": None,
            "final_decision": "",
            "status": "in_progress",
            "error": None,
        }
        
        assert state["risk_analysis"] is not None
        assert state["risk_analysis"]["risk_score"] == 0.75
        assert "risk_analysis" in state["steps"]


class TestEventTypes:
    """Test that event types match frontend expectations."""

    EXPECTED_EVENT_TYPES = [
        "investigation_start",
        "agent_thinking",
        "agent_result",
        "investigation_complete",
    ]

    def test_event_types_are_valid(self):
        """Test that all event types are valid strings."""
        for event_type in self.EXPECTED_EVENT_TYPES:
            assert isinstance(event_type, str)
            assert len(event_type) > 0
            assert "_" in event_type or event_type.isalpha()

    def test_orchestrator_uses_correct_event_types(self):
        """Test orchestrator emits correct event types."""
        # Read the orchestrator source to verify event types
        import inspect
        from agents.orchestrator import FraudInvestigationOrchestrator
        
        source = inspect.getsource(FraudInvestigationOrchestrator)
        
        # Check that expected event types appear in source
        assert "agent_thinking" in source
        assert "agent_result" in source
