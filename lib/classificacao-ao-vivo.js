export function buildLiveStandingsFromOfficial(officialTable, _matches = []) {
  return Array.isArray(officialTable) ? officialTable : [];
}

export function hasLiveMatches(_matches = []) {
  return false;
}
