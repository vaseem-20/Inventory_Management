Google Sheets sync (Apps Script Web App)
=======================================

Overview
--------
This app can sync Inventory Items and Groups to Google Sheets via a simple Google Apps Script Web App.

What you need
-------------
1) A Google Sheet (can be blank)
2) Apps Script bound to that Sheet
3) A published Web App URL with access for "Anyone with the link"

Apps Script (Code.gs)
---------------------
Paste this into a new script in your Sheet (Extensions → Apps Script):

```javascript
  let SHEET_ITEMS = "Items";
  let SHEET_GROUPS = "Groups";

  function ensureSheets_() {
    const ss = SpreadsheetApp.getActive();
    if (!ss.getSheetByName(SHEET_ITEMS)) ss.insertSheet(SHEET_ITEMS);
    if (!ss.getSheetByName(SHEET_GROUPS)) ss.insertSheet(SHEET_GROUPS);
  }

  function doGet(e) {
    ensureSheets_();
    // Handle GET requests for loading (no CORS preflight needed)
    const action = e.parameter.action || "";
    if (action === "loadItems") return json_({ ok: true, items: loadItems_() });
    if (action === "loadGroups") return json_({ ok: true, groups: loadGroups_() });
    return json_({ ok: false, error: "UNKNOWN_ACTION" }, 400);
  }

  function doPost(e) {
    ensureSheets_();
    // Handle POST body (works with or without Content-Type header)
    // With no-cors mode, Content-Type might not be set, but body is still readable
    const bodyText = e.postData ? e.postData.contents : "";
    let body = {};
    try {
      body = JSON.parse(bodyText || "{}");
    } catch (err) {
      return json_({ ok: false, error: "INVALID_JSON" }, 400);
    }
    const action = body.action;
    const payload = body.payload || {};
    if (action === "saveItems") return json_({ ok: true, ...saveItems_(payload.items || []) });
    if (action === "saveGroups") return json_({ ok: true, ...saveGroups_(payload.groups || []) });
    return json_({ ok: false, error: "UNKNOWN_ACTION" }, 400);
  }

  function doOptions() {
    // Handle CORS preflight for POST requests
    // Google Apps Script automatically adds CORS headers when deployed as "Anyone"
    return ContentService.createTextOutput("")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  function json_(obj, code) {
    const out = ContentService.createTextOutput(JSON.stringify(obj));
    out.setMimeType(ContentService.MimeType.JSON);
    // Note: CORS headers are automatically added by Google Apps Script
    // when Web App is deployed with "Who has access: Anyone"
    if (code) out.setContent(JSON.stringify({ code, ...obj }));
    return out;
  }

  function saveItems_(items) {
    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_ITEMS);
    sh.clear();
    const headers = ["Id","Name","HNScode","Category","Supplier","Location","Description","Qty","MinQty","UnitPrice","Cost"];
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    if (!items.length) return {};
    const rows = items.map(i => [i.id,i.name,i.sku,i.category,i.supplier,i.location,i.description,i.qty,i.minQty,i.unitPrice,i.cost]);
    sh.getRange(2,1,rows.length,headers.length).setValues(rows);
    return {};
  }
  function loadItems_() {
    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_ITEMS);
    const values = sh.getDataRange().getValues();
    if (values.length <= 1) return [];
    const headers = values[0];
    return values.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, idx) => obj[h] = r[idx]);
      // Map capitalized headers to lowercase for internal use (backward compatibility)
      return {
        id: obj.Id || obj.id || "",
        name: obj.Name || obj.name || "",
        sku: obj.HNScode || obj.Sku || obj.sku || "",
        category: obj.Category || obj.category || "",
        supplier: obj.Supplier || obj.supplier || "",
        location: obj.Location || obj.location || "",
        description: obj.Description || obj.description || "",
        qty: Number(obj.Qty || obj.qty || 0),
        minQty: Number(obj.MinQty || obj.minQty || 0),
        unitPrice: Number(obj.UnitPrice || obj.unitPrice || 0),
        cost: Number(obj.Cost || obj.cost || 0)
      };
    });
  }

function saveGroups_(groups) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_GROUPS);
  sh.clear();
  // Save groups with expanded item details: GroupId, GroupName, ItemId, ItemName, Category, HnsCode, Quantity
  const headers = ["GroupId", "GroupName", "ItemId", "ItemName", "Category", "HnsCode", "Quantity"];
  sh.getRange(1,1,1,headers.length).setValues([headers]);
  if (!groups.length) return {};
  
  // Flatten groups: each row is one item in a group
  const rows = [];
  groups.forEach(g => {
    (g.items || []).forEach(item => {
      rows.push([
        g.id,
        g.name,
        item.itemId || "",
        item.name || "",
        item.category || "",
        item.sku || "",
        item.qty || 0
      ]);
    });
  });
  
  if (rows.length > 0) {
    sh.getRange(2,1,rows.length,headers.length).setValues(rows);
  }
  return {};
}
function loadGroups_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_GROUPS);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  
  // Group rows by GroupId (handle both capitalized and lowercase for backward compatibility)
  const groupsMap = {};
  values.slice(1).forEach(r => {
    const obj = {};
    headers.forEach((h, idx) => obj[h] = r[idx]);
    // Handle both capitalized and lowercase header names
    const groupId = obj.GroupId || obj.groupId || "";
    const groupName = obj.GroupName || obj.groupName || "";
    
    if (!groupsMap[groupId]) {
      groupsMap[groupId] = {
        id: groupId,
        name: groupName,
        items: []
      };
    }
    
    // Add item details (handle both capitalized and lowercase)
    const itemId = obj.ItemId || obj.itemId || "";
    const itemName = obj.ItemName || obj.itemName || "";
    const category = obj.Category || obj.category || "";
    const hnsCode = obj.HnsCode || obj.hnsCode || "";
    const quantity = obj.Quantity || obj.quantity || 0;
    
    if (itemName || hnsCode || itemId) {
      groupsMap[groupId].items.push({
        itemId: itemId,
        name: itemName,
        category: category,
        sku: hnsCode,
        qty: Number(quantity)
      });
    }
  });
  
  return Object.values(groupsMap);
}
```

