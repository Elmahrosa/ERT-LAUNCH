const OpenAI = require('openai');
const CryptoJS = require('crypto-js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function auditWithAI(eventData) {
    const { eventType, data, signature } = eventData;

    // Prompt engineering for high-tech analysis
    const prompt = `
    You are an expert blockchain auditor for the ERT stablecoin. Analyze the following:

    Event Type: ${eventType}
    Details: ${JSON.stringify(data || {})}
    Transaction Signature: ${signature || 'N/A'}

    Tasks:
    1. Check for anomalies: e.g., If reserves < 120% collateral, flag as HIGH RISK.
    2. Verify backing (gold/TEOS): Suggest oracle updates if deviation > 2%.
    3. For mining claims: Ensure level <=5 and no referral abuse.
    4. Output: Risk level (LOW/MED/HIGH), explanation, actions (e.g., "Mint more backing", "Alert governance").
    5. Generate a base64 hash of this report for on-chain verification.

    Respond in JSON: { "risk": "LOW", "explanation": "...", "actions": [...], "reportHash": "base64_hash" }
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,  // Low for factual analysis
            max_tokens: 500,
        });

        const response = JSON.parse(completion.choices[0].message.content);
        
        // Generate hash for on-chain (as in update_reserves_with_ai_audit)
        const reportString = JSON.stringify(response);
        response.reportHash = Buffer.from(reportString).toString('base64');

        // Log for debugging
        console.log('AI Audit Output:', response);

        // If HIGH risk, auto-trigger peg_adjust.js or notify multisig
        if (response.risk === 'HIGH') {
            console.log('HIGH RISK: Triggering emergency actions');
            // e.g., require('child_process').exec('node scripts/peg_adjust.js');
        }

        return response;
    } catch (error) {
        throw new Error(`AI Audit Error: ${error.message}`);
    }
}

module.exports = { auditWithAI };
