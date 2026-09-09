"use client";

import { useMemo, useState, type ReactNode } from "react";

export type FilterItem = {
  id: string;
  /** One or more filter keys this item belongs to. */
  tags: string[];
  render: ReactNode;
};

type FilterGridProps = {
  items: FilterItem[];
  filters: { key: string; label: string }[];
  /** Class applied to the grid container — use the template's own grid class. */
  gridClassName?: string;
  itemClassName?: string;
};

/**
 * Replaces Isotope/Masonry filtering. CSS grid handles the layout (the template's
 * gallery is a regular grid, not true masonry), so no layout library is needed —
 * this just filters which items render.
 *
 * If a section turns out to need genuine masonry (uneven column flow), switch the
 * grid container to `column-count` CSS rather than reintroducing Isotope.
 */
export default function FilterGrid({
  items,
  filters,
  gridClassName = "",
  itemClassName = "",
}: FilterGridProps) {
  const [active, setActive] = useState("*");

  const visible = useMemo(
    () => (active === "*" ? items : items.filter((i) => i.tags.includes(active))),
    [items, active],
  );

  return (
    <>
      <ul className="gallery-filter" role="tablist">
        <li>
          <button
            type="button"
            role="tab"
            aria-selected={active === "*"}
            className={active === "*" ? "selected" : ""}
            onClick={() => setActive("*")}
          >
            All
          </button>
        </li>
        {filters.map((f) => (
          <li key={f.key}>
            <button
              type="button"
              role="tab"
              aria-selected={active === f.key}
              className={active === f.key ? "selected" : ""}
              onClick={() => setActive(f.key)}
            >
              {f.label}
            </button>
          </li>
        ))}
      </ul>

      <div className={gridClassName}>
        {visible.map((item) => (
          <div key={item.id} className={itemClassName}>
            {item.render}
          </div>
        ))}
      </div>
    </>
  );
}
