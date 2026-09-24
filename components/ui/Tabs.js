// Accessible tab buttons for pop-ups whose tab list and content sit in different
// parts of the layout (e.g. tabs in the header, content in the body): arrow keys
// and Home/End move between tabs, only the selected tab is a Tab stop, and the
// selected tab points at its panel. Spread `tabPanelProps(idBase, value)` on the
// element that shows the selected tab's content.
export function TabList({ idBase, label, tabs, value, onChange, className, tabClassName }) {
  function onKeyDown(event) {
    const index = tabs.findIndex((t) => t.id === value);
    const last = tabs.length - 1;
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChange(tabs[next].id);
    document.getElementById(`${idBase}-tab-${tabs[next].id}`)?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className={className} onKeyDown={onKeyDown}>
      {tabs.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            id={`${idBase}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={selected ? `${idBase}-panel` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={tabClassName(selected)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function tabPanelProps(idBase, value) {
  return { id: `${idBase}-panel`, role: "tabpanel", "aria-labelledby": `${idBase}-tab-${value}` };
}
