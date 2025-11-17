import { SHEETS_SCRIPT_URL } from "../config.js";

async function callSheetsApi(action, payload) {
	if (!SHEETS_SCRIPT_URL) return { ok: false, error: "NO_ENDPOINT" };
	try {
		// Use no-cors mode to avoid CORS preflight issues
		// Note: With no-cors, we can't send custom headers or read response
		// But Google Apps Script can still read the body from e.postData.contents
		// localStorage acts as backup, so this is acceptable
		await fetch(SHEETS_SCRIPT_URL, {
			method: "POST",
			// No custom headers with no-cors (Content-Type would trigger preflight)
			body: JSON.stringify({ action, payload }),
			mode: "no-cors" // Prevents CORS errors (response is opaque)
		});
		// Assume success since we can't read response with no-cors
		return { ok: true, data: {} };
	} catch (e) {
		// Network error - fail silently, localStorage will handle it
		return { ok: false, error: String(e?.message || e) };
	}
}

// Use GET for loading (avoids CORS preflight)
export async function loadItemsFromSheets() {
	if (!SHEETS_SCRIPT_URL) return { ok: false, error: "NO_ENDPOINT" };
	try {
		const url = new URL(SHEETS_SCRIPT_URL);
		url.searchParams.set("action", "loadItems");
		const res = await fetch(url.toString(), { method: "GET", mode: "cors" });
		if (!res.ok) return { ok: false, error: `HTTP_${res.status}` };
		const data = await res.json().catch(() => ({}));
		return { ok: true, data };
	} catch (e) {
		return { ok: false, error: String(e?.message || e) };
	}
}

export async function saveItemsToSheets(items) {
	return callSheetsApi("saveItems", { items });
}

// Use GET for loading (avoids CORS preflight)
export async function loadGroupsFromSheets() {
	if (!SHEETS_SCRIPT_URL) return { ok: false, error: "NO_ENDPOINT" };
	try {
		const url = new URL(SHEETS_SCRIPT_URL);
		url.searchParams.set("action", "loadGroups");
		const res = await fetch(url.toString(), { method: "GET", mode: "cors" });
		if (!res.ok) return { ok: false, error: `HTTP_${res.status}` };
		const data = await res.json().catch(() => ({}));
		return { ok: true, data };
	} catch (e) {
		return { ok: false, error: String(e?.message || e) };
	}
}

export async function saveGroupsToSheets(groups) {
	return callSheetsApi("saveGroups", { groups });
}


