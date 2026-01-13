"""
Compliance Agent - Regulatory compliance and SAR reporting.
"""

import json
from typing import Any, Dict, List

from .base_agent import BedrockAgent


class ComplianceAgent(BedrockAgent):
    """Agent specialized in regulatory compliance."""

    def __init__(self, region: str = "us-east-1"):
        super().__init__(
            agent_name="Compliance Officer",
            role="regulatory compliance specialist",
            region=region,
        )

    def _get_responsibilities(self) -> str:
        return """
- Ensure AML/KYC compliance
- Generate Suspicious Activity Reports (SAR)
- Check FINRA/FinCEN requirements
- Flag regulatory violations
- Provide compliance recommendations
- Maintain audit trail for regulatory purposes
- Apply Bank Secrecy Act (BSA) requirements
"""

    def check_compliance(
        self,
        transaction: Dict[str, Any],
        investigation_result: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Check regulatory compliance for a transaction."""
        prompt = f"""Review this transaction for regulatory compliance:

Transaction Details:
- ID: {transaction['transaction_id']}
- Amount: ${transaction['amount']}
- From: {transaction['from_account']} → To: {transaction['to_account']}
- Merchant: {transaction['merchant_category']}
- Location: {transaction['location']}

Investigation Result:
- Recommendation: {investigation_result.get('recommendation', 'N/A')}
- Fraud Likelihood: {investigation_result.get('fraud_likelihood', 'N/A')}
- Confidence: {investigation_result.get('confidence', 'N/A')}

Regulatory Requirements to Check:
- Bank Secrecy Act (BSA): Transactions >$10,000 must be reported (CTR)
- FinCEN: Suspicious Activity Reports (SAR) for suspected fraud >$5,000
- FINRA: Customer protection rules
- AML: Anti-Money Laundering checks
- KYC: Know Your Customer verification
- OFAC: Sanctions screening

Your task:
1. Determine if SAR filing is required
2. Check for AML/KYC violations
3. Identify any regulatory requirements
4. Provide compliance recommendations
5. Note any audit trail requirements

Format as JSON:
{{
  "sar_required": true/false,
  "sar_reason": "reason if required",
  "ctr_required": true/false,
  "aml_violations": ["violation1", "violation2"],
  "kyc_flags": ["flag1", "flag2"],
  "regulatory_actions": ["action1", "action2"],
  "compliance_notes": "additional notes",
  "risk_rating": "Low/Medium/High",
  "reporting_deadline": "timeframe for required reports"
}}
"""

        response = self.invoke(prompt)
        result = self._parse_json_response(response)

        # Apply automatic rules
        amount = transaction.get("amount", 0)

        # CTR required for transactions > $10,000
        if amount > 10000:
            result["ctr_required"] = True
            if "ctr_required" not in result.get("regulatory_actions", []):
                result.setdefault("regulatory_actions", []).append(
                    "File Currency Transaction Report (CTR) - amount exceeds $10,000"
                )

        # SAR required for suspicious transactions > $5,000
        fraud_likelihood = investigation_result.get("fraud_likelihood", "Low")
        if amount > 5000 and fraud_likelihood in ["Medium", "High"]:
            result["sar_required"] = True
            result.setdefault("sar_reason", f"Suspicious transaction over $5,000 with {fraud_likelihood} fraud likelihood")

        # Ensure required fields
        result.setdefault("sar_required", False)
        result.setdefault("ctr_required", False)
        result.setdefault("sar_reason", "")
        result.setdefault("aml_violations", [])
        result.setdefault("kyc_flags", [])
        result.setdefault("regulatory_actions", [])
        result.setdefault("compliance_notes", "")
        result.setdefault("risk_rating", "Low")
        result["agent"] = self.agent_name
        
        # Generate human-readable compliance summary
        result["compliance_summary"] = self._generate_compliance_summary(
            result, transaction, investigation_result
        )

        return result
    
    def _generate_compliance_summary(
        self,
        result: Dict[str, Any],
        transaction: Dict[str, Any],
        investigation_result: Dict[str, Any],
    ) -> str:
        """Generate concise human-readable compliance explanation."""
        amount = transaction.get("amount", 0)
        parts = []
        
        # CTR status
        if result.get("ctr_required"):
            parts.append(f"CTR required: ${amount:,.2f} exceeds $10,000 threshold.")
        
        # SAR status
        if result.get("sar_required"):
            fraud_likelihood = investigation_result.get("fraud_likelihood", "Unknown")
            parts.append(f"SAR filing initiated: {fraud_likelihood} fraud likelihood on ${amount:,.2f} transaction.")
        elif amount > 5000:
            parts.append(f"SAR not required: Transaction ${amount:,.2f} reviewed, no suspicious indicators confirmed.")
        
        # AML/KYC status
        aml_count = len(result.get("aml_violations", []))
        kyc_count = len(result.get("kyc_flags", []))
        
        if aml_count > 0:
            parts.append(f"{aml_count} AML violation(s) flagged for review.")
        if kyc_count > 0:
            parts.append(f"{kyc_count} KYC flag(s) require verification.")
        
        if not parts:
            parts.append("All compliance checks passed. No regulatory filings required.")
        
        return " ".join(parts)

    def generate_sar_report(
        self,
        transaction: Dict[str, Any],
        investigation: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate a Suspicious Activity Report."""
        prompt = f"""Generate a Suspicious Activity Report (SAR) for this transaction:

Transaction:
{json.dumps(transaction, indent=2)}

Investigation Findings:
{json.dumps(investigation, indent=2)}

Generate a complete SAR with:
1. Subject information
2. Suspicious activity description
3. Amount involved
4. Date/time of activity
5. Account information
6. Narrative describing suspicious activity

Format as JSON with SAR fields.
"""

        response = self.invoke(prompt)
        result = self._parse_json_response(response)
        result["agent"] = self.agent_name
        result["report_type"] = "SAR"
        result["transaction_id"] = transaction["transaction_id"]

        return result
