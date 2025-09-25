# Advanced ERT Stablecoin Architecture

## Overview
$ERT is an over-collateralized stablecoin with zk-privacy, AI audits, and oracle-driven pegging. Key flows: Mint (zk-proof + oracle check) → AI Audit → Reward Distribution.

## High-Level Flow Diagram
```mermaid
graph TD
    A[User Requests Mint $ERT] --> B[Generate ZK Proof of Reserves]
    B --> C[Fetch Pyth Oracle Prices Gold/TEOS]
    C --> D[On-Chain: Verify Collateral >150% & ZK]
    D --> E[Mint $ERT via SPL CPI]
    E --> F[Emit Event: Mint/RewardClaimed]
    F --> G[Backend: Listen WS → Trigger OpenAI Audit]
    G --> H{Anomaly Detected?}
    H -->|Yes| I[Alert Governance Multisig & Adjust Peg]
    H -->|No| J[Update Vault State]
    J --> K[Telegram Bot: Notify User Rewards]
    L[Stake for Mining] --> M[5-Level Referral Calc] --> K
