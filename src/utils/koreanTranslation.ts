const CHO = [
  "g",
  "kk",
  "n",
  "d",
  "tt",
  "r",
  "m",
  "b",
  "pp",
  "s",
  "ss",
  "",
  "j",
  "jj",
  "ch",
  "k",
  "t",
  "p",
  "h",
];

const JUNG = [
  "a",
  "ae",
  "ya",
  "yae",
  "eo",
  "e",
  "yeo",
  "ye",
  "o",
  "wa",
  "wae",
  "oe",
  "yo",
  "u",
  "wo",
  "we",
  "wi",
  "yu",
  "eu",
  "ui",
  "i",
];

const JONG = [
  "",
  "k",
  "k",
  "ks",
  "n",
  "nj",
  "nh",
  "t",
  "l",
  "lk",
  "lm",
  "lb",
  "ls",
  "lt",
  "lp",
  "lh",
  "m",
  "p",
  "ps",
  "t",
  "t",
  "ng",
  "t",
  "t",
  "k",
  "t",
  "p",
  "t",
];

const SUFFIX_PRESERVATION = [
  "-do",
  "-si",
  "-gun",
  "-gu",
  "-eup",
  "-myeon",
  "-dong",
  "-ri",
  "-ro",
  "-gil",
];

const DEDICATED_REPLACEMENTS: Array<[RegExp, string]> = [
  [/한국|대한민국|코리아/gi, "Korea"],
  [/서울특별시|서울시|서울/gi, "Seoul"],
  [/부산광역시|부산시|부산/gi, "Busan"],
  [/대구광역시|대구시|대구/gi, "Daegu"],
  [/광주광역시|광주시|광주/gi, "Gwangju"],
  [/대전광역시|대전시|대전/gi, "Daejeon"],
  [/울산광역시|울산시|울산/gi, "Ulsan"],
  [/인천광역시|인천시|인천/gi, "Incheon"],
  [/경기도/gi, "Gyeonggi-do"],
  [/강원도/gi, "Gangwon-do"],
  [/충청북도/gi, "Chungcheongbuk-do"],
  [/충청남도/gi, "Chungcheongnam-do"],
  [/전라북도/gi, "Jeollabuk-do"],
  [/전라남도/gi, "Jeollanam-do"],
  [/경상북도/gi, "Gyeongsangbuk-do"],
  [/경상남도/gi, "Gyeongsangnam-do"],
  [/제주특별자치도|제주도|제주/gi, "Jeju-do"],
];

const SUFFIX_MAP: Record<string, string> = {
  도: "-do",
  시: "-si",
  군: "-gun",
  구: "-gu",
  읍: "-eup",
  면: "-myeon",
  동: "-dong",
  리: "-ri",
  로: "-ro",
  길: "-gil",
};

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

const capitalizeSegments = (input: string) =>
  input.replace(/\b([a-z])/g, (match) => match.toUpperCase());

const preserveSuffixCase = (input: string) =>
  SUFFIX_PRESERVATION.reduce(
    (acc, suffix) =>
      acc.replace(
        new RegExp(suffix.replace("-", "\\-"), "gi"),
        suffix,
      ),
    input,
  );

const romanizeBlock = (char: string) => {
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) {
    return char;
  }

  const syllableIndex = code - HANGUL_BASE;
  const choIndex = Math.floor(syllableIndex / (21 * 28));
  const jungIndex = Math.floor((syllableIndex % (21 * 28)) / 28);
  const jongIndex = syllableIndex % 28;

  const initial = CHO[choIndex] ?? "";
  const medial = JUNG[jungIndex] ?? "";
  const final = JONG[jongIndex] ?? "";

  return `${initial}${medial}${final}`;
};

const romanizeText = (input: string) =>
  Array.from(input)
    .map((char) => romanizeBlock(char))
    .join("");

const applyDedicatedReplacements = (input: string) =>
  DEDICATED_REPLACEMENTS.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    input,
  );

const translateSuffixes = (input: string) =>
  input.replace(/([가-힣]+)(도|시|군|구|읍|면|동|리|로|길)/g, (_, stem, suffix) => {
    const romanizedStem = romanizeText(stem);
    const formattedStem = capitalizeSegments(romanizedStem);
    const mappedSuffix = SUFFIX_MAP[suffix] ?? "";
    return `${formattedStem}${mappedSuffix}`;
  });

export const translateKoreanText = (input?: string | null) => {
  if (!input) {
    return "";
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  if (!/[가-힣]/.test(trimmed)) {
    return trimmed;
  }

  const withDedicated = applyDedicatedReplacements(trimmed);
  const withSuffixes = translateSuffixes(withDedicated);
  const romanized = romanizeText(withSuffixes);
  const capitalized = capitalizeSegments(romanized);
  return preserveSuffixCase(capitalized);
};
