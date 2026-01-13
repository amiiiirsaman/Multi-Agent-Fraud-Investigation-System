"""
Base Agent class for AWS Bedrock-powered agents.
"""

import boto3
import json
import logging
from typing import Any, Optional, List, Dict

logger = logging.getLogger(__name__)


class BedrockAgent:
    """Base class for AWS Bedrock-powered agents."""

    def __init__(self, agent_name: str, role: str, region: str = "us-east-1"):
        self.agent_name = agent_name
        self.role = role
        self.bedrock = boto3.client("bedrock-runtime", region_name=region)
        # Use Amazon Nova Pro - more widely available
        self.model_id = "amazon.nova-pro-v1:0"
        self.conversation_history: List[Dict[str, str]] = []

    def invoke(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Invoke the agent with a prompt and optional context."""
        system_prompt = f"""You are {self.agent_name}, a {self.role}.

Your responsibilities:
{self._get_responsibilities()}

Always provide clear, actionable insights based on the data provided.
Respond in valid JSON format when requested."""

        # Add context if provided
        full_prompt = prompt
        if context:
            full_prompt = f"Context:\n{json.dumps(context, indent=2)}\n\nTask:\n{prompt}"

        try:
            # Use Nova-compatible format
            response = self.bedrock.invoke_model(
                modelId=self.model_id,
                body=json.dumps({
                    "inferenceConfig": {
                        "max_new_tokens": 2000,
                        "temperature": 0.3,
                    },
                    "system": [{"text": system_prompt}],
                    "messages": [
                        {
                            "role": "user",
                            "content": [{"text": full_prompt}],
                        }
                    ],
                }),
            )

            response_body = json.loads(response["body"].read())
            result = response_body["output"]["message"]["content"][0]["text"]

            # Store in conversation history
            self.conversation_history.append({
                "prompt": full_prompt,
                "response": result,
            })

            return result

        except Exception as e:
            logger.error(f"Error invoking Bedrock: {e}")
            raise

    def _get_responsibilities(self) -> str:
        """Override in subclasses to define agent responsibilities."""
        return "General agent responsibilities"

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from response, handling markdown wrapping."""
        try:
            # Try direct parse first
            return json.loads(response)
        except json.JSONDecodeError:
            pass

        # Handle markdown code blocks
        if "```json" in response:
            json_str = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            json_str = response.split("```")[1].split("```")[0].strip()
        else:
            json_str = response.strip()

        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            return {"raw_response": response, "parse_error": str(e)}

    def clear_history(self) -> None:
        """Clear conversation history."""
        self.conversation_history = []
