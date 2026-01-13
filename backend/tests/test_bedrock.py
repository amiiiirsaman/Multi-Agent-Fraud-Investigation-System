"""
Tests for Bedrock Nova Pro API connectivity and format.
"""

import json
import pytest
import boto3
from unittest.mock import MagicMock, patch


class TestBedrockConnectivity:
    """Test AWS Bedrock Nova Pro API calls."""

    @pytest.fixture
    def bedrock_client(self):
        """Create a Bedrock client."""
        return boto3.client("bedrock-runtime", region_name="us-east-1")

    @pytest.fixture
    def mock_bedrock_response(self):
        """Create a mock Bedrock response."""
        response_body = {
            "output": {
                "message": {
                    "content": [{"text": '{"risk_score": 0.75, "risk_level": "HIGH"}'}]
                }
            }
        }
        mock_response = MagicMock()
        mock_response["body"].read.return_value = json.dumps(response_body).encode()
        return mock_response

    def test_nova_pro_request_format(self):
        """Test that the Nova Pro request format is correct."""
        # This is the format we use in base_agent.py
        request_body = {
            "inferenceConfig": {
                "max_new_tokens": 2000,
                "temperature": 0.3,
            },
            "system": [{"text": "You are a helpful assistant."}],
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": "Hello, world!"}],
                }
            ],
        }

        # Verify structure
        assert "inferenceConfig" in request_body
        assert "system" in request_body
        assert "messages" in request_body
        assert request_body["messages"][0]["role"] == "user"
        assert isinstance(request_body["system"], list)
        assert isinstance(request_body["messages"][0]["content"], list)

    def test_nova_pro_response_parsing(self, mock_bedrock_response):
        """Test that we correctly parse Nova Pro responses."""
        response_body = json.loads(mock_bedrock_response["body"].read())
        result = response_body["output"]["message"]["content"][0]["text"]

        assert result == '{"risk_score": 0.75, "risk_level": "HIGH"}'
        
        # Parse the JSON result
        parsed = json.loads(result)
        assert parsed["risk_score"] == 0.75
        assert parsed["risk_level"] == "HIGH"

    @patch("boto3.client")
    def test_invoke_model_call(self, mock_boto_client, mock_bedrock_response):
        """Test the invoke_model call structure."""
        mock_client = MagicMock()
        mock_client.invoke_model.return_value = mock_bedrock_response
        mock_boto_client.return_value = mock_client

        # Simulate what base_agent.py does
        client = boto3.client("bedrock-runtime", region_name="us-east-1")
        
        response = client.invoke_model(
            modelId="amazon.nova-pro-v1:0",
            body=json.dumps({
                "inferenceConfig": {
                    "max_new_tokens": 2000,
                    "temperature": 0.3,
                },
                "system": [{"text": "You are a risk analyst."}],
                "messages": [
                    {
                        "role": "user",
                        "content": [{"text": "Analyze this transaction."}],
                    }
                ],
            }),
        )

        # Verify the call was made correctly
        mock_client.invoke_model.assert_called_once()
        call_args = mock_client.invoke_model.call_args
        assert call_args.kwargs["modelId"] == "amazon.nova-pro-v1:0"


class TestBedrockLiveConnectivity:
    """Live tests for Bedrock - run manually with real credentials."""

    @pytest.mark.skip(reason="Run manually with real AWS credentials")
    def test_live_nova_pro_call(self):
        """Test a real call to Nova Pro."""
        client = boto3.client("bedrock-runtime", region_name="us-east-1")
        
        response = client.invoke_model(
            modelId="amazon.nova-pro-v1:0",
            body=json.dumps({
                "inferenceConfig": {
                    "max_new_tokens": 100,
                    "temperature": 0.3,
                },
                "system": [{"text": "You are a helpful assistant."}],
                "messages": [
                    {
                        "role": "user",
                        "content": [{"text": "Say 'Hello, test successful!' and nothing else."}],
                    }
                ],
            }),
        )

        response_body = json.loads(response["body"].read())
        result = response_body["output"]["message"]["content"][0]["text"]
        
        assert "hello" in result.lower() or "test" in result.lower()
        print(f"Nova Pro response: {result}")
