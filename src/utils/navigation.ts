export const buildAppUrl = (path: string) => {
  if (typeof window === "undefined") {
    return path;
  }

  try {
    return path.startsWith("http")
      ? path
      : new URL(path.startsWith("/") ? path : `/${path}`, window.location.origin).toString();
  } catch (error) {
    console.error("Failed to build app url", { path, error });
    return path;
  }
};

export const openPathInNewTab = (path: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const url = buildAppUrl(path);
  window.open(url, "_blank", "noopener,noreferrer");
};

export const openCarDetailsInNewTab = (lotOrId?: string | number | null) => {
  if (lotOrId === undefined || lotOrId === null) return;
  const safeId = encodeURIComponent(String(lotOrId));
  openPathInNewTab(`/car/${safeId}`);
};

export const openCarReportInNewTab = (lotOrId?: string | number | null) => {
  if (lotOrId === undefined || lotOrId === null) return;
  const safeId = encodeURIComponent(String(lotOrId));
  openPathInNewTab(`/car/${safeId}/report`);
};
