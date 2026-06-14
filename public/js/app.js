// Tipp-Formulare: Auto-Save
document.querySelectorAll('.tip-form[data-autosave]').forEach(form => {
  const gameId = form.dataset.gameId;
  const homeInput = form.querySelector(`[name="score_home_${gameId}"]`);
  const awayInput = form.querySelector(`[name="score_away_${gameId}"]`);
  const tendencyBtns = form.querySelectorAll('.tendency-btn');
  const status = document.getElementById(`status-${gameId}`);
  let saveTimer = null;

  function autoTendency() {
    const h = parseInt(homeInput?.value);
    const a = parseInt(awayInput?.value);
    if (isNaN(h) || isNaN(a)) return;
    const t = h > a ? 'H' : h < a ? 'A' : 'D';
    form.querySelectorAll(`[name="tendency_${gameId}"]`).forEach(r => {
      r.checked = r.value === t;
      r.closest('.tendency-btn').classList.toggle('active', r.value === t);
    });
  }

  async function saveTip() {
    const tendency = form.querySelector(`[name="tendency_${gameId}"]:checked`)?.value;
    if (!tendency) return;
    const scoreHome = homeInput?.value;
    const scoreAway = awayInput?.value;
    const powerplay = form.querySelector(`[name="powerplay_${gameId}"]`)?.checked ? '1' : '0';

    status.textContent = '…';
    status.className = 'tip-status';

    try {
      const res = await fetch('/tips/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          tip_tendency: tendency,
          tip_home: scoreHome !== '' ? scoreHome : null,
          tip_away: scoreAway !== '' ? scoreAway : null,
          is_powerplay: powerplay
        })
      });
      const data = await res.json();
      if (data.ok) {
        status.textContent = '✓';
        status.className = 'tip-status ok';
        setTimeout(() => { status.textContent = ''; }, 2000);
      } else {
        status.textContent = data.error || 'Fehler';
        status.className = 'tip-status err';
      }
    } catch {
      status.textContent = 'Verbindungsfehler';
      status.className = 'tip-status err';
    }
  }

  function debouncedSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveTip, 400);
  }

  tendencyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tendencyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveTip();
    });
  });

  homeInput?.addEventListener('input', () => { autoTendency(); debouncedSave(); });
  awayInput?.addEventListener('input', () => { autoTendency(); debouncedSave(); });

  form.querySelector(`[name="powerplay_${gameId}"]`)?.addEventListener('change', saveTip);
});

// Countdown bis nächstes Spiel
const countdownBar = document.querySelector('.countdown-bar');
if (countdownBar) {
  const kickoff = new Date(countdownBar.dataset.kickoff);
  const dEl = document.getElementById('cd-d');
  const hEl = document.getElementById('cd-h');
  const mEl = document.getElementById('cd-m');
  const sEl = document.getElementById('cd-s');

  function pad(n) { return String(n).padStart(2, '0'); }

  function updateCountdown() {
    const diff = kickoff - new Date();
    if (diff <= 0) {
      countdownBar.querySelector('.countdown-timer').innerHTML = '<span style="font-size:.9rem;opacity:.7">Läuft gerade!</span>';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    dEl.textContent = pad(d);
    hEl.textContent = pad(h);
    mEl.textContent = pad(m);
    sEl.textContent = pad(s);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// View Tabs (Tag / Gruppe)
document.querySelectorAll('.view-tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`view-${btn.dataset.view}`)?.classList.add('active');
  });
});

// Ranking-Hinweis (Powerspiel) — einmal schließbar pro Nutzer, merkt sich via localStorage
const rankNotice = document.getElementById('rank-notice');
if (rankNotice) {
  if (localStorage.getItem('rankNoticeDismissed_pp1') === '1') {
    rankNotice.style.display = 'none';
  }
  document.getElementById('rank-notice-close')?.addEventListener('click', () => {
    rankNotice.style.display = 'none';
    localStorage.setItem('rankNoticeDismissed_pp1', '1');
  });
}

// Ranking Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
  });
});