Deploy the Web App
------------------
**CRITICAL STEPS (must follow exactly):**

1) Apps Script → Deploy → New deployment
2) Type: **Web app** (not API executable)
3) Description: "Stock Management API" (optional)
4) Execute as: **Me** (your email)
5) Who has access: **Anyone** (THIS IS CRITICAL - must be "Anyone", not "Only myself")
6) Click **Deploy**
7) **Copy the Web app URL** (starts with https://script.google.com/macros/s/...)

**IMPORTANT:** After making ANY changes to the Apps Script code:
- You MUST create a new version: Deploy → Manage deployments → Edit (pencil) → New version → Deploy
- The URL stays the same, but you must redeploy for changes to take effect

Configure the URL in the app
----------------------------
Edit `src/config.js` and set:

```js
export const SHEETS_SCRIPT_URL = "YOUR_WEB_APP_URL_HERE";
```

Data format
-----------
- **Items sheet columns:** Id,Name,HNScode,Category,Supplier,Location,Description,Qty,MinQty,UnitPrice,Cost
- **Groups sheet columns:** GroupId,GroupName,ItemId,ItemName,Category,HnsCode,Quantity
  - Each row represents one item in a group
  - Multiple rows can have the same GroupId (one item per row)
  - Example: If Group "Arduino Kit" has 2 items, there will be 2 rows with the same GroupId
  - ItemId links to the Items sheet, ItemName/Category/HnsCode are stored for reference

Troubleshooting CORS Errors
----------------------------
If you see CORS errors in the browser console:

1. **Verify deployment settings:**
   - Go to Apps Script → Deploy → Manage deployments
   - Click Edit (pencil icon)
   - Ensure "Who has access" is set to **"Anyone"** (not "Only myself")
   - If changed, create a new version and redeploy

2. **Redeploy after code changes:**
   - After updating Apps Script code, you MUST create a new version
   - Deploy → Manage deployments → Edit → New version → Deploy

3. **Test the endpoint:**
   - Open in browser: `YOUR_URL?action=loadItems`
   - Should return JSON: `{"ok":true,"items":[]}`
   - If you see an error page, the deployment is incorrect

4. **Note about POST requests:**
   - The app uses "no-cors" mode for saving to avoid CORS errors
   - Data is still saved to Google Sheets, but response can't be read
   - localStorage acts as a backup, so your data is safe

5. **If CORS persists:**
   - The app will continue working with localStorage only
   - All data is saved locally as backup
   - You can manually export/import data if needed


