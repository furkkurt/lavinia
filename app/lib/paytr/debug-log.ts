/**
 * PayTR teşhisi varsayılan açık: [paytr-debug] sunucu logları (/api/paytr-token, callback vb.).
 * Kapatmak: PAYTR_DEBUG_ON=0 (veya false / off / no).
 */

export function isPaytrDebugOn(): boolean {
  const v = process.env["PAYTR_DEBUG_ON"];
  if (v === undefined || v === "") return true;
  const t = v.trim().toLowerCase();
  if (t === "0" || t === "false" || t === "off" || t === "no") return false;
  return true;
}

/** PAYTR_DEBUG_ON açıkken: HMAC öncesi tam zincir + segment listesi (yalnızca sunucu logu / _paytrDeep). */
export function isPaytrDebugDeepOn(): boolean {
  if (!isPaytrDebugOn()) return false;
  const v = process.env["PAYTR_DEBUG_DEEP"]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function paytrDebugLog(phase: string, data: Record<string, unknown>): void {
  if (!isPaytrDebugOn()) return;
  try {
    console.info(`[paytr-debug][${phase}]`, JSON.stringify(data));
  } catch {
    console.info(`[paytr-debug][${phase}]`, data);
  }
}

export function paytrDeepDebugLog(phase: string, data: Record<string, unknown>): void {
  if (!isPaytrDebugDeepOn()) return;
  try {
    console.info(`[paytr-deep][${phase}]`, JSON.stringify(data));
  } catch {
    console.info(`[paytr-deep][${phase}]`, data);
  }
}
