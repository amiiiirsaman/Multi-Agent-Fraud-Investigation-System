"""
WebSocket handlers for real-time fraud investigation updates.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, List, Dict, Optional

from fastapi import WebSocket, WebSocketDisconnect
import pandas as pd

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.investigation_subscribers: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a disconnected client."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        # Remove from investigation subscriptions
        for subscribers in self.investigation_subscribers.values():
            if websocket in subscribers:
                subscribers.remove(websocket)

        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    def subscribe_investigation(self, websocket: WebSocket, transaction_id: str) -> None:
        """Subscribe to investigation updates for a transaction."""
        if transaction_id not in self.investigation_subscribers:
            self.investigation_subscribers[transaction_id] = []
        if websocket not in self.investigation_subscribers[transaction_id]:
            self.investigation_subscribers[transaction_id].append(websocket)

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Broadcast message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

    async def send_to_investigation_subscribers(
        self,
        transaction_id: str,
        message: Dict[str, Any],
    ) -> None:
        """Send message to clients subscribed to a specific investigation."""
        subscribers = self.investigation_subscribers.get(transaction_id, [])
        disconnected = []

        for connection in subscribers:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        # Clean up
        for conn in disconnected:
            self.disconnect(conn)


# Global connection manager
manager = ConnectionManager()


async def websocket_endpoint(
    websocket: WebSocket,
    orchestrator: Any,
    transactions_df: pd.DataFrame,
) -> None:
    """Main WebSocket endpoint handler."""
    await manager.connect(websocket)

    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "timestamp": datetime.now().isoformat(),
            "message": "Connected to Fraud Investigation System",
        })

        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "subscribe_feed":
                # Client wants to receive transaction feed updates
                await websocket.send_json({
                    "type": "subscribed",
                    "feed": "transactions",
                })

            elif message_type == "subscribe_investigation":
                # Client wants updates for a specific investigation
                transaction_id = data.get("transaction_id")
                if transaction_id:
                    manager.subscribe_investigation(websocket, transaction_id)
                    await websocket.send_json({
                        "type": "subscribed",
                        "investigation": transaction_id,
                    })

            elif message_type == "investigate":
                # Client requests investigation of a transaction
                transaction_id = data.get("transaction_id")
                transaction_data = data.get("transaction_data")  # For custom transactions
                await handle_investigation_request(
                    websocket,
                    transaction_id,
                    orchestrator,
                    transactions_df,
                    transaction_data,
                )

            elif message_type == "ping":
                # Heartbeat
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat(),
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


async def handle_investigation_request(
    websocket: WebSocket,
    transaction_id: str,
    orchestrator: Any,
    transactions_df: pd.DataFrame,
    transaction_data: Optional[Dict[str, Any]] = None,
) -> None:
    """Handle an investigation request."""
    # Use provided transaction_data for custom transactions, or look up in CSV
    if transaction_data:
        # Custom transaction - use provided data directly
        transaction_record = transaction_data
    else:
        # Existing transaction - look up in DataFrame
        transaction = transactions_df[transactions_df["transaction_id"] == transaction_id]

        if transaction.empty:
            await websocket.send_json({
                "type": "error",
                "message": f"Transaction {transaction_id} not found",
            })
            return

        transaction_record = transaction.iloc[0].to_dict()

    # Send start notification
    await websocket.send_json({
        "type": "investigation_start",
        "transaction_id": transaction_id,
        "timestamp": datetime.now().isoformat(),
    })

    # Also broadcast to all subscribers
    await manager.send_to_investigation_subscribers(transaction_id, {
        "type": "investigation_start",
        "transaction_id": transaction_id,
        "timestamp": datetime.now().isoformat(),
    })

    # Use a queue to communicate between threads
    step_queue: asyncio.Queue = asyncio.Queue()
    main_loop = asyncio.get_event_loop()

    # Create sync callback that puts events in queue
    def sync_callback(event_type: str, data: Dict[str, Any]) -> None:
        main_loop.call_soon_threadsafe(
            step_queue.put_nowait,
            {"event_type": event_type, "data": data}
        )

    original_callback = orchestrator.on_step
    orchestrator.on_step = sync_callback

    async def process_queue():
        """Process step events from queue."""
        while True:
            try:
                event = await asyncio.wait_for(step_queue.get(), timeout=0.1)
                message = {
                    "type": event["event_type"],
                    "transaction_id": transaction_id,
                    "timestamp": datetime.now().isoformat(),
                    "data": event["data"],
                }
                await websocket.send_json(message)
                await manager.send_to_investigation_subscribers(transaction_id, message)
            except asyncio.TimeoutError:
                pass
            except Exception as e:
                logger.warning(f"Queue error: {e}")
                break

    try:
        # Run investigation and queue processor concurrently
        async def run_investigation():
            return await orchestrator.investigate_async(transaction_record)

        # Start queue processor and investigation
        queue_task = asyncio.create_task(process_queue())
        result = await run_investigation()
        
        # Give queue time to process remaining events
        await asyncio.sleep(0.5)
        queue_task.cancel()

        # Send completion
        await websocket.send_json({
            "type": "investigation_complete",
            "transaction_id": transaction_id,
            "timestamp": datetime.now().isoformat(),
            "result": result,
        })

        await manager.send_to_investigation_subscribers(transaction_id, {
            "type": "investigation_complete",
            "transaction_id": transaction_id,
            "timestamp": datetime.now().isoformat(),
            "result": result,
        })

    except Exception as e:
        logger.error(f"Investigation error: {e}")
        await websocket.send_json({
            "type": "investigation_error",
            "transaction_id": transaction_id,
            "error": str(e),
        })

    finally:
        orchestrator.on_step = original_callback


async def simulate_transaction_feed(interval_seconds: float = 5.0) -> None:
    """Simulate new transactions arriving (for demo purposes)."""
    import random

    while True:
        await asyncio.sleep(interval_seconds)

        if manager.active_connections:
            # Generate a simulated new transaction
            transaction = {
                "transaction_id": f"TXN{random.randint(100000, 999999):08d}",
                "timestamp": datetime.now().isoformat(),
                "from_account": f"ACC{random.randint(1000, 9999)}",
                "to_account": f"ACC{random.randint(1000, 9999)}",
                "amount": round(random.uniform(10, 5000), 2),
                "merchant_category": random.choice([
                    "Groceries", "Gas", "Restaurant", "Shopping",
                    "Electronics", "Gift Cards",
                ]),
                "location": random.choice(["Home", "Work", "Local", "Unknown"]),
                "hour": datetime.now().hour,
                "is_fraud": 0,  # Will be determined by system
            }

            await manager.broadcast({
                "type": "transaction_new",
                "timestamp": datetime.now().isoformat(),
                "transaction": transaction,
            })
