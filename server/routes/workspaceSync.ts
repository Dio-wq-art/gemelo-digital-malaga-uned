import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import zlib from "zlib";

const router = express.Router();

export interface StoredWorkspacePayload {
  version: string;
  updatedAtIso: string;
  deviceLabel: string;
  activePoint?: {
    lat: number;
    lon: number;
    address: string;
    streetName?: string;
  };
  multiformatDirectorOrders: any[];
  customDirectorClauses: any[];
  approvedRadarIds: string[];
  dismissedRadarIds: string[];
  pinnedPointA: any | null;
  tabOrders: Record<string, string[]>;
  defenseLockActive?: boolean;
}

export interface RestorePointSnapshot {
  snapshotId: string;
  savedAtIso: string;
  deviceLabel: string;
  verificationCode: string;
  ordersCount: number;
  clausesCount: number;
  approvedDoisCount: number;
  activeStreet: string;
  payload: StoredWorkspacePayload;
}

interface PersistentCloudStore {
  current: StoredWorkspacePayload;
  verificationCode: string;
  sha256Signature: string;
  restorePoints: RestorePointSnapshot[];
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const SYNC_FILE_PATH = path.join(DATA_DIR, "doctoral_workspace_sync.json");
const MAX_RESTORE_POINTS = 5;

function computeVerificationMetadata(payload: StoredWorkspacePayload): {
  verificationCode: string;
  sha256Signature: string;
} {
  const canonical = JSON.stringify({
    ordersIds: (payload.multiformatDirectorOrders || []).map((o: any) => o?.id || o?.code || "").sort(),
    clausesIds: (payload.customDirectorClauses || []).map((c: any) => c?.clauseId || c?.section || "").sort(),
    approvedRadarIds: [...(payload.approvedRadarIds || [])].sort(),
    dismissedRadarIds: [...(payload.dismissedRadarIds || [])].sort(),
    activeLat: payload.activePoint?.lat ? Number(payload.activePoint.lat.toFixed(5)) : 36.7168,
    activeLon: payload.activePoint?.lon ? Number(payload.activePoint.lon.toFixed(5)) : -4.4234
  });

  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < canonical.length; i++) {
    const code = canonical.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code ^ (i & 0xff);
    h2 = Math.imul(h2, 0x01000193);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0").toUpperCase();
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0").toUpperCase();
  const shortHex = hex1.slice(0, 4);
  const sha256Hex = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16).toUpperCase();

  return {
    verificationCode: `#UNED-${shortHex}`,
    sha256Signature: `${hex1}${hex2}-${sha256Hex}-UNED2026`
  };
}

function getDefaultPayload(): StoredWorkspacePayload {
  return {
    version: "2.5.0-UNED-CLOUD-USB",
    updatedAtIso: new Date().toISOString(),
    deviceLabel: "Servidor Central UNED",
    activePoint: {
      lat: 36.7168,
      lon: -4.4234,
      address: "Alameda Principal, Málaga",
      streetName: "Alameda Principal"
    },
    multiformatDirectorOrders: [],
    customDirectorClauses: [],
    approvedRadarIds: ["sota_cp_pre_2025", "sota_dml_metfix_lez_2025", "sota_sentinel4_mtg_s1_2025"],
    dismissedRadarIds: [],
    pinnedPointA: null,
    tabOrders: {},
    defenseLockActive: false
  };
}

function readPersistentStore(): PersistentCloudStore {
  try {
    if (fs.existsSync(SYNC_FILE_PATH)) {
      const raw = fs.readFileSync(SYNC_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as PersistentCloudStore;
      if (parsed && parsed.current) {
        const meta = computeVerificationMetadata(parsed.current);
        return {
          current: parsed.current,
          verificationCode: meta.verificationCode,
          sha256Signature: meta.sha256Signature,
          restorePoints: Array.isArray(parsed.restorePoints) ? parsed.restorePoints.slice(0, MAX_RESTORE_POINTS) : []
        };
      }
    }
  } catch {
    // Fallback to clean deterministic store
  }
  const initial = getDefaultPayload();
  const meta = computeVerificationMetadata(initial);
  return {
    current: initial,
    verificationCode: meta.verificationCode,
    sha256Signature: meta.sha256Signature,
    restorePoints: []
  };
}

function writePersistentStore(store: PersistentCloudStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // Ignore read-only filesystem errors in ephemeral containers
  }
}

