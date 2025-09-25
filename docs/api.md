# ERT Backend API Documentation

The backend (`backend/server.js`) exposes REST APIs for audits and queries. Base URL: `http://localhost:3000` (or deployed endpoint).

## Endpoints

### GET /health
- **Description**: Server status.
- **Response**: `{ "status": "running", "timestamp": "2024-01-01T00:00:00Z" }`

### POST /audit/reserves
- **Description**: Trigger AI audit of reserves (e.g., anomaly detection).
- **Body**: `{ "vaultPubkey": "PubkeyStr", "currentReserves": 1.5, "collateralRatio": 1.2 }`
- **Response**: `{ "success": true, "report": { "risk": "LOW", "explanation": "...", "actions": [...], "reportHash": "base64hash" } }`
- **Auth**: None (add JWT for prod).

### POST /audit/event
- **Description**: Audit on-chain event (e.g., mint/claim).
- **Body**: `{ "eventType": "mint", "signature": "TxSig", "data": { ... } }`
- **Response**: Same as above.

### GET /reserves
- **Description**: Fetch current vault state (on-chain query).
- **Response**: `{ "totalReserves": 1500000, "peg": 1.00, "zkProofHash": "hex" }`

## WebSocket
- Connect to `/ws` for real-time events (e.g., `{"type": "audit_update", "report": {...}}`).

## Error Handling
- 400: Invalid input.
- 500: Audit failure (e.g., OpenAI error).

Integrate with client/bot via fetch/WebSocket.
