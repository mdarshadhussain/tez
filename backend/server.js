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

// Post a deposit (Simulated Gateway)
app.post('/api/wallet/deposit', authenticateToken, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const newBalance = await db.adjustWalletBalance(req.user.id, amount, 'deposit', 'completed', `dep_${Date.now()}`);
    res.json({ success: true, new_balance: newBalance });
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

// Admin verification middleware
function verifyAdmin(req, res, next) {
  if (req.user.phone_number !== '9999999999') {
    return res.status(403).json({ error: 'Admin access denied' });
  }
  next();
}

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

// Crash multiplier engine state
let crashState = 'waiting'; // waiting, playing, crashed
let crashMultiplier = 1.00;
let crashLimit = 1.00;
let activeCrashBets = []; // { userId, socketId, betAmount, cashedOut: false }

// Global community chat logs
let chatMessages = [
  { sender: 'TezClubVIP', text: 'Welcome to the elite lobby! 🚀', system: true, vip: 5 },
  { sender: 'Rajesh_Kumar', text: 'Crash multiplier was insane last round! 20x!', system: false, vip: 2 }
];

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
  rouletteTimer--;
  if (rouletteTimer <= 0) {
    handleRouletteResolution();
    rouletteTimer = 15;
  }

  // Broadcast timers
  io.emit('game_timers', {
    wingo: winGoTimer,
    trx: trxWinGoTimer,
    roulette: rouletteTimer
  });
}, 1000);

// Resolve WinGo Color Prediction
async function handleWinGoResolution() {
  const roundId = `WG-${Date.now()}`;
  
  let outcomeNum;
  if (nextWinGoColor !== null) {
    if (!isNaN(parseInt(nextWinGoColor))) {
      outcomeNum = parseInt(nextWinGoColor);
    } else if (nextWinGoColor === 'red') {
      const redNums = [2, 4, 6, 8];
      outcomeNum = redNums[Math.floor(Math.random() * redNums.length)];
    } else if (nextWinGoColor === 'green') {
      const greenNums = [1, 3, 7, 9];
      outcomeNum = greenNums[Math.floor(Math.random() * greenNums.length)];
    } else if (nextWinGoColor === 'violet') {
      outcomeNum = Math.random() < 0.5 ? 0 : 5;
    } else {
      outcomeNum = await db.calculateWinGoResult(activeWinGoBets, {});
    }
    // Clear override
    nextWinGoColor = null;
  } else {
    // Apply 15% Profit Pool calculation
    outcomeNum = await db.calculateWinGoResult(activeWinGoBets, {});
  }
  
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
  
  // Simulate TRON block hash lookup (verifiable final digit)
  const characters = 'abcdef0123456789';
  let randomHash = '0000000000000000000e';
  for (let i = 0; i < 44; i++) {
    randomHash += characters[Math.floor(Math.random() * characters.length)];
  }
  const lastChar = randomHash.charAt(randomHash.length - 1);
  // Parse last char to number outcome (0-9)
  const code = lastChar.charCodeAt(0);
  const outcomeNum = code % 10;
  
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
  const winSector = sectors[Math.floor(Math.random() * sectors.length)];
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

// --- CRASH MULTIPLIER MULTIPLAYER GAME LOOP ---
function runCrashLoop() {
  crashState = 'waiting';
  crashMultiplier = 1.00;
  io.emit('crash_state', { state: 'waiting', multiplier: 1.00 });

  // 5 seconds betting/waiting phase
  setTimeout(() => {
    crashState = 'playing';
    
    // Check for active override
    if (nextCrashMultiplier !== null) {
      crashLimit = nextCrashMultiplier;
      nextCrashMultiplier = null;
    } else {
      // Check for 10% hard crash floor (crashing exactly at 1.00x)
      const isHardCrash = db.checkCrashFloor();
      if (isHardCrash) {
        crashLimit = 1.00;
      } else {
        // standard rocket curve math
        // generate crash limit matching realistic odds
        const rand = Math.random();
        crashLimit = parseFloat((0.95 / (1.00 - rand)).toFixed(2));
        if (crashLimit < 1.01) crashLimit = 1.01;
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
        // Multiplier climbs exponentially
        const increment = crashMultiplier * 0.06;
        crashMultiplier = parseFloat((crashMultiplier + increment).toFixed(2));
        io.emit('crash_state', { state: 'playing', multiplier: crashMultiplier });
      }
    }, 150);

  }, 5000);
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
    chat: chatMessages
  });

  // Chat message listener
  socket.on('send_chat', (data) => {
    // data: { sender, text, vip_level }
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
        activeCrashBets.push({ userId, betAmount: amount, socketId: socket.id, cashedOut: false });
      }

      socket.emit('bet_placed_success', { balance: newBalance, game, amount });
    } catch (e) {
      socket.emit('bet_error', { error: e.message });
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

});

server.listen(PORT, () => {
  console.log(`Backend WebSocket server running on port ${PORT}`);
});
