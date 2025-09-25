import { AdvancedERTClient } from '../src/advanced_client';

describe('AdvancedERTClient', () => {
    let client: AdvancedERTClient;

    beforeEach(() => {
        client = new AdvancedERTClient('https://api.devnet.solana.com');
    });

    test('connects wallet and fetches reserves', async () => {
        // Mock wallet connection
        global.fetch = jest.fn(() => Promise.resolve({ json: () => ({}) } as Response));
        const reserves = await client.getReserves();
        expect(reserves).toHaveProperty('totalReserves');
        expect(reserves.totalReserves).toBeGreaterThan(0);
    });

    test('mints ERT with valid ZK proof', async () => {
        const mockProof = { proof: 'mock', proofHash: 'hash123' };
        jest.spyOn(client as any, 'generateZKProof').mockResolvedValue(mockProof);
        // Mock RPC call
        await expect(client.mintERT(100, { total: 150, gold: 50, teos: 100 })).resolves.not.toThrow();
    });

    // Add bot tests if needed (e.g., mock Telegram)
});
