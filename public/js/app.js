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

// View Tabs (Tag / Gruppe)
document.querySelectorAll('.view-tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`view-${btn.dataset.view}`)?.classList.add('active');
  });
});

// Ranking Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
  });
});
