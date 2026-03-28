const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED", "LIVE"]);

function getCurrentScore(match) {
  const score = match?.score || {};

  const candidates = [
    score?.fullTime,
    score?.regularTime,
    score?.current,
    score?.halfTime,
  ];

  for (const item of candidates) {
    if (
      item &&
      typeof item.home === "number" &&
      typeof item.away === "number"
    ) {
      return { home: item.home, away: item.away };
    }
  }

  return { home: 0, away: 0 };
}

function getTeamId(team) {
  return String(team?.id ?? "");
}

function cloneRow(row) {
  return {
    ...row,
    team: { ...(row?.team || {}) },
    live: false,
  };
}

function sortTable(table) {
  return [...table]
    .sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) {
        return (b.points || 0) - (a.points || 0);
      }

      if ((b.goalDifference || 0) !== (a.goalDifference || 0)) {
        return (b.goalDifference || 0) - (a.goalDifference || 0);
      }

      if ((b.goalsFor || 0) !== (a.goalsFor || 0)) {
        return (b.goalsFor || 0) - (a.goalsFor || 0);
      }

      return (a.team?.name || "").localeCompare(b.team?.name || "", "pt-BR");
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));
}

export function hasLiveMatches(matches = []) {
  return matches.some((match) => LIVE_STATUSES.has(match?.status));
}

export function buildLiveStandingsFromOfficial(
  officialTable = [],
  allMatches = []
) {
  if (!Array.isArray(officialTable) || officialTable.length === 0) {
    return [];
  }

  const liveMatches = allMatches.filter((m) => LIVE_STATUSES.has(m?.status));
  if (!liveMatches.length) return officialTable;

  const table = officialTable.map(cloneRow);
  const map = new Map();

  for (const row of table) {
    map.set(getTeamId(row.team), row);
  }

  for (const match of liveMatches) {
    const homeId = getTeamId(match?.homeTeam);
    const awayId = getTeamId(match?.awayTeam);

    if (!homeId || !awayId) continue;

    const homeRow = map.get(homeId);
    const awayRow = map.get(awayId);

    if (!homeRow || !awayRow) continue;

    const { home, away } = getCurrentScore(match);

    homeRow.playedGames += 1;
    awayRow.playedGames += 1;

    homeRow.goalsFor += home;
    homeRow.goalsAgainst += away;
    awayRow.goalsFor += away;
    awayRow.goalsAgainst += home;

    if (home > away) {
      homeRow.won += 1;
      homeRow.points += 3;
      awayRow.lost += 1;
    } else if (away > home) {
      awayRow.won += 1;
      awayRow.points += 3;
      homeRow.lost += 1;
    } else {
      homeRow.draw += 1;
      awayRow.draw += 1;
      homeRow.points += 1;
      awayRow.points += 1;
    }

    homeRow.goalDifference = homeRow.goalsFor - homeRow.goalsAgainst;
    awayRow.goalDifference = awayRow.goalsFor - awayRow.goalsAgainst;

    homeRow.live = true;
    awayRow.live = true;
  }

  return sortTable(table);
}
