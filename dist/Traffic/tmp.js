
      // --- THEME LOGIC ---
      const currentTheme = localStorage.getItem('theme') || 'dark'
      if (currentTheme === 'light') {
        document.body.classList.add('lm')
      }

      // --- WIZARD LOGIC ---
      let currentStep = 1
      const totalSteps = 3
      let setupProgressRing = null

      function updateWizardStep(step) {
        currentStep = Math.max(1, Math.min(step, totalSteps))

        // Update stepper circles
        document.querySelectorAll('.step-item').forEach((item, i) => {
          const stepNum = i + 1
          item.classList.remove('active', 'completed')
          if (stepNum < currentStep) item.classList.add('completed')
          else if (stepNum === currentStep) item.classList.add('active')
        })

        // Update progress bar
        const progress = ((currentStep - 1) / (totalSteps - 1)) * 100
        document.querySelector('.wizard-stepper .step-progress').style.width = `${progress}%`

        // Update progress ring
        if (setupProgressRing && window.TrafficCharts) {
          const pct = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100)
          setupProgressRing.update(pct)
        }

        // Show/hide steps
        document.querySelectorAll('.wizard-step').forEach(el => {
          el.style.display = parseInt(el.dataset.step) === currentStep ? 'block' : 'none'
        })

        // Also handle auth area as step 1
        const authArea = document.getElementById('authArea')
        if (authArea) {
          authArea.style.display = currentStep === 1 ? 'block' : 'none'
        }
      }

      function goToStep(step) {
        // Validate current step before moving forward
        if (step > currentStep) {
          if (currentStep === 1) {
            // For step 1, we allow skip (local setup)
          } else if (currentStep === 2) {
            const name = document.getElementById('prof-name').value.trim()
            const age = parseInt(document.getElementById('prof-age').value) || 0
            if (name.length < 2) {
              alert('Please enter a valid name (at least 2 characters).')
              return
            }
            if (age < 8 || age > 99) {
              alert('Please enter a valid age (8-99).')
              return
            }
          }
        }
        updateWizardStep(step)
      }

      // Initialize progress ring
      function initProgressRing() {
        const canvas = document.getElementById('setup-progress-canvas')
        if (canvas && window.TrafficCharts) {
          setupProgressRing = window.TrafficCharts.createProgressRing(canvas, 0, { cutout: '70%' })
          // Override update method
          setupProgressRing.update = function(value) {
            this.data.datasets[0].data = [value, 100 - value]
            this.update('none')
          }
        }
      }

      // --- 3D BACKGROUND LOGIC ---
      let scene, camera, renderer, particles
      const init3D = () => {
        const canvas = document.getElementById('bg-canvas')
        scene = new THREE.Scene()
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

        const isLowEnd = /iPhone|iPad|Android/i.test(navigator.userAgent) || window.innerWidth < 768

        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isLowEnd })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(isLowEnd ? 1 : Math.min(window.devicePixelRatio, 2))

        const isLight = document.body.classList.contains('lm')

        const count = isLowEnd ? 800 : 3000
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(count * 3)
        const colors = new Float32Array(count * 3)

        const color1 = new THREE.Color(isLight ? 0x0e72a0 : 0xf2b84b)
        const color2 = new THREE.Color(isLight ? 0x34d399 : 0x00f0cc)

        for (let i = 0; i < count; i++) {
          const radius = 2 + Math.random() * 15
          const theta = Math.random() * 2 * Math.PI
          const y = (Math.random() - 0.5) * 4 * (1 - radius / 18)

          positions[i * 3] = radius * Math.cos(theta)
          positions[i * 3 + 1] = y
          positions[i * 3 + 2] = radius * Math.sin(theta)

          const mix = Math.random()
          const mixedColor = color1.clone().lerp(color2, mix)
          colors[i * 3] = mixedColor.r
          colors[i * 3 + 1] = mixedColor.g
          colors[i * 3 + 2] = mixedColor.b
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const texCanvas = document.createElement('canvas')
        texCanvas.width = 32
        texCanvas.height = 32
        const context = texCanvas.getContext('2d')
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
        gradient.addColorStop(0, 'rgba(255,255,255,1)')
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)')
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        context.fillStyle = gradient
        context.fillRect(0, 0, 32, 32)
        const texture = new THREE.CanvasTexture(texCanvas)

        const material = new THREE.PointsMaterial({
          size: 0.15,
          vertexColors: true,
          map: texture,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })

        particles = new THREE.Points(geometry, material)
        particles.rotation.x = 0.3
        scene.add(particles)

        const grid = new THREE.GridHelper(40, 40, isLight ? 0x0e72a0 : 0xf2b84b, isLight ? 0x0e72a0 : 0xf2b84b)
        grid.position.y = -3
        grid.material.opacity = 0.08
        grid.material.transparent = true
        grid.material.blending = THREE.AdditiveBlending
        scene.add(grid)

        camera.position.z = 8
        camera.position.y = 1

        let mouseX = 0
        let mouseY = 0
        document.addEventListener('mousemove', (event) => {
          mouseX = (event.clientX / window.innerWidth) * 2 - 1
          mouseY = -(event.clientY / window.innerHeight) * 2 - 1
        })

        let time = 0
        const animate = () => {
          requestAnimationFrame(animate)
          time += 0.005

          particles.rotation.y = time * 0.5

          if (!isLowEnd) {
            const positions = particles.geometry.attributes.position.array
            for (let i = 0; i < count; i++) {
              const i3 = i * 3
              positions[i3 + 1] += Math.sin(time * 2 + positions[i3]) * 0.002
            }
            particles.geometry.attributes.position.needsUpdate = true
          }

          grid.position.z = (time * 5) % 1

          camera.position.x += (mouseX * 2 - camera.position.x) * 0.05
          camera.position.y += (-mouseY * 1 - camera.position.y + 1) * 0.05
          camera.lookAt(scene.position)

          renderer.render(scene, camera)
        }

        animate()

        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
        })
      }

      window.addEventListener('load', () => {
        if (typeof THREE !== 'undefined') {
          init3D()
        }
        initProgressRing()
      })

      // --- AUTH LOGIC ---
      let authMode = 'login'
      let selectedRole = 'student'

      function selectRole(role) {
        selectedRole = role
        document.getElementById('signup-role').value = role
        document.querySelectorAll('.role-btn').forEach(btn => {
          btn.classList.remove('selected')
          btn.style.borderColor = 'var(--line)'
        })
        event.currentTarget.classList.add('selected')
        event.currentTarget.style.borderColor = 'var(--signal)'
      }

      function switchTab(mode) {
        authMode = mode
        const btnLogin = document.getElementById('tab-login')
        const btnSignup = document.getElementById('tab-signup')
        const loginPanel = document.getElementById('login-panel')
        const signupPanel = document.getElementById('signup-panel')
        const submitBtn = document.getElementById('auth-submit-btn')

        if (mode === 'login') {
          btnLogin.classList.add('active')
          btnSignup.classList.remove('active')
          loginPanel.style.display = 'block'
          signupPanel.style.display = 'none'
          submitBtn.innerHTML = 'Sign In with Email'
        } else {
          btnSignup.classList.add('active')
          btnLogin.classList.remove('active')
          loginPanel.style.display = 'none'
          signupPanel.style.display = 'block'
          submitBtn.innerHTML = 'Create Account'
        }
      }

      function selectRole(role) {
        document.getElementById('signup-role').value = role
        document.querySelectorAll('.role-btn').forEach(btn => {
          btn.classList.remove('selected')
        })
        event.currentTarget.classList.add('selected')
      }

      async function handleEmailAuth() {
        if (!window.supabaseClient) return alert('Cloud connection not ready. Please use Local Setup.')

        if (authMode === 'signup') {
          const email = document.getElementById('signup-email').value.trim()
          const pass = document.getElementById('signup-pass').value
          const passConfirm = document.getElementById('signup-pass-confirm').value
          const role = document.getElementById('signup-role').value
          const errDiv = document.getElementById('col-auth-err-signup')

          if (!email || !pass) {
            errDiv.textContent = 'Please fill out all fields.'
            return
          }
          if (pass !== passConfirm) {
            errDiv.textContent = 'Passwords do not match.'
            return
          }
          if (!role) {
            errDiv.textContent = 'Please select a role.'
            return
          }

          errDiv.textContent = 'Creating account...'
          errDiv.style.color = 'var(--dim)'

          try {
            const res = await window.supabaseClient.auth.signUp({
              email,
              password: pass,
              options: {
                data: {
                  full_name: email.split('@')[0],
                  role: role
                }
              }
            })

            if (res.error) throw res.error

            if (res.data.user && !res.data.session) {
              errDiv.textContent = 'Please check your email to confirm registration!'
              errDiv.style.color = 'var(--em)'
            } else {
              errDiv.textContent = 'Success!'
              errDiv.style.color = 'var(--em)'
              showLocalSetup()
            }
          } catch (err) {
            errDiv.textContent = err.message || 'Authentication failed.'
            errDiv.style.color = '#ef4444'
          }
        } else {
          const email = document.getElementById('auth-email').value.trim()
          const pass = document.getElementById('auth-pass').value
          const errDiv = document.getElementById('col-auth-err')

          if (!email || !pass) {
            errDiv.textContent = 'Please fill out all fields.'
            return
          }

          errDiv.textContent = 'Authenticating...'
          errDiv.style.color = 'var(--dim)'

          try {
            let res = await window.supabaseClient.auth.signInWithPassword({ email, password: pass })

            if (res.error) throw res.error

            errDiv.textContent = 'Success!'
            errDiv.style.color = 'var(--em)'
            showLocalSetup()
          } catch (err) {
            errDiv.textContent = err.message || 'Authentication failed.'
            errDiv.style.color = '#ef4444'
          }
        }
      }

      async function handleGoogleAuth() {
        if (!window.supabaseClient) return alert('Cloud connection not ready. Please use Local Setup.')
        try {
          await window.supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname }
          })
        } catch (err) {
          alert('Google Sign-In failed: ' + err.message)
        }
      }

      function showLocalSetup() {
        goToStep(2)
      }

      window.addEventListener('col-auth-changed', (e) => {
        const user = e.detail && e.detail.user ? e.detail.user : window.colUser
        if (user) {
          showLocalSetup()
          document.getElementById('cloud-status').style.display = 'block'
          if (user.user_metadata && user.user_metadata.full_name) {
            document.getElementById('prof-name').value = user.user_metadata.full_name
          }
        }
      })

      setTimeout(() => {
        if (window.colUser) {
          showLocalSetup()
          document.getElementById('cloud-status').style.display = 'block'
          if (window.colUser.user_metadata && window.colUser.user_metadata.full_name) {
            if (!document.getElementById('prof-name').value) {
              document.getElementById('prof-name').value = window.colUser.user_metadata.full_name
            }
          }
        }
      }, 500)

      let S = {}
      try {
        const raw = localStorage.getItem('traffic_local_user')
        if (raw) S = JSON.parse(raw)
      } catch (e) {}

      if (S.name) document.getElementById('prof-name').value = S.name
      if (S.vehicle) document.getElementById('prof-veh').value = S.vehicle
      if (S.age) document.getElementById('prof-age').value = S.age
      if (S.language) document.getElementById('prof-lang').value = S.language

      // Update wizard state if already completed
      if (localStorage.getItem('trafficSetupComplete') === 'true' || S.name) {
        const authDashBtn = document.getElementById('auth-dashboard-btn')
        const setupDashBtn = document.getElementById('setup-dashboard-btn')
        if (authDashBtn) authDashBtn.style.display = 'inline-flex'
        if (setupDashBtn) setupDashBtn.style.display = 'inline-flex'
        // Skip to dashboard button visible
        updateWizardStep(totalSteps)
      }

      document.getElementById('vehicleForm').addEventListener('submit', function (e) {
        e.preventDefault()

        const name = document.getElementById('prof-name').value.trim()
        const veh = document.getElementById('prof-veh').value
        const pin = document.getElementById('prof-pin').value.trim()
        const age = parseInt(document.getElementById('prof-age').value) || 18
        const language = document.getElementById('prof-lang').value

        if (name.length < 2) {
          alert('Please enter a valid name.')
          return
        }

        if (age < 8 || age > 99) {
          alert('Please enter a valid age (8-99).')
          return
        }

        const tUser = { name, vehicle: veh, pin, age, language, createdAt: new Date().toISOString() }
        localStorage.setItem('traffic_local_user', JSON.stringify(tUser))

        let L = {}
        try {
          const r = localStorage.getItem('th-save')
          if (r) L = JSON.parse(r)
        } catch (e) {}
        L.name = name
        L.vehicle = veh
        if (pin) L.localPin = pin
        localStorage.setItem('th-save', JSON.stringify(L))
        localStorage.setItem('trafficSetupComplete', 'true')

        // Complete wizard
        updateWizardStep(totalSteps)
        
        setTimeout(() => {
          window.location.href = 'Academy.html'
        }, 500)
      })

      // --- WIZARD NAVIGATION ---
      const totalSteps = 3

      function goToStep(step) {
        document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none')
        const target = step === 1 ? document.getElementById('authArea') : 
                       step === 2 ? document.getElementById('setupFormArea') :
                       document.getElementById('vehicleStep')
        if (target) target.style.display = 'block'
        updateWizardStep(step)
      }

      function updateWizardStep(step) {
        // Update step circles
        document.querySelectorAll('.step-item').forEach((item, i) => {
          const stepNum = i + 1
          item.classList.remove('active', 'completed')
          if (stepNum < step) item.classList.add('completed')
          else if (stepNum === step) item.classList.add('active')
        })

        // Update progress bar
        const progressBar = document.querySelector('.wizard-stepper .step-progress')
        if (progressBar) {
          const pct = ((step - 1) / (totalSteps - 1)) * 100
          progressBar.style.width = pct + '%'
        }
      }

      // Initialize progress ring
      const setupProgressCanvas = document.getElementById('setup-progress-ring')
      if (setupProgressCanvas && window.TrafficCharts) {
        window.TrafficCharts.createRadialProgress(setupProgressCanvas, 33, {
          strokeWidth: 6,
          subtitle: 'Setup Progress',
          fontSize: 20
        })
      }

      // Initialize on load
      updateWizardStep(1)
    