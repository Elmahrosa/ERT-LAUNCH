require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Connection, PublicKey } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');
const WebSocket = require('ws');
const { auditWithAI } = require('./ai_auditor.js');  // Import AI module

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

const connection = new Connection(process.env.RPC_URL || 'https://api.devnet.solana.com');
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

// WebSocket listener for Solana logs (on-chain events)
const ws = new WebSocket('wss://api.devnet.solana.com');  // Devnet WS
ws.on('open', () => {
    console.log('Connected to Solana WS');
    // Subscribe to program logs
    const subscriptionId = connection.onLogs(
        PROGRAM_ID,
        (logs, ctx) => {
            console.log('Event detected:', logs.signature);
            if (logs.logs.some(log => log.includes('RewardClaimed') || log.includes('Mint'))) {
                // Trigger AI audit on relevant events
                auditWithAI({ eventType: 'claim_or_mint', signature: logs.signature, timestamp: Date.now() })
                    .then(report => {
                        console.log('AI Audit Report:', report);
                        // Emit to connected clients (e.g., bot or dApp)
                        // ws.send(JSON.stringify({ type: 'audit_update', report }));
                    })
                    .catch(err => console.error('Audit failed:', err));
            }
        },
        'confirmed'
    );
    console.log('Subscribed to program events:', subscriptionId);
});

ws.on('error', (err) => console.error('WS Error:', err));

// API Routes
app.post('/audit/reserves', async (req, res) => {
    const { vaultPubkey, currentReserves, collateralRatio } = req.body;
    try {
        const report = await auditWithAI({
            eventType: 'manual_reserve_check',
            data: { vaultPubkey, currentReserves, collateralRatio }
        });
        res.json({ success: true, report });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`AI Auditor Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    ws.close();
    process.exit();
});
