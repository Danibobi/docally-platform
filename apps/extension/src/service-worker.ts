import {transformRequestSchema} from "@docally/shared";

const API_BASE = "http://localhost:8787";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    docallyApiBase: API_BASE,
    docallyMode: "autism-adhd",
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.tabs.sendMessage(tab.id, {type: "DOCALLY_TOGGLE"});
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-sidebar") return;
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  if (tab?.id) {
    await chrome.tabs.sendMessage(tab.id, {type: "DOCALLY_TOGGLE"});
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "DOCALLY_TRANSFORM") {
    handleTransform(message.payload).then(sendResponse);
    return true;
  }

  if (message?.type === "DOCALLY_AUDIO") {
    handleAudio(message.payload).then(sendResponse);
    return true;
  }

  return false;
});

async function apiBase(): Promise<string> {
  const value = await chrome.storage.sync.get(["docallyApiBase"]);
  return typeof value.docallyApiBase === "string" ? value.docallyApiBase : API_BASE;
}

async function handleTransform(payload: unknown) {
  const parsed = transformRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return {ok: false, error: "DocAlly could not read enough document text on this page."};
  }

  try {
    const response = await fetch(`${await apiBase()}/v1/transform`, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify(parsed.data),
    });

    const data = await response.json();
    if (!response.ok) {
      return {ok: false, error: data?.message || "The DocAlly API could not transform this document."};
    }

    return {ok: true, data};
  } catch {
    return {ok: false, error: "DocAlly API is unavailable. Start the API server or check the API URL."};
  }
}

async function handleAudio(payload: {text?: string}) {
  try {
    const response = await fetch(`${await apiBase()}/v1/audio`, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({text: payload?.text || ""}),
    });
    return {ok: response.ok, data: await response.json()};
  } catch {
    return {ok: false, error: "Audio service is unavailable."};
  }
}
