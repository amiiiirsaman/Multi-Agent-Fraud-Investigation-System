"""
Configuration settings for the application.
"""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Settings:
    """Application settings."""

    # AWS Bedrock settings
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    bedrock_model_id: str = os.getenv(
        "BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0"
    )

    # API settings
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Data settings
    data_dir: str = os.getenv("DATA_DIR", "data")
    num_transactions: int = int(os.getenv("NUM_TRANSACTIONS", "10000"))
    fraud_rate: float = float(os.getenv("FRAUD_RATE", "0.05"))

    # LangFuse settings (optional)
    langfuse_public_key: Optional[str] = os.getenv("LANGFUSE_PUBLIC_KEY")
    langfuse_secret_key: Optional[str] = os.getenv("LANGFUSE_SECRET_KEY")
    langfuse_host: str = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")


settings = Settings()
