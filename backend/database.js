const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'tezclub.db');
const db = new sqlite3.Database(dbPath);

// Initialize DB schema
function initDatabase() {
  db.serialize(() => {
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON;");

    // 1. Master Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        invite_code TEXT UNIQUE NOT NULL,
        referred_by_id INTEGER,
        vip_level INTEGER DEFAULT 1,
        lifetime_turnover REAL DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referred_by_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 2. Unified Financial Wallets Table
    db.run(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        playable_balance REAL DEFAULT 0.00 CHECK (playable_balance >= 0),
        commission_balance REAL DEFAULT 0.00 CHECK (commission_balance >= 0),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Permanent 3-Tier Referral Mapping Layout
    db.run(`
      CREATE TABLE IF NOT EXISTS referral_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ancestor_id INTEGER NOT NULL,
        descendant_id INTEGER NOT NULL,
        depth INTEGER CHECK (depth BETWEEN 1 AND 3),
        UNIQUE(ancestor_id, descendant_id),
        FOREIGN KEY (ancestor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (descendant_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 4. Transaction Ledger (Double-Entry Balance Verification)
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'bet_place', 'bet_win', 'referral_commission', 'vip_bonus')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'reversed')) DEFAULT 'pending',
        amount REAL NOT NULL,
        previous_balance REAL NOT NULL,
        new_balance REAL NOT NULL,
        reference_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT
      )
    `);

    // 5. Complete Bet Transaction History Ledger
    db.run(`
      CREATE TABLE IF NOT EXISTS bets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game TEXT NOT NULL CHECK (game IN ('wingo', 'big_small', 'trx_wingo', 'crash', 'mines', 'plinko', 'limbo', 'roulette', 'dice', 'coin_flip')),
        game_round_id TEXT NOT NULL,
        bet_amount REAL NOT NULL CHECK (bet_amount >= 10.00),
        payout_multiplier REAL DEFAULT 0.00,
        payout_amount REAL DEFAULT 0.00,
        is_won INTEGER DEFAULT 0,
        raw_selection TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
      )
    `);

    // Essential Performance Optimization Indexes
    db.run("CREATE INDEX IF NOT EXISTS idx_users_invite ON users(invite_code);");
    db.run("CREATE INDEX IF NOT EXISTS idx_bets_round_lookup ON bets(user_id, game_round_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_referral_depth ON referral_mappings(ancestor_id, depth);");
    db.run("CREATE INDEX IF NOT EXISTS idx_tx_tracking ON transactions(reference_id);");

    // Add administrative test seeds if no users exist
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (row && row.count === 0) {
        console.log("No users found. Creating master admin user...");
        createSeedUsers();
      }
    });
  });
}

function createSeedUsers() {
  const adminPhone = "9999999999";
  const hash = bcrypt.hashSync("admin123", 10);
  const adminInvite = "TEZADMIN";
  
  db.run("INSERT INTO users (phone_number, password_hash, invite_code) VALUES (?, ?, ?)",
    [adminPhone, hash, adminInvite],
    function(err) {
      if (err) return console.error(err);
      const adminId = this.lastID;
      db.run("INSERT INTO wallets (user_id, playable_balance) VALUES (?, 10000.00)", [adminId]);
      console.log(`Admin user created. ID: ${adminId}, Phone: ${adminPhone}, Wallet: ₹10000.00`);
    }
  );
}

// Database helper functions wrapped in Promises
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) return reject(err);
    resolve({ lastID: this.lastID, changes: this.changes });
  });
});

