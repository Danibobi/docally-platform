import type {ManifestV3Export} from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "DocAlly Enterprise Accessibility",
  version: "0.1.0",
  description: "Transforms dense workplace documents into private, accessible summaries.",
  permissions: ["activeTab", "storage", "scripting"],
  host_permissions: ["<all_urls>", "http://localhost:8787/*"],
  background: {
    service_worker: "src/service-worker.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content.tsx"],
      run_at: "document_idle",
      all_frames: false,
    },
  ],
  action: {
    default_title: "Open DocAlly",
  },
  commands: {
    "toggle-sidebar": {
      suggested_key: {
        default: "Alt+D",
        mac: "Alt+D",
      },
      description: "Toggle the DocAlly sidebar",
    },
  },
};

export default manifest;
