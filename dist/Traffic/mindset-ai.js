/*
 * mindset-ai.js — Road Mindset Check for onboarding.
 * Asks patience/attitude questions, sends answers to an AI coach (OpenAI-compatible
 * chat completions endpoint) and falls back to a local heuristic coach when no
 * API is configured or the request fails. Never blocks onboarding.
 *
 * Configure (optional) via:
 *   window.MINDSET_AI_CONFIG = { endpoint: 'https://api.openai.com/v1', apiKey: 'sk-...', model: 'gpt-4o-mini' }
 * or localStorage 'mindset_ai_config' with the same JSON shape.
 */
(function () {
  'use strict'

  var QUESTIONS = [
    {
      id: 'redlight',
      icon: '🚦',
      text: 'It\'s 2 AM, the road is empty, the light is red and no cop is around. You are exhausted.',
      coachTip: 'The red light at 2 AM is where character is built — the habit you keep when nobody watches is the one that saves you at 6 PM.',
      options: [
        { label: 'Wait for green — rules don\'t sleep, so I don\'t either', score: 10 },
        { label: 'Creep through slowly if it stays empty', score: 4 },
        { label: 'Just go — empty road at night, what\'s the harm?', score: 0 }
      ]
    },
    {
      id: 'wrongside',
      icon: '🛣️',
      text: 'You\'ve been stuck in a jam for 20 minutes. The wrong-side lane ahead is completely open.',
      coachTip: 'Wrong-side driving causes some of Mumbai\'s deadliest head-on crashes. The jam always moves — the wrong side can end your journey forever.',
      options: [
        { label: 'Stay in my lane — the jam will clear before my luck does', score: 10 },
        { label: 'Take it only if everyone else starts doing it', score: 3 },
        { label: 'Take it immediately — time is money, everyone does it', score: 0 }
      ]
    },
    {
      id: 'zebra',
      icon: '🚸',
      text: 'Pedestrians — including school kids — are waiting at a zebra crossing. You are running late.',
      coachTip: 'A zebra crossing is a promise made to every person on foot. Two minutes of your delay is nothing against a life.',
      options: [
        { label: 'Stop and let them cross fully', score: 10 },
        { label: 'Slow down and squeeze past carefully', score: 4 },
        { label: 'Honk and keep moving — they know how Mumbai works', score: 0 }
      ]
    },
    {
      id: 'overtake',
      icon: '🛺',
      text: 'A slow auto is ahead of you on a single-lane road with blind curves.',
      coachTip: 'Overtaking on a blind curve is gambling with dice you can\'t see. The auto reaches its destination either way — make sure you reach yours.',
      options: [
        { label: 'Follow patiently, overtake only with clear view', score: 10 },
        { label: 'Honk and flash till he pulls over', score: 3 },
        { label: 'Overtake anyway on the curve — gap is gap', score: 0 }
      ]
    },
    {
      id: 'attitude',
      icon: '🧠',
      text: 'Be honest: "Rules are for fools — Indian roads belong to the bold."',
      coachTip: 'Every rule exists because someone didn\'t come home. The boldest thing on an Indian road is actually the driver who follows the rules.',
      options: [
        { label: 'Strongly disagree — rules are why I get home', score: 10 },
        { label: 'Partly true — survival sometimes needs flexibility', score: 4 },
        { label: 'Totally true — that\'s just how it works here', score: 0 }
      ]
    }
  ]

  var ARCHETYPES = [
    { min: 90, name: 'The Zen Navigator', emoji: '🧘', line: 'Mumbai tests you daily and you pass with a calm heart. You are the driver others should learn from.' },
    { min: 70, name: 'The Steady Commuter', emoji: '🚗', line: 'Mostly patient with a few human moments. Tighten the weak spots below and you become unstoppable.' },
    { min: 45, name: 'The Recovering Honker', emoji: '📢', line: 'You know the right thing — impatience just wins too often. Your training plan will target exactly that.' },
    { min: 20, name: 'The Horn Warrior', emoji: '💥', line: 'The road bends to speed in your mind today. The Academy exists precisely for drivers like you — welcome.' },
    { min: 0, name: 'Full Mumbai Mode', emoji: '🌪️', line: 'Rules feel optional to you right now. Good news: mindset is trainable, and your plan starts today.' }
  ]

  function getConfig() {
    if (window.MINDSET_AI_CONFIG && window.MINDSET_AI_CONFIG.endpoint) return window.MINDSET_AI_CONFIG
    try {
      var raw = localStorage.getItem('mindset_ai_config')
      if (raw) {
        var cfg = JSON.parse(raw)
        if (cfg && cfg.endpoint && cfg.apiKey) return cfg
      }
    } catch (e) {}
    return null
  }

  function renderQuiz(container) {
    if (!container) return
    container.innerHTML = ''
    QUESTIONS.forEach(function (q, qi) {
      var wrap = document.createElement('div')
      wrap.style.cssText = 'width:100%;max-width:420px;margin:0 auto 18px;text-align:left'
      var head = document.createElement('p')
      head.style.cssText = 'font-size:0.85rem;font-weight:700;color:var(--text,#e2e8f0);margin-bottom:8px;line-height:1.4'
      head.textContent = q.icon + ' Q' + (qi + 1) + '. ' + q.text
      var dots = document.createElement('div')
      dots.className = 'onb-dots'
      dots.style.cssText = 'flex-direction:column;gap:8px;margin-bottom:0'
      q.options.forEach(function (opt, oi) {
        var b = document.createElement('button')
        b.type = 'button'
        b.className = 'onb-dot' + (oi === 0 ? ' selected' : '')
        b.setAttribute('data-q', q.id)
        b.setAttribute('data-score', opt.score)
        b.style.cssText = 'width:100%;text-align:left;font-size:0.82rem;padding:12px 14px;white-space:normal;line-height:1.35'
        b.textContent = opt.label + (oi === 0 ? '   ✅ recommended' : '')
        b.onclick = function () { _onbSelectDot(b, q.id) }
        dots.appendChild(b)
      })
      wrap.appendChild(head)
      wrap.appendChild(dots)
      container.appendChild(wrap)
    })
  }

  // Scoped selection so multiple question groups don't interfere
  function _onbSelectDot(el, group) {
    var groupEl = el.parentNode
    Array.prototype.slice.call(groupEl.children).forEach(function (s) { s.classList.remove('selected') })
    el.classList.add('selected')
  }

  function collectAnswers() {
    var out = []
    QUESTIONS.forEach(function (q) {
      var sel = document.querySelector('.onb-dot[data-q="' + q.id + '"].selected')
      out.push({
        question: q.text,
        answer: sel ? sel.textContent.replace('✅ recommended', '').trim() : '',
        score: sel ? parseInt(sel.getAttribute('data-score'), 10) : q.options[0].score,
        maxScore: 10
      })
    })
    return out
  }

  function localScore(answers) {
    var total = 0
    var weakest = null
    answers.forEach(function (a) {
      total += a.score
      if (!weakest || a.score < weakest.score) weakest = a
    })
    return {
      score: Math.round((total / (answers.length * 10)) * 100),
      focus: weakest
    }
  }

  function archetypeFor(score) {
    for (var i = 0; i < ARCHETYPES.length; i++) {
      if (score >= ARCHETYPES[i].min) return ARCHETYPES[i]
    }
    return ARCHETYPES[ARCHETYPES.length - 1]
  }

  function localAnalyze(answers) {
    var s = localScore(answers)
    var arch = archetypeFor(s.score)
    var tips = []
    answers.forEach(function (a) {
      if (a.score <= 4) {
        var q = QUESTIONS.filter(function (x) { return x.text === a.question })[0]
        if (q && tips.indexOf(q.coachTip) === -1) tips.push(q.coachTip)
      }
    })
    if (!tips.length) tips.push(s.focus ? s.focus.question + ' — even here, choose the patient option. That is where champions are separated from statistics.' : 'Keep choosing the patient option. Patience compounds like interest.')
    if (tips.length > 3) tips = tips.slice(0, 3)
    return {
      patienceScore: s.score,
      archetype: arch.name,
      emoji: arch.emoji,
      oneLiner: arch.line,
      tips: tips,
      source: 'offline-coach'
    }
  }

  function buildPrompt(answers) {
    var lines = answers.map(function (a, i) {
      return 'Q' + (i + 1) + ': ' + a.question + '\nA: ' + a.answer
    }).join('\n\n')
    return 'These are onboarding mindset answers from a new driver at Mumbai Traffic Hero Academy (a road-safety training game for Indian traffic).\n\n' +
      lines + '\n\nAct as a direct but warm Mumbai road-safety behavioural coach. Respond ONLY with minified JSON, no markdown:\n' +
      '{"patienceScore":<0-100 integer>,"archetype":"<short persona name, max 4 words>","emoji":"<one emoji>","oneLiner":"<max 25 words, Hinglish flavour allowed>","tips":["<tip 1 addressing their weakest answer>", "<tip 2>", "<tip 3>"]}'
  }

  function parseAIJson(text) {
    try {
      var m = text.match(/\{[\s\S]*\}/)
      if (!m) return null
      var obj = JSON.parse(m[0])
      if (typeof obj.patienceScore !== 'number' || !obj.archetype) return null
      return {
        patienceScore: Math.max(0, Math.min(100, Math.round(obj.patienceScore))),
        archetype: String(obj.archetype || '').slice(0, 40),
        emoji: String(obj.emoji || '🧠').slice(0, 4),
        oneLiner: String(obj.oneLiner || '').slice(0, 220),
        tips: (Array.isArray(obj.tips) ? obj.tips : []).slice(0, 3).map(function (t) { return String(t).slice(0, 240) }),
        source: 'ai-coach'
      }
    } catch (e) {
      return null
    }
  }

  function aiAnalyze(answers, cfg) {
    var body = {
      model: cfg.model || 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        { role: 'system', content: 'You are a Mumbai traffic-safety mindset coach. Output strict JSON only.' },
        { role: 'user', content: buildPrompt(answers) }
      ]
    }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
    var timer = ctrl ? setTimeout(function () { ctrl.abort() }, 9000) : null
    return fetch(cfg.endpoint.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    }).then(function (data) {
      if (timer) clearTimeout(timer)
      var txt = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : ''
      var parsed = parseAIJson(txt || '')
      if (!parsed) throw new Error('bad AI payload')
      return parsed
    }).catch(function (err) {
      if (timer) clearTimeout(timer)
      console.warn('[MindsetAI] AI analysis unavailable, using offline coach:', err.message)
      return null
    })
  }

  function analyze(answers) {
    var cfg = getConfig()
    var chain = cfg ? aiAnalyze(answers, cfg) : Promise.resolve(null)
    return chain.then(function (report) {
      return report || localAnalyze(answers)
    })
  }

  function saveReport(report, answers) {
    report.completedAt = new Date().toISOString()
    try { localStorage.setItem('mindset_profile', JSON.stringify(report)) } catch (e) {}
    window.MindsetAI.lastReport = report
    // Best-effort sync for signed-in users; silently ignored if table/auth absent
    try {
      if (window.supabaseClient && window.colUser && window.colUser.id) {
        window.supabaseClient.from('mindset_profiles').upsert({
          user_id: window.colUser.id,
          patience_score: report.patienceScore,
          archetype: report.archetype,
          answers: answers || null,
          report: report
        }, { onConflict: 'user_id' }).then(function () {}, function () {})
      }
    } catch (e) {}
    return report
  }

  function renderReport(container, report) {
    if (!container) return
    var color = report.patienceScore >= 70 ? '#34d399' : report.patienceScore >= 45 ? '#f2b84b' : '#ef4444'
    var html =
      '<div style="width:100%;max-width:420px;margin:14px auto 0;text-align:left;background:rgba(255,255,255,0.05);border:1px solid rgba(242,184,75,0.35);border-radius:16px;padding:16px">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
      '<div style="font-size:2rem">' + report.emoji + '</div>' +
      '<div><div style="font-weight:800;color:' + color + ';font-size:1.05rem">' + report.archetype + '</div>' +
      '<div style="font-size:0.75rem;color:var(--muted,#8891aa)">Patience Score: <b style="color:' + color + '">' + report.patienceScore + '/100</b> · ' + (report.source === 'ai-coach' ? 'AI Coach' : 'Offline Coach') + '</div></div>' +
      '</div>' +
      '<p style="font-size:0.85rem;color:var(--text,#e2e8f0);margin:6px 0 10px">' + report.oneLiner + '</p>' +
      '<ul style="margin:0;padding-left:18px;font-size:0.78rem;color:var(--dim,#9aa4bf);line-height:1.55">' +
      report.tips.map(function (t) { return '<li style="margin-bottom:4px">' + t + '</li>' }).join('') +
      '</ul></div>'
    container.innerHTML = html
  }

  window.MindsetAI = {
    questions: QUESTIONS,
    lastReport: null,
    renderQuiz: renderQuiz,
    collectAnswers: collectAnswers,
    analyze: analyze,
    saveReport: saveReport,
    renderReport: renderReport,
    localAnalyze: localAnalyze
  }
})()
