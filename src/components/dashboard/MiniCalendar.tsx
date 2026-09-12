export function MiniCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Monday-first offset
  const mondayOffset = (firstDay + 6) % 7;

  const cells: { day: number; current: boolean }[] = [];
  for (let i = mondayOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 35) {
    cells.push({ day: cells.length, current: false });
  }

  return (
    <div>
      <p className="text-sm font-medium mb-3">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-ink-faint">{d}</span>
        ))}
        {cells.map((c, i) => {
          const isToday = c.current && c.day === today;
          return (
            <span
              key={i}
              className={`w-6 h-6 mx-auto flex items-center justify-center rounded-full ${
                isToday
                  ? "bg-cobalt text-white font-medium"
                  : c.current
                  ? "text-ink"
                  : "text-ink-faint/40"
              }`}
            >
              {c.day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
