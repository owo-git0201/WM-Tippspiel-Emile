const ROUND_MULTIPLIERS = {
  'Gruppenphase':    1,
  'Achtelfinale':    2,
  'Viertelfinale':   2,
  'Halbfinale':      3,
  'Spiel um Platz 3': 2,
  'Finale':          4,
};

const POINTS_TENDENCY = 2;
const POINTS_EXACT = 4;
const POWERPLAY_MULTIPLIER = 3;

function getTendency(home, away) {
  if (home > away) return 'H';
  if (home < away) return 'A';
  return 'D';
}

function calcPoints(tip, game) {
  if (game.home_score === null || game.away_score === null) return null;
  if (!tip.tip_tendency) return 0;

  const multiplier = ROUND_MULTIPLIERS[game.round] || 1;
  const actualTendency = getTendency(game.home_score, game.away_score);

  let basePts = 0;
  if (tip.tip_home !== null && tip.tip_away !== null &&
      Number(tip.tip_home) === game.home_score && Number(tip.tip_away) === game.away_score) {
    basePts = POINTS_EXACT;
  } else if (tip.tip_tendency === actualTendency) {
    basePts = POINTS_TENDENCY;
  }

  const baseTotal = basePts * multiplier;
  const powerBonus = tip.is_powerplay && baseTotal > 0 ? baseTotal * (POWERPLAY_MULTIPLIER - 1) : 0;

  return { total: baseTotal + powerBonus, base: baseTotal, powerBonus };
}

function calcPointsTotal(tip, game) {
  const r = calcPoints(tip, game);
  if (r === null) return null;
  return r.total;
}

module.exports = { calcPoints, calcPointsTotal, getTendency, ROUND_MULTIPLIERS, POINTS_TENDENCY, POINTS_EXACT, POWERPLAY_MULTIPLIER };
