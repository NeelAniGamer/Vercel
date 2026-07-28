// ════════════════════════════════════════════════════════════════════════════════
// WALLET TRANSACTION HISTORY — Tracks all wallet deductions and earnings
// ════════════════════════════════════════════════════════════════════════════════

const WalletHistory = {
  MAX_TRANSACTIONS: 100,
  STORAGE_KEY: 'mth4_wallet_history',

  // ── Get all transactions from storage ──
  getAll() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  // ── Save transactions to storage ──
  _save(transactions) {
    try {
      // Keep only last MAX_TRANSACTIONS
      const trimmed = transactions.slice(-this.MAX_TRANSACTIONS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {}
  },

  // ── Log a new transaction ──
  // type: 'earn' | 'deduct'
  // category: 'level_reward' | 'daily_bonus' | 'mystery_reward' | 'fine' | 'starting_balance' | 'other'
  // amount: number (always positive)
  // meta: optional object with extra info (level name, violation type, etc.)
  log(type, category, amount, meta = {}) {
    const tx = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type,        // 'earn' or 'deduct'
      category,    // reason category
      amount: Math.abs(amount),
      balance: (window.S && window.S.wallet) || 50000,
      meta,
      timestamp: Date.now()
    };

    const transactions = this.getAll();
    transactions.push(tx);
    this._save(transactions);
    return tx;
  },

  // ── Convenience: log an earning ──
  earn(category, amount, meta = {}) {
    return this.log('earn', category, amount, meta);
  },

  // ── Convenience: log a deduction ──
  deduct(category, amount, meta = {}) {
    return this.log('deduct', category, amount, meta);
  },

  // ── Get transactions filtered by type ──
  getByType(type) {
    return this.getAll().filter(tx => tx.type === type);
  },

  // ── Get transactions filtered by category ──
  getByCategory(category) {
    return this.getAll().filter(tx => tx.category === category);
  },

  // ── Get summary stats ──
  getSummary() {
    const all = this.getAll();
    let totalEarned = 0, totalDeducted = 0;
    const byCategory = {};

    all.forEach(tx => {
      if (tx.type === 'earn') totalEarned += tx.amount;
      else totalDeducted += tx.amount;

      if (!byCategory[tx.category]) byCategory[tx.category] = { earned: 0, deducted: 0, count: 0 };
      if (tx.type === 'earn') byCategory[tx.category].earned += tx.amount;
      else byCategory[tx.category].deducted += tx.amount;
      byCategory[tx.category].count++;
    });

    return { totalEarned, totalDeducted, net: totalEarned - totalDeducted, byCategory, count: all.length };
  },

  // ── Format amount with Indian numbering ──
  formatAmount(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  },

  // ── Format timestamp relative ──
  formatTime(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days < 7) return days + 'd ago';
    return new Date(ts).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  },

  // ── Get icon and label for a category ──
  getCategoryInfo(category) {
    const map = {
      level_reward:    { icon: '🏆', label: 'Level Reward' },
      daily_bonus:     { icon: '🎁', label: 'Daily Bonus' },
      mystery_reward:  { icon: '🎲', label: 'Mystery Reward' },
      fine:            { icon: '⚖️', label: 'Traffic Fine' },
      starting_balance:{ icon: '💰', label: 'Starting Balance' },
      other:           { icon: '💳', label: 'Transaction' }
    };
    return map[category] || map.other;
  }
};

// Make globally accessible
window.WalletHistory = WalletHistory;
