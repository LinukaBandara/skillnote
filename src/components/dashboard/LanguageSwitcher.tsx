import { updatePreferredLanguage } from "@/app/language/actions";
import type { PreferredLanguage } from "@/types/db";

const OPTIONS: { value: PreferredLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "si", label: "සිංහල" },
  { value: "ta", label: "தமிழ்" },
];

export function LanguageSwitcher({ current = "en" }: { current?: PreferredLanguage | null }) {
  return (
    <form action={updatePreferredLanguage} className="px-1 mb-3">
      <label className="sr-only" htmlFor="skill-note-language">Content language</label>
      <select
        id="skill-note-language"
        name="language"
        defaultValue={current ?? "en"}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="w-full text-xs text-ink-soft bg-transparent border border-rule rounded-full px-3 py-2 focus:outline-none focus:border-cobalt"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </form>
  );
}
