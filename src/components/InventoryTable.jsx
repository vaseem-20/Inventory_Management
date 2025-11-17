import React, { useMemo, useState } from "react";

const headers = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "sku", label: "HNS code" }, // using existing sku field to store HNS code
  { key: "qty", label: "Quantity" },
  { key: "unitPrice", label: "unit Price" },
  { key: "cost", label: "Price" }
];

export function InventoryTable({ items, onEdit, onDelete, onAdjustQty }) {
  const [sort, setSort] = useState({ key: "name", dir: "asc" });

  function toggleSort(key) {
    setSort(prev => {
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: "asc" };
    });
  }

  const rows = useMemo(() => {
    const out = [...items];
    out.sort((a, b) => {
      const { key, dir } = sort;
      const av = a[key];
      const bv = b[key];
      if (typeof av === "number" && typeof bv === "number") {
        return dir === "asc" ? av - bv : bv - av;
      }
      return dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return out;
  }, [items, sort]);

  function qtyClass(item) {
    if (item.qty < item.minQty) return "qty-chip qty-low";
    if (item.qty > item.minQty * 3) return "qty-chip qty-ok";
    return "qty-chip qty-mid";
  }

  return (
    <table>
      <thead>
        <tr>
          {headers.map(h => (
            <th key={h.key} onClick={() => toggleSort(h.key)} style={{ cursor: "pointer" }}>
              {h.label} {sort.key === h.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={headers.length} className="empty">No items match your filters.</td>
          </tr>
        )}
        {rows.map(item => (
          <tr key={item.id}>
            <td>
              {item.name}
              <span
                title="Edit item"
                onClick={() => onEdit && onEdit(item, "name")}
                style={{ marginLeft: 8, cursor: "pointer", color: "#a6adcc" }}
              >
                ✎
              </span>
            </td>
            <td>
              {item.category}
              <span
                title="Edit category"
                onClick={() => onEdit && onEdit(item, "category")}
                style={{ marginLeft: 8, cursor: "pointer", color: "#a6adcc" }}
              >
                ✎
              </span>
            </td>
            <td>
              {item.sku}
              <span
                title="Edit item"
                onClick={() => onEdit && onEdit(item, "sku")}
                style={{ marginLeft: 8, cursor: "pointer", color: "#a6adcc" }}
              >
                ✎
              </span>
            </td>
            <td>
              <span className={qtyClass(item)}>{item.qty}</span>
              <span
                title="Edit quantity"
                onClick={() => onEdit && onEdit(item, "qty")}
                style={{ marginLeft: 8, cursor: "pointer", color: "#a6adcc" }}
              >
                ✎
              </span>
            </td>
            <td>₹{Number(item.unitPrice ?? 0).toFixed(2)}</td>
            <td>₹{item.cost.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

