export const SUPPORTED_LANGUAGES = ["en", "si", "ta"] as const;

export type ContentLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface ContentLanguageRecord {
  code: ContentLanguage;
  name: string;
  native_name: string;
  direction: "ltr" | "rtl";
  is_active: boolean;
}

export function normalizeLanguage(value: string | null | undefined): ContentLanguage {
  if (value === "si" || value === "ta") return value;
  return "en";
}

export function languageFallbackChain(preferred: ContentLanguage): ContentLanguage[] {
  return preferred === "en" ? ["en"] : [preferred, "en"];
}

export function getLocalizedValue<T extends Record<string, unknown>>(
  values: T | null | undefined,
  preferred: ContentLanguage,
): unknown {
  if (!values) return undefined;
  for (const language of languageFallbackChain(preferred)) {
    if (values[language] != null && values[language] !== "") return values[language];
  }
  return undefined;
}
