# Multi-Agent Fraud Investigation System

## Business problem
Fraud rings hide behind fragmented transactions and cross-entity behavior that rule-based systems miss. Investigation teams need faster, explainable triage for high-risk networks.

## Agent architecture
A LangGraph orchestration layer coordinates specialist agents:
- Graph Risk Analyst: scores entities and edges with a graph-based risk model.
- Investigator Agent: builds case narratives and evidence trails.
- Compliance Agent: validates policy and regulatory checkpoints.
- Decision Synthesizer: produces investigation-ready recommendations with confidence.

## Stack
- Python, FastAPI, React
- LangGraph, AWS Bedrock (Claude)
- PyTorch Geometric, NetworkX
- PostgreSQL, Docker

## Result
Built for production-style workflows with explainable fraud signals, investigation traceability, and governance-aware outputs for compliance review.
