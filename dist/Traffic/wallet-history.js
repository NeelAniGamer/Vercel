


const WalletHistory = {
  MAX_TRANSACTIONS: 100,
  STORAGE_KEY: 'mth4_wallet_history',


  getAll() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },


  _save(transactions) {
    try {

      const trimmed = transactions.slice(-this.MAX_TRANSACTIONS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {}
  },






  log(type, category, amount, meta = {}) {
    const tx = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type,
      category,
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


  earn(category, amount, meta = {}) {
    return this.log('earn', category, amount, meta);
  },


  deduct(category, amount, meta = {}) {
    return this.log('deduct', category, amount, meta);
  },


  getByType(type) {
    return this.getAll().filter(tx => tx.type === type);
  },


  getByCategory(category) {
    return this.getAll().filter(tx => tx.category === category);
  },


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


  formatAmount(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  },


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


window.WalletHistory = WalletHistory;
