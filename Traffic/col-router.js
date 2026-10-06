// Class Of Learners Global Router & Banner System
;(async function () {
  if (window._colRouterRunning) {return}
  window._colRouterRunning = true

  try {
    // Fetch global config from the deployed site. Do not let the service worker
    // cache routing/auth configuration.
    const res = await fetch('/config.json', { cache: 'no-store' })
    if (!res.ok) {return}
    const config = await res.json()

    const rawPage = window.location.pathname.split('/').filter(Boolean).pop() || 'home'
    const page = rawPage.replace(/\.html$/i, '').toLowerCase()
    const status = config.pages && (config.pages[rawPage] || config.pages[page])

    if (status && status !== '200') {
      renderErrorScreen(status)
      return
    }

    if (config.banner && config.banner.active && config.banner.text) {
      renderBanner(config.banner.text)
    }
  } catch (error) {
    // A failed optional config request must not prevent the page from booting.
  }

  function renderErrorScreen(code) {
    const safeCode = String(code).replace(/[^0-9A-Za-z]/g, '').slice(0, 3) || '000'
    const messages = {
      404: { title: '404 Not Found', description: 'The sector you are trying to access does not exist or has been relocated.' },
      503: { title: '503 Maintenance', description: 'This page is currently offline for maintenance. Please check back later.' },
      401: { title: '401 Unauthorized', description: 'Authentication is required to view this module.' },
      403: { title: '403 Forbidden', description: 'Access to this zone is restricted.' }
    }
    const info = messages[safeCode] || { title: 'System Halted', description: 'An unexpected error occurred.' }

    while (document.head.firstChild) {document.head.removeChild(document.head.firstChild)}
    const meta = document.createElement('meta')
    meta.setAttribute('charset', 'UTF-8')
    const viewport = document.createElement('meta')
    viewport.name = 'viewport'
    viewport.content = 'width=device-width, initial-scale=1.0'
    const title = document.createElement('title')
    title.textContent = 'System Error ' + safeCode
    const font = document.createElement('link')
    font.rel = 'stylesheet'
    font.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap'
    const style = document.createElement('style')
    style.textContent = `
      body { margin: 0; padding: 0; background: #0f172a; color: #38bdf8; font-family: 'Space Mono', monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
      h1 { font-size: 6rem; margin: 0; filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.5)); }
      p { font-size: 1.2rem; color: #94a3b8; max-width: 500px; margin-top: 10px; line-height: 1.5; }
      .glow { color: #f8fafc; font-weight: bold; }
      .btn { margin-top: 30px; display: inline-block; padding: 12px 24px; border: 2px solid #38bdf8; color: #38bdf8; text-decoration: none; font-weight: bold; border-radius: 8px; transition: background 0.2s ease, box-shadow 0.2s ease; }
      .btn:hover, .btn:focus-visible { background: rgba(56, 189, 248, 0.1); box-shadow: 0 0 15px rgba(56, 189, 248, 0.3); }
    `
    document.head.append(meta, viewport, title, font, style)

    while (document.body.firstChild) {document.body.removeChild(document.body.firstChild)}
    const main = document.createElement('main')
    main.setAttribute('role', 'alert')
    const icon = document.createElement('div')
    icon.textContent = '⚠️'
    icon.style.fontSize = '4rem'
    icon.style.marginBottom = '20px'
    icon.style.textShadow = '0 0 15px rgba(239, 68, 68, 0.5)'
    const heading = document.createElement('h1')
    heading.textContent = safeCode
    const label = document.createElement('div')
    label.className = 'glow'
    label.textContent = info.title
    label.style.fontSize = '1.5rem'
    label.style.marginBottom = '20px'
    const description = document.createElement('p')
    description.textContent = info.description
    const link = document.createElement('a')
    link.className = 'btn'
    link.href = '/home'
    link.textContent = 'Return to Home'
    main.append(icon, heading, label, description, link)
    document.body.appendChild(main)
  }

  function renderBanner(text) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => injectBanner(text), { once: true })
    } else {
      injectBanner(text)
    }
  }

  function injectBanner(text) {
    if (!document.body) {return}
    const banner = document.createElement('div')
    banner.setAttribute('role', 'status')
    banner.style.cssText = 'background: linear-gradient(90deg, #38bdf8, #818cf8); color: #fff; text-align: center; padding: 12px 20px; font-weight: bold; font-family: Inter, sans-serif; font-size: 14px; position: relative; z-index: 999999; box-shadow: 0 4px 15px rgba(0,0,0,0.2); line-height: 1.5;'
    const message = document.createElement('span')
    message.textContent = '🚀 ' + String(text).slice(0, 240)
    message.style.display = 'inline-block'
    message.style.marginRight = '42px'
    const close = document.createElement('button')
    close.type = 'button'
    close.setAttribute('aria-label', 'Dismiss Banner')
    close.textContent = '×'
    close.style.cssText = 'position:absolute; right:15px; top:50%; transform:translateY(-50%); cursor:pointer; opacity:0.85; color:#fff; background:transparent; border:0; font-size:20px; line-height:1; font-family:sans-serif;'
    close.addEventListener('click', () => banner.remove())
    banner.append(message, close)
    document.body.insertBefore(banner, document.body.firstChild)
  }
})()
