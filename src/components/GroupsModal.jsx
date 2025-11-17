import React, { useMemo, useState } from "react";

export function GroupsModal({
  onClose,
  items,
  groups,
  onCreateGroup,
  onDeleteGroup,
  onRenameGroup,
  onAddItem,
  onSetItemQty,
  onRemoveItem
}) {
  const [tab, setTab] = useState("existing"); // 'existing' | 'new'
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || null);
  const [itemSearch, setItemSearch] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [renameVal, setRenameVal] = useState("");

  const selectedGroup = useMemo(
    () => groups.find(g => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();
    return items.filter(i =>
      [i.name, i.sku, i.category, i.supplier].some(v => String(v).toLowerCase().includes(q))
    );
  }, [items, itemSearch]);

  function handleCreate() {
    const name = newGroupName.trim();
    if (!name) return;
    const id = onCreateGroup(name);
    setSelectedGroupId(id);
    setNewGroupName("");
    setTab("existing");
  }

  function handleSelectGroup(id) {
    setSelectedGroupId(id);
    const g = groups.find(x => x.id === id);
    setRenameVal(g ? g.name : "");
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 1100, maxWidth: "100%" }}>
        <div className="modal-header">
          <div style={{ fontWeight: 700 }}>Groups</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`button ${tab === "existing" ? "" : "ghost"}`} onClick={() => setTab("existing")}>Existing</button>
            <button className={`button ${tab === "new" ? "" : "ghost"}`} onClick={() => setTab("new")}>New Group</button>
            <button className="button ghost" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="modal-body" style={{ gridTemplateColumns: tab === "existing" ? "280px 1fr" : "1fr" }}>
          {tab === "new" && (
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label className="label">Group name</label>
              <input className="input" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g., Arduino Starter Kit Parts" />
            </div>
          )}

          {tab === "existing" && (
            <>
              <div className="panel" style={{ padding: 12 }}>
                <div className="field">
                  <label className="label">Groups</label>
                  <div style={{ display: "grid", gap: 6 }}>
                    {groups.length === 0 && <div className="empty">No groups yet. Create one in the New Group tab.</div>}
                    {groups.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <button className={`button ${selectedGroupId === g.id ? "" : "ghost"}`} onClick={() => handleSelectGroup(g.id)} style={{ flex: 1, textAlign: "left" }}>
                          {g.name}
                        </button>
                        <button
                          className="button ghost"
                          onClick={() => onDeleteGroup(g.id)}
                          title="Delete group"
                          style={{ padding: "6px 8px", fontSize: 12 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="panel" style={{ padding: 12 }}>
                {!selectedGroup && <div className="empty">Select a group to manage its items.</div>}
                {selectedGroup && (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div className="field">
                      <label className="label">Rename group</label>
                      <input className="input" value={renameVal} onChange={e => setRenameVal(e.target.value)} />
                    </div>

                    <div className="field">
                      <label className="label">Search</label>
                      <input className="input" placeholder="Search items by name, HNS, category..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
                    </div>

                    <div className="field">
                      <label className="label">Add items from all categories</label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <select className="select" onChange={e => onAddItem(selectedGroup.id, e.target.value, addQty)} defaultValue="" style={{ width: 260 }}>
                          <option value="" disabled>Select item to add</option>
                          {filteredItems.map(i => (
                            <option key={i.id} value={i.id}>{i.name} — {i.sku} ({i.category})</option>
                          ))}
                        </select>
                        <input type="number" className="input" value={addQty} min={1} onChange={e => setAddQty(Math.max(1, Number(e.target.value)))} style={{ width: 100 }} />
                        <span className="label">Qty</span>
                      </div>
                    </div>

                    <div className="table-wrap" style={{ maxHeight: 520 }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>HNS</th>
                            <th>Category</th>
                            <th>Qty</th>
                            <th>Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedGroup.items.length === 0 && (
                            <tr>
                              <td colSpan={5} className="empty">No items in this group yet.</td>
                            </tr>
                          )}
                          {selectedGroup.items.map(gi => {
                            const item = items.find(i => i.id === gi.itemId);
                            if (!item) return null;
                            return (
                              <tr key={gi.itemId}>
                                <td>{item.name}</td>
                                <td>{item.sku}</td>
                                <td>{item.category}</td>
                                <td>
                                  <input
                                    type="number"
                                    className="input"
                                    value={gi.qty}
                                    min={1}
                                    onChange={e => onSetItemQty(selectedGroup.id, gi.itemId, Math.max(1, Number(e.target.value)))}
                                    style={{ width: 100 }}
                                  />
                                </td>
                                <td>
                                  <button className="button ghost" style={{ padding: "6px 8px", fontSize: 12 }} onClick={() => onRemoveItem(selectedGroup.id, gi.itemId)}>Remove</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="button success" onClick={() => {
            // Handle save based on current tab
            if (tab === "new") {
              // Create new group if name is provided
              const name = newGroupName.trim();
              if (name) {
                const id = onCreateGroup(name);
                setSelectedGroupId(id);
                setNewGroupName("");
                setTab("existing");
              }
            } else if (tab === "existing") {
              // Save rename if changed
              if (selectedGroup && renameVal.trim() && renameVal !== selectedGroup.name) {
                onRenameGroup(selectedGroup.id, renameVal);
              }
            }
            onClose();
          }}>Save</button>
          <button className="button ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

