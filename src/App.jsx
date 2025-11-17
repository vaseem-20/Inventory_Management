import React, { useEffect, useMemo, useState } from "react";
import { InventoryTable } from "./components/InventoryTable.jsx";
import { ItemFormModal } from "./components/ItemFormModal.jsx";
import { Filters } from "./components/Filters.jsx";
import { GroupsModal } from "./components/GroupsModal.jsx";
import { loadItemsFromSheets, saveItemsToSheets, loadGroupsFromSheets, saveGroupsToSheets } from "./services/sheetsApi.js";
import { SHEETS_SCRIPT_URL } from "./config.js";

const defaultItems = [
  { id: crypto.randomUUID(), name: "Soldering Iron Tip T12-K", sku: "TIP-T12-K", category: "Tools", supplier: "Hakko", qty: 18, minQty: 10, location: "Aisle 1", cost: 5.9 },
  { id: crypto.randomUUID(), name: "1kΩ Resistor 1/4W (100pcs)", sku: "RES-1K-0.25W", category: "Resistor", supplier: "Yageo", qty: 250, minQty: 100, location: "Aisle 3", cost: 1.2 },
  { id: crypto.randomUUID(), name: "Electrolytic Capacitor 100µF 25V (20pcs)", sku: "CAP-100UF-25V", category: "Capacitor", supplier: "Nichicon", qty: 40, minQty: 30, location: "Aisle 4", cost: 3.8 },
  { id: crypto.randomUUID(), name: "ESP32-WROOM-32 Module", sku: "MCU-ESP32-WROOM", category: "Microcontroller", supplier: "Espressif", qty: 6, minQty: 8, location: "Aisle 6", cost: 3.2 },
  { id: crypto.randomUUID(), name: "Tactile Switch 6x6x5mm (50pcs)", sku: "SW-6X6-5", category: "Switch", supplier: "Omron", qty: 120, minQty: 50, location: "Aisle 5", cost: 2.7 }
];

const defaultSuppliers = ["Hakko", "Yageo", "Nichicon", "Espressif", "Omron", "STMicro", "Murata"];
const defaultCategories = ["Tools", "Resistor", "Capacitor", "Microcontroller", "Switch", "Connector", "IC", "Misc"];

