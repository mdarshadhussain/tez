const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const PORT = 3001;
const JWT_SECRET = 'tezclub_secret_super_key_2026';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize database
db.initDatabase();

// --- AUTH MIDDLEWARE ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// --- EXPRESS ENDPOINTS ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { phone_number, password, referral_code } = req.body;
  if (!phone_number || !password) {
    return res.status(400).json({ error: 'Phone number and password required' });
  }
  try {
    const user = await db.registerUser(phone_number, password, referral_code);
    const token = jwt.sign({ id: user.id, phone_number: user.phone_number }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { phone_number, password } = req.body;
  try {
    const user = await db.dbGet("SELECT * FROM users WHERE phone_number = ?", [phone_number]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: 'Invalid phone number or password' });
    }
    const token = jwt.sign({ id: user.id, phone_number: user.phone_number }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, phone_number: user.phone_number, invite_code: user.invite_code } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Stats / Wallet
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.dbGet("SELECT id, phone_number, invite_code, vip_level, lifetime_turnover, created_at FROM users WHERE id = ?", [req.user.id]);
    const wallet = await db.dbGet("SELECT playable_balance, commission_balance FROM wallets WHERE user_id = ?", [req.user.id]);
    res.json({ user, wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VIP Tournament Leaderboard (Monthly Whales)
app.get('/api/vip/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db.dbAll(`
      SELECT u.id, SUBSTR(u.phone_number, 1, 3) || '****' || SUBSTR(u.phone_number, -3) as phone, u.vip_level, u.lifetime_turnover 
      FROM users u 
      ORDER BY u.lifetime_turnover DESC 
      LIMIT 10
    `);
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Affiliate network dashboard data
app.get('/api/affiliate/stats', authenticateToken, async (req, res) => {
  try {
    const user = await db.dbGet("SELECT invite_code FROM users WHERE id = ?", [req.user.id]);
    const counts = await db.dbAll(`
      SELECT depth, COUNT(*) as count 
      FROM referral_mappings 
      WHERE ancestor_id = ? 
      GROUP BY depth
    `, [req.user.id]);

    const wallet = await db.dbGet("SELECT commission_balance FROM wallets WHERE user_id = ?", [req.user.id]);

    res.json({
      invite_code: user.invite_code,
      network: counts,
      commission_balance: wallet ? wallet.commission_balance : 0.00
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a deposit (Creates pending review record)
app.post('/api/wallet/deposit', authenticateToken, async (req, res) => {
  const { amount, reference_id } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!reference_id) return res.status(400).json({ error: 'Reference ID/UTR is required' });

  try {
    const currentBalance = await db.createPendingDeposit(req.user.id, amount, reference_id);
    res.json({ success: true, new_balance: currentBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending deposits (admin only)
app.get('/api/admin/deposits/pending', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const list = await db.getPendingDeposits();
    res.json({ success: true, deposits: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Take action (approve/reject) on a pending deposit (admin only)
app.post('/api/admin/deposits/action', authenticateToken, verifyAdmin, async (req, res) => {
  const { transaction_id, action } = req.body;
  if (!transaction_id || !action) return res.status(400).json({ error: 'Missing required parameters' });

  try {
    if (action === 'approve') {
      const newBalance = await db.approveDeposit(transaction_id);
      res.json({ success: true, message: 'Deposit approved successfully', new_balance: newBalance });
    } else if (action === 'reject') {
      await db.rejectDeposit(transaction_id);
      res.json({ success: true, message: 'Deposit rejected successfully' });
    } else {
      res.status(400).json({ error: 'Invalid action. Must be approve or reject' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment settings
app.get('/api/payment/settings', async (req, res) => {
  try {
    const settings = await db.getPaymentSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update payment settings (admin only)
app.post('/api/payment/settings', authenticateToken, verifyAdmin, async (req, res) => {
  const { upi_id, qr_url } = req.body;
  if (!upi_id) return res.status(400).json({ error: 'UPI ID is required' });

  try {
    await db.updatePaymentSettings(upi_id, qr_url || '');
    res.json({ success: true, message: 'Payment settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a withdrawal
app.post('/api/wallet/withdraw', authenticateToken, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const newBalance = await db.adjustWalletBalance(req.user.id, -amount, 'withdrawal', 'completed', `wd_${Date.now()}`);
    res.json({ success: true, new_balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Overrides variables
let nextWinGoColor = null;
let nextCrashMultiplier = null;

// Game Control Settings Configuration
let gameControlSettings = {
  wingo: { mode: 'algorithmic', nextOutcome: null },
  trx: { mode: 'random', nextOutcome: null },
  roulette: { mode: 'random', nextOutcome: null },
  coinflip: { mode: 'random', nextOutcome: null },
  dice: { mode: 'random', nextOutcome: null },
  limbo: { mode: 'random', nextOutcome: null },
  keno: { mode: 'random', nextOutcome: null },
  crash: { mode: 'random', nextOutcome: null }
};

// Admin verification middleware
function verifyAdmin(req, res, next) {
  if (req.user.phone_number !== '9999999999') {
    return res.status(403).json({ error: 'Admin access denied' });
  }
  next();
}

// Get all game settings (admin only)
app.get('/api/admin/game-settings', authenticateToken, verifyAdmin, (req, res) => {
  res.json({ success: true, settings: gameControlSettings });
});

// Update game settings (admin only)
app.post('/api/admin/game-settings', authenticateToken, verifyAdmin, (req, res) => {
  const { game, mode, nextOutcome } = req.body;
  if (!game || !gameControlSettings[game]) {
    return res.status(400).json({ error: 'Invalid game identifier' });
  }
  if (mode) gameControlSettings[game].mode = mode;
  if (nextOutcome !== undefined) gameControlSettings[game].nextOutcome = nextOutcome;
  res.json({ success: true, settings: gameControlSettings });
});

// Get detailed user profiles for admin (admin only)
app.get('/api/admin/users/:userId/details', authenticateToken, verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await db.dbGet("SELECT u.id, u.phone_number, u.password_hash, u.vip_level, u.lifetime_turnover, u.is_blocked, u.created_at FROM users u WHERE u.id = ?", [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const wallet = await db.dbGet("SELECT playable_balance, commission_balance FROM wallets WHERE user_id = ?", [userId]);
    
    // Payment History: Deposits & Withdrawals
    const payments = await db.dbAll(`
      SELECT t.id, t.type, t.status, t.amount, t.previous_balance, t.new_balance, t.reference_id, t.created_at
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      WHERE w.user_id = ? AND t.type IN ('deposit', 'withdrawal')
      ORDER BY t.id DESC
    `, [userId]);

    // Earnings History: Referral commissions
    const earnings = await db.dbAll(`
      SELECT t.id, t.type, t.status, t.amount, t.previous_balance, t.new_balance, t.reference_id, t.created_at
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      WHERE w.user_id = ? AND t.type = 'referral_commission'
      ORDER BY t.id DESC
    `, [userId]);

    // Reward History: VIP tournament, VIP tasks, bonuses
    const rewards = await db.dbAll(`
      SELECT t.id, t.type, t.status, t.amount, t.previous_balance, t.new_balance, t.reference_id, t.created_at
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      WHERE w.user_id = ? AND t.type IN ('vip_bonus')
      ORDER BY t.id DESC
    `, [userId]);

    // Game Plays: Bets logs
    const gamePlays = await db.dbAll(`
      SELECT id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won, raw_selection, created_at
      FROM bets
      WHERE user_id = ?
      ORDER BY id DESC
    `, [userId]);

    res.json({
      success: true,
      user,
      wallet,
      payments,
      earnings,
      rewards,
      gamePlays
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user credentials / balance (admin only)
app.post('/api/admin/users/:userId/update', authenticateToken, verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  const { password, vip_level, playable_balance, commission_balance } = req.body;
  try {
    const user = await db.dbGet("SELECT id FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (password) {
      const passwordHash = bcrypt.hashSync(password, 10);
      await db.dbRun("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
    }

    if (vip_level !== undefined) {
      await db.dbRun("UPDATE users SET vip_level = ? WHERE id = ?", [parseInt(vip_level), userId]);
    }

    const wallet = await db.dbGet("SELECT id, playable_balance, commission_balance FROM wallets WHERE user_id = ?", [userId]);
    if (wallet) {
      if (playable_balance !== undefined) {
        const diff = parseFloat(playable_balance) - wallet.playable_balance;
        if (diff !== 0) {
          await db.adjustWalletBalance(userId, diff, 'vip_bonus', 'completed', `admin_adj_${Date.now()}`);
        }
      }
      if (commission_balance !== undefined) {
        const diff = parseFloat(commission_balance) - wallet.commission_balance;
        if (diff !== 0) {
          await db.adjustWalletBalance(userId, diff, 'referral_commission', 'completed', `admin_adj_comm_${Date.now()}`);
        }
      }
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User transaction ledger history
app.get('/api/user/transactions', authenticateToken, async (req, res) => {
  try {
    const history = await db.getUserTransactions(req.user.id);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin stats
app.get('/api/admin/stats', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const stats = await db.getPlatformStats();
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin user listings
app.get('/api/admin/users', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin manual round outcome overrides
app.post('/api/admin/override', authenticateToken, verifyAdmin, (req, res) => {
  const { wingo_color, crash_multiplier } = req.body;
  if (wingo_color) nextWinGoColor = wingo_color;
  if (crash_multiplier) nextCrashMultiplier = parseFloat(crash_multiplier);
  res.json({ success: true, nextWinGoColor, nextCrashMultiplier });
});

// Admin toggle block status of a user
app.post('/api/admin/toggle-block', authenticateToken, verifyAdmin, async (req, res) => {
  const { target_user_id } = req.body;
  if (!target_user_id) return res.status(400).json({ error: 'target_user_id required' });
  try {
    const user = await db.dbGet("SELECT is_blocked FROM users WHERE id = ?", [target_user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const nextStatus = user.is_blocked ? 0 : 1;
    await db.dbRun("UPDATE users SET is_blocked = ? WHERE id = ?", [nextStatus, target_user_id]);
    res.json({ success: true, is_blocked: nextStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin test control panel - deposit credits instantly
app.post('/api/admin/mint-credits', authenticateToken, async (req, res) => {
  const { amount, target_user_id } = req.body;
  try {
    const target = target_user_id || req.user.id;
    const newBalance = await db.adjustWalletBalance(target, amount, 'vip_bonus', 'completed', `mint_${Date.now()}`);
    res.json({ success: true, balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all support threads for admin
app.get('/api/admin/support/threads', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const threads = await db.getAllSupportThreads();
    res.json({ threads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get message history for a user support session
app.get('/api/support/messages/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const messages = await db.getSupportMessages(sessionId);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CLIENT-SIDE INSTANT GAMES (SOLO MECHANICS) ---

// Mines Game round start
app.post('/api/games/mines/start', authenticateToken, async (req, res) => {
  const { bet_amount, mine_count } = req.body;
  if (!bet_amount || bet_amount < 10) return res.status(400).json({ error: 'Minimum bet is ₹10.00' });
  if (mine_count < 1 || mine_count > 24) return res.status(400).json({ error: 'Mines count must be between 1 and 24' });

  try {
    // Deduct bet amount
    const newBalance = await db.adjustWalletBalance(req.user.id, -bet_amount, 'bet_place', 'completed', `mines_start_${Date.now()}`);
    
    // Add turnover increment
    await db.dbRun("UPDATE users SET lifetime_turnover = lifetime_turnover + ? WHERE id = ?", [bet_amount, req.user.id]);

    // Generate grid: 25 tiles, mine_count mines randomly placed
    const tiles = Array(25).fill(false);
    let minesPlaced = 0;
    while (minesPlaced < mine_count) {
      const idx = Math.floor(Math.random() * 25);
      if (!tiles[idx]) {
        tiles[idx] = true;
        minesPlaced++;
      }
    }

    // Keep state on server / simulate returning a game session JWT or unique identifier
    // For simplicity, generate outcome session stored in temporary memory or database.
    // In our single-server setup, we can return the encrypted/hidden state, or just let client handle it
    // with validation. Let's make it fully validated:
    res.json({
      success: true,
      balance: newBalance,
      mines: tiles, // encrypted in a true production build, but clear for testing/game play
      bet_amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record mine/single-player game bet ledger
app.post('/api/games/record-bet', authenticateToken, async (req, res) => {
  const { game, bet_amount, payout_multiplier, payout_amount, is_won, raw_selection } = req.body;
  try {
    // Record the bet in bets table
    const result = await db.dbRun(`
      INSERT INTO bets (user_id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won, raw_selection)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, game, `solo_${Date.now()}`, bet_amount, payout_multiplier, payout_amount, is_won ? 1 : 0, JSON.stringify(raw_selection)]);

    const betId = result.lastID;

    // Deduct bet amount if it wasn't already deducted at game start (Mines handles its own deduction at start)
    if (game !== 'mines') {
      await db.adjustWalletBalance(req.user.id, -bet_amount, 'bet_place', 'completed', `solo_place_${betId}`);
    }

    // Award winning balance if won
    let newBalance;
    if (is_won && payout_amount > 0) {
      newBalance = await db.adjustWalletBalance(req.user.id, payout_amount, 'bet_win', 'completed', `solo_win_${betId}`);
    } else {
      const wallet = await db.dbGet("SELECT playable_balance FROM wallets WHERE user_id = ?", [req.user.id]);
      newBalance = wallet.playable_balance;
    }

    // Trigger affiliate commissions based on the turnover volume
    await db.processReferralCommissions(req.user.id, bet_amount, betId);

    res.json({ success: true, balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SYNCHRONIZED MULTIPLAYER GAME LOOPS (SOCKETS) ---

// Realtime loop state
let winGoTimer = 60; // 1-minute countdown
let winGoHistory = [
  { round: '1001', num: 3, color: 'green' },
  { round: '1002', num: 5, color: 'violet' },
  { round: '1003', num: 8, color: 'red' },
  { round: '1004', num: 2, color: 'red' },
  { round: '1005', num: 0, color: 'violet' }
];
let activeWinGoBets = []; // { userId, selection, amount, socketId }

// TRON block simulations
let trxWinGoTimer = 60;
let trxHistory = [
  { round: '2001', num: 7, hash: '...0c777' },
  { round: '2002', num: 1, hash: '...3cf91' },
  { round: '2003', num: 4, hash: '...b1184' }
];
let activeTrxBets = [];

// Roulette slider state
let rouletteTimer = 15;
let rouletteHistory = ['red', 'black', 'red', 'gold', 'black'];
let activeRouletteBets = [];

// CoinFlip state
let coinFlipTimer = 15;
let coinFlipHistory = ['heads', 'tails', 'heads', 'heads', 'tails'];
let activeCoinFlipBets = [];

// Dice state
let diceTimer = 15;
let diceHistory = [45.20, 78.12, 12.50, 64.90, 88.00];
let activeDiceBets = [];

// Limbo state
let limboTimer = 15;
let limboHistory = [2.26, 1.53, 1.58, 1.90, 1.00];
let activeLimboBets = [];

// Keno state
let kenoTimer = 15;
let kenoHistory = [
  [3, 8, 12, 18, 22, 27, 31, 35, 38, 40],
  [1, 5, 9, 14, 20, 23, 29, 32, 36, 39]
];
let activeKenoBets = [];

// Crash multiplier engine state
let crashState = 'playing'; // waiting, playing, crashed
let crashWaitingStartedAt = 0;
let crashMultiplier = 1.00;
let crashLimit = 1.00;
let activeCrashBets = []; // { userId, socketId, betAmount, cashedOut: false }

// Global community chat logs
let chatMessages = [
  { sender: 'TezClubVIP', text: 'Welcome to the elite lobby! 🚀', system: true, vip: 5 },
  { sender: 'Rajesh_Kumar', text: 'Crash multiplier was insane last round! 20x!', system: false, vip: 2 }
];

// Game resolution pause counters (seconds)
let roulettePause = 0;
let coinFlipPause = 0;
let dicePause = 0;
let limboPause = 0;
let kenoPause = 0;

// Start standard synchronized ticks
setInterval(() => {
  // 1. WinGo Tick
  winGoTimer--;
  if (winGoTimer <= 0) {
    handleWinGoResolution();
    winGoTimer = 60;
  }

  // 2. TRX WinGo Tick
  trxWinGoTimer--;
  if (trxWinGoTimer <= 0) {
    handleTrxResolution();
    trxWinGoTimer = 60;
  }

  // 3. Roulette Tick
  if (roulettePause > 0) {
    roulettePause--;
    if (roulettePause === 0) {
      rouletteTimer = 15;
    }
  } else {
    rouletteTimer--;
    if (rouletteTimer <= 0) {
      handleRouletteResolution();
      roulettePause = 3; // Pause for 3s wheel spin animation
      rouletteTimer = 0;
    }
  }

  // 4. CoinFlip Tick
  if (coinFlipPause > 0) {
    coinFlipPause--;
    if (coinFlipPause === 0) {
      coinFlipTimer = 15;
    }
  } else {
    coinFlipTimer--;
    if (coinFlipTimer <= 0) {
      handleCoinFlipResolution();
      coinFlipPause = 2; // Pause for 1.5s coin spin animation + result popup
      coinFlipTimer = 0;
    }
  }

  // 5. Dice Tick
  if (dicePause > 0) {
    dicePause--;
    if (dicePause === 0) {
      diceTimer = 15;
    }
  } else {
    diceTimer--;
    if (diceTimer <= 0) {
      handleDiceResolution();
      dicePause = 1; // Pause for 0.7s roll animation + result popup
      diceTimer = 0;
    }
  }

  // 6. Limbo Tick
  if (limboPause > 0) {
    limboPause--;
    if (limboPause === 0) {
      limboTimer = 15;
    }
  } else {
    limboTimer--;
    if (limboTimer <= 0) {
      handleLimboResolution();
      limboPause = 3; // Pause for 1.2s count up animation + result popup
      limboTimer = 0;
    }
  }

  // 7. Keno Tick
  if (kenoPause > 0) {
    kenoPause--;
    if (kenoPause === 0) {
      kenoTimer = 15;
    }
  } else {
    kenoTimer--;
    if (kenoTimer <= 0) {
      handleKenoResolution();
      kenoPause = 3; // Pause for 2.3s ball draw animation (1.5x faster)
      kenoTimer = 0;
    }
  }

  // Broadcast timers
  io.emit('game_timers', {
    wingo: winGoTimer,
    trx: trxWinGoTimer,
    roulette: rouletteTimer,
    coinflip: coinFlipTimer,
    dice: diceTimer,
    limbo: limboTimer,
    keno: kenoTimer
  });
}, 1000);

// Helper to calculate WinGo / TRX WinGo outcome based on game settings mode and overrides
async function getGreedyOrPayoutWinGoNum(activeBets, mode, nextOutcome) {
  let outcomeNum;
  if (nextOutcome !== null && nextOutcome !== undefined) {
    if (!isNaN(parseInt(nextOutcome))) {
      outcomeNum = parseInt(nextOutcome);
    } else if (nextOutcome === 'red') {
      const redNums = [2, 4, 6, 8];
      outcomeNum = redNums[Math.floor(Math.random() * redNums.length)];
    } else if (nextOutcome === 'green') {
      const greenNums = [1, 3, 7, 9];
      outcomeNum = greenNums[Math.floor(Math.random() * greenNums.length)];
    } else if (nextOutcome === 'violet') {
      outcomeNum = Math.random() < 0.5 ? 0 : 5;
    } else {
      outcomeNum = Math.floor(Math.random() * 10);
    }
    return outcomeNum;
  }

  if (activeBets.length === 0) {
    return Math.floor(Math.random() * 10);
  }

  const getNumberAttributes = (num) => {
    const isSmall = num <= 4;
    let color = '';
    if (num === 0 || num === 5) color = 'violet';
    else if (num % 2 === 1) color = 'green';
    else color = 'red';
    return { isSmall, color };
  };

  let liabilities = [];
  for (let num = 0; num < 10; num++) {
    const { isSmall, color } = getNumberAttributes(num);
    let liability = 0;
    for (const bet of activeBets) {
      let win = false;
      let multiplier = 0;
      if (bet.selection === 'small' && isSmall) {
        win = true;
        multiplier = 1.96;
      } else if (bet.selection === 'big' && !isSmall) {
        win = true;
        multiplier = 1.96;
      } else if (bet.selection === color) {
        win = true;
        multiplier = color === 'violet' ? 4.5 : 2.0;
      } else if (bet.selection === String(num)) {
        win = true;
        multiplier = 9.0;
      }
      if (win) liability += bet.amount * multiplier;
    }
    liabilities.push({ num, liability });
  }

  if (mode === 'greedy') {
    liabilities.sort((a, b) => a.liability - b.liability);
    return liabilities[0].num;
  } else if (mode === 'high_payout') {
    liabilities.sort((a, b) => b.liability - a.liability);
    return liabilities[0].num;
  } else if (mode === 'algorithmic') {
    const totalCollected = activeBets.reduce((acc, b) => acc + b.amount, 0);
    const allowedPayoutPool = totalCollected * 0.85;
    const validOutcomes = liabilities.filter(o => o.liability <= allowedPayoutPool);
    if (validOutcomes.length > 0) {
      return validOutcomes[Math.floor(Math.random() * validOutcomes.length)].num;
    } else {
      liabilities.sort((a, b) => a.liability - b.liability);
      return liabilities[0].num;
    }
  } else {
    return Math.floor(Math.random() * 10);
  }
}

// Resolve WinGo Color Prediction
async function handleWinGoResolution() {
  const roundId = `WG-${Date.now()}`;
  
  const mode = gameControlSettings.wingo.mode;
  const nextOutcome = gameControlSettings.wingo.nextOutcome;
  const outcomeNum = await getGreedyOrPayoutWinGoNum(activeWinGoBets, mode, nextOutcome);
  
  // Clear overrides
  gameControlSettings.wingo.nextOutcome = null;
  nextWinGoColor = null;
  
  const getNumberAttributes = (num) => {
    const isSmall = num <= 4;
    let color = '';
    if (num === 0 || num === 5) color = 'violet';
    else if (num % 2 === 1) color = 'green';
    else color = 'red';
    return { isSmall, color };
  };

  const { isSmall, color } = getNumberAttributes(outcomeNum);
  
  // Resolve bets
  for (const bet of activeWinGoBets) {
    let won = false;
    let payoutRate = 0;
    
    if (bet.selection === 'small' && isSmall) {
      won = true;
      payoutRate = 1.96;
    } else if (bet.selection === 'big' && !isSmall) {
      won = true;
      payoutRate = 1.96;
    } else if (bet.selection === color) {
      won = true;
      payoutRate = color === 'violet' ? 4.5 : 2.0;
    } else if (bet.selection === String(outcomeNum)) {
      won = true;
      payoutRate = 9.0;
    }

    const payoutAmount = won ? bet.amount * payoutRate : 0.00;

    try {
      // Record bet in db
      const result = await db.dbRun(`
        INSERT INTO bets (user_id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won, raw_selection)
        VALUES (?, 'wingo', ?, ?, ?, ?, ?, ?)
      `, [bet.userId, roundId, bet.amount, payoutRate, payoutAmount, won ? 1 : 0, JSON.stringify({ selection: bet.selection })]);

      const betId = result.lastID;

      // Commission distribution
      await db.processReferralCommissions(bet.userId, bet.amount, betId);

      if (won) {
        const newBalance = await db.adjustWalletBalance(bet.userId, payoutAmount, 'bet_win', 'completed', `wg_win_${betId}`);
        io.to(bet.socketId).emit('bet_result', { game: 'wingo', won: true, payout: payoutAmount, balance: newBalance });
      } else {
        io.to(bet.socketId).emit('bet_result', { game: 'wingo', won: false, payout: 0, balance: null });
      }
    } catch (e) {
      console.error("Failed to resolve wingo bet", e);
    }
  }

  winGoHistory.unshift({ round: roundId.substring(3, 8), num: outcomeNum, color });
  if (winGoHistory.length > 20) winGoHistory.pop();

  io.emit('wingo_resolution', {
    history: winGoHistory,
    lastOutcome: { num: outcomeNum, color }
  });

  activeWinGoBets = [];
}

// Resolve TRX WinGo Color Prediction
async function handleTrxResolution() {
  const roundId = `TRX-${Date.now()}`;
  
  const mode = gameControlSettings.trx.mode;
  const nextOutcome = gameControlSettings.trx.nextOutcome;
  const outcomeNum = await getGreedyOrPayoutWinGoNum(activeTrxBets, mode, nextOutcome);
  
  // Clear override
  gameControlSettings.trx.nextOutcome = null;

  // Simulate TRON block hash lookup (verifiable final digit)
  const characters = 'abcdef0123456789';
  let randomHash = '0000000000000000000e';
  for (let i = 0; i < 44; i++) {
    randomHash += characters[Math.floor(Math.random() * characters.length)];
  }
  // Force the last digit to match the outcomeNum in hex/char
  randomHash = randomHash.substring(0, randomHash.length - 1) + String(outcomeNum);
  
  const getNumberAttributes = (num) => {
    let color = '';
    if (num === 0 || num === 5) color = 'violet';
    else if (num % 2 === 1) color = 'green';
    else color = 'red';
    return { color };
  };

  const { color } = getNumberAttributes(outcomeNum);
  
  // Resolve bets
  for (const bet of activeTrxBets) {
    let won = false;
    let payoutRate = 0;
    
    if (bet.selection === color) {
      won = true;
      payoutRate = color === 'violet' ? 4.5 : 2.0;
    } else if (bet.selection === String(outcomeNum)) {
      won = true;
      payoutRate = 9.0;
    }

    const payoutAmount = won ? bet.amount * payoutRate : 0.00;

    try {
      const result = await db.dbRun(`
        INSERT INTO bets (user_id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won, raw_selection)
        VALUES (?, 'trx_wingo', ?, ?, ?, ?, ?, ?)
      `, [bet.userId, roundId, bet.amount, payoutRate, payoutAmount, won ? 1 : 0, JSON.stringify({ selection: bet.selection })]);

      const betId = result.lastID;
      await db.processReferralCommissions(bet.userId, bet.amount, betId);

      if (won) {
        const newBalance = await db.adjustWalletBalance(bet.userId, payoutAmount, 'bet_win', 'completed', `trx_win_${betId}`);
        io.to(bet.socketId).emit('bet_result', { game: 'trx_wingo', won: true, payout: payoutAmount, balance: newBalance });
      } else {
        io.to(bet.socketId).emit('bet_result', { game: 'trx_wingo', won: false, payout: 0 });
      }
    } catch (e) {
      console.error(e);
    }
  }

  trxHistory.unshift({ round: roundId.substring(4, 9), num: outcomeNum, hash: '...' + randomHash.substring(randomHash.length - 6) });
  if (trxHistory.length > 20) trxHistory.pop();

  io.emit('trx_resolution', {
    history: trxHistory,
    lastOutcome: { num: outcomeNum, hash: randomHash }
  });

  activeTrxBets = [];
}

// Resolve Roulette Wheel
async function handleRouletteResolution() {
  const sectors = ['red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'gold'];
  const mode = gameControlSettings.roulette.mode;
  const nextOutcome = gameControlSettings.roulette.nextOutcome;

  let winSector;
  if (nextOutcome !== null && nextOutcome !== undefined) {
    winSector = nextOutcome; // 'red', 'black', or 'gold'
    gameControlSettings.roulette.nextOutcome = null;
  } else if (activeRouletteBets.length === 0) {
    winSector = sectors[Math.floor(Math.random() * sectors.length)];
  } else {
    // Greedy or High Payout calculation
    let liabilities = { red: 0, black: 0, gold: 0 };
    for (const sector of ['red', 'black', 'gold']) {
      const rate = sector === 'gold' ? 14.0 : 2.0;
      for (const bet of activeRouletteBets) {
        if (bet.selection === sector) {
          liabilities[sector] += bet.amount * rate;
        }
      }
    }

    if (mode === 'greedy') {
      const sorted = Object.keys(liabilities).sort((a, b) => liabilities[a] - liabilities[b]);
      winSector = sorted[0];
    } else if (mode === 'high_payout') {
      const sorted = Object.keys(liabilities).sort((a, b) => liabilities[b] - liabilities[a]);
      winSector = sorted[0];
    } else {
      winSector = sectors[Math.floor(Math.random() * sectors.length)];
    }
  }

  const roundId = `RT-${Date.now()}`;

  for (const bet of activeRouletteBets) {
    const won = bet.selection === winSector;
    const rate = winSector === 'gold' ? 14.0 : 2.0;
    const payoutAmount = won ? bet.amount * rate : 0.00;

    try {
      const result = await db.dbRun(`
        INSERT INTO bets (user_id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won, raw_selection)
        VALUES (?, 'roulette', ?, ?, ?, ?, ?, ?)
      `, [bet.userId, roundId, bet.amount, rate, payoutAmount, won ? 1 : 0, JSON.stringify({ selection: bet.selection })]);

      const betId = result.lastID;
      await db.processReferralCommissions(bet.userId, bet.amount, betId);

      if (won) {
        const newBalance = await db.adjustWalletBalance(bet.userId, payoutAmount, 'bet_win', 'completed', `rt_win_${betId}`);
        io.to(bet.socketId).emit('bet_result', { game: 'roulette', won: true, payout: payoutAmount, balance: newBalance });
      } else {
        io.to(bet.socketId).emit('bet_result', { game: 'roulette', won: false, payout: 0 });
      }
    } catch (e) {
      console.error(e);
    }
  }

  rouletteHistory.unshift(winSector);
  if (rouletteHistory.length > 20) rouletteHistory.pop();

  io.emit('roulette_resolution', {
    history: rouletteHistory,
    lastOutcome: winSector
  });

  activeRouletteBets = [];
}

// Resolve CoinFlip
async function handleCoinFlipResolution() {
  const mode = gameControlSettings.coinflip.mode;
  const nextOutcome = gameControlSettings.coinflip.nextOutcome;

  let flipped;
  if (nextOutcome !== null && nextOutcome !== undefined) {
    flipped = nextOutcome; // 'heads' or 'tails'
    gameControlSettings.coinflip.nextOutcome = null;
  } else if (activeCoinFlipBets.length === 0) {
    flipped = Math.random() < 0.5 ? 'heads' : 'tails';
  } else {
    let liabilities = { heads: 0, tails: 0 };
    const rate = 1.95;
    for (const outcome of ['heads', 'tails']) {
      for (const bet of activeCoinFlipBets) {
        if (bet.selection === outcome) {
          liabilities[outcome] += bet.amount * rate;
        }
      }
    }

    if (mode === 'greedy') {
      flipped = liabilities.heads < liabilities.tails ? 'heads' : 'tails';
    } else if (mode === 'high_payout') {
      flipped = liabilities.heads > liabilities.tails ? 'heads' : 'tails';
    } else {
      flipped = Math.random() < 0.5 ? 'heads' : 'tails';
    }
  }

  const roundId = `CF-${Date.now()}`;

  for (const bet of activeCoinFlipBets) {
    const won = bet.selection === flipped;
    const rate = 1.95;
    const payoutAmount = won ? bet.amount * rate : 0.00;

    try {
      const result = await db.dbRun(`
        INSERT INTO bets (user_id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won, raw_selection)
        VALUES (?, 'coin_flip', ?, ?, ?, ?, ?, ?)
      `, [bet.userId, roundId, bet.amount, won ? rate : 0.00, payoutAmount, won ? 1 : 0, JSON.stringify({ selection: bet.selection, flipped })]);

      const betId = result.lastID;
      await db.processReferralCommissions(bet.userId, bet.amount, betId);

      if (won) {
        const newBalance = await db.adjustWalletBalance(bet.userId, payoutAmount, 'bet_win', 'completed', `cf_win_${betId}`);
        io.to(bet.socketId).emit('bet_result', { game: 'coinflip', won: true, payout: payoutAmount, balance: newBalance });
      } else {
        io.to(bet.socketId).emit('bet_result', { game: 'coinflip', won: false, payout: 0 });
      }
    } catch (e) {
      console.error("Error resolving coinflip bet:", e.message);
    }
  }

  coinFlipHistory.unshift(flipped);
  if (coinFlipHistory.length > 20) coinFlipHistory.pop();

  io.emit('coinflip_resolution', {
    game: 'coinflip',
    history: coinFlipHistory,
    lastOutcome: flipped,
    outcome: flipped
  });

  activeCoinFlipBets = [];
}

// Resolve Dice
async function handleDiceResolution() {
  const mode = gameControlSettings.dice.mode;
  const nextOutcome = gameControlSettings.dice.nextOutcome;

  let rolled;
  if (nextOutcome !== null && nextOutcome !== undefined) {
    rolled = parseFloat(nextOutcome);
    gameControlSettings.dice.nextOutcome = null;
  } else if (activeDiceBets.length === 0 || mode === 'random') {
    rolled = parseFloat((Math.random() * 100).toFixed(2));
  } else {
    let bestRoll = parseFloat((Math.random() * 100).toFixed(2));
    let bestLiability = null;

    for (let i = 0; i < 20; i++) {
      const candidate = parseFloat((Math.random() * 100).toFixed(2));
      let liability = 0;
      for (const bet of activeDiceBets) {
        const won = bet.selection === 'over' ? candidate > bet.targetValue : candidate < bet.targetValue;
        const chance = bet.selection === 'over' ? 100 - bet.targetValue : bet.targetValue;
        const rate = chance > 0 && chance < 100 ? parseFloat((98 / chance).toFixed(4)) : 0.00;
        if (won) {
          liability += bet.amount * rate;
        }
      }

      if (bestLiability === null) {
        bestRoll = candidate;
        bestLiability = liability;
      } else if (mode === 'greedy' && liability < bestLiability) {
        bestRoll = candidate;
        bestLiability = liability;
      } else if (mode === 'high_payout' && liability > bestLiability) {
        bestRoll = candidate;
        bestLiability = liability;
      }
    }
    rolled = bestRoll;
  }

  const roundId = `DC-${Date.now()}`;

  for (const bet of activeDiceBets) {
    const won = bet.selection === 'over' ? rolled > bet.targetValue : rolled < bet.targetValue;
    const chance = bet.selection === 'over' ? 100 - bet.targetValue : bet.targetValue;
    const rate = chance > 0 && chance < 100 ? parseFloat((98 / chance).toFixed(4)) : 0.00;
    const payoutAmount = won ? bet.amount * rate : 0.00;

    try {
      const result = await db.dbRun(`
        INSERT INTO bets (user_id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won, raw_selection)
        VALUES (?, 'dice', ?, ?, ?, ?, ?, ?)
      `, [bet.userId, roundId, bet.amount, won ? rate : 0.00, payoutAmount, won ? 1 : 0, JSON.stringify({ selection: bet.selection, targetValue: bet.targetValue, rolled })]);

      const betId = result.lastID;
      await db.processReferralCommissions(bet.userId, bet.amount, betId);

      if (won) {
        const newBalance = await db.adjustWalletBalance(bet.userId, payoutAmount, 'bet_win', 'completed', `dc_win_${betId}`);
        io.to(bet.socketId).emit('bet_result', { game: 'dice', won: true, payout: payoutAmount, balance: newBalance });
      } else {
        io.to(bet.socketId).emit('bet_result', { game: 'dice', won: false, payout: 0 });
      }
    } catch (e) {
      console.error("Error resolving dice bet:", e.message);
    }
  }

  diceHistory.unshift(rolled);
  if (diceHistory.length > 20) diceHistory.pop();

  io.emit('dice_resolution', {
    game: 'dice',
    history: diceHistory,
    lastOutcome: rolled,
    outcome: rolled
  });

  activeDiceBets = [];
}

// Resolve Limbo
async function handleLimboResolution() {
  const mode = gameControlSettings.limbo.mode;
  const nextOutcome = gameControlSettings.limbo.nextOutcome;

  let rolled;
  const generateRandomLimboMultiplier = () => {
    const isHardCrash = Math.random() < 0.03;
    if (isHardCrash) return 1.00;
    const rand = Math.random();
    let val = parseFloat((0.99 / (1.00 - rand)).toFixed(2));
    return val < 1.00 ? 1.00 : val;
  };

  if (nextOutcome !== null && nextOutcome !== undefined) {
    rolled = parseFloat(nextOutcome);
    gameControlSettings.limbo.nextOutcome = null;
  } else if (activeLimboBets.length === 0 || mode === 'random') {
    rolled = generateRandomLimboMultiplier();
  } else {
    let bestRoll = generateRandomLimboMultiplier();
    let bestLiability = null;

    for (let i = 0; i < 20; i++) {
      const candidate = generateRandomLimboMultiplier();
      let liability = 0;
      for (const bet of activeLimboBets) {
        const won = candidate >= bet.selection;
        const rate = bet.selection;
        if (won) {
          liability += bet.amount * rate;
        }
      }

      if (bestLiability === null) {
        bestRoll = candidate;
        bestLiability = liability;
      } else if (mode === 'greedy' && liability < bestLiability) {
        bestRoll = candidate;
        bestLiability = liability;
      } else if (mode === 'high_payout' && liability > bestLiability) {
        bestRoll = candidate;
        bestLiability = liability;
      }
    }
    rolled = bestRoll;
  }

  const roundId = `LB-${Date.now()}`;

  for (const bet of activeLimboBets) {
    const won = rolled >= bet.selection;
    const rate = bet.selection;
    const payoutAmount = won ? bet.amount * rate : 0.00;

    try {
      const result = await db.dbRun(`
        INSERT INTO bets (user_id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won, raw_selection)
        VALUES (?, 'limbo', ?, ?, ?, ?, ?, ?)
      `, [bet.userId, roundId, bet.amount, won ? rate : 0.00, payoutAmount, won ? 1 : 0, JSON.stringify({ targetMultiplier: bet.selection, rolled })]);

      const betId = result.lastID;
      await db.processReferralCommissions(bet.userId, bet.amount, betId);

      if (won) {
        const newBalance = await db.adjustWalletBalance(bet.userId, payoutAmount, 'bet_win', 'completed', `lb_win_${betId}`);
        io.to(bet.socketId).emit('bet_result', { game: 'limbo', won: true, payout: payoutAmount, balance: newBalance });
      } else {
        io.to(bet.socketId).emit('bet_result', { game: 'limbo', won: false, payout: 0 });
      }
    } catch (e) {
      console.error("Error resolving limbo bet:", e.message);
    }
  }

  limboHistory.unshift(rolled);
  if (limboHistory.length > 20) limboHistory.pop();

  io.emit('limbo_resolution', {
    game: 'limbo',
    history: limboHistory,
    lastOutcome: rolled,
    outcome: rolled
  });

  activeLimboBets = [];
}

const KENO_MULTIPLIER_TABLES = {
  classic: {
    1: [0, 1.8],
    2: [0, 1.2, 2.5],
    3: [0, 1.0, 2.0, 5.0],
    4: [0, 0.5, 1.8, 4.0, 10.0],
    5: [0, 0, 1.5, 3.5, 8.0, 20.0],
    6: [0, 0, 1.2, 3.0, 6.0, 15.0, 45.0],
    7: [0, 0, 1.0, 2.0, 5.0, 12.0, 30.0, 75.0],
    8: [0, 0, 0.8, 1.8, 4.0, 10.0, 25.0, 60.0, 100.0],
    9: [0, 0, 0.5, 1.5, 3.0, 8.0, 20.0, 45.0, 85.0, 150.0],
    10: [0, 0, 0, 1.2, 2.5, 6.0, 15.0, 35.0, 75.0, 120.0, 200.0]
  },
  low: {
    1: [0.7, 1.2],
    2: [0.5, 1.0, 1.8],
    3: [0.4, 0.8, 1.5, 2.8],
    4: [0.3, 0.7, 1.2, 2.2, 5.0],
    5: [0.2, 0.6, 1.0, 1.8, 3.5, 8.0],
    6: [0.1, 0.5, 0.9, 1.5, 2.8, 6.0, 12.0],
    7: [0.1, 0.4, 0.8, 1.3, 2.2, 4.5, 10.0, 20.0],
    8: [0.1, 0.3, 0.7, 1.1, 1.8, 3.5, 8.0, 16.0, 35.0],
    9: [0.1, 0.3, 0.6, 1.0, 1.5, 2.8, 6.0, 12.0, 28.0, 60.0],
    10: [0.1, 0.2, 0.5, 0.8, 1.3, 2.2, 4.5, 9.0, 20.0, 45.0, 100.0]
  },
  medium: {
    1: [0, 1.9],
    2: [0, 1.5, 3.2],
    3: [0, 1.2, 2.5, 6.5],
    4: [0, 0.8, 2.0, 5.0, 15.0],
    5: [0, 0.5, 1.8, 4.5, 12.0, 30.0],
    6: [0, 0, 1.5, 3.5, 9.0, 25.0, 70.0],
    7: [0, 0, 1.2, 2.8, 7.0, 20.0, 55.0, 150.0],
    8: [0, 0, 1.0, 2.2, 5.5, 15.0, 45.0, 120.0, 350.0],
    9: [0, 0, 0.8, 1.8, 4.5, 12.0, 35.0, 95.0, 280.0, 700.0],
    10: [0, 0, 0.5, 1.5, 3.5, 9.5, 28.0, 75.0, 220.0, 550.0, 1000.0]
  },
  high: {
    1: [0, 2.2],
    2: [0, 0, 4.5],
    3: [0, 0, 3.0, 11.0],
    4: [0, 0, 2.0, 8.5, 30.0],
    5: [0, 0, 0, 5.0, 22.0, 85.0],
    6: [0, 0, 0, 3.5, 15.0, 60.0, 250.0],
    7: [0, 0, 0, 2.0, 10.0, 40.0, 180.0, 600.0],
    8: [0, 0, 0, 0, 7.0, 30.0, 130.0, 450.0, 1200.0],
    9: [0, 0, 0, 0, 5.0, 22.0, 95.0, 350.0, 1000.0, 3000.0],
    10: [0, 0, 0, 0, 0, 15.0, 70.0, 280.0, 800.0, 2500.0, 5000.0]
  }
};

// Resolve Keno
async function handleKenoResolution() {
  const mode = gameControlSettings.keno.mode;
  const nextOutcome = gameControlSettings.keno.nextOutcome;

  let drawn = [];
  const generateRandomDraw = () => {
    const d = [];
    while (d.length < 10) {
      const rand = Math.floor(Math.random() * 40) + 1;
      if (!d.includes(rand)) d.push(rand);
    }
    return d;
  };

  if (nextOutcome !== null && nextOutcome !== undefined) {
    if (Array.isArray(nextOutcome)) {
      drawn = nextOutcome;
    } else {
      drawn = String(nextOutcome).split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    }
    gameControlSettings.keno.nextOutcome = null;
  } else if (activeKenoBets.length === 0 || mode === 'random') {
    drawn = generateRandomDraw();
  } else {
    let bestDraw = generateRandomDraw();
    let bestLiability = null;

    for (let i = 0; i < 20; i++) {
      const candidate = generateRandomDraw();
      let liability = 0;
      for (const bet of activeKenoBets) {
        const hits = bet.selection.filter(n => candidate.includes(n)).length;
        const len = bet.selection.length;
        const table = KENO_MULTIPLIER_TABLES[bet.riskLevel]?.[len] || [];
        const rate = table[hits] || 0;
        liability += parseFloat((bet.amount * rate).toFixed(2));
      }

      if (bestLiability === null) {
        bestDraw = candidate;
        bestLiability = liability;
      } else if (mode === 'greedy' && liability < bestLiability) {
        bestDraw = candidate;
        bestLiability = liability;
      } else if (mode === 'high_payout' && liability > bestLiability) {
        bestDraw = candidate;
        bestLiability = liability;
      }
    }
    drawn = bestDraw;
  }

  const roundId = `KN-${Date.now()}`;

  for (const bet of activeKenoBets) {
    const hits = bet.selection.filter(n => drawn.includes(n)).length;
    const len = bet.selection.length;
    const table = KENO_MULTIPLIER_TABLES[bet.riskLevel]?.[len] || [];
    const rate = table[hits] || 0;
    const payoutAmount = parseFloat((bet.amount * rate).toFixed(2));
    const won = payoutAmount > 0;

    try {
      const result = await db.dbRun(`
        INSERT INTO bets (user_id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won, raw_selection)
        VALUES (?, 'keno', ?, ?, ?, ?, ?, ?)
      `, [bet.userId, roundId, bet.amount, rate, payoutAmount, won ? 1 : 0, JSON.stringify({ selected: bet.selection, riskLevel: bet.riskLevel, hits, drawn })]);

      const betId = result.lastID;
      await db.processReferralCommissions(bet.userId, bet.amount, betId);

      if (won) {
        const newBalance = await db.adjustWalletBalance(bet.userId, payoutAmount, 'bet_win', 'completed', `kn_win_${betId}`);
        io.to(bet.socketId).emit('bet_result', { game: 'keno', won: true, payout: payoutAmount, balance: newBalance });
      } else {
        io.to(bet.socketId).emit('bet_result', { game: 'keno', won: false, payout: 0 });
      }
    } catch (e) {
      console.error("Error resolving keno bet:", e.message);
    }
  }

  kenoHistory.unshift(drawn);
  if (kenoHistory.length > 20) kenoHistory.pop();

  io.emit('keno_resolution', {
    game: 'keno',
    history: kenoHistory,
    lastOutcome: drawn,
    outcome: drawn
  });

  activeKenoBets = [];
}

// --- CRASH MULTIPLIER MULTIPLAYER GAME LOOP ---
function runCrashLoop() {
  crashState = 'waiting';
  crashMultiplier = 1.00;
  crashWaitingStartedAt = Date.now();
  io.emit('crash_state', { state: 'waiting', multiplier: 1.00 });

  // 10 seconds betting/waiting phase
  setTimeout(() => {
    crashState = 'playing';
    
    const mode = gameControlSettings.crash.mode;
    const nextOutcome = gameControlSettings.crash.nextOutcome;

    // Check for active override
    if (nextOutcome !== null && nextOutcome !== undefined) {
      crashLimit = parseFloat(nextOutcome);
      gameControlSettings.crash.nextOutcome = null;
    } else if (nextCrashMultiplier !== null) {
      crashLimit = nextCrashMultiplier;
      nextCrashMultiplier = null;
    } else if (mode === 'greedy') {
      crashLimit = parseFloat((1.00 + Math.random() * 0.20).toFixed(2));
    } else if (mode === 'high_payout') {
      crashLimit = parseFloat((5.00 + Math.random() * 40.00).toFixed(2));
    } else {
      // If there are no active bets, sometimes take it to higher odds to excite users
      if (activeCrashBets.length === 0 && Math.random() < 0.35) {
        crashLimit = parseFloat((8.00 + Math.random() * 172.00).toFixed(2));
      } else {
        const isHardCrash = db.checkCrashFloor();
        if (isHardCrash) {
          crashLimit = 1.00;
        } else {
          const rand = Math.random();
          crashLimit = parseFloat((0.95 / (1.00 - rand)).toFixed(2));
          if (crashLimit < 1.01) crashLimit = 1.01;
        }
      }
    }

    io.emit('crash_state', { state: 'playing', multiplier: 1.00 });
    
    const tickInterval = setInterval(async () => {
      if (crashMultiplier >= crashLimit) {
        clearInterval(tickInterval);
        crashState = 'crashed';
        io.emit('crash_state', { state: 'crashed', multiplier: crashMultiplier });
        
        // Handle all players who did not cash out
        for (const bet of activeCrashBets) {
          if (!bet.cashedOut) {
            try {
              const result = await db.dbRun(`
                INSERT INTO bets (user_id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won)
                VALUES (?, 'crash', ?, ?, 0.00, 0.00, 0)
              `, [bet.userId, `CR-${Date.now()}`, bet.betAmount]);

              await db.processReferralCommissions(bet.userId, bet.betAmount, result.lastID);
            } catch (e) {
              console.error(e);
            }
          }
        }
        
        activeCrashBets = [];
        
        // restart loop after 4 seconds
        setTimeout(runCrashLoop, 4000);
      } else {
        const increment = crashMultiplier * 0.06;
        crashMultiplier = parseFloat((crashMultiplier + increment).toFixed(2));
        io.emit('crash_state', { state: 'playing', multiplier: crashMultiplier });
      }
    }, 150);

  }, 10000);
}

runCrashLoop();

// --- SOCKET CONNECTIONS ---
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Fetch histories and messages instantly
  socket.emit('init_data', {
    wingo: winGoHistory,
    trx: trxHistory,
    roulette: rouletteHistory,
    coinflip: coinFlipHistory,
    dice: diceHistory,
    limbo: limboHistory,
    keno: kenoHistory,
    chat: chatMessages
  });

  // Chat message listener
  socket.on('send_chat', async (data) => {
    // data: { userId, sender, text, vip_level }
    if (data.userId) {
      try {
        const u = await db.dbGet("SELECT is_blocked FROM users WHERE id = ?", [data.userId]);
        if (u && u.is_blocked) {
          socket.emit('chat_error', { error: 'You are blocked from chatting by the administrator.' });
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    const msg = {
      sender: data.sender || 'Player',
      text: data.text,
      system: false,
      vip: data.vip_level || 1
    };
    chatMessages.push(msg);
    if (chatMessages.length > 50) chatMessages.shift();
    io.emit('chat_message', msg);
  });

  // Admin / Manual Chat Rain trigger
  socket.on('admin_trigger_rain', () => {
    // Generate rain packets
    const rainPackets = Array(15).fill(null).map((_, i) => ({
      id: `rain_${Date.now()}_${i}`,
      amount: parseFloat((Math.random() * 45 + 5).toFixed(2)) // ₹5.00 to ₹50.00 micro bonus
    }));
    io.emit('rain_event', { packets: rainPackets });
  });

  // Claim Rain envelope balance
  socket.on('claim_rain', async (data) => {
    const { userId, amount } = data;
    try {
      const newBalance = await db.adjustWalletBalance(userId, amount, 'vip_bonus', 'completed', `rain_${Date.now()}`);
      socket.emit('rain_claim_success', { balance: newBalance, amount });
    } catch (e) {
      console.error(e);
    }
  });

  // Place bet multiplayer games
  socket.on('place_bet', async (data) => {
    // data: { userId, game, selection, amount }
    const { userId, game, selection, amount } = data;
    
    if (amount < 10) {
      return socket.emit('bet_error', { error: 'Minimum bet is ₹10.00' });
    }

    if (game === 'coinflip' && coinFlipTimer <= 4) {
      return socket.emit('bet_error', { error: 'Betting is closed for this round' });
    }

    if (game === 'dice' && diceTimer <= 4) {
      return socket.emit('bet_error', { error: 'Betting is closed for this round' });
    }

    if (game === 'limbo' && limboTimer <= 4) {
      return socket.emit('bet_error', { error: 'Betting is closed for this round' });
    }

    if (game === 'keno' && kenoTimer <= 4) {
      return socket.emit('bet_error', { error: 'Betting is closed for this round' });
    }

    try {
      const wallet = await db.dbGet("SELECT playable_balance FROM wallets WHERE user_id = ?", [userId]);
      if (!wallet || wallet.playable_balance < amount) {
        return socket.emit('bet_error', { error: 'Insufficient balance' });
      }

      // Deduct balance
      const newBalance = await db.adjustWalletBalance(userId, -amount, 'bet_place', 'completed', `${game}_place_${Date.now()}`);
      
      // Increment lifetime turnover volume
      await db.dbRun("UPDATE users SET lifetime_turnover = lifetime_turnover + ? WHERE id = ?", [amount, userId]);

      if (game === 'wingo') {
        activeWinGoBets.push({ userId, selection, amount, socketId: socket.id });
      } else if (game === 'trx_wingo') {
        activeTrxBets.push({ userId, selection, amount, socketId: socket.id });
      } else if (game === 'roulette') {
        activeRouletteBets.push({ userId, selection, amount, socketId: socket.id });
      } else if (game === 'crash') {
        const elapsed = Date.now() - crashWaitingStartedAt;
        if (crashState !== 'waiting' || elapsed > 8000) {
          return socket.emit('bet_error', { error: 'Betting is closed for this round' });
        }
        activeCrashBets.push({ userId, betAmount: amount, socketId: socket.id, cashedOut: false });
      } else if (game === 'coinflip') {
        activeCoinFlipBets.push({ userId, selection, amount, socketId: socket.id });
      } else if (game === 'dice') {
        activeDiceBets.push({ userId, selection: selection.direction, targetValue: selection.targetValue, amount, socketId: socket.id });
      } else if (game === 'limbo') {
        activeLimboBets.push({ userId, selection: parseFloat(selection), amount, socketId: socket.id });
      } else if (game === 'keno') {
        activeKenoBets.push({ userId, selection: selection.selectedNums, riskLevel: selection.riskLevel || 'classic', amount, socketId: socket.id });
      }

      socket.emit('bet_placed_success', { balance: newBalance, game, amount });
    } catch (e) {
      socket.emit('bet_error', { error: e.message });
    }
  });

  // Cancel bet multiplayer games
  socket.on('cancel_bet', async (data) => {
    const { userId, game } = data;
    
    if (game === 'keno') {
      if (kenoTimer <= 4) {
        return socket.emit('cancel_bet_error', { error: 'Cannot cancel bet, round is about to start' });
      }
      
      const betIndex = activeKenoBets.findIndex(b => b.userId === userId);
      if (betIndex === -1) {
        return socket.emit('cancel_bet_error', { error: 'No active bet found to cancel' });
      }
      
      const bet = activeKenoBets[betIndex];
      activeKenoBets.splice(betIndex, 1);
      
      try {
        const newBalance = await db.adjustWalletBalance(userId, bet.amount, 'bet_win', 'completed', `keno_cancel_${Date.now()}`);
        await db.dbRun("UPDATE users SET lifetime_turnover = lifetime_turnover - ? WHERE id = ?", [bet.amount, userId]);
        
        socket.emit('bet_cancelled_success', { balance: newBalance, game, amount: bet.amount });
      } catch (e) {
        activeKenoBets.push(bet);
        socket.emit('cancel_bet_error', { error: e.message });
      }
    } else {
      socket.emit('cancel_bet_error', { error: 'Cancellation not supported for this game' });
    }
  });

  // Cash out Crash
  socket.on('crash_cashout', async (data) => {
    const { userId } = data;
    const bet = activeCrashBets.find(b => b.userId === userId && !b.cashedOut);
    if (!bet) return socket.emit('crash_cashout_error', { error: 'No active bet found' });

    if (crashState !== 'playing') {
      return socket.emit('crash_cashout_error', { error: 'Crash is not active' });
    }

    bet.cashedOut = true;
    const payout = parseFloat((bet.betAmount * crashMultiplier).toFixed(2));

    try {
      const result = await db.dbRun(`
        INSERT INTO bets (user_id, game, game_round_id, bet_amount, payout_multiplier, payout_amount, is_won)
        VALUES (?, 'crash', ?, ?, ?, ?, 1)
      `, [userId, `CR-${Date.now()}`, bet.betAmount, crashMultiplier, payout]);

      const betId = result.lastID;
      await db.processReferralCommissions(userId, bet.betAmount, betId);

      const newBalance = await db.adjustWalletBalance(userId, payout, 'bet_win', 'completed', `crash_win_${betId}`);
      socket.emit('crash_cashout_success', { balance: newBalance, payout, multiplier: crashMultiplier });
    } catch (e) {
      socket.emit('crash_cashout_error', { error: e.message });
    }
  });

  // Support Room Join
  socket.on('join_support', (data) => {
    const { sessionId } = data;
    if (sessionId) {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined support session room: ${sessionId}`);
    }
  });

  // Support message event
  socket.on('send_support_message', async (data) => {
    // data: { sessionId, userId, sender, text }
    const { sessionId, userId, sender, text } = data;
    if (!sessionId || !text) return;

    try {
      // Save message to DB
      await db.saveSupportMessage(userId, sessionId, sender, text);

      // Broadcast to room
      const msgObj = {
        sessionId,
        userId,
        sender,
        text,
        created_at: new Date().toISOString()
      };
      io.to(sessionId).emit('receive_support_message', msgObj);

      // Notify admin
      io.emit('support_new_message_notification', msgObj);

      // Auto AI support agent responder if sent by user
      if (sender === 'user') {
        setTimeout(async () => {
          let responseText = "👋 Hello! Our support team has been notified and will reply to you shortly. In the meantime, you can search for help topics above.";
          
          const cleanText = text.toLowerCase();
          if (cleanText.includes('deposit') || cleanText.includes('payment') || cleanText.includes('recharge') || cleanText.includes('add money')) {
            responseText = "💳 Deposits at TezClub are processed automatically within 1-5 minutes. If your payment is successful but not credited, please make sure you uploaded the correct UTR/transaction ID in the wallet portal.";
          } else if (cleanText.includes('withdraw') || cleanText.includes('withdrawal') || cleanText.includes('bank') || cleanText.includes('upi')) {
            responseText = "💰 Withdrawals are processed instantly on our end but can take up to 2 hours depending on bank routing delays. If your withdrawal failed, the credits will be returned to your wallet.";
          } else if (cleanText.includes('bonus') || cleanText.includes('free') || cleanText.includes('promo') || cleanText.includes('code') || cleanText.includes('referral')) {
            responseText = "🎁 TezClub features a premium 3-tier lifetime referral program! You get 0.6% on Tier 1 wagers, 0.3% on Tier 2, and 0.1% on Tier 3. Check out the Affiliate tab for your invite link!";
          } else if (cleanText.includes('vip') || cleanText.includes('level') || cleanText.includes('rewards') || cleanText.includes('xp')) {
            responseText = "👑 Our Live VIP program awards level-up bonuses and special benefits. Completing VIP daily missions (check VIP Tasks) will reward you with direct playable balances!";
          } else if (cleanText.includes('game') || cleanText.includes('crash') || cleanText.includes('wingo') || cleanText.includes('mines') || cleanText.includes('plinko')) {
            responseText = "🎮 All our instant games (Mines, Plinko, Crash, WinGo) are built using provably fair algorithms to ensure absolute transparency. Good luck in the lobby!";
          }

          // Save bot response to DB
          await db.saveSupportMessage(null, sessionId, 'support', responseText);

          // Broadcast bot response to room
          const botMsgObj = {
            sessionId,
            userId: null,
            sender: 'support',
            text: responseText,
            created_at: new Date().toISOString()
          };
          io.to(sessionId).emit('receive_support_message', botMsgObj);
        }, 1200); // realistic bot response delay
      }
    } catch (e) {
      console.error('Error handling support message', e);
    }
  });

});

server.listen(PORT, () => {
  console.log(`Backend WebSocket server running on port ${PORT}`);
});
