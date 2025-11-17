import React from "react";

export function Filters({ filters, onChange, categories, suppliers }) {
  return (
    <div className="filters">
      <div className="field">
        <label className="label">Search</label>
        <input
          className="input"
          placeholder="Search name, HNS code..."
          value={filters.q}
          onChange={e => onChange({ ...filters, q: e.target.value })}
        />
      </div>
      <div className="field">
        <label className="label">Category</label>
        <select
          className="select"
          value={filters.category}
          onChange={e => onChange({ ...filters, category: e.target.value })}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label className="label">Suppliers</label>
        <select
          className="select"
          value={filters.supplier}
          onChange={e => onChange({ ...filters, supplier: e.target.value })}
        >
          {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="field">
        <label className="label">Stocks quantity</label>
        <select
          className="select"
          value={filters.stock}
          onChange={e => onChange({ ...filters, stock: e.target.value })}
        >
          {["All", "Low", "OK", "High"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div />
    </div>
  );
}