export default function App() {
  const [items, setItems] = useState(() => {
    const cached = localStorage.getItem("ews.items");
    return cached ? JSON.parse(cached) : defaultItems;
  });
  const [filters, setFilters] = useState({ q: "", category: "All", supplier: "All", stock: "All" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingField, setEditingField] = useState(null); // 'name' | 'sku' | null
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
  const [groups, setGroups] = useState(() => {
    const cached = localStorage.getItem("ews.groups");
    return cached ? JSON.parse(cached) : [];
  });

  useEffect(() => {
    localStorage.setItem("ews.items", JSON.stringify(items));
    if (SHEETS_SCRIPT_URL) {
      // Fire and forget; fallback is localStorage
      saveItemsToSheets(items);
    }
  }, [items]);
  useEffect(() => {
    localStorage.setItem("ews.groups", JSON.stringify(groups));
    if (SHEETS_SCRIPT_URL) {
      saveGroupsToSheets(groups);
    }
  }, [groups]);
  // Helper to find itemId by matching name, category, and sku
  function findItemIdByName(name, category, sku) {
    const item = items.find(i => 
      String(i.name || "").trim().toLowerCase() === String(name || "").trim().toLowerCase() &&
      String(i.category || "").trim().toLowerCase() === String(category || "").trim().toLowerCase() &&
      String(i.sku || "").trim().toLowerCase() === String(sku || "").trim().toLowerCase()
    );
    return item ? item.id : null;
  }

  useEffect(() => {
    // On mount: try Sheets first, else keep local cache
    (async () => {
      if (!SHEETS_SCRIPT_URL) return;
      const [itemsRes, groupsRes] = await Promise.all([loadItemsFromSheets(), loadGroupsFromSheets()]);
      
      if (itemsRes.ok && Array.isArray(itemsRes.data?.items)) {
        const loadedItems = itemsRes.data.items;
        setItems(loadedItems);
        
        // After items are loaded, update groups to match itemIds
        if (groupsRes.ok && Array.isArray(groupsRes.data?.groups)) {
          const groupsWithItemIds = groupsRes.data.groups.map(g => ({
            ...g,
            items: g.items.map(item => {
              // Try to find itemId by matching name, category, sku
              const matchedItem = loadedItems.find(i => 
                String(i.name || "").trim().toLowerCase() === String(item.name || "").trim().toLowerCase() &&
                String(i.category || "").trim().toLowerCase() === String(item.category || "").trim().toLowerCase() &&
                String(i.sku || "").trim().toLowerCase() === String(item.sku || "").trim().toLowerCase()
              );
              return {
                ...item,
                itemId: item.itemId || matchedItem?.id || null
              };
            })
          }));
          setGroups(groupsWithItemIds);
        }
      } else if (groupsRes.ok && Array.isArray(groupsRes.data?.groups)) {
        // If items didn't load but groups did, still set groups
        setGroups(groupsRes.data.groups);
      }
    })();
  }, []);

  const suppliers = useMemo(() => {
    const set = new Set(defaultSuppliers);
    items.forEach(i => set.add(i.supplier));
    return Array.from(set);
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set(defaultCategories);
    items.forEach(i => set.add(i.category));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    let out = items;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      out = out.filter(i => [i.name, i.sku, i.location, i.category, i.supplier].some(v => String(v).toLowerCase().includes(q)));
    }
    if (filters.category !== "All") out = out.filter(i => i.category === filters.category);
    if (filters.supplier !== "All") out = out.filter(i => i.supplier === filters.supplier);
    if (filters.stock !== "All") {
      out = out.filter(i => {
        if (filters.stock === "Low") return i.qty < i.minQty;
        if (filters.stock === "OK") return i.qty >= i.minQty && i.qty <= i.minQty * 3;
        if (filters.stock === "High") return i.qty > i.minQty * 3;
        return true;
      });
    }
    return out;
  }, [items, filters]);

  function openAdd() {
    setEditingItem(null);
    setIsModalOpen(true);
    setEditingField(null);
  }
  function openEdit(item, field = null) {
    setEditingItem(item);
    setIsModalOpen(true);
    setEditingField(field);
  }
  function closeModal() {
    setIsModalOpen(false);
    setEditingItem(null);
    setEditingField(null);
  }
  function saveItem(item) {
    if (item.id) {
      // Editing existing item
      const originalItem = items.find(i => i.id === item.id);
      if (!originalItem) return;
      
      // Check if category changed
      const categoryChanged = originalItem.category.trim().toLowerCase() !== item.category.trim().toLowerCase();
      
      if (categoryChanged) {
        // Category changed: check if item with same Name + new Category exists
        const nameKey = item.name.trim().toLowerCase();
        const newCategoryKey = item.category.trim().toLowerCase();
        const existingWithNewCategory = items.find(i => 
          i.id !== item.id && 
          i.name.trim().toLowerCase() === nameKey && 
          i.category.trim().toLowerCase() === newCategoryKey
        );
        
        if (existingWithNewCategory) {
          // Merge quantities into existing item with new category
          setItems(prev => {
            const updated = prev.map(i => {
              if (i.id === existingWithNewCategory.id) {
                // Merge into existing item with new category
                const newQty = Math.max(0, (i.qty || 0) + (originalItem.qty || 0));
                const unitPrice = Number(i.unitPrice ?? 0);
                const newCost = unitPrice * newQty;
                return {
                  ...i,
                  qty: newQty,
                  cost: newCost
                };
              }
              return i;
            });
            // Remove the old item (with old category)
            return updated.filter(i => i.id !== item.id);
          });
        } else {
          // No existing item with new category: just update the category
          setItems(prev => prev.map(i => {
            if (i.id !== item.id) return i;
            const unit = Number(item.unitPrice ?? i.unitPrice ?? 0);
            const qty = Number(item.qty ?? i.qty ?? 0);
            const cost = Math.max(0, unit * qty);
            return { ...i, ...item, cost };
          }));
        }
      } else {
        // Category didn't change: normal edit
        setItems(prev => prev.map(i => {
          if (i.id !== item.id) return i;
          const unit = Number(item.unitPrice ?? i.unitPrice ?? 0);
          const qty = Number(item.qty ?? i.qty ?? 0);
          const cost = Math.max(0, unit * qty);
          return { ...i, ...item, cost };
        }));
      }
    } else {
      // Adding new item: if same name+category exists, merge quantities (supplier independent)
      const nameKey = item.name.trim().toLowerCase();
      const categoryKey = item.category.trim().toLowerCase();
      const existing = items.find(i => i.name.trim().toLowerCase() === nameKey && i.category.trim().toLowerCase() === categoryKey);
      if (existing) {
        setItems(prev => prev.map(i => {
          if (i.id !== existing.id) return i;
          const newQty = Math.max(0, (i.qty || 0) + (item.qty || 0));
          const unitPrice = Number(i.unitPrice ?? 0);
          const newCost = unitPrice * newQty;
          return {
            ...i,
            // supplier independent: do not change existing supplier
            // keep existing price/HNS; only merge quantities
            qty: newQty,
            // recalculate cost based on unitPrice × quantity
            cost: newCost
          };
        }));
      } else {
        const unit = Number(item.unitPrice ?? 0);
        const qty = Number(item.qty ?? 0);
        const cost = Math.max(0, unit * qty);
        setItems(prev => [{ ...item, id: crypto.randomUUID(), cost }, ...prev]);
      }
    }
    closeModal();
  }
  function deleteItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }
  function adjustQty(id, delta) {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = Math.max(0, i.qty + delta);
      const unitPrice = Number(i.unitPrice ?? 0);
      const newCost = unitPrice * newQty;
      return { ...i, qty: newQty, cost: newCost };
    }));
  }
  function changeItemQty(itemId, delta) {
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const newQty = Math.max(0, i.qty + delta);
      const unitPrice = Number(i.unitPrice ?? 0);
      const newCost = unitPrice * newQty;
      return { ...i, qty: newQty, cost: newCost };
    }));
  }
  function getItemById(itemId) {
    return items.find(i => i.id === itemId);
  }
  function openGroups() {
    setIsGroupsOpen(true);
  }
  function closeGroups() {
    setIsGroupsOpen(false);
  }
  function createGroup(name) {
    const group = { id: crypto.randomUUID(), name: name.trim(), items: [] };
    setGroups(prev => [group, ...prev]);
    return group.id;
  }
  function deleteGroup(id) {
    // Restock all items back to inventory before deleting the group
    const g = groups.find(x => x.id === id);
    if (g) {
      g.items.forEach(gi => {
        changeItemQty(gi.itemId, gi.qty);
      });
    }
    setGroups(prev => prev.filter(g => g.id !== id));
  }
  function renameGroup(id, name) {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name: name.trim() } : g));
  }
  function addItemToGroup(groupId, itemId, qty) {
    const stockItem = getItemById(itemId);
    if (!stockItem) return;
    const available = stockItem.qty;
    if (available <= 0) return;
    const addQty = Math.max(1, Math.min(qty, available));
    // deduct from inventory
    changeItemQty(itemId, -addQty);
    // add to group with item details
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const existing = g.items.find(it => it.itemId === itemId);
      if (existing) {
        return {
          ...g,
          items: g.items.map(it => it.itemId === itemId ? { ...it, qty: it.qty + addQty } : it)
        };
      }
      // Store item details: name, category, sku (HNS code), and quantity
      return { 
        ...g, 
        items: [{ 
          itemId, 
          qty: addQty,
          name: stockItem.name,
          category: stockItem.category,
          sku: stockItem.sku
        }, ...g.items] 
      };
    }));
  }
  function setGroupItemQty(groupId, itemId, qty) {
    setGroups(prev => {
      const targetGroup = prev.find(g => g.id === groupId);
      if (!targetGroup) return prev;
      const gi = targetGroup.items.find(it => it.itemId === itemId);
      if (!gi) return prev;
      const currentQty = gi.qty;
      const desiredQty = Math.max(1, qty);
      const delta = desiredQty - currentQty;
      if (delta === 0) return prev;
      if (delta > 0) {
        // need more from inventory
        const stockItem = getItemById(itemId);
        const available = stockItem ? stockItem.qty : 0;
        const take = Math.min(delta, available);
        if (take <= 0) return prev;
        changeItemQty(itemId, -take);
        return prev.map(g => g.id === groupId
          ? { ...g, items: g.items.map(it => it.itemId === itemId ? { ...it, qty: currentQty + take } : it) }
          : g
        );
      } else {
        // return to inventory
        changeItemQty(itemId, -delta); // delta negative, so add back
        return prev.map(g => g.id === groupId
          ? { ...g, items: g.items.map(it => it.itemId === itemId ? { ...it, qty: desiredQty } : it) }
          : g
        );
      }
    });
  }
  function removeItemFromGroup(groupId, itemId) {
    setGroups(prev => {
      const targetGroup = prev.find(g => g.id === groupId);
      if (!targetGroup) return prev;
      const gi = targetGroup.items.find(it => it.itemId === itemId);
      if (!gi) return prev;
      // return qty to inventory
      changeItemQty(itemId, gi.qty);
      return prev.map(g => {
        if (g.id !== groupId) return g;
        return { ...g, items: g.items.filter(it => it.itemId !== itemId) };
      });
    });
  }

  return (
    <div className="app">
      <div className="header">
        <div className="brand">
          <span className="badge">Electronic Workshop</span>
          <div className="title">Stock Management</div>
        </div>
        <div className="toolbar">
          <button className="button secondary" onClick={openGroups}>{`Groups`}</button>
          <button className="button" onClick={openAdd}>Add Item</button>
          <button className="button ghost" onClick={() => setFilters({ q: "", category: "All", supplier: "All", stock: "All" })}>Reset Filters</button>
        </div>
      </div>

      <div className="panel">
        <Filters
          filters={filters}
          onChange={setFilters}
          categories={["All", ...categories]}
          suppliers={["All", ...suppliers]}
        />
        <div className="table-wrap">
          <InventoryTable
            items={filtered}
            onEdit={openEdit}
            onDelete={deleteItem}
            onAdjustQty={adjustQty}
          />
        </div>
      </div>

      {isModalOpen && (
        <ItemFormModal
          onClose={closeModal}
          onSave={saveItem}
          suppliers={suppliers}
          categories={categories}
          item={editingItem}
          editableField={editingField}
        />
      )}
      {isGroupsOpen && (
        <GroupsModal
          onClose={closeGroups}
          items={items}
          groups={groups}
          onCreateGroup={createGroup}
          onDeleteGroup={deleteGroup}
          onRenameGroup={renameGroup}
          onAddItem={addItemToGroup}
          onSetItemQty={setGroupItemQty}
          onRemoveItem={removeItemFromGroup}
        />
      )}
    </div>
  );
}

