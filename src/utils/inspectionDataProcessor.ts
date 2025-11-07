import { mapInspectionTypeToPartId } from './inspectionMapping';

export interface InspectionItem {
  type: { code: string; title: string };
  statusTypes: Array<{ code: string; title: string }>;
  attributes: string[];
  mappedPartId?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  X: "Exchange (replacement)",
  W: "Welding",
  A: "Repair",
  C: "Panel repair",
  S: "Scratch",
  U: "Corrosion",
  P: "Paint",
};

const normalizeStatusEntry = (entry: any): { code: string; title: string } | null => {
  if (entry === null || entry === undefined) return null;

  const buildStatus = (codeRaw: string | null, titleRaw: string | null) => {
    const code = codeRaw ? codeRaw.trim().toUpperCase() : "";
    const fallbackTitle = (code && STATUS_LABELS[code]) || undefined;
    const title = titleRaw?.trim() || fallbackTitle || code;
    if (!code && !title) return null;
    return {
      code: code || (title ? title.charAt(0).toUpperCase() : ""),
      title: title || code,
    };
  };

  if (typeof entry === "string" || typeof entry === "number") {
    const text = entry.toString().trim();
    if (!text) return null;
    const normalizedCode = text.length <= 3 ? text.toUpperCase() : text.charAt(0).toUpperCase();
    return buildStatus(normalizedCode, text);
  }

  if (typeof entry === "object") {
    const codeCandidate =
      entry.code ??
      entry.id ??
      entry.key ??
      entry.value ??
      entry.status ??
      entry.type ??
      null;
    const titleCandidate =
      entry.title ??
      entry.name ??
      entry.label ??
      entry.description ??
      entry.text ??
      entry.value ??
      null;
    return buildStatus(
      codeCandidate != null ? String(codeCandidate) : null,
      titleCandidate != null ? String(titleCandidate) : null,
    );
  }

  return null;
};

const dedupeStatuses = (statuses: Array<{ code: string; title: string }>) => {
  const seen = new Set<string>();
  const result: Array<{ code: string; title: string }> = [];
  for (const status of statuses) {
    if (!status) continue;
    const key = `${status.code}|${status.title}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      code: status.code || "",
      title: status.title || status.code || "",
    });
  }
  return result;
};

export const extractInspectionItemsFromSource = (source: unknown): InspectionItem[] => {
  const results: InspectionItem[] = [];
  const visited = new WeakSet<object>();

  const addAttributesFromCandidate = (container: Set<string>, candidate: unknown) => {
    if (!candidate) return;
    if (Array.isArray(candidate)) {
      candidate.forEach((entry) => {
        if (entry !== null && entry !== undefined) {
          const text = String(entry).trim();
          if (text) container.add(text);
        }
      });
      return;
    }
    if (typeof candidate === "string") {
      candidate
        .split(/[\r\n]+|,|•|\u2022/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => container.add(part));
      return;
    }
    if (typeof candidate === "object") {
      Object.values(candidate).forEach((value) => addAttributesFromCandidate(container, value));
    }
  };

  const visit = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      if (visited.has(value)) return;
      visited.add(value);

      const obj = value as Record<string, any>;
      const rawType = obj.type ?? obj.part ?? obj.location ?? obj.body_part ?? obj.item;

      let codeCandidate: string | null = null;
      let titleCandidate: string | null = null;

      const assignFrom = (input: any) => {
        if (!input) return;
        if (typeof input === "string" || typeof input === "number") {
          const text = String(input).trim();
          if (!text) return;
          if (!titleCandidate) titleCandidate = text;
          if (!codeCandidate) codeCandidate = text;
          return;
        }
        if (typeof input === "object") {
          const code =
            input.code ??
            input.id ??
            input.key ??
            input.value ??
            input.part_code ??
            input.partId ??
            input.position ??
            input.slug ??
            null;
          const title =
            input.title ??
            input.name ??
            input.label ??
            input.description ??
            input.part_name ??
            input.display ??
            input.text ??
            null;
          if (code != null && !codeCandidate) codeCandidate = String(code);
          if (title != null && !titleCandidate) titleCandidate = String(title);
        }
      };

      assignFrom(rawType);
      assignFrom(obj);

      if (codeCandidate || titleCandidate) {
        if (!codeCandidate && titleCandidate) codeCandidate = titleCandidate;
        if (!titleCandidate && codeCandidate) titleCandidate = codeCandidate;

        const statusCandidates = [
          obj.statusTypes,
          obj.status_types,
          obj.status,
          obj.statuses,
          obj.repair_types,
          obj.repairType,
          obj.repairs,
          obj.repair,
          obj.result,
          obj.damage_types,
          obj.simple_repair,
        ];

        const statuses: Array<{ code: string; title: string }> = [];
        statusCandidates.forEach((candidate) => {
          if (!candidate) return;
          if (Array.isArray(candidate)) {
            candidate.forEach((entry) => {
              const normalized = normalizeStatusEntry(entry);
              if (normalized) statuses.push(normalized);
            });
          } else if (typeof candidate === "object") {
            Object.values(candidate).forEach((entry) => {
              const normalized = normalizeStatusEntry(entry);
              if (normalized) statuses.push(normalized);
            });
          } else {
            const normalized = normalizeStatusEntry(candidate);
            if (normalized) statuses.push(normalized);
          }
        });

        const attributes = new Set<string>();
        [
          obj.attributes,
          obj.attribute,
          obj.attr,
          obj.descriptions,
          obj.description,
          obj.details,
          obj.detail,
          obj.comments,
          obj.comment,
        ].forEach((candidate) => addAttributesFromCandidate(attributes, candidate));

        const mappedPartId =
          mapInspectionTypeToPartId({ code: codeCandidate || undefined, title: titleCandidate || undefined }) ||
          Array.from(attributes)
            .map((attr) => mapInspectionTypeToPartId(undefined, attr))
            .find((id): id is string => Boolean(id)) ||
          null;

        results.push({
          type: {
            code: codeCandidate || "",
            title: titleCandidate || codeCandidate || "",
          },
          statusTypes: dedupeStatuses(statuses),
          attributes: Array.from(attributes),
          mappedPartId,
        });
      }

      Object.values(obj).forEach(visit);
    }
  };

  visit(source);
  return results;
};

export const mergeInspectionItems = (items: InspectionItem[]): InspectionItem[] => {
  const merged = new Map<string, InspectionItem>();

  for (const item of items) {
    if (!item?.type) continue;
    const key = [
      item.mappedPartId || "",
      item.type.code || "",
      item.type.title || "",
    ]
      .join("|")
      .toLowerCase();

    const existing = merged.get(key);
    if (existing) {
      const combinedStatuses = dedupeStatuses([...existing.statusTypes, ...item.statusTypes]);
      const combinedAttributes = Array.from(new Set([...existing.attributes, ...item.attributes]));
      merged.set(key, {
        type: {
          code: existing.type.code || item.type.code || "",
          title: existing.type.title || item.type.title || existing.type.code || item.type.code || "",
        },
        statusTypes: combinedStatuses,
        attributes: combinedAttributes,
        mappedPartId: existing.mappedPartId || item.mappedPartId || mapInspectionTypeToPartId(item.type) || null,
      });
    } else {
      merged.set(key, {
        type: {
          code: item.type.code || "",
          title: item.type.title || item.type.code || "",
        },
        statusTypes: dedupeStatuses(item.statusTypes),
        attributes: Array.from(new Set(item.attributes)),
        mappedPartId: item.mappedPartId || mapInspectionTypeToPartId(item.type) || null,
      });
    }
  }

  return Array.from(merged.values());
};