function unionByKey<T extends Record<string, any>>(existingArr: T[], incomingArr: T[], keyField: string): T[] {
  const map = new Map<string, T>();
  for (const item of existingArr || []) {
    if (item && typeof item === "object") {
      const key = String(item[keyField] || item.id || item.code || JSON.stringify(item));
      map.set(key, item);
    }
  }
  for (const item of incomingArr || []) {
    if (item && typeof item === "object") {
      const key = String(item[keyField] || item.id || item.code || JSON.stringify(item));
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

function unionStrings(a: string[], b: string[]): string[] {
  return Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]));
}

// GET /api/workspace-sync -> Returns current cloud state + 5 restore points
router.get("/api/workspace-sync", (_req, res) => {
  const store = readPersistentStore();
  res.json({
    status: "ok",
    serverTimestampIso: new Date().toISOString(),
    verificationCode: store.verificationCode,
    sha256Signature: store.sha256Signature,
    current: store.current,
    restorePoints: store.restorePoints
  });
});

// POST /api/workspace-sync -> Non-destructive union merge or explicit snapshot restore
router.post(
  "/api/workspace-sync",
  express.text({ type: ["text/plain", "application/json"], limit: "25mb" }),
  (req, res) => {
    try {
      const store = readPersistentStore();
      let bodyObj: any = req.body;
      if (typeof bodyObj === "string" && bodyObj.trim().length > 0) {
        try {
          bodyObj = JSON.parse(bodyObj);
        } catch {
          bodyObj = {};
        }
      }

      const incoming: Partial<StoredWorkspacePayload> = bodyObj?.payload || bodyObj || {};
      const forceOverwrite = Boolean(bodyObj?.forceRestoreSnapshot);
      const deviceLabel = String(incoming.deviceLabel || bodyObj?.deviceLabel || "Dispositivo Doctoral");

      let nextCurrent: StoredWorkspacePayload;

      if (forceOverwrite) {
        nextCurrent = {
          version: "2.5.0-UNED-CLOUD-USB",
          updatedAtIso: new Date().toISOString(),
          deviceLabel,
          activePoint: incoming.activePoint || store.current.activePoint,
          multiformatDirectorOrders: Array.isArray(incoming.multiformatDirectorOrders)
            ? incoming.multiformatDirectorOrders
            : store.current.multiformatDirectorOrders,
          customDirectorClauses: Array.isArray(incoming.customDirectorClauses)
            ? incoming.customDirectorClauses
            : store.current.customDirectorClauses,
          approvedRadarIds: Array.isArray(incoming.approvedRadarIds)
            ? incoming.approvedRadarIds
            : store.current.approvedRadarIds,
          dismissedRadarIds: Array.isArray(incoming.dismissedRadarIds)
            ? incoming.dismissedRadarIds
            : store.current.dismissedRadarIds,
          pinnedPointA: incoming.pinnedPointA !== undefined ? incoming.pinnedPointA : store.current.pinnedPointA,
          tabOrders: incoming.tabOrders || store.current.tabOrders || {},
          defenseLockActive:
            typeof incoming.defenseLockActive === "boolean"
              ? incoming.defenseLockActive
              : store.current.defenseLockActive
        };
      } else {
        // Fusión Inteligente sin Pérdida (Union-by-ID)
        nextCurrent = {
          version: "2.5.0-UNED-CLOUD-USB",
          updatedAtIso: new Date().toISOString(),
          deviceLabel,
          activePoint: incoming.activePoint?.address ? incoming.activePoint : store.current.activePoint,
          multiformatDirectorOrders: unionByKey(
            store.current.multiformatDirectorOrders,
            incoming.multiformatDirectorOrders || [],
            "id"
          ),
          customDirectorClauses: unionByKey(
            store.current.customDirectorClauses,
            incoming.customDirectorClauses || [],
            "clauseId"
          ),
          approvedRadarIds: unionStrings(store.current.approvedRadarIds, incoming.approvedRadarIds || []),
          dismissedRadarIds: unionStrings(store.current.dismissedRadarIds, incoming.dismissedRadarIds || []),
          pinnedPointA: incoming.pinnedPointA || store.current.pinnedPointA,
          tabOrders: {
            ...(store.current.tabOrders || {}),
            ...(incoming.tabOrders || {})
          },
          defenseLockActive:
            typeof incoming.defenseLockActive === "boolean"
              ? incoming.defenseLockActive
              : store.current.defenseLockActive
        };
      }

      const meta = computeVerificationMetadata(nextCurrent);

      // Crear punto de restauración en la Máquina del Tiempo (últimos 5 puntos)
      const snapshotEntry: RestorePointSnapshot = {
        snapshotId: `snap_${Date.now()}_${meta.verificationCode.replace("#", "")}`,
        savedAtIso: nextCurrent.updatedAtIso,
        deviceLabel,
        verificationCode: meta.verificationCode,
        ordersCount: nextCurrent.multiformatDirectorOrders.length,
        clausesCount: nextCurrent.customDirectorClauses.length,
        approvedDoisCount: nextCurrent.approvedRadarIds.length,
        activeStreet: nextCurrent.activePoint?.address || "Alameda Principal, Málaga",
        payload: nextCurrent
      };

      const existingPoints = Array.isArray(store.restorePoints) ? store.restorePoints : [];
      // Evitar duplicar el punto de restauración si el código de verificación y calle son idénticos al más reciente
      const latest = existingPoints[0];
      const updatedRestorePoints =
        latest &&
        latest.verificationCode === snapshotEntry.verificationCode &&
        latest.activeStreet === snapshotEntry.activeStreet &&
        !forceOverwrite
          ? [snapshotEntry, ...existingPoints.slice(1)].slice(0, MAX_RESTORE_POINTS)
          : [snapshotEntry, ...existingPoints].slice(0, MAX_RESTORE_POINTS);

      const nextStore: PersistentCloudStore = {
        current: nextCurrent,
        verificationCode: meta.verificationCode,
        sha256Signature: meta.sha256Signature,
        restorePoints: updatedRestorePoints
      };

      writePersistentStore(nextStore);

      res.json({
        status: "ok",
        serverTimestampIso: nextCurrent.updatedAtIso,
        verificationCode: meta.verificationCode,
        sha256Signature: meta.sha256Signature,
        current: nextCurrent,
        restorePoints: updatedRestorePoints
      });
    } catch (err: any) {
      res.status(500).json({
        status: "error",
        message: err?.message || "Error al sincronizar el espacio de trabajo doctoral"
      });
    }
  }
);

