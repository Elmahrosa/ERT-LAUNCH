import TelegramBot from 'node-telegram-bot-api';
import { AdvancedERTClient } from './advanced_client.js';  // Import client

const token = process.env.TELEGRAM_BOT_TOKEN!;  // Get from BotFather
const bot = new TelegramBot(token, { polling: true });
const ertClient = new AdvancedERTClient();

interface UserStake {
    userId: number;
    level: number;
    referrals: number[];
}

const stakes: Map<number, UserStake> = new Map();  // In-memory; use DB in prod

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome to ERT Mining! Stake $ERT for rewards. Use /stake <amount> or /claim <level>');
});

bot.onText(/\/stake (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const amount = parseInt(match[1]);
    if (isNaN(amount) || amount <= 0) return bot.sendMessage(chatId, 'Invalid amount');

    try {
        // Assume user links Solana wallet via /wallet command (store in stakes)
        const userStake = stakes.get(chatId) || { userId: chatId, level: 1, referrals: [] };
        // Call client to stake (extend client with stake instruction)
        await ertClient.stake(amount, userStake.level);  // Pseudo: Add stake fn to client
        userStake.level = Math.min(5, userStake.level + 1);  // Upgrade on stake
        stakes.set(chatId, userStake);
        bot.sendMessage(chatId, `Staked ${amount} $ERT at level ${userStake.level}! Rewards: 1% + 0.5% per level.`);
    } catch (error) {
        bot.sendMessage(chatId, `Error staking: ${error.message}`);
    }
});

bot.onText(/\/claim (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const level = parseInt(match[1]);
    const userStake = stakes.get(chatId);
    if (!userStake || level > 5 || level < 1) return bot.sendMessage(chatId, 'Invalid level or no stake');

    try {
        // Claim on-chain
        await ertClient.claimRewards(level, userStake.userId);  // Pseudo: Use wallet from user
        const reward = userStake.level * 10;  // Simplified calc
        bot.sendMessage(chatId, `Claimed ${reward} $ERT rewards at level ${level}! Refer /refer @username for bonuses.`);
        // Handle referrals: Add to userStake.referrals
    } catch (error) {
        bot.sendMessage(chatId, `Claim failed: ${error.message}`);
    }
});

bot.onText(/\/refer (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const referredUser = match[1];  // Parse username
    // Add to referral tree (on-chain via client if needed)
    bot.sendMessage(chatId, `Referred ${referredUser}! Earn bonus on their stakes.`);
});

// Listen for on-chain events (e.g., RewardClaimed) via websocket
ertClient.connection.onLogs('all', (logs) => {
    if (logs.logs.some(log => log.includes('RewardClaimed'))) {
        // Notify users in bot
        bot.sendMessage(/* user chatId */, 'New rewards available! Use /claim');
    }
});

console.log('Mining Bot Started');
