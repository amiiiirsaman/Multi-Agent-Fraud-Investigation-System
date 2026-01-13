"""
LangGraph Orchestrator - Multi-agent fraud investigation workflow.
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Callable, Optional, List, Dict, TypedDict

from langgraph.graph import StateGraph, END

from .fraud_investigator import FraudInvestigatorAgent
from .risk_analyst import RiskAnalystAgent
from .compliance_agent import ComplianceAgent

logger = logging.getLogger(__name__)


class InvestigationState(TypedDict, total=False):
    """State for the investigation workflow using TypedDict."""
    transaction: Dict[str, Any]
    transaction_id: str
    timestamp: str
    steps: List[str]
    risk_analysis: Optional[Dict[str, Any]]
    fraud_investigation: Optional[Dict[str, Any]]
    compliance_check: Optional[Dict[str, Any]]
    final_decision: str
    decision_reason: str
    status: str
    error: Optional[str]


class FraudInvestigationOrchestrator:
    """Orchestrates multi-agent fraud investigation using LangGraph."""

    def __init__(
        self,
        gnn_model: Any = None,
        region: str = "us-east-1",
        on_step: Optional[Callable[[str, Dict[str, Any]], None]] = None,
    ):
        self.risk_analyst = RiskAnalystAgent(gnn_model=gnn_model, region=region)
        self.fraud_investigator = FraudInvestigatorAgent(region=region)
        self.compliance_officer = ComplianceAgent(region=region)
        self.investigation_log: List[Dict[str, Any]] = []
        self.on_step = on_step  # Callback for WebSocket updates
        self._build_graph()

    def _build_graph(self) -> None:
        """Build the LangGraph workflow."""
        workflow = StateGraph(InvestigationState)

        # Add nodes (use different names than state attributes)
        workflow.add_node("analyze_risk", self._risk_analysis_node)
        workflow.add_node("investigate_fraud", self._fraud_investigation_node)
        workflow.add_node("check_compliance", self._compliance_check_node)
        workflow.add_node("finalize", self._finalize_node)

        # Set entry point
        workflow.set_entry_point("analyze_risk")

        # Add conditional edges
        workflow.add_conditional_edges(
            "analyze_risk",
            self._should_investigate,
            {
                "investigate": "investigate_fraud",
                "approve": "finalize",
            },
        )

        workflow.add_edge("investigate_fraud", "check_compliance")
        workflow.add_edge("check_compliance", "finalize")
        workflow.add_edge("finalize", END)

        self.graph = workflow.compile()

    def _should_investigate(self, state: Dict[str, Any]) -> str:
        """Determine if investigation is needed based on risk score."""
        risk_analysis = state.get("risk_analysis")
        if risk_analysis and risk_analysis.get("risk_score", 0) > 0.4:
            return "investigate"
        return "approve"
    
    def _get_routing_reason(self, state: Dict[str, Any], route: str) -> str:
        """Generate explanation for routing decision."""
        risk_analysis = state.get("risk_analysis", {})
        risk_score = risk_analysis.get("risk_score", 0)
        risk_level = risk_analysis.get("risk_level", "Unknown")
        
        if route == "approve":
            return (f"Risk score {risk_score:.0%} is below 40% threshold. "
                    f"{risk_level} risk level - no further investigation needed. "
                    "Transaction approved by Risk Analyst.")
        else:
            return (f"Risk score {risk_score:.0%} exceeds 40% threshold. "
                    f"{risk_level} risk level detected. "
                    "Escalating to Fraud Investigator for detailed analysis.")

    def _risk_analysis_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Risk Analyst agent node."""
        self._emit_step("agent_thinking", {
            "agent": "Risk Analyst",
            "message": "Analyzing transaction risk...",
        })

        try:
            risk_analysis = self.risk_analyst.analyze_risk(
                transaction=state["transaction"],
                graph_data=None,
            )
            
            # Determine routing and add explanation
            route = self._should_investigate({"risk_analysis": risk_analysis})
            risk_analysis["routing_reason"] = self._get_routing_reason(
                {"risk_analysis": risk_analysis}, route
            )
            risk_analysis["escalated"] = route == "investigate"

            step_msg = f"Risk Analyst: {risk_analysis['risk_level']} risk (score: {risk_analysis['risk_score']:.3f})"
            self._emit_step("agent_result", {
                "agent": "Risk Analyst",
                "result": risk_analysis,
            })

            return {
                "risk_analysis": risk_analysis,
                "steps": state.get("steps", []) + [step_msg],
            }

        except Exception as e:
            logger.error(f"Risk analysis failed: {e}")
            return {
                "error": str(e),
                "status": "error",
            }

    def _fraud_investigation_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Fraud Investigator agent node."""
        self._emit_step("agent_thinking", {
            "agent": "Fraud Investigator",
            "message": "Investigating suspicious activity...",
        })

        try:
            risk_analysis = state.get("risk_analysis") or {}
            fraud_investigation = self.fraud_investigator.investigate_transaction(
                transaction=state["transaction"],
                risk_score=risk_analysis.get("risk_score", 0.5),
                patterns=risk_analysis.get("patterns", []),
            )

            step_msg = f"Fraud Investigator: {fraud_investigation['recommendation']} ({fraud_investigation['fraud_likelihood']} likelihood)"
            self._emit_step("agent_result", {
                "agent": "Fraud Investigator",
                "result": fraud_investigation,
            })

            return {
                "fraud_investigation": fraud_investigation,
                "steps": state.get("steps", []) + [step_msg],
            }

        except Exception as e:
            logger.error(f"Fraud investigation failed: {e}")
            return {
                "fraud_investigation": {
                    "recommendation": "REVIEW",
                    "fraud_likelihood": "Unknown",
                    "explanation": f"Investigation error: {e}",
                },
                "steps": state.get("steps", []) + [f"Fraud Investigator: Error - {e}"],
            }

    def _compliance_check_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Compliance Officer agent node."""
        self._emit_step("agent_thinking", {
            "agent": "Compliance Officer",
            "message": "Checking regulatory requirements...",
        })

        try:
            fraud_investigation = state.get("fraud_investigation") or {
                "recommendation": "REVIEW",
                "fraud_likelihood": "Unknown",
            }

            compliance_check = self.compliance_officer.check_compliance(
                transaction=state["transaction"],
                investigation_result=fraud_investigation,
            )

            step_msg = f"Compliance Officer: SAR {'required' if compliance_check['sar_required'] else 'not required'}"
            self._emit_step("agent_result", {
                "agent": "Compliance Officer",
                "result": compliance_check,
            })

            return {
                "compliance_check": compliance_check,
                "steps": state.get("steps", []) + [step_msg],
            }

        except Exception as e:
            logger.error(f"Compliance check failed: {e}")
            return {
                "compliance_check": {
                    "sar_required": False,
                    "compliance_notes": f"Compliance check error: {e}",
                },
                "steps": state.get("steps", []) + [f"Compliance Officer: Error - {e}"],
            }

    def _finalize_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Finalize the investigation with a decision."""
        fraud_investigation = state.get("fraud_investigation")
        risk_analysis = state.get("risk_analysis")
        compliance_check = state.get("compliance_check")
        
        if fraud_investigation:
            final_decision = fraud_investigation.get("recommendation", "REVIEW")
            decision_reason = self._build_decision_reason(
                final_decision, risk_analysis, fraud_investigation, compliance_check
            )
        elif risk_analysis and risk_analysis.get("risk_score", 0) <= 0.4:
            final_decision = "APPROVE"
            score = risk_analysis.get("risk_score", 0)
            decision_reason = (f"Approved: Risk score {score:.0%} below threshold. "
                              "No suspicious patterns detected. Standard transaction.")
        else:
            final_decision = "REVIEW"
            decision_reason = "Manual review required due to incomplete analysis."

        step_msg = f"Final Decision: {final_decision}"

        return {
            "final_decision": final_decision,
            "decision_reason": decision_reason,
            "status": "completed",
            "steps": state.get("steps", []) + [step_msg],
        }
    
    def _build_decision_reason(
        self,
        decision: str,
        risk_analysis: Optional[Dict[str, Any]],
        fraud_investigation: Optional[Dict[str, Any]],
        compliance_check: Optional[Dict[str, Any]],
    ) -> str:
        """Build comprehensive decision explanation."""
        parts = []
        
        risk_score = risk_analysis.get("risk_score", 0) if risk_analysis else 0
        fraud_likelihood = fraud_investigation.get("fraud_likelihood", "Unknown") if fraud_investigation else "Unknown"
        confidence = fraud_investigation.get("confidence", 0) if fraud_investigation else 0
        
        if decision == "APPROVE":
            parts.append(f"Approved: Risk score {risk_score:.0%}")
            if fraud_likelihood == "Low":
                parts.append(f"fraud likelihood low ({confidence:.0%} confidence)")
            parts.append("no indicators require blocking.")
        elif decision == "DECLINE":
            parts.append(f"Declined: Risk score {risk_score:.0%}")
            parts.append(f"{fraud_likelihood} fraud likelihood ({confidence:.0%} confidence).")
            if fraud_investigation and fraud_investigation.get("fraud_indicators"):
                indicators = fraud_investigation["fraud_indicators"][:2]
                parts.append(f"Key indicators: {', '.join(indicators)}.")
        else:  # REVIEW
            parts.append(f"Manual Review Required: Risk score {risk_score:.0%}")
            parts.append(f"{fraud_likelihood} fraud likelihood.")
            parts.append("Mixed signals require human judgment.")
        
        # Add compliance note if relevant
        if compliance_check:
            if compliance_check.get("sar_required"):
                parts.append("SAR filing initiated.")
            if compliance_check.get("ctr_required"):
                parts.append("CTR required (>$10K).")
        
        return " ".join(parts)

    def _emit_step(self, event_type: str, data: Dict[str, Any]) -> None:
        """Emit step update via callback."""
        if self.on_step:
            try:
                self.on_step(event_type, data)
            except Exception as e:
                logger.error(f"Error emitting step: {e}")

    async def investigate_async(
        self,
        transaction: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Run async investigation workflow."""
        self._emit_step("investigation_start", {
            "transaction_id": transaction["transaction_id"],
        })

        # LangGraph expects a dict, not a Pydantic model
        initial_state = {
            "transaction": transaction,
            "transaction_id": transaction["transaction_id"],
            "timestamp": datetime.now().isoformat(),
            "steps": [],
            "risk_analysis": None,
            "fraud_investigation": None,
            "compliance_check": None,
            "final_decision": "",
            "status": "pending",
            "error": None,
        }

        # Run the graph
        final_state = await asyncio.to_thread(
            lambda: self.graph.invoke(initial_state)
        )

        # Convert to dict for serialization
        result = {
            "transaction_id": final_state["transaction_id"],
            "timestamp": final_state["timestamp"],
            "steps": final_state["steps"],
            "risk_analysis": final_state.get("risk_analysis"),
            "fraud_investigation": final_state.get("fraud_investigation"),
            "compliance_check": final_state.get("compliance_check"),
            "final_decision": final_state["final_decision"],
            "decision_reason": final_state.get("decision_reason", ""),
            "status": final_state["status"],
        }

        self.investigation_log.append(result)

        self._emit_step("investigation_complete", result)

        return result

    def investigate(self, transaction: Dict[str, Any]) -> Dict[str, Any]:
        """Run synchronous investigation workflow."""
        return asyncio.run(self.investigate_async(transaction))

    def get_investigation_log(self) -> List[Dict[str, Any]]:
        """Get all investigation results."""
        return self.investigation_log