// Tabla CRC32 determinista IEEE 802.3 para empaquetado ZIP estándar sin dependencias externas
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function computeCrc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function collectProjectFilesRecursive(dirAbs: string, relPrefix: string, out: Array<{ relPath: string; data: Buffer }>): void {
  if (!fs.existsSync(dirAbs)) return;
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "build" ||
      entry.name === ".aistudio" ||
      entry.name === "github_backup_config.json" ||
      entry.name.startsWith("Captura_de_pantalla_") ||
      entry.name.startsWith("IMG_")
    ) {
      continue;
    }
    const fullPath = path.join(dirAbs, entry.name);
    const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      collectProjectFilesRecursive(fullPath, relPath, out);
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size <= 8 * 1024 * 1024) {
          out.push({ relPath, data: fs.readFileSync(fullPath) });
        }
      } catch {
        // Ignore unreadable files
      }
    }
  }
}

function buildStandardZipBuffer(files: Array<{ relPath: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const cleanRelPath = file.relPath.replace(/\\/g, "/");
    const nameBuf = Buffer.from(cleanRelPath, "utf-8");
    const rawDataBuf = file.data;
    const crc = computeCrc32(rawDataBuf);

    // Use Deflate (method 8) for text/source files to reduce ZIP size ~4x and avoid proxy limits
    const lowerName = cleanRelPath.toLowerCase();
    const isAlreadyCompressed =
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".webp") ||
      lowerName.endsWith(".woff2") ||
      lowerName.endsWith(".zip");

    let compressionMethod = 0;
    let payloadBuf = rawDataBuf;
    if (!isAlreadyCompressed && rawDataBuf.length > 128) {
      const deflated = zlib.deflateRawSync(rawDataBuf, { level: 6 });
      if (deflated.length < rawDataBuf.length) {
        compressionMethod = 8;
        payloadBuf = deflated;
      }
    }

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(compressionMethod, 8); // 8 = Deflate, 0 = Store
    localHeader.writeUInt16LE(0x6000, 10); // Valid DOS time (12:00:00)
    localHeader.writeUInt16LE(0x5c6a, 12); // Valid DOS date (2026-03-10)
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(payloadBuf.length, 18); // Compressed size
    localHeader.writeUInt32LE(rawDataBuf.length, 22); // Uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, payloadBuf);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(compressionMethod, 10);
    centralHeader.writeUInt16LE(0x6000, 12);
    centralHeader.writeUInt16LE(0x5c6a, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payloadBuf.length, 20); // Compressed size
    centralHeader.writeUInt32LE(rawDataBuf.length, 24); // Uncompressed size
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + payloadBuf.length;
  }

  const centralSize = centralParts.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

