import { MODEL_QWEN_35 } from "./modelPresets";

/**
 * Treibhausgasintensität des deutschen Strommixes (Verbraucherstrom),
 * grob nach UBA-Veröffentlichungen (z. B. ~363 g/kWh für 2024).
 * Nur für grobe Orientierung — jährlicher Mittelwert, keine Standort-Garantie.
 */
export const DE_GRID_CO2_GRAMS_PER_KWH = 363;

/**
 * Power Usage Effectiveness: gemessener Wert eures RZ (Gesamtstrom der Anlage / IT-Ausrüstung).
 * Für den Footprint wird die GPU-bezogene Nutzenergie mit PUE multipliziert (Kühlung, USV-Verluste,
 * Verteilung usw. anteilig am IT-Verbrauch).
 */
export const DATACENTER_PUE = 1.35;

/**
 * Annahme: mittlere elektrische Leistung einer RTX 6000 Pro (96 GB)
 * während der Texterzeugung (Inferenz). Ohne CPU/RAM/Netzwerk — nur GPU-Karte.
 */
export const RTX6000_PRO_INFERENCE_WATTS = 450;

/** Qwen 122B läuft auf zwei GPUs; alle anderen konfigurierten Modelle auf einer. */
export function getInferenceGpuCount(modelId: string): number {
  return modelId === MODEL_QWEN_35 ? 2 : 1;
}

/**
 * Geschätztes CO₂-Äquivalent (Gramm) aus Generierungsdauer und Modell.
 * IT-Leistung [W] = GPUs × W_GPU; Facility-Leistung ≈ IT × PUE.
 * Energie [kWh] = (IT_W × PUE × s) / (1000 × 3600)
 */
export function estimateInferenceCo2Grams(generationSeconds: number, modelId: string): number {
  const itWatts = getInferenceGpuCount(modelId) * RTX6000_PRO_INFERENCE_WATTS;
  const facilityWatts = itWatts * DATACENTER_PUE;
  const kWh = (facilityWatts * generationSeconds) / (1000 * 3600);
  return kWh * DE_GRID_CO2_GRAMS_PER_KWH;
}
