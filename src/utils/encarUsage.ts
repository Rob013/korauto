export type UsageHistoryEntry = {
  description?: string;
  value?: string;
};

export type UsageHighlight = {
  label: string;
  value: string;
  details: string[];
};

const primaryUsageMap: Record<string, string> = {
  "0": "Pa të dhëna",
  "1": "Përdorim privat",
  "2": "Përdorim komercial",
  "3": "Përdorim qeveritar",
  "4": "Përdorim të përbashkët",
};

const secondaryUsageMap: Record<string, string> = {
  "0": "Pa të dhëna",
  "1": "Përdorim i përgjithshëm",
  "2": "Taksi",
  "3": "Auto-shkollë",
  "4": "Qira afatshkurtër",
  "5": "Qira afatgjatë",
  "6": "Transport publik",
  "7": "Transport i mallrave",
  "8": "Përdorim special",
};

export const decodePrimaryUsage = (code?: string | null) => {
  if (!code) return "Informacion i padisponueshëm";
  const normalized = code.trim();
  const label = primaryUsageMap[normalized];
  return label ? `${label} (${normalized})` : `Kodi i përdorimit ${normalized}`;
};

export const decodeSecondaryUsage = (code?: string | null) => {
  if (!code) return "Informacion i padisponueshëm";
  const normalized = code.trim();
  const label = secondaryUsageMap[normalized];
  return label
    ? `${label} (${normalized})`
    : `Kodi i përdorimit sekondar ${normalized}`;
};

const usageHiddenPatterns: RegExp[] = [
  /përdorur\s+për\s+qëllime\s+komerciale/i,
  /përdorim\s+komercial/i,
  /used\s+for\s+commercial\s+purposes/i,
  /commercial\s+use/i,
];

const usageTextExactTranslations: Record<string, string> = {
  "used for commercial purposes": "Përdorur për qëllime komerciale",
  "commercial use": "Përdorim komercial",
  "commercial usage": "Përdorim komercial",
  "commercial record": "Regjistër komercial",
  "no commercial history": "Pa histori komerciale",
  "no commercial use": "Pa përdorim komercial",
  "non commercial use": "Përdorim jo komercial",
  "private use": "Përdorim privat",
  "personal use": "Përdorim personal",
  "business use": "Përdorim biznesi",
  "taxi use": "Përdorim taksi",
  "rental use": "Përdorim qiraje",
  "rent car": "Automjet me qira",
  "rent-car": "Automjet me qira",
  rental: "Qira",
  lease: "Leasing",
  "lease use": "Leasing",
  fleet: "Flotë automjetesh",
  "company car": "Automjet i kompanisë",
  "corporate use": "Përdorim korporativ",
  "general use": "Përdorim i përgjithshëm",
  "private vehicle": "Automjet privat",
  "owner change": "Ndryshim pronari",
  "ownership change": "Ndryshim pronësie",
  "usage change": "Ndryshim përdorimi",
  "usage history": "Historia e përdorimit",
  taxi: "Taksi",
  cargo: "Transport mallrash",
  delivery: "Transport dorëzimi",
  "passenger transport": "Transport pasagjerësh",
  "commercial vehicle": "Automjet komercial",
  "비영업": "Përdorim jo komercial",
  "영업용": "Përdorim komercial",
  "렌트": "Qira",
  "렌터카": "Auto me qira",
  "영업 이력 없음": "Pa histori komerciale",
  "렌트 이력 없음": "Pa histori qiraje",
};

const usageTextRegexTranslations: Array<{ pattern: RegExp; translation: string }> =
  [
    { pattern: /rental\s+history/i, translation: "Histori qiraje" },
    { pattern: /rental\s+record/i, translation: "Regjistër qiraje" },
    { pattern: /rent\s+history/i, translation: "Histori qiraje" },
    { pattern: /rent\s+record/i, translation: "Regjistër qiraje" },
    { pattern: /taxi/i, translation: "Taksi" },
    { pattern: /lease/i, translation: "Leasing" },
    { pattern: /fleet/i, translation: "Flotë automjetesh" },
    { pattern: /business/i, translation: "Biznes" },
    { pattern: /transport/i, translation: "Transport" },
    { pattern: /delivery/i, translation: "Dërgesa" },
    { pattern: /cargo/i, translation: "Mallra" },
    { pattern: /logistic/i, translation: "Logjistikë" },
    { pattern: /commercial/i, translation: "Komercial" },
    { pattern: /non[-\s]?commercial/i, translation: "Jo komercial" },
    { pattern: /general/i, translation: "I përgjithshëm" },
    { pattern: /private/i, translation: "Privat" },
    { pattern: /personal/i, translation: "Personal" },
  ];

