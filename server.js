"use strict";

const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");

const ROOT = __dirname;
const START_PORT = parseInt(process.env.PORT, 10) || 3000;
const MAX_PORT_TRIES = 100;
// 0.0.0.0 binds all IPv4 interfaces so other devices on the LAN can connect.
// Set HOST=127.0.0.1 in the env to restrict to loopback only.
const HOST = process.env.HOST || "0.0.0.0";

function getLanIPs() {
  const ifaces = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        out.push({ name, address: iface.address });
      }
    }
  }
  return out;
}

const MIME = {
  ".html":  "text/html; charset=utf-8",
  ".htm":   "text/html; charset=utf-8",
  ".js":    "text/javascript; charset=utf-8",
  ".mjs":   "text/javascript; charset=utf-8",
  ".css":   "text/css; charset=utf-8",
  ".json":  "application/json; charset=utf-8",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".gif":   "image/gif",
  ".webp":  "image/webp",
  ".svg":   "image/svg+xml",
  ".ico":   "image/x-icon",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
  ".ttf":   "font/ttf",
  ".txt":   "text/plain; charset=utf-8",
  ".map":   "application/json",
};

function safeJoin(root, urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); }
  catch { return null; }
  const resolved = path.resolve(root, "." + decoded);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

function serve(req, res) {
  let pathname = (req.url || "/").split("?")[0];
  if (pathname === "/") pathname = "/index.html";
  const filePath = safeJoin(ROOT, pathname);
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found: " + pathname);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
    const ts = new Date().toISOString().slice(11, 19);
    process.stdout.write(`  [${ts}] 200  ${pathname}\n`);
  });
}

// Find an open port starting at `port`, incrementing up to MAX_PORT_TRIES.
function findPort(port, attempt = 0) {
  return new Promise((resolve, reject) => {
    if (attempt >= MAX_PORT_TRIES) {
      reject(new Error(
        `No open port found in [${START_PORT}-${START_PORT + MAX_PORT_TRIES - 1}].`
      ));
      return;
    }
    const tester = http.createServer();
    const onError = (err) => {
      tester.removeAllListeners("listening");
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        process.stdout.write(`  port ${port} is in use, trying ${port + 1}...\n`);
        tester.close();
        findPort(port + 1, attempt + 1).then(resolve, reject);
      } else {
        reject(err);
      }
    };
    const onListen = () => {
      tester.removeAllListeners("error");
      tester.close(() => resolve(port));
    };
    tester.once("error", onError);
    tester.once("listening", onListen);
    tester.listen(port, HOST);
  });
}

function openBrowser(target) {
  const platform = process.platform;
  const cmd =
    platform === "win32"  ? `start "" "${target}"` :
    platform === "darwin" ? `open "${target}"` :
                            `xdg-open "${target}"`;
  exec(cmd, () => {});
}

(async () => {
  console.log("");
  console.log("  ╔══════════════════════════════════════════════╗");
  console.log("  ║       A B O M I N A T I O N   P L A Y H O U S E       ║");
  console.log("  ║       Cursed Arcade — local Node server      ║");
  console.log("  ╚══════════════════════════════════════════════╝");
  console.log("");

  let port;
  try {
    port = await findPort(START_PORT, 0);
  } catch (err) {
    console.error("  Failed to find open port:", err.message);
    process.exit(1);
  }

  const server = http.createServer(serve);
  server.on("error", (err) => {
    console.error("  Server error:", err.message);
    process.exit(1);
  });
  server.listen(port, HOST, () => {
    const localUrl = `http://localhost:${port}/`;
    const lanIPs = getLanIPs();
    console.log(`  Local         ${localUrl}`);
    if (HOST === "0.0.0.0" || HOST === "::") {
      if (lanIPs.length === 0) {
        console.log(`  Network       (no LAN interface detected)`);
      } else {
        for (const { name, address } of lanIPs) {
          console.log(`  Network       http://${address}:${port}/   (${name})`);
        }
        console.log(`  Other devices on your network can use the Network URL above.`);
        if (process.platform === "win32") {
          console.log(`  Windows may pop a firewall dialog the first time -- choose`);
          console.log(`  "Allow access" on Private networks for LAN play.`);
        }
      }
    } else {
      console.log(`  Network       disabled (HOST=${HOST}, loopback only)`);
    }
    console.log(`  Serving from  ${ROOT}`);
    console.log(`  Press Ctrl+C to stop.`);
    console.log("");
    openBrowser(localUrl);
  });

  const shutdown = (sig) => {
    console.log(`\n  Received ${sig}, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  };
  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
})();
