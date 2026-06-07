const ui = {
      cur: null, qst: null, cq: [], cbusy: false, _ccb: null,
      adminUnlock() { LVS.forEach(l => { if (!S.comp[l.id]) S.comp[l.id] = { score: 500, time: Date.now() } }); BADGES.forEach(b => { if (!S.badges.includes(b.id)) S.badges.push(b.id) }); S.total += 7500; save(); toast('🔓 Developer Unlock Triggered!', '#00c851'); this.showLevels(); },
      hardReset() { if (confirm('Reset all progress?')) { S.comp = {};