const usageTokenTranslations: Record<string, string> = {
  used: "Përdorur",
  use: "përdorim",
  usage: "përdorim",
  for: "për",
  purpose: "qëllim",
  purposes: "qëllime",
  commercial: "komerciale",
  business: "biznes",
  company: "kompani",
  corporate: "korporatë",
  fleet: "flotë",
  taxi: "taksi",
  rental: "qiraje",
  rent: "qira",
  lease: "leasing",
  record: "regjistër",
  history: "histori",
  change: "ndryshim",
  changed: "ndryshuar",
  owner: "pronar",
  ownership: "pronësi",
  general: "i përgjithshëm",
  private: "privat",
  personal: "personal",
  vehicle: "automjet",
  car: "automjet",
  transport: "transport",
  delivery: "dërgesë",
  cargo: "mallra",
  logistic: "logjistikë",
  no: "nuk ka",
  none: "asnjë",
  found: "gjetur",
  detected: "zbuluar",
  evidence: "dëshmi",
  available: "i disponueshëm",
  unavailable: "i padisponueshëm",
  confirm: "konfirmo",
  confirmed: "konfirmuar",
};

const preserveTokenCasing = (source: string, translated: string) => {
  if (!source) return translated;
  if (source === source.toUpperCase()) return translated.toUpperCase();
  if (source === source.toLowerCase()) return translated;
  if (/^[A-Z]/.test(source)) {
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  return translated;
};

export const isUsageDetailHidden = (input?: string | null) => {
  if (!input) return false;
  return usageHiddenPatterns.some((pattern) => pattern.test(input));
};

export const translateUsageText = (input?: string | null) => {
  if (input === null || input === undefined) return "";

  const text = input.toString();
  const trimmed = text.trim();
  if (!trimmed) return "";

  const hasLetters = /[A-Za-z]/.test(trimmed);
  const hasKorean = /[가-힣]/.test(trimmed);

  if (!hasLetters && !hasKorean) {
    return trimmed;
  }

  const normalized = trimmed.toLowerCase();
  if (usageTextExactTranslations[normalized]) {
    return usageTextExactTranslations[normalized];
  }

  for (const { pattern, translation } of usageTextRegexTranslations) {
    if (pattern.test(trimmed)) {
      return translation;
    }
  }

  const segments = trimmed.split(/(\s+|[(),.;:/-]+)/);
  let translatedCount = 0;
  const translatedSegments = segments.map((segment) => {
    if (!segment) return segment;
    if (!/[A-Za-z가-힣]/.test(segment)) {
      return segment;
    }

    const pure = segment.replace(/[^A-Za-z가-힣]/g, "").toLowerCase();
    if (!pure) return segment;

    const direct =
      usageTextExactTranslations[pure] ||
      usageTokenTranslations[pure] ||
      (hasKorean ? usageTextExactTranslations[segment] : undefined);

    if (direct) {
      translatedCount += 1;
      return preserveTokenCasing(segment, direct);
    }

    return segment;
  });

  if (translatedCount === 0) {
    return trimmed;
  }

  return translatedSegments.join("").replace(/\s+/g, (space) => (space.includes("\n") ? space : " "));
};

export const buildUsageHistoryList = (
  car: any,
  formatDate?: (value: unknown, options?: { monthYear?: boolean }) => string | undefined,
): UsageHistoryEntry[] => {
  const entries: UsageHistoryEntry[] = [];

  const addEntry = (entry: any) => {
    if (!entry) return;
    const description = entry.description ?? entry.type ?? entry.label;
    const rawValue = entry.value ?? entry.result ?? entry.details;
    const translatedDescription =
      description !== undefined && description !== null
        ? translateUsageText(description)
        : undefined;
    const translatedValue =
      typeof rawValue === "string"
        ? translateUsageText(rawValue)
        : rawValue !== undefined && rawValue !== null
          ? String(rawValue)
          : undefined;

    if (
      isUsageDetailHidden(translatedDescription) ||
      isUsageDetailHidden(translatedValue)
    ) {
      return;
    }

    entries.push({
      description: translatedDescription,
      value: translatedValue,
    });
  };

  const usageHistory = car?.details?.insurance?.usage_history;
  if (Array.isArray(usageHistory)) {
    usageHistory.forEach(addEntry);
  }

  const carInfoChanges = (car?.insurance_v2 as any)?.carInfoChanges;
  if (Array.isArray(carInfoChanges)) {
    carInfoChanges.forEach((change: any) => {
      const description =
        change?.description ||
        change?.type ||
        (change?.carNo ? `Ndryshim targash (${change.carNo})` : "Ndryshim informacioni");

      const format = (value: unknown, opts?: { monthYear?: boolean }) =>
        formatDate ? formatDate(value, opts) : undefined;

      const formattedDate =
        format(change?.date, { monthYear: true }) ??
        format(change?.changed_at, { monthYear: true }) ??
        (typeof change?.date === "string" ? change.date : undefined) ??
        (typeof change?.changed_at === "string" ? change.changed_at : undefined);

      entries.push({
        description: translateUsageText(description),
        value: formattedDate,
      });
    });
  }

  return entries.filter((entry) => entry.description || entry.value);
};

export const evaluateYesNo = (
  value?: string | number | boolean | null,
): "Po" | "Jo" | null => {
  const evaluate = (input: unknown): "Po" | "Jo" | null => {
    if (input === undefined || input === null) return null;

    if (Array.isArray(input)) {
      for (const item of input) {
        const result = evaluate(item);
        if (result) return result;
      }
      return null;
    }

    if (typeof input === "boolean") return input ? "Po" : "Jo";
    if (typeof input === "number") return input > 0 ? "Po" : "Jo";

    const rawString = input.toString().trim();
    if (!rawString) return null;

    const normalized = rawString.toLowerCase();
    const compact = normalized.replace(/\s+/g, "");
    const asciiOnly = normalized.replace(/[^a-z0-9]/g, "");
    const tokens = normalized
      .replace(/[\u3000]/g, " ")
      .split(/[\s,.;:!?()<>|/\\\-]+/)
      .filter(Boolean);
    const tokenSet = new Set(tokens);

    const containsIndicator = (text: string, indicators: string[]) =>
      indicators.some((indicator) => text.includes(indicator));

    const unknownIndicators = [
      "unknown",
      "n/a",
      "n\\a",
      "not available",
      "no data",
      "not provided",
      "unavailable",
      "undefined",
      "정보없",
      "미확인",
      "확인불가",
      "미제공",
      "알수없",
      "확인 안됨",
      "정보 없음",
    ];
    if (
      containsIndicator(normalized, unknownIndicators) ||
      containsIndicator(compact, unknownIndicators)
    ) {
      return null;
    }

    const directYesTokens = [
      "po",
      "yes",
      "true",
      "y",
      "present",
      "exists",
      "available",
      "positive",
      "있음",
      "있다",
      "맞음",
      "해당",
      "설치",
      "교환",
      "수리",
      "등록",
      "사용",
    ];
    for (const token of directYesTokens) {
      if (normalized === token || asciiOnly === token || tokenSet.has(token)) {
        return "Po";
      }
    }

    const directNoTokens = [
      "jo",
      "no",
      "false",
      "n",
      "none",
      "not",
      "without",
      "absent",
      "없음",
      "없다",
      "미해당",
      "미설치",
      "무교환",
      "무수리",
      "무등록",
      "무사용",
      "미사용",
    ];
    for (const token of directNoTokens) {
      if (normalized === token || asciiOnly === token || tokenSet.has(token)) {
        return "Jo";
      }
    }

    const yesIndicators = [
      "po",
      "yes",
      "present",
      "exists",
      "exist",
      "available",
      "applied",
      "performed",
      "conducted",
      "done",
      "recorded",
      "reported",
      "등록",
      "교환",
      "수리",
      "있음",
      "실시",
      "시공",
      "있다",
    ];
    if (containsIndicator(normalized, yesIndicators)) {
      return "Po";
    }

    const noIndicators = [
      "jo",
      "no",
      "none",
      "without",
      "not",
      "absent",
      "missing",
      "nuk ka",
      "pa",
      "무",
      "없음",
      "미",
      "없다",
      "미사용",
      "미등록",
      "미교환",
      "무교환",
      "미수리",
      "무수리",
      "미도장",
      "무도장",
      "미해당",
      "비해당",
      "없습니다",
      "없어요",
    ];
    if (containsIndicator(normalized, noIndicators)) {
      return "Jo";
    }

    if (compact === "ok" || compact === "okay") return "Jo";

    return null;
  };

  return evaluate(value);
};

export const buildUsageHighlights = (
  car: any,
  usageHistoryList: UsageHistoryEntry[],
): UsageHighlight[] => {
  const primaryCodeSet = new Set<string>();
  const secondaryCodeSet = new Set<string>();
  const textSourceSet = new Set<string>();

  const addPrimaryCode = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(addPrimaryCode);
      return;
    }
    if (value === null || value === undefined) return;
    const code = String(value).trim();
    if (!code) return;
    primaryCodeSet.add(code);
  };

  const addSecondaryCode = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(addSecondaryCode);
      return;
    }
    if (value === null || value === undefined) return;
    const code = String(value).trim();
    if (!code) return;
    secondaryCodeSet.add(code);
  };

  const addTextSource = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(addTextSource);
      return;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed || trimmed === "-" || trimmed === "--") return;
      const normalized = trimmed.toLowerCase();
      if (
        normalized === "informacion i padisponueshëm" ||
        normalized === "informacion i padisponueshem" ||
        normalized === "pa të dhëna" ||
        normalized === "pa te dhena" ||
        normalized === "n/a" ||
        normalized === "na" ||
        normalized === "none"
      ) {
        return;
      }
      textSourceSet.add(trimmed);
    }
  };

  addTextSource(car?.details?.insurance?.general_info?.usage_type);
  addTextSource((car?.details?.insurance?.car_info as any)?.usage_type);
  addTextSource((car?.details as any)?.usage_type);
  addTextSource((car?.insurance_v2 as any)?.usageType);
  addTextSource((car?.insurance_v2 as any)?.useType);
  addTextSource((car?.insurance_v2 as any)?.usage_type);

  addPrimaryCode((car?.details?.insurance?.car_info as any)?.use);
  addPrimaryCode(car?.encarRecordSummary?.use);
  addPrimaryCode(car?.encarRecord?.use);
  addPrimaryCode((car?.insurance_v2 as any)?.useType);
  addPrimaryCode((car?.insurance_v2 as any)?.usageType);
  addPrimaryCode(car?.insurance_v2?.carInfoUse1s);

  addSecondaryCode(car?.insurance_v2?.carInfoUse2s);
  addSecondaryCode((car?.encarRecord as any)?.carInfoUse2s);

  usageHistoryList.forEach((entry) => {
    addTextSource(entry.description);
    addTextSource(entry.value);
  });

  const primaryCodes = Array.from(primaryCodeSet);
  const secondaryCodes = Array.from(secondaryCodeSet);
  const textSources = Array.from(textSourceSet);

  const rentalDetails = new Set<string>();
  const commercialDetails = new Set<string>();
  const generalDetails = new Set<string>();

  const addDetail = (set: Set<string>, detail?: string) => {
    if (!detail) return;
    const trimmed = detail.trim();
    if (
      !trimmed ||
      trimmed === "-" ||
      trimmed === "--" ||
      trimmed === "Informacion i padisponueshëm" ||
      trimmed.toLowerCase().includes("pa të dhëna") ||
      trimmed.toLowerCase().includes("pa te dhena")
    ) {
      return;
    }
    set.add(trimmed);
  };

  let codeIndicatesRental = false;
  let codeIndicatesCommercial = false;
  let codeIndicatesGeneral = false;

  primaryCodes.forEach((code) => {
    if (!code) return;
    if (["2", "3", "4"].includes(code)) {
      codeIndicatesCommercial = true;
      addDetail(commercialDetails, decodePrimaryUsage(code));
    } else if (code === "1") {
      codeIndicatesGeneral = true;
      addDetail(generalDetails, decodePrimaryUsage(code));
    }
  });

  secondaryCodes.forEach((code) => {
    if (!code) return;
    if (["4", "5"].includes(code)) {
      codeIndicatesRental = true;
      addDetail(rentalDetails, decodeSecondaryUsage(code));
    } else if (["2", "3", "6", "7", "8"].includes(code)) {
      codeIndicatesCommercial = true;
      addDetail(commercialDetails, decodeSecondaryUsage(code));
    } else if (code === "1") {
      codeIndicatesGeneral = true;
      addDetail(generalDetails, decodeSecondaryUsage(code));
    }
  });

  const rentalKeywords = [
    "rent",
    "rental",
    "rentcar",
    "rent car",
    "lease",
    "leasing",
    "qira",
    "qiraja",
    "rentë",
    "rentim",
    "임대",
    "임차",
    "렌트",
    "렌터카",
    "대여",
  ];
  const commercialKeywords = [
    "komerc",
    "komercial",
    "commercial",
    "business",
    "biznes",
    "corporate",
    "company",
    "fleet",
    "taxi",
    "transport",
    "delivery",
    "cargo",
    "logistics",
    "영업",
    "영업용",
    "사업",
    "사업용",
    "법인",
    "업무",
  ];
  const generalKeywords = [
    "general",
    "i përgjithshëm",
    "i pergjithshem",
    "përdorim i përgjithshëm",
    "perdorim i pergjithshem",
    "private",
    "personal",
    "individual",
    "vetjak",
    "non-commercial",
    "non commercial",
    "noncommercial",
    "비영업",
    "자가용",
  ];

  const negativeRentalPatterns = [
    /no\s+rent/i,
    /no\s+rental/i,
    /without\s+rent/i,
    /without\s+rental/i,
    /no\s+rentcar/i,
    /norent/i,
    /norental/i,
    /nuk\s+ka\s+rent/i,
    /nuk\s+ka\s+qira/i,
    /pa\s+qira/i,
    /미렌트/,
    /렌트이력없음/,
  ];
  const negativeCommercialPatterns = [
    /no\s+commercial/i,
    /without\s+commercial/i,
    /non[-\s]?commercial/i,
    /no\s+business/i,
    /without\s+business/i,
    /nuk\s+ka\s+biznes/i,
    /pa\s+biznes/i,
    /비영업/,
    /영업이력없음/,
  ];

  let textIndicatesRental = false;
  let textIndicatesCommercial = false;
  let textIndicatesGeneral = false;

  const includesAny = (normalized: string, keywords: string[]) =>
    keywords.some((keyword) => normalized.includes(keyword));

  textSources.forEach((text) => {
    if (!text) return;
    if (/^-?\d+(\.\d+)?$/.test(text)) {
      return;
    }
    const normalized = text.toLowerCase();
    const yesNo = evaluateYesNo(text as any);
    const rentKeyword = includesAny(normalized, rentalKeywords);
    const commercialKeyword = includesAny(normalized, commercialKeywords);
    const generalKeyword = includesAny(normalized, generalKeywords);

    const rentNeg = negativeRentalPatterns.some((pattern) => pattern.test(text));
    const commercialNeg = negativeCommercialPatterns.some((pattern) =>
      pattern.test(text),
    );

    if (rentKeyword) {
      if (yesNo === "Jo" || rentNeg) {
        textIndicatesGeneral = true;
        addDetail(generalDetails, text);
      } else {
        textIndicatesRental = true;
        addDetail(rentalDetails, text);
      }
    }

    if (commercialKeyword) {
      if (yesNo === "Jo" || commercialNeg) {
        textIndicatesGeneral = true;
        addDetail(generalDetails, text);
      } else {
        textIndicatesCommercial = true;
        addDetail(commercialDetails, text);
      }
    }

    if (
      generalKeyword ||
      (!rentKeyword && !commercialKeyword && yesNo === "Jo")
    ) {
      textIndicatesGeneral = true;
      addDetail(generalDetails, text);
    }
  });

  const hasRent =
    codeIndicatesRental || textIndicatesRental || rentalDetails.size > 0;
  const hasCommercial =
    codeIndicatesCommercial ||
    textIndicatesCommercial ||
    commercialDetails.size > 0;
  const hasGeneral =
    codeIndicatesGeneral || textIndicatesGeneral || generalDetails.size > 0;

  const hasNonZeroPrimaryCode = primaryCodes.some(
    (code) => code && code !== "0",
  );
  const hasNonZeroSecondaryCode = secondaryCodes.some(
    (code) => code && code !== "0",
  );
  const hasMeaningfulEvidence =
    hasRent ||
    hasCommercial ||
    hasGeneral ||
    hasNonZeroPrimaryCode ||
    hasNonZeroSecondaryCode ||
    textSources.length > 0;

  const rentalValue = hasRent
    ? "Po"
    : hasGeneral || hasMeaningfulEvidence
      ? "Jo"
      : "Nuk ka informata";

  const commercialValue = hasCommercial
    ? "Po"
    : hasGeneral || hasMeaningfulEvidence
      ? "Jo"
      : "Nuk ka informata";

  const generalDetailsList = Array.from(generalDetails);
  if (hasGeneral) {
    generalDetailsList.unshift(
      "Raporti përmend përdorim të përgjithshëm (informativ)",
    );
  }

  const generalValue = hasMeaningfulEvidence ? "Jo" : "Nuk ka informata";

  return [
    {
      label: "Përdorur si veturë me qira",
      value: rentalValue,
      details: hasRent ? Array.from(rentalDetails) : [],
    },
    {
      label: "Përdorur për qëllime komerciale",
      value: commercialValue,
      details: hasCommercial ? Array.from(commercialDetails) : [],
    },
    {
      label: "Përdorim i përgjithshëm",
      value: generalValue,
      details: generalDetailsList,
    },
  ];
};
