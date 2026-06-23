
    // Fallback UI controller for progressive loading
    // Since the file is 18MB, users might click buttons before the bottom script executes.
    window.ui = new Proxy({}, {
      get: function() {
        return function() {
          const m = document.createElement('div');
          m.style.position = 'fixed'; m.style.bottom = '20px'; m.style.left = '50%'; m.style.transform = 'translateX(-50%)';
          m.style.background = '#333'; m.style.color = '#fff'; m.style.padding = '12px 24px'; m.style.borderRadius = '30px';
          m.style.zIndex = '999999'; m.style.fontFamily = 'sans-serif'; m.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          m.innerText = 'Academy Engine is downloading... Please wait a moment.';
          document.body.appendChild(m);
          setTimeout(() => { if(m.parentNode) m.parentNode.removeChild(m); }, 3000);
        };
      }
    });
  