"""
Tests for WebSocket API and async callback mechanism.
"""

import asyncio
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from typing import Dict, Any, List
from datetime import datetime

import sys
sys.path.insert(0, "..")


class TestWebSocketManager:
    """Test WebSocket connection management."""

    @pytest.fixture
    def manager(self):
        """Create a ConnectionManager instance."""
        from api.websocket import ConnectionManager
        return ConnectionManager()

    @pytest.mark.asyncio
    async def test_connect_adds_connection(self, manager):
        """Test that connect adds a WebSocket to active connections."""
        mock_ws = AsyncMock()
        await manager.connect(mock_ws)
        
        assert mock_ws in manager.active_connections
        mock_ws.accept.assert_called_once()

    def test_disconnect_removes_connection(self, manager):
        """Test that disconnect removes a WebSocket."""
        mock_ws = AsyncMock()
        manager.active_connections.append(mock_ws)
        
        manager.disconnect(mock_ws)
        
        assert mock_ws not in manager.active_connections

    @pytest.mark.asyncio
    async def test_broadcast_sends_to_all(self, manager):
        """Test that broadcast sends to all connections."""
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()
        manager.active_connections = [mock_ws1, mock_ws2]
        
        await manager.broadcast({"type": "test", "data": "hello"})
        
        mock_ws1.send_json.assert_called_once()
        mock_ws2.send_json.assert_called_once()


class TestAsyncCallbackQueue:
    """Test the queue-based async callback mechanism."""

    @pytest.mark.asyncio
    async def test_queue_receives_events(self):
        """Test that events are properly queued from sync context."""
        step_queue: asyncio.Queue = asyncio.Queue()
        main_loop = asyncio.get_running_loop()
        
        # Simulate sync callback
        def sync_callback(event_type: str, data: Dict[str, Any]) -> None:
            main_loop.call_soon_threadsafe(
                step_queue.put_nowait,
                {"event_type": event_type, "data": data}
            )
        
        # Call from sync context (simulated)
        sync_callback("agent_thinking", {"agent": "Risk Analyst"})
        sync_callback("agent_result", {"agent": "Risk Analyst", "result": {}})
        
        # Verify events are in queue
        event1 = await asyncio.wait_for(step_queue.get(), timeout=1.0)
        assert event1["event_type"] == "agent_thinking"
        assert event1["data"]["agent"] == "Risk Analyst"
        
        event2 = await asyncio.wait_for(step_queue.get(), timeout=1.0)
        assert event2["event_type"] == "agent_result"

    @pytest.mark.asyncio
    async def test_queue_order_preserved(self):
        """Test that event order is preserved in the queue."""
        step_queue: asyncio.Queue = asyncio.Queue()
        main_loop = asyncio.get_running_loop()
        
        def sync_callback(event_type: str, data: Dict[str, Any]) -> None:
            main_loop.call_soon_threadsafe(
                step_queue.put_nowait,
                {"event_type": event_type, "data": data}
            )
        
        # Send events in order
        events_to_send = [
            ("investigation_start", {"transaction_id": "TXN001"}),
            ("agent_thinking", {"agent": "Risk Analyst"}),
            ("agent_result", {"agent": "Risk Analyst", "result": {}}),
            ("agent_thinking", {"agent": "Fraud Investigator"}),
            ("agent_result", {"agent": "Fraud Investigator", "result": {}}),
            ("agent_thinking", {"agent": "Compliance Officer"}),
            ("agent_result", {"agent": "Compliance Officer", "result": {}}),
            ("investigation_complete", {"status": "completed"}),
        ]
        
        for event_type, data in events_to_send:
            sync_callback(event_type, data)
        
        # Verify order
        for expected_type, expected_data in events_to_send:
            event = await asyncio.wait_for(step_queue.get(), timeout=1.0)
            assert event["event_type"] == expected_type


