/* MIS AI Assistant.
   This frontend calls your own backend endpoint; it intentionally contains no AI secret key. */
(function () {
  'use strict';
  const cfg = window.MIS_CONFIG || {};
  const endpoint = String(cfg.aiEndpoint || '').trim();
  const history = [];
  let busy = false;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function addMessage(text, who) {
    const list = document.getElementById('ai-messages');
    if (!list) return;
    const el = document.createElement('div');
    el.className = 'ai-msg ' + who;
    el.textContent = text;
    list.appendChild(el);
    list.scrollTop = list.scrollHeight;
    return el;
  }
  function getContext() {
    // Send only a small operational summary, not credentials, tokens, user list, or audit log.
    try {
      if (typeof db === 'undefined' || !db) return {app:'Machinery Information System',page:typeof view==='string'?view:'public'};
      const count = k => Array.isArray(db[k]) ? db[k].length : 0;
      return {
        app:'Machinery Information System',
        page:typeof view==='string'?view:'unknown',
        userRole:typeof S!=='undefined' && S ? S.role : 'public',
        machines:(db.machines||[]).filter(x=>!x.del).slice(0,100).map(m=>({name:m.name,type:m.type,status:m.status,department:m.dept,location:m.loc})),
        counts:{machines:count('machines'),tickets:count('tickets'),openTickets:(db.tickets||[]).filter(t=>!t.del&&t.status!=='Completed').length,
          breakdowns:count('breakdowns'),maintenance:count('maintenance'),spareParts:count('parts'),lowStock:(db.parts||[]).filter(p=>!p.del&&Number(p.qty)<Number(p.min)).map(p=>({name:p.name,partNo:p.no,quantity:p.qty,minimum:p.min})).slice(0,30),
          ups:count('ups'),diodes:count('diodes')}
      };
    } catch (_) { return {app:'Machinery Information System'}; }
  }
  function sendDisabled(v) {
    const b=document.getElementById('ai-send'),t=document.getElementById('ai-input');
    if(b)b.disabled=v;if(t)t.disabled=v;busy=v;
  }
  async function send() {
    const input=document.getElementById('ai-input');
    const message=(input.value||'').trim();
    if(!message||busy)return;
    input.value=''; addMessage(message,'user');
    if(!endpoint || endpoint.includes('YOUR-AI-BACKEND')) {
      addMessage('AI is not connected yet. Deploy the included ai-server example, then set aiEndpoint in config.js to its HTTPS URL. Do not put your AI API key in config.js.','bot');
      return;
    }
    history.push({role:'user',content:message});
    const status=document.getElementById('ai-status');
    sendDisabled(true); if(status)status.textContent='Thinking…';
    try {
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history:history.slice(-12),context:getContext()})});
      let data={};try{data=await response.json()}catch(_){}
      if(!response.ok)throw new Error(data.error||('AI service returned HTTP '+response.status));
      const reply=String(data.reply||data.message||'The AI service returned an empty response.').slice(0,12000);
      history.push({role:'assistant',content:reply}); addMessage(reply,'bot');
    } catch(e) {
      history.pop();
      addMessage('Sorry, I could not reach the AI service. '+(e.message||'Please try again.'),'bot');
    } finally {sendDisabled(false);if(status)status.textContent='AI answers can be wrong. Verify safety-critical maintenance advice.';input.focus();}
  }
  function mount() {
    if(document.getElementById('mis-ai-widget'))return;
    const wrap=document.createElement('div');wrap.id='mis-ai-widget';
    wrap.innerHTML='<button type="button" class="ai-launch" id="ai-launch" aria-expanded="false">✦ AI Assistant</button>'+
      '<section class="ai-panel" id="ai-panel" role="dialog" aria-label="AI Assistant" aria-modal="false">'+
      '<header class="ai-head"><div><strong>Machinery AI Assistant</strong><small>Ask about maintenance and MIS records</small></div><button type="button" class="ai-close" id="ai-close" aria-label="Close assistant">×</button></header>'+
      '<div class="ai-messages" id="ai-messages" aria-live="polite"></div><div class="ai-status" id="ai-status">Ask for help with maintenance, breakdowns, stock, or reports.</div>'+
      '<form class="ai-form" id="ai-form"><textarea id="ai-input" aria-label="Your question" placeholder="Ask a question…" maxlength="2000" required></textarea><button id="ai-send" type="submit">Send</button></form>'+
      '<div class="ai-hint">Avoid sharing passwords, tokens, or personal information.</div></section>';
    document.body.appendChild(wrap);
    const panel=document.getElementById('ai-panel'),launch=document.getElementById('ai-launch');
    const toggle=open=>{panel.classList.toggle('open',open);launch.setAttribute('aria-expanded',String(open));if(open)document.getElementById('ai-input').focus()};
    launch.addEventListener('click',()=>{const open=!panel.classList.contains('open');toggle(open);if(open&&!document.getElementById('ai-messages').children.length)addMessage('Hello! I can help interpret machinery records, open tickets, low stock, maintenance schedules, and general troubleshooting. What would you like to know?','bot')});
    document.getElementById('ai-close').addEventListener('click',()=>toggle(false));
    document.getElementById('ai-form').addEventListener('submit',e=>{e.preventDefault();send()});
    document.getElementById('ai-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
