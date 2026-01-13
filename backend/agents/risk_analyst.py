"""
Risk Analyst Agent - Risk assessment and pattern recognition using GNN.
"""

import json
from typing import Any, Dict, List

from .base_agent import BedrockAgent


class RiskAnalystAgent(BedrockAgent):
    """Agent specialized in risk analysis using GNN."""

    def __init__(self, gnn_model: Any = None, region: str = "us-east-1"):
        super().__init__(
            agent_name="Risk Analyst",
            role="risk assessment specialist",
            region=region,
        )
        self.gnn_model = gnn_model

    def _get_responsibilities(self) -> str:
        return """
- Calculate risk scores using Graph Neural Network
- Identify fraud rings and suspicious patterns
- Analyze transaction networks and relationships
- Provide quantitative risk metrics
- Suggest prevention strategies
- Monitor for emerging fraud patterns
"""

    def analyze_risk(
        self,
        transaction: Dict[str, Any],
        graph_data: Any = None,
    ) -> Dict[str, Any]:
        """Analyze transaction risk using GNN and AI."""
        score_breakdown: Dict[str, Any] = {}
        
        # Get GNN prediction if model available
        if self.gnn_model is not None and graph_data is not None:
            try:
                import torch
                with torch.no_grad():
                    risk_score = float(self.gnn_model(graph_data).item())
                    score_breakdown = {
                        "method": "GNN",
                        "factors": [
                            {"name": "Graph Neural Network", "contribution": risk_score,
                             "reason": "ML model analyzed transaction patterns and relationships"}
                        ],
                        "total_score": risk_score
                    }
            except Exception:
                risk_score, score_breakdown = self._calculate_heuristic_risk(transaction)
                score_breakdown["method"] = "Heuristic (GNN fallback)"
        else:
            risk_score, score_breakdown = self._calculate_heuristic_risk(transaction)
            score_breakdown["method"] = "Heuristic"

        # Identify patterns
        patterns = self._identify_patterns(transaction, risk_score)

        # Get AI analysis
        prompt = f"""Analyze the risk profile of this transaction:

Transaction: {transaction['transaction_id']}
Amount: ${transaction['amount']}
Merchant Category: {transaction['merchant_category']}
Location: {transaction['location']}
Time: Hour {transaction['hour']}
Device: {transaction['device_id']}

GNN Risk Score: {risk_score:.3f} (0-1 scale)
Detected Patterns: {', '.join(patterns) if patterns else 'None'}

Provide:
1. Risk level (Low/Medium/High/Critical)
2. Key risk factors
3. Recommended monitoring actions
4. Prevention strategies

Format as JSON:
{{
  "risk_level": "Low/Medium/High/Critical",
  "risk_factors": ["factor1", "factor2"],
  "monitoring_actions": ["action1", "action2"],
  "prevention_strategies": ["strategy1", "strategy2"],
  "network_analysis": "Brief analysis of transaction network patterns"
}}
"""

        response = self.invoke(prompt)
        result = self._parse_json_response(response)

        # Ensure required fields
        result["risk_score"] = risk_score
        result["patterns"] = patterns
        result["score_breakdown"] = score_breakdown
        result.setdefault("risk_level", self._score_to_level(risk_score))
        result.setdefault("risk_factors", [])
        result.setdefault("monitoring_actions", [])
        result.setdefault("prevention_strategies", [])
        result["agent"] = self.agent_name
        
        # Generate human-readable explanation
        result["explanation"] = self._generate_explanation(risk_score, score_breakdown, patterns)

        return result

    def _generate_explanation(
        self,
        risk_score: float,
        score_breakdown: Dict[str, Any],
        patterns: List[str],
    ) -> str:
        """Generate concise human-readable explanation for risk score."""
        level = self._score_to_level(risk_score)
        factors = score_breakdown.get("factors", [])
        
        if not factors and not patterns:
            return f"{level} risk ({risk_score:.0%}). No significant risk factors detected."
        
        # Build explanation from top contributing factors
        top_factors = sorted(factors, key=lambda x: x["contribution"], reverse=True)[:3]
        reasons = [f["reason"] for f in top_factors]
        
        if level in ["Low"]:
            return f"{level} risk ({risk_score:.0%}). Transaction appears normal with no major red flags."
        elif level == "Medium":
            return f"{level} risk ({risk_score:.0%}). " + "; ".join(reasons[:2]) + ". Escalating for investigation."
        else:
            return f"{level} risk ({risk_score:.0%}). " + "; ".join(reasons) + ". Immediate review required."

    def _calculate_heuristic_risk(
        self,
        transaction: Dict[str, Any],
    ) -> tuple[float, Dict[str, Any]]:
        """Calculate risk score using heuristics when GNN unavailable.
        
        Returns:
            Tuple of (score, score_breakdown) where score_breakdown shows
            each factor's contribution to the total risk score.
        """
        score = 0.0
        breakdown: Dict[str, Any] = {
            "factors": [],
            "base_score": 0.0,
        }

        # Amount-based risk
        amount = transaction.get("amount", 0)
        if amount < 1.0:
            score += 0.3
            breakdown["factors"].append({
                "name": "Micro-transaction",
                "contribution": 0.3,
                "reason": f"Amount ${amount:.2f} suggests card testing pattern"
            })
        elif amount > 5000:
            score += 0.2
            breakdown["factors"].append({
                "name": "Large transaction",
                "contribution": 0.2,
                "reason": f"High value ${amount:,.2f} exceeds typical threshold"
            })

        # Time-based risk
        hour = transaction.get("hour", 12)
        if hour in [0, 1, 2, 3, 4, 23]:
            score += 0.2
            breakdown["factors"].append({
                "name": "Unusual hours",
                "contribution": 0.2,
                "reason": f"Transaction at {hour}:00 - high-risk time window"
            })

        # Location-based risk
        location = transaction.get("location", "")
        if location in ["Unknown", "Foreign", "VPN", "Proxy"]:
            score += 0.25
            breakdown["factors"].append({
                "name": "Suspicious location",
                "contribution": 0.25,
                "reason": f"Location '{location}' indicates potential fraud"
            })

        # Merchant category risk
        merchant = transaction.get("merchant_category", "")
        high_risk_merchants = ["Gift Cards", "Crypto", "Wire Transfer", "Electronics", "Jewelry"]
        if merchant in high_risk_merchants:
            score += 0.15
            breakdown["factors"].append({
                "name": "High-risk merchant",
                "contribution": 0.15,
                "reason": f"'{merchant}' category commonly used for fraud"
            })

        # Velocity risk
        velocity = transaction.get("velocity", 1)
        if velocity > 5:
            score += 0.1
            breakdown["factors"].append({
                "name": "High velocity",
                "contribution": 0.1,
                "reason": f"{velocity} transactions/hour exceeds normal rate"
            })

        final_score = min(score, 1.0)
        breakdown["total_score"] = final_score
        
        return final_score, breakdown

    def _identify_patterns(
        self,
        transaction: Dict[str, Any],
        risk_score: float,
    ) -> List[str]:
        """Identify fraud patterns in transaction."""
        patterns = []

        if risk_score > 0.7:
            patterns.append("High GNN risk score")

        amount = transaction.get("amount", 0)
        if amount < 1.0:
            patterns.append("Card testing (micro-transaction)")
        elif amount > 5000:
            patterns.append("Large value transaction")

        hour = transaction.get("hour", 12)
        if hour in [0, 1, 2, 3, 4, 23]:
            patterns.append("Unusual transaction time")

        merchant = transaction.get("merchant_category", "")
        if merchant in ["Gift Cards", "Crypto", "Wire Transfer"]:
            patterns.append(f"High-risk merchant: {merchant}")

        location = transaction.get("location", "")
        if location in ["Unknown", "Foreign", "VPN", "Proxy"]:
            patterns.append(f"Suspicious location: {location}")

        velocity = transaction.get("velocity", 1)
        if velocity > 5:
            patterns.append(f"High velocity: {velocity} tx/hour")

        return patterns

    def _score_to_level(self, score: float) -> str:
        """Convert numeric score to risk level."""
        if score >= 0.8:
            return "Critical"
        elif score >= 0.6:
            return "High"
        elif score >= 0.4:
            return "Medium"
        return "Low"
