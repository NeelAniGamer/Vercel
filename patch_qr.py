import sys
import re

with open("qr-editor.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Quick Styles HTML
html_target = '''      <div><div class="sh">Customize Design</div><p class="ss">Adjust borders, colors, and logos.</p></div>
      <div style="flex:1; display:flex; flex-direction:column;">

        <div class="ds open" id="dsF">'''
        
html_replace = '''      <div><div class="sh">Customize Design</div><p class="ss">Adjust borders, colors, and logos.</p></div>
      <div style="flex:1; display:flex; flex-direction:column;">

        <div style="margin-bottom: 25px; border-bottom: 1px solid var(--border); padding-bottom: 25px;">
          <p class="type-slbl" style="border:none; padding:0 0 15px; margin:0;">Quick Styles (QRFY Templates)</p>
          <div class="vg" id="qsGrid">
            <div class="vb" onclick="applyQS('modern')"><span style="font-size:1.5rem">🟢</span><span>Modern</span></div>
            <div class="vb" onclick="applyQS('classy')"><span style="font-size:1.5rem">🎩</span><span>Classy</span></div>
            <div class="vb" onclick="applyQS('liquid')"><span style="font-size:1.5rem">💧</span><span>Liquid</span></div>
            <div class="vb" onclick="applyQS('heavy')"><span style="font-size:1.5rem">⬛</span><span>Heavy</span></div>
            <div class="vb" onclick="applyQS('minimal')"><span style="font-size:1.5rem">⚪</span><span>Minimal</span></div>
          </div>
        </div>

        <div class="ds open" id="dsF">'''
content = content.replace(html_target, html_replace)

# 2. activeQrId
var_target = '''let qrInst=null, currentStep=1, selType='url', selFrame='none';'''
var_replace = '''let qrInst=null, currentStep=1, selType='url', selFrame='none';
window.activeQrId = Date.now();'''
content = content.replace(var_target, var_replace)

# 3. getQRDataString & applyQS & initQR & lu
js_target = '''function initQR(){
  if(typeof QRCodeStyling==='undefined') return;
  const w=document.getElementById('qrWrap');
  if(w) w.innerHTML='';
  const c=getContent();
  if(c&&c.trim()) opts.data=c;
  qrInst=new QRCodeStyling(Object.assign({}, opts));
  if(w) qrInst.append(w);
  updateInfo();
}

function lu(){
  const c=getContent();
  if(!c||!c.trim())return;
  opts.data=c;
  if(qrInst){qrInst.update({data:c});} else{initQR();}
  updateInfo();
}'''

js_replace = '''function getQRDataString() {
    const isStatic = ['text','vcard','wifi','whatsapp','email','sms'].indexOf(selType) !== -1;
    if (isStatic) return getContent();
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    const id = editId ? parseInt(editId) : window.activeQrId;
    return window.location.origin + '/q.html?id=' + id;
}

function initQR(){
  if(typeof QRCodeStyling==='undefined') return;
  const w=document.getElementById('qrWrap');
  if(w) w.innerHTML='';
  const c=getContent();
  if(c&&c.trim()) opts.data=getQRDataString();
  qrInst=new QRCodeStyling(Object.assign({}, opts));
  if(w) qrInst.append(w);
  updateInfo();
}

function lu(){
  const c=getContent();
  if(!c||!c.trim())return;
  opts.data=getQRDataString();
  if(qrInst){qrInst.update({data:opts.data});} else{initQR();}
  updateInfo();
}

function applyQS(style) {
    if(style === 'modern') {
        opts.dotsOptions = {type: 'rounded', color: '#10b981'};
        opts.cornersSquareOptions = {type: 'extra-rounded', color: '#059669'};
        opts.cornersDotOptions = {type: 'dot', color: '#10b981'};
        opts.backgroundOptions = {color: '#ffffff'};
    } else if(style === 'classy') {
        opts.dotsOptions = {type: 'classy', color: '#1e293b'};
        opts.cornersSquareOptions = {type: 'dot', color: '#0f172a'};
        opts.cornersDotOptions = {type: 'square', color: '#1e293b'};
        opts.backgroundOptions = {color: '#f8fafc'};
    } else if(style === 'liquid') {
        opts.dotsOptions = {type: 'extra-rounded', color: '#3b82f6'};
        opts.cornersSquareOptions = {type: 'extra-rounded', color: '#1d4ed8'};
        opts.cornersDotOptions = {type: 'dot', color: '#3b82f6'};
        opts.backgroundOptions = {color: '#eff6ff'};
    } else if(style === 'heavy') {
        opts.dotsOptions = {type: 'square', color: '#000000'};
        opts.cornersSquareOptions = {type: 'square', color: '#000000'};
        opts.cornersDotOptions = {type: 'square', color: '#000000'};
        opts.backgroundOptions = {color: '#ffffff'};
    } else if(style === 'minimal') {
        opts.dotsOptions = {type: 'dots', color: '#64748b'};
        opts.cornersSquareOptions = {type: 'dot', color: '#475569'};
        opts.cornersDotOptions = {type: 'dot', color: '#64748b'};
        opts.backgroundOptions = {color: '#ffffff'};
    }
    if(qrInst) {
        qrInst.update({
            dotsOptions: opts.dotsOptions,
            cornersSquareOptions: opts.cornersSquareOptions,
            cornersDotOptions: opts.cornersDotOptions,
            backgroundOptions: opts.backgroundOptions
        });
    }
}'''
content = content.replace(js_target, js_replace)

# 4. goStep
step_target = '''  if(n===3){
    const c=getContent(); if(c&&c.trim()) opts.data=c;
    if(!qrInst) initQR(); else {qrInst.update({data:opts.data}); updateInfo();}
  }'''
step_replace = '''  if(n===3){
    const c=getContent(); if(c&&c.trim()) opts.data=getQRDataString();
    if(!qrInst) initQR(); else {qrInst.update({data:opts.data}); updateInfo();}
  }'''
content = content.replace(step_target, step_replace)

# 5. saveQR ID
save_target = '''    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    
    const entry={id: editId ? parseInt(editId) : Date.now(), type:selType, typeName:to.name, typeIcon:to.icon, content:getContent(), thumb:img, date:new Date().toLocaleDateString(), opts:Object.assign({},opts)};
    
    if (editId) {'''
save_replace = '''    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    const idToSave = editId ? parseInt(editId) : window.activeQrId;
    
    const entry={id: idToSave, type:selType, typeName:to.name, typeIcon:to.icon, content:getContent(), thumb:img, date:new Date().toLocaleDateString(), opts:Object.assign({},opts)};
    
    if (editId) {'''
content = content.replace(save_target, save_replace)

with open("qr-editor.html", "w", encoding="utf-8") as f:
    f.write(content)
print("Patch applied.")
