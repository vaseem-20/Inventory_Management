import React, { useEffect, useMemo, useState } from "react";

const emptyItem = {
  id: null,
  name: "",
  sku: "",
  category: "",
  supplier: "",
  location: "",
  description: "",
  qty: 0,
  minQty: 0,
  cost: 0,
  unitPrice: 0
};

export function ItemFormModal({ onClose, onSave, suppliers, categories, item, editableField }) {
  const [model, setModel] = useState(emptyItem);
  const [errors, setErrors] = useState({});
  const [focus, setFocus] = useState({ qty: false, unitPrice: false, cost: false });

  useEffect(() => {
    if (item) {
      setModel(prev => ({
        ...prev,
        ...item,
        // Normalize all string fields (Sheets may return numbers/null)
        name: String(item.name ?? ""),
        sku: String(item.sku ?? ""),
        category: String(item.category ?? ""),
        supplier: String(item.supplier ?? ""),
        location: String(item.location ?? ""),
        description: String(item.description ?? ""),
        // Normalize numeric fields
        qty: Number(item.qty ?? 0),
        minQty: Number(item.minQty ?? 0),
        cost: Number(item.cost ?? 0),
        unitPrice: Number(item.unitPrice ?? 0)
      }));
    }
  }, [item]);

  const isEdit = useMemo(() => Boolean(model.id), [model.id]);

  function validate() {
    const e = {};
    // Ensure string fields are strings before calling .trim()
    const name = String(model.name ?? "");
    const sku = String(model.sku ?? "");
    const category = String(model.category ?? "");
    const supplier = String(model.supplier ?? "");
    
    if (!name.trim()) e.name = "Name is required";
    if (!sku.trim()) e.sku = "HNS code is required";
    if (!category.trim()) e.category = "Category is required";
    if (model.qty < 0) e.qty = "Qty cannot be negative";
    if (model.cost < 0) e.cost = "Cost cannot be negative";
    if (!supplier.trim()) e.supplier = "Supplier is required";
    if (model.unitPrice < 0) e.unitPrice = "Price for 1pc cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    // Ensure all string fields are strings before calling .trim()
    onSave({
      ...model,
      name: String(model.name ?? "").trim(),
      sku: String(model.sku ?? "").trim(),
      category: String(model.category ?? "").trim(),
      supplier: String(model.supplier ?? "").trim(),
      location: String(model.location ?? "").trim(),
      description: String(model.description ?? "").trim(),
      unitPrice: Number(model.unitPrice ?? 0)
    });
  }

  function update(field, value) {
    setModel(prev => ({ ...prev, [field]: value }));
  }
  function isDisabled(field) {
    return Boolean(editableField) && editableField !== field;
  }
  function handleFocus(field) {
    setFocus(prev => ({ ...prev, [field]: true }));
  }
  function handleBlur(field, parser = Number) {
    setFocus(prev => ({ ...prev, [field]: false }));
    // if empty, reset to 0
    setModel(prev => {
      const v = prev[field];
      if (v === "" || v === null || typeof v === "undefined") {
        return { ...prev, [field]: 0 };
      }
      // ensure numeric fields are numbers
      if (parser && typeof v === "string") {
        const num = parser(v);
        return { ...prev, [field]: isNaN(num) ? 0 : num };
      }
      return prev;
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ fontWeight: 700 }}>{isEdit ? "Edit Item" : "Add New Item"}</div>
          <button className="button ghost" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label className="label">Name</label>
            <input className="input" value={model.name} onChange={e => update("name", e.target.value)} placeholder="e.g., 10kΩ Resistor 1/4W" disabled={isDisabled("name")} autoFocus={editableField === "name"} />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>
          <div className="field">
            <label className="label">HNS code</label>
            <input className="input" value={model.sku} onChange={e => update("sku", e.target.value)} placeholder="e.g., HNS-RES-10K-025" disabled={isDisabled("sku")} autoFocus={editableField === "sku"} />
            {errors.sku && <span className="error">{errors.sku}</span>}
          </div>
          <div className="field">
            <label className="label">Category</label>
            <input list="category-list" className="input" value={model.category} onChange={e => update("category", e.target.value)} placeholder="Select or type" disabled={isDisabled("category")} />
            <datalist id="category-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
            {errors.category && <span className="error">{errors.category}</span>}
          </div>
          <div className="field">
            <label className="label">Supplier</label>
            <input className="input" value={model.supplier} onChange={e => update("supplier", e.target.value)} placeholder="e.g., Yageo" disabled={isDisabled("supplier")} />
            {errors.supplier && <span className="error">{errors.supplier}</span>}
          </div>
          <div className="field">
            <label className="label">Quantity</label>
            <input
              type="number"
              className="input"
              value={focus.qty && model.qty === 0 ? "" : model.qty}
              onChange={e => update("qty", Number(e.target.value))}
              onFocus={() => handleFocus("qty")}
              onBlur={() => handleBlur("qty", Number)}
              disabled={isDisabled("qty")}
            />
            {errors.qty && <span className="error">{errors.qty}</span>}
          </div>
          <div className="field">
            <label className="label"> unit Price (₹)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={focus.unitPrice && model.unitPrice === 0 ? "" : model.unitPrice}
              onChange={e => update("unitPrice", Number(e.target.value))}
              onFocus={() => handleFocus("unitPrice")}
              onBlur={() => handleBlur("unitPrice", Number)}
              disabled={isDisabled("unitPrice")}
            />
            {errors.unitPrice && <span className="error">{errors.unitPrice}</span>}
          </div>
          <div className="field">
            <label className="label">Price (₹)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={focus.cost && model.cost === 0 ? "" : model.cost}
              onChange={e => update("cost", Number(e.target.value))}
              onFocus={() => handleFocus("cost")}
              onBlur={() => handleBlur("cost", Number)}
              disabled={isDisabled("cost")}
            />
            {errors.cost && <span className="error">{errors.cost}</span>}
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={model.description} onChange={e => update("description", e.target.value)} placeholder="Optional notes, specs, or usage details" disabled={isDisabled("description")}></textarea>
          </div>
          <div />
        </div>
        <div className="modal-actions">
          <button className="button ghost" onClick={onClose}>Cancel</button>
          <button className="button success" onClick={submit}>{isEdit ? "Save Changes" : "Add Item"}</button>
        </div>
      </div>
    </div>
  );
}

