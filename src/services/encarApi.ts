const ENCAR_API_BASE_URL = "https://api.encar.com";
const ENCAR_IMAGE_BASE_URL = "https://ci.encar.com";

const DEFAULT_ENCAR_API_TOKEN = "7L32Khpc2iLyR88Wxn8iCHsa8X6L3V";

const ENCAR_API_TOKEN =
  (import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_ENCAR_API_TOKEN || DEFAULT_ENCAR_API_TOKEN;

interface EncarsInspectionStatus {
  code?: string;
  title?: string;
}

export interface EncarsInspectionOuter {
  type?: { code?: string; title?: string };
  statusTypes?: EncarsInspectionStatus[];
  attributes?: string[];
}

export interface EncarsInspectionInner {
  type?: { code?: string; title?: string };
  statusType?: EncarsInspectionStatus;
  statusTypes?: EncarsInspectionStatus[];
  description?: string | null;
  children?: EncarsInspectionInner[];
}

export interface EncarsInspectionResponse {
  vehicleId?: number;
  master?: {
    supplyNum?: string;
    accdient?: boolean;
    simpleRepair?: boolean;
    registrationDate?: string;
    detail?: Record<string, unknown>;
  };
  price?: number | null;
  inners?: EncarsInspectionInner[];
  outers?: EncarsInspectionOuter[];
  images?: Array<{ path: string; type?: string; title?: string }>;
  etcs?: unknown[];
  inspectionSource?: Record<string, unknown>;
}

export interface EncarsVehicleResponse {
  vehicleId: number;
  vehicleNo?: string;
  vin?: string;
  vehicleType?: string;
  advertisement?: {
    price?: number;
    status?: string;
  };
  spec?: {
    mileage?: number;
    displacement?: number;
    fuelCd?: string;
    fuelName?: string;
    transmissionName?: string;
    colorName?: string;
    seatCount?: number;
    bodyName?: string;
  };
  category?: {
    manufacturerName?: string;
    modelName?: string;
    modelGroupName?: string;
    gradeName?: string;
    formYear?: string;
    yearMonth?: string;
    originPrice?: number;
    domestic?: boolean;
  };
  photos?: Array<{
    code?: string;
    path: string;
    type?: string;
    desc?: string | null;
  }>;
  options?: {
    standard?: string[];
    choice?: string[];
    etc?: string[];
    tuning?: string[];
  };
  manage?: {
    registDateTime?: string;
    firstAdvertisedDateTime?: string;
    modifyDateTime?: string;
    subscribeCount?: number;
    viewCount?: number;
  };
  partnership?: {
    dealer?: {
      userId?: string;
      name?: string;
      firm?: {
        code?: string;
        name?: string;
      };
    };
  };
  contact?: {
    address?: string;
    userId?: string;
    userType?: string;
    no?: string;
  };
  condition?: {
    accident?: { recordView?: boolean; resumeView?: boolean };
    inspection?: { formats?: string[] };
    seizing?: { seizingCount?: number; pledgeCount?: number };
  };
}

export interface EncarsRecordSummaryResponse {
  carNo?: string;
  year?: string;
  maker?: string | null;
  carKind?: string | null;
  use?: string | null;
  displacement?: string | null;
  carName?: string | null;
  firstDate?: string | null;
  fuel?: string | null;
  myAccidentCnt?: number;
  otherAccidentCnt?: number;
  ownerChangeCnt?: number;
  robberCnt?: number;
  totalLossCnt?: number;
  floodTotalLossCnt?: number;
  floodPartLossCnt?: number | null;
  accidentCnt?: number;
  myAccidentCost?: number | null;
  otherAccidentCost?: number | null;
  carNoChangeCnt?: number | null;
}

export interface EncarsRecordOpenResponse {
  openData?: boolean;
  regDate?: string;
  carNo?: string;
  year?: string;
  maker?: string | null;
  carKind?: string | null;
  use?: string | null;
  displacement?: string | null;
  firstDate?: string | null;
  fuel?: string | null;
  model?: string | null;
  transmission?: string | null;
  myAccidentCnt?: number;
  otherAccidentCnt?: number;
  ownerChangeCnt?: number;
  robberCnt?: number;
  totalLossCnt?: number;
  floodTotalLossCnt?: number;
  floodPartLossCnt?: number | null;
  accidentCnt?: number;
  myAccidentCost?: number | null;
  otherAccidentCost?: number | null;
  carNoChangeCnt?: number | null;
  carInfoChanges?: Array<{ date?: string; carNo?: string }>;
  carInfoUse1s?: string[];
  carInfoUse2s?: string[];
  ownerChanges?: string[];
  accidents?: Array<{
    type?: string;
    date?: string;
    insuranceBenefit?: number;
    partCost?: number;
    laborCost?: number;
    paintingCost?: number;
  }>;
  notJoinDate1?: string | null;
  notJoinDate2?: string | null;
  notJoinDate3?: string | null;
  notJoinDate4?: string | null;
  notJoinDate5?: string | null;
}

type EncarsFetchOptions = {
  signal?: AbortSignal;
  cache?: RequestCache;
};

const encarHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json;charset=UTF-8",
  Authorization: `Bearer ${ENCAR_API_TOKEN}`,
});

