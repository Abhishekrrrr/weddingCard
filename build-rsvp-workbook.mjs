import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const inputPath = process.argv[2] || path.join(__dirname, "data", "rsvp-submissions.json");
  const outputPath = process.argv[3] || path.join(__dirname, "data", "rsvp-attendees.xlsx");

  let submissions = [];

  try {
    const raw = await fs.readFile(inputPath, "utf8");
    submissions = JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add("Attendees");

  const rows = submissions.map((entry, index) => [
    index + 1,
    entry.fullName || "",
    entry.attendance || "",
    entry.message || "",
    entry.submittedAt || ""
  ]);

  sheet.getRange("A1:E1").values = [[
    "No.",
    "Full Name",
    "Attendance",
    "Message",
    "Submitted At"
  ]];

  if (rows.length > 0) {
    sheet.getRange(`A2:E${rows.length + 1}`).values = rows;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