function gatherAllProjectFilesForBackup(store: PersistentCloudStore): Array<{ relPath: string; data: Buffer }> {
  const rootDir = process.cwd();
  const files: Array<{ relPath: string; data: Buffer }> = [];

  const rootFiles = [
    "ARRANCAR_EN_MI_PC.bat",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "index.html",
    "metadata.json",
    "server.ts",
    "AGENTS.md",
    "SURGICAL_PROTOCOL.md",
    ".env.example",
    ".gitignore"
  ];

  for (const rf of rootFiles) {
    const p = path.join(rootDir, rf);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      files.push({ relPath: rf, data: fs.readFileSync(p) });
    }
  }

  collectProjectFilesRecursive(path.join(rootDir, "src"), "src", files);
  collectProjectFilesRecursive(path.join(rootDir, "server"), "server", files);
  collectProjectFilesRecursive(path.join(rootDir, "scripts"), "scripts", files);
  collectProjectFilesRecursive(path.join(rootDir, "data"), "data", files);
  collectProjectFilesRecursive(path.join(rootDir, "public"), "public", files);

  const readmeText = [
    `# GEMELO DIGITAL DE MÁLAGA — TESIS DOCTORAL UNED`,
    `## Paquete Íntegro de Recuperación para Google AI Studio y GitHub (${store.verificationCode})`,
    `- **Fecha de exportación en vivo:** ${new Date().toISOString()}`,
    `- **Firma Criptográfica:** \`${store.sha256Signature}\``,
    `- **Correo GitHub vinculado:** dioni100669@gmail.com`,
    `- **Punto Activo Guardado:** ${store.current.activePoint?.address || "Alameda Principal, Málaga"}`,
    `- **Órdenes / PDFs del Director en vivo incluidos:** ${store.current.multiformatDirectorOrders.length} adicionales + Documento Maestro (Puntos 1→7)`,
    ``,
    `### Cómo recuperar e incorporar la App de nuevo en Google AI Studio si se pierde:`,
    `1. Abre Google AI Studio y pulsa **Import from GitHub** seleccionando este repositorio (o sube los archivos de este respaldo).`,
    `2. Al incluir \`/data/doctoral_workspace_sync.json\`, la aplicación arranca exactamente con las mismas variaciones, puntos y PDFs del Director que tenías en vivo.`
  ].join("\n");

  files.push({
    relPath: "README_RECUPERACION_AISTUDIO_GITHUB.md",
    data: Buffer.from(readmeText, "utf-8")
  });

  return files;
}