async function encarFetch<T>(
  path: string,
  { signal, cache = "no-store" }: EncarsFetchOptions = {},
): Promise<T> {
  const response = await fetch(`${ENCAR_API_BASE_URL}${path}`, {
    method: "GET",
    headers: encarHeaders(),
    signal,
    cache,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    
    // Provide more specific error messages for common status codes
    if (response.status === 404) {
      throw new Error(
        "VEHICLE_NOT_FOUND: Makina nuk u gjet në sistemin e Encars. Mund të jetë larguar nga shitja ose ID-ja është e pasaktë.",
      );
    } else if (response.status === 401 || response.status === 403) {
      throw new Error(
        "AUTH_ERROR: Probleme me autorizimin e API. Ju lutem kontaktoni mbështetjen teknike.",
      );
    } else if (response.status >= 500) {
      throw new Error(
        "SERVER_ERROR: Serveri i Encars nuk është i disponueshëm momentalisht. Ju lutem provoni më vonë.",
      );
    }
    
    throw new Error(
      `Encars API request failed (${response.status} ${response.statusText})${message ? `: ${message}` : ""}`,
    );
  }

  return (await response.json()) as T;
}

export async function fetchEncarsVehicle(
  vehicleId: string | number,
  include: string[] = [
    "ADVERTISEMENT",
    "CATEGORY",
    "CONDITION",
    "CONTACT",
    "MANAGE",
    "OPTIONS",
    "PHOTOS",
    "SPEC",
    "PARTNERSHIP",
    "CENTER",
    "VIEW",
  ],
  options?: EncarsFetchOptions,
): Promise<EncarsVehicleResponse> {
  const query =
    include && include.length > 0
      ? `?include=${encodeURIComponent(include.join(","))}`
      : "";
  return encarFetch<EncarsVehicleResponse>(
    `/v1/readside/vehicle/${vehicleId}${query}`,
    options,
  );
}

export async function fetchEncarsInspection(
  vehicleId: string | number,
  options?: EncarsFetchOptions,
): Promise<EncarsInspectionResponse> {
  return encarFetch<EncarsInspectionResponse>(
    `/v1/readside/inspection/vehicle/${vehicleId}`,
    options,
  );
}

export async function fetchEncarsInspectionSummary(
  vehicleId: string | number,
  options?: EncarsFetchOptions,
) {
  return encarFetch<Record<string, unknown>>(
    `/v1/readside/inspection/vehicle/${vehicleId}/summary`,
    options,
  );
}

export async function fetchEncarsRecordSummary(
  vehicleId: string | number,
  options?: EncarsFetchOptions,
): Promise<EncarsRecordSummaryResponse> {
  return encarFetch<EncarsRecordSummaryResponse>(
    `/v1/readside/record/vehicle/${vehicleId}/summary`,
    options,
  );
}

export async function fetchEncarsRecordOpen(
  vehicleId: string | number,
  vehicleNo: string,
  options?: EncarsFetchOptions,
): Promise<EncarsRecordOpenResponse> {
  const encodedVehicleNo = encodeURIComponent(vehicleNo.trim());
  return encarFetch<EncarsRecordOpenResponse>(
    `/v1/readside/record/vehicle/${vehicleId}/open?vehicleNo=${encodedVehicleNo}`,
    options,
  );
}

export {
  ENCAR_API_BASE_URL,
  ENCAR_API_TOKEN,
  ENCAR_IMAGE_BASE_URL,
  DEFAULT_ENCAR_API_TOKEN,
};

