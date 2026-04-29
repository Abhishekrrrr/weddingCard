import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const submissionsPath = path.join(dataDir, "rsvp-submissions.json");
const workbookPath = path.join(dataDir, "rsvp-attendees.xlsx");
const port = Number(process.env.PORT || 8000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

async function readSubmissions() {
  try {
    const raw = await fs.readFile(submissionsPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function rebuildWorkbook() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      path.join(__dirname, "build-rsvp-workbook.mjs"),
      submissionsPath,
      workbookPath
    ], {
      cwd: __dirname,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Workbook build failed with exit code ${code}`));
    });

    child.on("error", reject);
  });
}

async function handleRsvp(request, response) {
  let body = "";

  request.on("data", (chunk) => {
    body += chunk.toString();
  });

  request.on("end", async () => {
    try {
      const payload = JSON.parse(body || "{}");
      const fullName = String(payload.fullName || "").trim();
      const attendance = String(payload.attendance || "").trim();
      const message = String(payload.message || "").trim();

      if (!fullName) {
        sendJson(response, 400, { error: "Full name is required." });
        return;
      }

      const submissions = await readSubmissions();
      const nextEntry = {
        id: submissions.length + 1,
        fullName,
        attendance,
        message,
        submittedAt: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Kolkata"
        })
      };

      submissions.push(nextEntry);

      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(submissionsPath, `${JSON.stringify(submissions, null, 2)}\n`, "utf8");
      await rebuildWorkbook();

      sendJson(response, 200, {
        message: `Thank you, ${fullName}. Your RSVP has been saved.`,
        workbook: "/data/rsvp-attendees.xlsx"
      });
    } catch (error) {
      console.error(error);
      sendJson(response, 500, { error: "Could not save your RSVP right now." });
    }
  });
}

async function serveFile(requestPath, response) {
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.normalize(path.join(__dirname, safePath));

  if (!filePath.startsWith(__dirname)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(404);
    response.end("Not found");
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "POST" && url.pathname === "/api/rsvp") {
    await handleRsvp(request, response);
    return;
  }

  if (request.method === "GET") {
    await serveFile(url.pathname, response);
    return;
  }

  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(port, () => {
  console.log(`Wedding card server running at http://localhost:${port}`);
});