// GET /api/workspace-sync/aistudio-github-zip -> Descarga ZIP íntegro del proyecto (Código Fuente + Datos en Vivo)
router.get("/api/workspace-sync/aistudio-github-zip", (_req, res) => {
  try {
    const store = readPersistentStore();
    writePersistentStore(store);

    const files = gatherAllProjectFilesForBackup(store);
    const zipBuffer = buildStandardZipBuffer(files);
    const safeCode = store.verificationCode.replace(/[^A-Z0-9_-]/gi, "");
    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `Gemelo_UNED_Proyecto_Completo_AIStudio_GitHub_${dateTag}_${safeCode}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", String(zipBuffer.length));
    res.status(200).send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err?.message || "Error al empaquetar el proyecto completo para AI Studio / GitHub"
    });
  }
});

// ====================================================================================================
// CONECTOR DIRECTO 1-CLIC DE SERVIDOR A GITHUB (SUBIDA DESCOMPRIMIDA LISTA PARA IMPORTAR EN AI STUDIO)
// ====================================================================================================
interface StoredGitHubConfig {
  token: string;
  githubUser: string;
  repoName: string;
  lastPushIso: string | null;
  lastCommitUrl: string | null;
  lastVerificationCode: string | null;
}

const GITHUB_CONFIG_PATH = path.join(DATA_DIR, "github_backup_config.json");

function readGitHubConfig(): StoredGitHubConfig | null {
  try {
    if (fs.existsSync(GITHUB_CONFIG_PATH)) {
      const raw = fs.readFileSync(GITHUB_CONFIG_PATH, "utf-8");
      const parsed = JSON.parse(raw) as StoredGitHubConfig;
      if (parsed && parsed.token && parsed.githubUser && parsed.repoName) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

function writeGitHubConfig(cfg: StoredGitHubConfig): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(GITHUB_CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
  } catch {
    // Ignore
  }
}

function isBinaryFilePath(relPath: string): boolean {
  const lower = relPath.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".ico") ||
    lower.endsWith(".pdf") ||
    lower.endsWith(".woff") ||
    lower.endsWith(".woff2") ||
    lower.endsWith(".ttf")
  );
}

router.get("/api/workspace-sync/github-status", (_req, res) => {
  const cfg = readGitHubConfig();
  if (!cfg) {
    return res.json({
      configured: false,
      githubUser: "",
      repoName: "gemelo-digital-malaga-uned",
      repoUrl: null,
      lastPushIso: null,
      lastCommitUrl: null,
      lastVerificationCode: null
    });
  }
  return res.json({
    configured: true,
    githubUser: cfg.githubUser,
    repoName: cfg.repoName,
    repoUrl: `https://github.com/${cfg.githubUser}/${cfg.repoName}`,
    lastPushIso: cfg.lastPushIso,
    lastCommitUrl: cfg.lastCommitUrl,
    lastVerificationCode: cfg.lastVerificationCode
  });
});

router.post("/api/workspace-sync/github-config", async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const rawRepo = String(req.body?.repoName || "gemelo-digital-malaga-uned")
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, "-");
    const repoName = rawRepo || "gemelo-digital-malaga-uned";

    if (!token) {
      return res.status(400).json({ status: "error", message: "Introduce el código de autorización de GitHub." });
    }

    const userResp = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "UNED-Digital-Twin-Malaga"
      }
    });

    if (!userResp.ok) {
      return res.status(401).json({
        status: "error",
        message: "El código de GitHub no es válido o ha caducado. Pulsa el paso 1 para generar uno nuevo."
      });
    }

    const userData: any = await userResp.json();
    const githubUser = String(userData.login || "");
    if (!githubUser) {
      return res.status(400).json({ status: "error", message: "No se pudo identificar el usuario de GitHub." });
    }

    const prev = readGitHubConfig();
    const nextCfg: StoredGitHubConfig = {
      token,
      githubUser,
      repoName,
      lastPushIso: prev?.lastPushIso || null,
      lastCommitUrl: prev?.lastCommitUrl || null,
      lastVerificationCode: prev?.lastVerificationCode || null
    };
    writeGitHubConfig(nextCfg);

    return res.json({
      status: "ok",
      configured: true,
      githubUser,
      repoName,
      repoUrl: `https://github.com/${githubUser}/${repoName}`
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "error",
      message: err?.message || "Error al conectar con GitHub"
    });
  }
});

