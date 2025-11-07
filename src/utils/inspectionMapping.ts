export interface InspectionTypeInfo {
  code?: string | number | null;
  title?: string | null;
}

const normalize = (value: string) => value.toLowerCase();

const includesAny = (value: string, keywords: string[]) =>
  keywords.some((keyword) => value.includes(keyword));

const hasKorean = (value: string, chars: string[]) => chars.some((char) => value.includes(char));

const stripNonAlphanumeric = (value: string) => value.replace(/[^a-z0-9]/g, '');

const STATUS_PART_PATTERNS: Array<{
  id: string;
  match: (text: string, raw: string, compact: string) => boolean;
}> = [
  {
    id: 'front_left_door',
    match: (text, raw) => {
      const compact = stripNonAlphanumeric(text);
      // Also match API format: front_door_left or frontdoorleft
      if (compact === 'frontdoorleft' || compact === 'frontleftdoor') return true;
      const hasDoor = includesAny(text, ['door']) || raw.includes('도어');
      const hasLeft =
        includesAny(text, ['left', 'lh', 'lfront']) ||
        hasKorean(raw, ['좌']) ||
        compact.includes('lf');
      const hasFront =
        includesAny(text, ['front']) ||
        includesAny(text, ['lfront', 'frontleft']) ||
        hasKorean(raw, ['앞']) ||
        compact.startsWith('fl');
      return hasDoor && hasLeft && hasFront;
    },
  },
  {
    id: 'front_right_door',
    match: (text, raw) => {
      const compact = stripNonAlphanumeric(text);
      // Also match API format: front_door_right or frontdoorright
      if (compact === 'frontdoorright' || compact === 'frontrightdoor') return true;
      const hasDoor = includesAny(text, ['door']) || raw.includes('도어');
      const hasRight =
        includesAny(text, ['right', 'rh', 'rfront']) ||
        hasKorean(raw, ['우']) ||
        compact.includes('rf');
      const hasFront =
        includesAny(text, ['front']) ||
        includesAny(text, ['front', 'frontright']) ||
        hasKorean(raw, ['앞']) ||
        compact.startsWith('fr');
      return hasDoor && hasRight && hasFront;
    },
  },
  {
    id: 'rear_left_door',
    match: (text, raw) => {
      const compact = stripNonAlphanumeric(text);
      // Also match API format: rear_door_left or reardoorleft
      if (compact === 'reardoorleft' || compact === 'rearleftdoor') return true;
      const hasDoor = includesAny(text, ['door']) || raw.includes('도어');
      const hasLeft = includesAny(text, ['left', 'lh']) || hasKorean(raw, ['좌']) || compact.includes('rl');
      const hasRear = includesAny(text, ['rear', 'back']) || hasKorean(raw, ['뒤', '후']) || compact.startsWith('rl');
      return hasDoor && hasLeft && hasRear;
    },
  },
  {
    id: 'rear_right_door',
    match: (text, raw) => {
      const compact = stripNonAlphanumeric(text);
      // Also match API format: rear_door_right or reardoorright
      if (compact === 'reardoorright' || compact === 'rearrightdoor') return true;
      const hasDoor = includesAny(text, ['door']) || raw.includes('도어');
      const hasRight = includesAny(text, ['right', 'rh']) || hasKorean(raw, ['우']) || compact.includes('rr');
      const hasRear = includesAny(text, ['rear', 'back']) || hasKorean(raw, ['뒤', '후']) || compact.startsWith('rr');
      return hasDoor && hasRight && hasRear;
    },
  },
  {
    id: 'front_bumper',
    match: (text, raw) => {
      const hasBumper = includesAny(text, ['bumper']) || raw.includes('범퍼');
      const hasFront = includesAny(text, ['front']) || hasKorean(raw, ['앞', '전']);
      return hasBumper && hasFront;
    },
  },
  {
    id: 'rear_bumper',
    match: (text, raw) => {
      const hasBumper = includesAny(text, ['bumper']) || raw.includes('범퍼');
      const hasRear = includesAny(text, ['rear', 'back']) || hasKorean(raw, ['뒤', '후']);
      return hasBumper && hasRear;
    },
  },
  {
    id: 'hood',
    match: (text, raw) =>
      includesAny(text, ['hood', 'bonnet']) || hasKorean(raw, ['후드', '본넷']),
  },
  {
    id: 'trunk',
    match: (text, raw, compact) =>
      includesAny(text, ['trunk', 'decklid', 'boot']) ||
      includesAny(compact, ['tailgate', 'backdoor']) ||
      hasKorean(raw, ['트렁크', '데크', '백도어']),
  },
  {
    id: 'roof',
    match: (text, raw) => includesAny(text, ['roof']) || hasKorean(raw, ['루프', '지붕']),
  },
  {
    id: 'left_fender',
    match: (text, raw, compact) => {
      const hasFender = includesAny(text, ['fender']) || raw.includes('휀더') || raw.includes('펜더');
      const hasLeft = includesAny(text, ['left', 'lh']) || hasKorean(raw, ['좌']);
      const hasFront = includesAny(text, ['front']) || includesAny(compact, ['front']);
      return hasFender && hasLeft && hasFront;
    },
  },
  {
    id: 'right_fender',
    match: (text, raw, compact) => {
      const hasFender = includesAny(text, ['fender']) || raw.includes('휀더') || raw.includes('펜더');
      const hasRight = includesAny(text, ['right', 'rh']) || hasKorean(raw, ['우']);
      const hasFront = includesAny(text, ['front']) || includesAny(compact, ['front']);
      return hasFender && hasRight && hasFront;
    },
  },
  {
    id: 'left_quarter',
    match: (text, raw, compact) => {
      // Also match API formats
      if (compact === 'quarterpanelleft' || compact === 'rearwheelhouseleft') return true;
      const hasQuarter = includesAny(text, ['quarter']) || raw.includes('쿼터');
      const hasPanel = includesAny(text, ['panel']) || raw.includes('패널');
      const hasRear = includesAny(text, ['rear']) || hasKorean(raw, ['뒤', '후']);
      const hasLeft = includesAny(text, ['left', 'lh']) || hasKorean(raw, ['좌']);
      const hasWheelHouse = includesAny(compact, ['wheelhouse', 'wheelarch']) || raw.includes('휠하우스');
      return (hasQuarter || hasPanel || hasWheelHouse) && hasRear && hasLeft;
    },
  },
  {
    id: 'right_quarter',
    match: (text, raw, compact) => {
      // Also match API formats
      if (compact === 'quarterpanelright' || compact === 'rearwheelhouseright') return true;
      const hasQuarter = includesAny(text, ['quarter']) || raw.includes('쿼터');
      const hasPanel = includesAny(text, ['panel']) || raw.includes('패널');
      const hasRear = includesAny(text, ['rear']) || hasKorean(raw, ['뒤', '후']);
      const hasRight = includesAny(text, ['right', 'rh']) || hasKorean(raw, ['우']);
      const hasWheelHouse = includesAny(compact, ['wheelhouse', 'wheelarch']) || raw.includes('휠하우스');
      return (hasQuarter || hasPanel || hasWheelHouse) && hasRear && hasRight;
    },
  },
  {
    id: 'side_sill_left',
    match: (text, raw, compact) => {
      // Also match API format: side_sill_panel_left
      if (compact === 'sidesillpanelleft' || compact === 'sidesilleft') return true;
      const hasSill = includesAny(text, ['sill', 'rocker']) || raw.includes('사이드실');
      const hasLeft = includesAny(text, ['left', 'lh']) || hasKorean(raw, ['좌']);
      return hasSill && hasLeft;
    },
  },
  {
    id: 'side_sill_right',
    match: (text, raw, compact) => {
      // Also match API format: side_sill_panel_right
      if (compact === 'sidesillpanelright' || compact === 'sidesillright') return true;
      const hasSill = includesAny(text, ['sill', 'rocker']) || raw.includes('사이드실');
      const hasRight = includesAny(text, ['right', 'rh']) || hasKorean(raw, ['우']);
      return hasSill && hasRight;
    },
  },
];

export const mapInspectionTypeToPartId = (
  type?: InspectionTypeInfo,
  fallbackText?: string,
): string | null => {
  const candidates: string[] = [];

  if (type) {
    if (type.code != null) candidates.push(String(type.code));
    if (type.title != null) candidates.push(String(type.title));
  }

  if (fallbackText) {
    candidates.push(fallbackText);
  }

  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (!trimmed) continue;

    const lower = normalize(trimmed);
    const compact = stripNonAlphanumeric(lower);

    for (const pattern of STATUS_PART_PATTERNS) {
      const patternIdLower = pattern.id.toLowerCase();
      const patternCompact = stripNonAlphanumeric(patternIdLower);

      if (
        trimmed === pattern.id ||
        lower === patternIdLower ||
        lower === patternIdLower.replace(/_/g, ' ') ||
        compact === patternCompact
      ) {
        return pattern.id;
      }
    }

    const matched = STATUS_PART_PATTERNS.find((pattern) =>
      pattern.match(lower, trimmed, compact),
    );

    if (matched) {
      return matched.id;
    }
  }

  return null;
};
