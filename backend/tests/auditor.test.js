const { auditWithAI } = require('./ai_auditor');

jest.mock('openai');  // Mock OpenAI for tests

describe('AI Auditor', () => {
    test('audits low-risk reserve check', async () => {
        // Mock OpenAI response
        const mockResponse = {
            risk: 'LOW',
            explanation: 'Reserves at 160% collateral—stable.',
            actions: ['Monitor'],
            reportHash: 'mockhash'
        };

        // Simulate
        const result = await auditWithAI({
            eventType: 'manual_reserve_check',
            data: { currentReserves: 1.6, collateralRatio: 1.5 }
        });

        expect(result.risk).toBe('LOW');
        expect(result.actions).toContain('Monitor');
    });

    test('flags high-risk anomaly', async () => {
        // Similar mock for under-collateral
        const result = await auditWithAI({
            eventType: 'claim_or_mint',
            data: { reserves: 1.1, required: 1.5 }
        });
        expect(result.risk).toBe('HIGH');
    });
});