router.post("/api/workspace-sync/github-push", async (req, res) => {
  try {
    let cfg = readGitHubConfig();
    // Permitir también que venga el token en la misma llamada si el usuario acaba de pegarlo
    if (req.body?.token) {
      const token = String(req.body.token).trim();
      const repoName =
        String(req.body?.repoName || cfg?.repoName || "gemelo-digital-malaga-uned")
          .trim()
          .replace(/[^a-zA-Z0-9._-]/g, "-") || "gemelo-digital-malaga-uned";
      const userResp = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "UNED-Digital-Twin-Malaga"
        }
      });
      if (!userResp.ok) {
        return res.status(401).json({
          status: "error",
          message: "Código de autorización de GitHub inválido. Revísalo en el Paso 1."
        });
      }
      const userData: any = await userResp.json();
      cfg = {
        token,
        githubUser: String(userData.login),
        repoName,
        lastPushIso: cfg?.lastPushIso || null,
        lastCommitUrl: cfg?.lastCommitUrl || null,
        lastVerificationCode: cfg?.lastVerificationCode || null
      };
      writeGitHubConfig(cfg);
    }

    if (!cfg || !cfg.token) {
      return res.status(400).json({
        status: "needs_config",
        message: "Conecta primero tu cuenta de GitHub (solo se hace 1 vez)."
      });
    }

    const headers = {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "UNED-Digital-Twin-Malaga"
    };

    const store = readPersistentStore();
    writePersistentStore(store);

    // 1. Verificar si existe el repositorio; si no existe, crearlo automáticamente con auto_init: true
    let repoResp = await fetch(`https://api.github.com/repos/${cfg.githubUser}/${cfg.repoName}`, { headers });
    if (repoResp.status === 404) {
      const createResp = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: cfg.repoName,
          description: `Gemelo Digital de Málaga — Tesis Doctoral UNED (${store.verificationCode} • Código Fuente AI Studio + Datos en Vivo)`,
          private: false,
          auto_init: true
        })
      });
      if (!createResp.ok) {
        const errBody: any = await createResp.json().catch(() => ({}));
        return res.status(400).json({
          status: "error",
          message: `No se pudo crear el repositorio en GitHub: ${errBody?.message || createResp.statusText}`
        });
      }
      repoResp = createResp;
      // Breve espera para que GitHub inicialice la rama principal tras auto_init
      await new Promise((r) => setTimeout(r, 1200));
    } else if (!repoResp.ok) {
      return res.status(400).json({
        status: "error",
        message: "No se pudo acceder al repositorio en GitHub. Verifica el permiso 'repo'."
      });
    }

    const repoData: any = await repoResp.json();
    const defaultBranch = String(repoData.default_branch || "main");

    // 2. Obtener el último commit de la rama principal
    let refResp = await fetch(
      `https://api.github.com/repos/${cfg.githubUser}/${cfg.repoName}/git/ref/heads/${defaultBranch}`,
      { headers }
    );

    if (refResp.status === 404 || refResp.status === 409) {
      // Si el repositorio estaba completamente vacío sin commits iniciales, creamos el archivo README inicial via Contents API
      await fetch(
        `https://api.github.com/repos/${cfg.githubUser}/${cfg.repoName}/contents/README.md`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message: `Inicialización Tesis UNED (${store.verificationCode})`,
            content: Buffer.from(`# Gemelo Digital de Málaga — Tesis UNED (${store.verificationCode})\n`, "utf-8").toString("base64")
          })
        }
      );
      await new Promise((r) => setTimeout(r, 800));
      refResp = await fetch(
        `https://api.github.com/repos/${cfg.githubUser}/${cfg.repoName}/git/ref/heads/${defaultBranch}`,
        { headers }
      );
    }

    if (!refResp.ok) {
      return res.status(400).json({
        status: "error",
        message: "No se pudo leer la rama principal del repositorio en GitHub."
      });
    }

    const refData: any = await refResp.json();
    const latestCommitSha = String(refData.object?.sha || "");

    const commitInfoResp = await fetch(
      `https://api.github.com/repos/${cfg.githubUser}/${cfg.repoName}/git/commits/${latestCommitSha}`,
      { headers }
    );
    const commitInfoData: any = await commitInfoResp.json();
    const baseTreeSha = String(commitInfoData.tree?.sha || "");

    // 3. Empaquetar todos los archivos del proyecto descomprimidos para el árbol Git (listos para Import from GitHub en AI Studio)
    const allFiles = gatherAllProjectFilesForBackup(store);
    const treeItems: Array<{ path: string; mode: string; type: string; content?: string; sha?: string }> = [];

    for (const f of allFiles) {
      const cleanPath = f.relPath.replace(/\\/g, "/");
      if (isBinaryFilePath(cleanPath)) {
        // Para binarios (imágenes en public/) creamos blob base64 si pesan menos de 2MB
        if (f.data.length <= 2 * 1024 * 1024) {
          const blobResp = await fetch(
            `https://api.github.com/repos/${cfg.githubUser}/${cfg.repoName}/git/blobs`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                content: f.data.toString("base64"),
                encoding: "base64"
              })
            }
          );
          if (blobResp.ok) {
            const blobData: any = await blobResp.json();
            treeItems.push({
              path: cleanPath,
              mode: "100644",
              type: "blob",
              sha: String(blobData.sha)
            });
          }
        }
      } else {
        treeItems.push({
          path: cleanPath,
          mode: "100644",
          type: "blob",
          content: f.data.toString("utf-8")
        });
      }
    }

    const createTreeResp = await fetch(
      `https://api.github.com/repos/${cfg.githubUser}/${cfg.repoName}/git/trees`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems
        })
      }
    );

    if (!createTreeResp.ok) {
      const errTree: any = await createTreeResp.json().catch(() => ({}));
      return res.status(400).json({
        status: "error",
        message: `Error al construir el árbol de archivos en GitHub: ${errTree?.message || createTreeResp.statusText}`
      });
    }

    const newTreeData: any = await createTreeResp.json();
    const commitMsg = `Respaldo Tesis UNED ${store.verificationCode} • ${store.current.activePoint?.address || "Málaga"} (${new Date().toLocaleString("es-ES")})`;

    const createCommitResp = await fetch(
      `https://api.github.com/repos/${cfg.githubUser}/${cfg.repoName}/git/commits`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: commitMsg,
          tree: newTreeData.sha,
          parents: [latestCommitSha]
        })
      }
    );

    if (!createCommitResp.ok) {
      return res.status(400).json({
        status: "error",
        message: "Error al confirmar el commit en GitHub."
      });
    }

    const newCommitData: any = await createCommitResp.json();

    const updateRefResp = await fetch(
      `https://api.github.com/repos/${cfg.githubUser}/${cfg.repoName}/git/refs/heads/${defaultBranch}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          sha: newCommitData.sha,
          force: true
        })
      }
    );

    if (!updateRefResp.ok) {
      return res.status(400).json({
        status: "error",
        message: "Error al actualizar la rama principal en GitHub."
      });
    }

    const nowIso = new Date().toISOString();
    const commitUrl = `https://github.com/${cfg.githubUser}/${cfg.repoName}/commit/${newCommitData.sha}`;
    const repoUrl = `https://github.com/${cfg.githubUser}/${cfg.repoName}`;

    const updatedCfg: StoredGitHubConfig = {
      ...cfg,
      lastPushIso: nowIso,
      lastCommitUrl: commitUrl,
      lastVerificationCode: store.verificationCode
    };
    writeGitHubConfig(updatedCfg);

    return res.json({
      status: "ok",
      githubUser: cfg.githubUser,
      repoName: cfg.repoName,
      repoUrl,
      commitUrl,
      filesPushedCount: treeItems.length,
      verificationCode: store.verificationCode,
      lastPushIso: nowIso
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "error",
      message: err?.message || "Error inesperado al subir el respaldo a GitHub"
    });
  }
});

export default router;