// Create User with 3-tier Affiliate Mapping
async function registerUser(phoneNumber, plainPassword, referralCode) {
  const passwordHash = bcrypt.hashSync(plainPassword, 10);
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  let referredById = null;
  if (referralCode) {
    const referrer = await dbGet("SELECT id FROM users WHERE invite_code = ?", [referralCode]);
    if (referrer) {
      referredById = referrer.id;
    }
  }

  // Insert user
  const userResult = await dbRun(
    "INSERT INTO users (phone_number, password_hash, invite_code, referred_by_id) VALUES (?, ?, ?, ?)",
    [phoneNumber, passwordHash, inviteCode, referredById]
  );
  const userId = userResult.lastID;

  // Create wallet
  await dbRun("INSERT INTO wallets (user_id, playable_balance) VALUES (?, 500.00)", [userId]); // Free signup ₹500
  
  // Create double entry seed transaction
  const wallet = await dbGet("SELECT id FROM wallets WHERE user_id = ?", [userId]);
  await dbRun(
    "INSERT INTO transactions (wallet_id, type, status, amount, previous_balance, new_balance, reference_id) VALUES (?, 'vip_bonus', 'completed', 500.00, 0.00, 500.00, 'signup_bonus')",
    [wallet.id]
  );

  // Set up 3-tier referral mappings
  if (referredById) {
    // Tier 1: direct referrer
    await dbRun("INSERT INTO referral_mappings (ancestor_id, descendant_id, depth) VALUES (?, ?, 1)", [referredById, userId]);
    
    // Tier 2: direct referrer's referrer
    const tier2Referrer = await dbGet("SELECT referred_by_id FROM users WHERE id = ?", [referredById]);
    if (tier2Referrer && tier2Referrer.referred_by_id) {
      await dbRun("INSERT INTO referral_mappings (ancestor_id, descendant_id, depth) VALUES (?, ?, 2)", [tier2Referrer.referred_by_id, userId]);
      
      // Tier 3: tier 2's referrer
      const tier3Referrer = await dbGet("SELECT referred_by_id FROM users WHERE id = ?", [tier2Referrer.referred_by_id]);
      if (tier3Referrer && tier3Referrer.referred_by_id) {
        await dbRun("INSERT INTO referral_mappings (ancestor_id, descendant_id, depth) VALUES (?, ?, 3)", [tier3Referrer.referred_by_id, userId]);
      }
    }
  }

  return { id: userId, phone_number: phoneNumber, invite_code: inviteCode };
}