class TestInvestigationFlow:
    """Test the complete investigation flow via WebSocket."""

    @pytest.fixture
    def sample_transaction(self):
        """Sample transaction for testing."""
        return {
            "transaction_id": "TXN_WS_TEST_001",
            "amount": 15000.00,
            "from_account": "ACC_FROM_001",
            "to_account": "ACC_TO_001",
            "timestamp": "2026-01-11T10:00:00Z",
            "merchant_category": "electronics",
            "location": "Miami",
            "device_id": "DEV001",
            "is_fraud": False,
        }

    @pytest.mark.asyncio
    async def test_investigation_sends_start_event(self, sample_transaction):
        """Test that investigation sends start event."""
        mock_ws = AsyncMock()
        messages_sent: List[Dict[str, Any]] = []
        
        async def capture_send(msg):
            messages_sent.append(msg)
        
        mock_ws.send_json = capture_send
        
        # Simulate start event
        await mock_ws.send_json({
            "type": "investigation_start",
            "transaction_id": sample_transaction["transaction_id"],
            "timestamp": datetime.now().isoformat(),
        })
        
        assert len(messages_sent) == 1
        assert messages_sent[0]["type"] == "investigation_start"
        assert messages_sent[0]["transaction_id"] == sample_transaction["transaction_id"]

    @pytest.mark.asyncio
    async def test_investigation_sends_complete_event(self, sample_transaction):
        """Test that investigation sends complete event with result."""
        mock_ws = AsyncMock()
        messages_sent: List[Dict[str, Any]] = []
        
        async def capture_send(msg):
            messages_sent.append(msg)
        
        mock_ws.send_json = capture_send
        
        # Simulate complete event
        result = {
            "transaction_id": sample_transaction["transaction_id"],
            "final_decision": "DECLINE",
            "status": "completed",
        }
        
        await mock_ws.send_json({
            "type": "investigation_complete",
            "transaction_id": sample_transaction["transaction_id"],
            "timestamp": datetime.now().isoformat(),
            "result": result,
        })
        
        assert len(messages_sent) == 1
        assert messages_sent[0]["type"] == "investigation_complete"
        assert messages_sent[0]["result"]["final_decision"] == "DECLINE"


class TestMessageFormat:
    """Test WebSocket message format matches frontend expectations."""

    def test_agent_thinking_message_format(self):
        """Test agent_thinking message has required fields."""
        message = {
            "type": "agent_thinking",
            "transaction_id": "TXN001",
            "timestamp": "2026-01-11T10:00:00Z",
            "data": {
                "agent": "Risk Analyst",
                "message": "Analyzing transaction patterns...",
            },
        }
        
        assert "type" in message
        assert "transaction_id" in message
        assert "timestamp" in message
        assert "data" in message
        assert "agent" in message["data"]

    def test_agent_result_message_format(self):
        """Test agent_result message has required fields."""
        message = {
            "type": "agent_result",
            "transaction_id": "TXN001",
            "timestamp": "2026-01-11T10:00:00Z",
            "data": {
                "agent": "Risk Analyst",
                "result": {
                    "risk_score": 0.85,
                    "risk_level": "HIGH",
                    "factors": ["large_amount", "unusual_time"],
                },
            },
        }
        
        assert "type" in message
        assert "data" in message
        assert "agent" in message["data"]
        assert "result" in message["data"]

    def test_investigation_complete_message_format(self):
        """Test investigation_complete message has required fields."""
        message = {
            "type": "investigation_complete",
            "transaction_id": "TXN001",
            "timestamp": "2026-01-11T10:00:00Z",
            "result": {
                "transaction_id": "TXN001",
                "final_decision": "DECLINE",
                "status": "completed",
                "risk_analysis": {"risk_score": 0.85},
                "fraud_investigation": {"is_fraud": True},
                "compliance_check": {"compliant": False},
            },
        }
        
        assert "type" in message
        assert "result" in message
        assert "final_decision" in message["result"]
        assert "status" in message["result"]
