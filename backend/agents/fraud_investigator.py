"""
Fraud Investigator Agent - Primary fraud detection and investigation.
"""

import json
from typing import Any, Dict, List

from .base_agent import BedrockAgent


class FraudInvestigatorAgent(BedrockAgent):
    """Agent specialized in fraud investigation."""

    def __init__(self, region: str = "us-east-1"):
        super().__init__(
            agent_name="Fraud Investigator",
            role="fraud detection specialist",
            region=region,
        )

    def _get_responsibilities(self) -> str:
        return """
- Analyze suspicious transactions for fraud indicators
- Generate detailed investigation reports
- Recommend actions (APPROVE, DECLINE, REVIEW)
- Explain reasoning in clear, non-technical language
- Consider customer impact and false positive risk
- Identify specific fraud patterns and indicators
"""

    def investigate_transaction(
        self,
        transaction: Dict[str, Any],
        risk_score: float,
        patterns: List[str],
    ) -> Dict[str, Any]:
        """Investigate a suspicious transaction."""
        prompt = f"""Investigate this transaction for potential fraud:

Transaction Details:
- ID: {transaction['transaction_id']}
- Amount: ${transaction['amount']}
- From: {transaction['from_account']} → To: {transaction['to_account']}
- Merchant: {transaction['merchant_category']}
- Time: {transaction['timestamp']} (Hour: {transaction['hour']})
- Device: {transaction['device_id']}
- Location: {transaction['location']}
- Transaction Velocity: {transaction.get('velocity', 'N/A')} transactions/hour

Risk Assessment:
- GNN Risk Score: {risk_score:.2f} (0-1 scale, higher = more suspicious)
- Detected Patterns: {', '.join(patterns) if patterns else 'None'}

Your task:
1. Analyze all available information
2. Identify specific fraud indicators
3. Assess likelihood of fraud (Low/Medium/High)
4. Recommend action (APPROVE/DECLINE/REVIEW)
5. Provide clear explanation for your recommendation

Format your response as JSON:
{{
  "fraud_likelihood": "Low/Medium/High",
  "recommendation": "APPROVE/DECLINE/REVIEW",
  "fraud_indicators": ["indicator1", "indicator2"],
  "explanation": "Clear explanation of your reasoning",
  "confidence": 0.0-1.0,
  "suggested_actions": ["action1", "action2"]
}}
"""

        response = self.invoke(prompt)
        result = self._parse_json_response(response)

        # Ensure required fields
        result.setdefault("fraud_likelihood", "Unknown")
        result.setdefault("recommendation", "REVIEW")
        result.setdefault("fraud_indicators", [])
        result.setdefault("explanation", response)
        result.setdefault("confidence", 0.5)
        result.setdefault("suggested_actions", [])
        result["agent"] = self.agent_name

        return result