// Unified double-entry Ledger adjustment
async function adjustWalletBalance(userId, amount, type, status, refId) {
  // Use a transaction simulator (serialize/run locks or read/write)
  const wallet = await dbGet("SELECT id, playable_balance, commission_balance FROM wallets WHERE user_id = ?", [userId]);
  if (!wallet) throw new Error("Wallet not found");

  const isCommission = type === 'referral_commission';
  const previousBalance = isCommission ? wallet.commission_balance : wallet.playable_balance;
  const newBalance = previousBalance + amount;

  if (newBalance < 0) throw new Error("Insufficient balance");

  if (isCommission) {
    await dbRun("UPDATE wallets SET commission_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newBalance, wallet.id]);
  } else {
    await dbRun("UPDATE wallets SET playable_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newBalance, wallet.id]);
  }

  await dbRun(
    "INSERT INTO transactions (wallet_id, type, status, amount, previous_balance, new_balance, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [wallet.id, type, status, amount, previousBalance, newBalance, refId]
  );

  return newBalance;
}

// 3-Tier Commission Payout
async function processReferralCommissions(userId, betAmount, betId) {
  // We look up the direct ancestor mappings (ancestors of user at depths 1, 2, 3)
  const ancestors = await dbAll("SELECT ancestor_id, depth FROM referral_mappings WHERE descendant_id = ?", [userId]);
  
  for (const mapping of ancestors) {
    let rate = 0;
    if (mapping.depth === 1) rate = 0.006;      // Tier 1: 0.6%
    else if (mapping.depth === 2) rate = 0.003; // Tier 2: 0.3%
    else if (mapping.depth === 3) rate = 0.001; // Tier 3: 0.1%

    const commissionAmount = parseFloat((betAmount * rate).toFixed(2));
    if (commissionAmount > 0) {
      await adjustWalletBalance(
        mapping.ancestor_id,
        commissionAmount,
        'referral_commission',
        'completed',
        `ref_bet_${betId}_tier_${mapping.depth}`
      );
    }
  }
}

// 15% Profit Pool Override Algorithmic Calculation for WinGo and Big/Small
// This takes current bets list and calculates which outcome stays within the target 85% payout pool, 
// or falls back to the absolute lowest liability for the platform.
async function calculateWinGoResult(activeBets, outcomeRates) {
  // activeBets is list of { userId, selection, amount }
  // outcomeRates: { 'red': 2.0, 'green': 2.0, 'violet': 4.5, '0': 9.0, ... }
  // Total collected pool
  let totalCollected = activeBets.reduce((acc, b) => acc + b.amount, 0);
  if (totalCollected === 0) {
    // If no bets, return a random result (0-9)
    return Math.floor(Math.random() * 10);
  }

  const allowedPayoutPool = totalCollected * 0.85; // 15% profit pool deduction
  
  // We evaluate liabilities for outcomes 0 to 9
  // Note that a number outcome also triggers WinGo Red/Green/Violet bets and Big/Small bets.
  // Let's analyze color, big/small, and number mappings:
  // Numbers:
  // 0: Violet & Red, Small
  // 5: Violet & Green, Big
  // 1, 3, 7, 9: Green, Big (5-9) or Small (0-4)
  // 2, 4, 6, 8: Red, Big (5-9) or Small (0-4)
  
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

      if (win) {
        liability += bet.amount * multiplier;
      }
    }

    liabilities.push({ num, liability });
  }

  // Filter outcomes that yield liability <= allowedPayoutPool
  const validOutcomes = liabilities.filter(o => o.liability <= allowedPayoutPool);

  if (validOutcomes.length > 0) {
    // Pick outcome within allowed budget. To make it interesting, pick one of the valid outcomes randomly
    const chosen = validOutcomes[Math.floor(Math.random() * validOutcomes.length)];
    return chosen.num;
  } else {
    // If all outcomes breach the threshold, force the outcome with the ABSOLUTE LOWEST liability
    liabilities.sort((a, b) => a.liability - b.liability);
    return liabilities[0].num;
  }
}

// Aggregated platform metrics
async function getPlatformStats() {
  const bets = await dbGet("SELECT SUM(bet_amount) as total_bets, SUM(payout_amount) as total_payouts FROM bets");
  const users = await dbGet("SELECT COUNT(*) as total_users FROM users");
  
  const betSum = bets.total_bets || 0.00;
  const paySum = bets.total_payouts || 0.00;
  const houseProfit = betSum - paySum;
  
  return {
    total_bets: betSum,
    total_payouts: paySum,
    house_profit: houseProfit,
    total_users: users.total_users || 0
  };
}

// User transaction ledger query
async function getUserTransactions(userId) {
  const wallet = await dbGet("SELECT id FROM wallets WHERE user_id = ?", [userId]);
  if (!wallet) return [];
  return await dbAll("SELECT id, type, status, amount, previous_balance, new_balance, reference_id, created_at FROM transactions WHERE wallet_id = ? ORDER BY id DESC LIMIT 50", [wallet.id]);
}

// List all users
async function getAllUsers() {
  return await dbAll("SELECT id, phone_number, vip_level, lifetime_turnover, created_at FROM users ORDER BY id DESC");
}

// Check crash floor (returns true 10% of the time to force 1.00x instant crash)
function checkCrashFloor() {
  return Math.random() < 0.10;
}

module.exports = {
  db,
  initDatabase,
  dbGet,
  dbAll,
  dbRun,
  registerUser,
  adjustWalletBalance,
  processReferralCommissions,
  calculateWinGoResult,
  checkCrashFloor,
  getPlatformStats,
  getUserTransactions,
  getAllUsers
};
