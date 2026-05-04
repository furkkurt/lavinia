import type { HepsijetCreateShipmentResponse, HepsijetTokenResponse } from "./types";
import type { HepsijetServerConfig } from "./env";
import { buildTestRetailShipmentJson } from "./payload";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function parseJsonBody(res: Response): Promise<unknown> {
  const t = await res.text();
  if (!t.trim()) return null;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return { raw: t } as const;
  }
}

export async function hepsijetGetToken(
  config: HepsijetServerConfig
): Promise<{ response: Response; body: HepsijetTokenResponse }> {
  const auth = Buffer.from(`${config.username}:${config.password}`, "utf8").toString("base64");
  const res = await fetch(`${config.baseUrl}/auth/getToken`, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  const body = (await parseJsonBody(res)) as HepsijetTokenResponse;
  return { response: res, body };
}

function extractToken(body: HepsijetTokenResponse): string | null {
  if (body?.data?.token) return String(body.data.token);
  return null;
}

export async function hepsijetWithToken(
  config: HepsijetServerConfig
): Promise<{ response: Response; body: HepsijetTokenResponse; token: string }> {
  const { response, body } = await hepsijetGetToken(config);
  const token = extractToken(body);
  if (!token) {
    const err = new Error(
      (body as { message?: string } | null)?.message || `Token yok (HTTP ${response.status})`
    ) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }
  return { response, body, token };
}

export async function hepsijetPostJson(
  config: HepsijetServerConfig,
  path: string,
  payload: unknown,
  token: string
): Promise<{ response: Response; body: unknown }> {
  const url = path.startsWith("http") ? path : `${config.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      "X-Auth-Token": token,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await parseJsonBody(res);
  return { response: res, body };
}

export async function hepsijetTrack(
  config: HepsijetServerConfig,
  barcodes: string[]
): Promise<{ response: Response; body: unknown }> {
  const { token } = await hepsijetWithToken(config);
  return hepsijetPostJson(
    config,
    "/rest/delivery/integration/track",
    { barcodes, isTrackAdded: true },
    token
  );
}

export async function hepsijetCreateTestRetailShipment(
  config: HepsijetServerConfig,
  options?: { productGtin?: string | null }
): Promise<{ response: Response; body: HepsijetCreateShipmentResponse; tokenMeta: HepsijetTokenResponse }> {
  const { body: tokenMeta, token } = await hepsijetWithToken(config);
  const deliveryDateOriginal = new Date().toISOString().slice(0, 10);
  const json = buildTestRetailShipmentJson({
    company: config.company,
    recipient: config.testRecipient,
    deliveryDateOriginal,
    productGtin: options?.productGtin,
  });
  const { response, body } = await hepsijetPostJson(
    config,
    "/rest/delivery/sendDeliveryOrderEnhanced",
    json,
    token
  );
  return { response, body: body as HepsijetCreateShipmentResponse, tokenMeta };
}
