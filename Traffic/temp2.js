
        global.window = global;
        global.document = { getElementById: () => ({ style: {}, classList: {add:()=>{}, remove:()=>{}}, appendChild: () => {}, innerHTML: '', innerText: '' }), body: { appendChild: () => {} }, createElement: () => ({ style: {}, classList: {add:()=>{}, remove:()=>{}}, getContext: () => ({}) }) };
        global.localStorage = { getItem: () => null, setItem: () => {} };
        global.requestAnimationFrame = () => {};
        global.cancelAnimationFrame = () => {};
        global.navigator = { userAgent: '' };
        global.THREE = { Object3D: class {}, Scene: class {}, PerspectiveCamera: class {}, WebGLRenderer: class { setSize(){} }, Clock: class {}, Vector3: class {} };
        global.AudioContext = class {};
        global.webkitAudioContext = class {};
        
    window.addEventListener('error', function (e) {
      const errDiv = document.createElement('div');
      errDiv.style.position = 'fixed';
      errDiv.style.top = '10px';
      errDiv.style.left = '10px';
      errDiv.style.zIndex = '999999';
      errDiv.style.background = 'red';
      errDiv.style.color = 'white';
      errDiv.style.padding = '10px';
      errDiv.style.fontFamily = 'monospace';
      errDiv.innerText = "JS Error: " + e.message + " at " + e.filename + ":" + e.lineno;
      document.body.appendChild(errDiv);
    });
    window.addEventListener('unhandledrejection', function (e) {
      const errDiv = document.createElement('div');
      errDiv.style.position = 'fixed';
      errDiv.style.top = '50px';
      errDiv.style.left = '10px';
      errDiv.style.zIndex = '999999';
      errDiv.style.background = 'darkred';
      errDiv.style.color = 'white';
      errDiv.style.padding = '10px';
      errDiv.style.fontFamily = 'monospace';
      errDiv.innerText = "Promise Rejection: " + e.reason;
      document.body.appendChild(errDiv);
    });
  