#!/usr/bin/env node
// Git Backup Script - Commits movies.db to git repository
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

function gitBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  try {
    // Change to root directory
    process.chdir(ROOT_DIR);

    // Check if there are changes to the database
    const status = execSync("git status --porcelain backend/movies.db", {
      encoding: "utf-8",
    });

    if (!status.trim()) {
      console.log(
        `[${new Date().toISOString()}] No database changes to commit`
      );
      return { success: true, message: "No changes" };
    }

    // Stage the database file
    execSync("git add backend/movies.db", { encoding: "utf-8" });

    // Commit with timestamp
    const commitMessage = `chore: auto-backup database ${timestamp}`;
    execSync(`git commit -m "${commitMessage}"`, { encoding: "utf-8" });

    // Push to remote
    try {
      execSync("git push", { encoding: "utf-8" });
      console.log(
        `[${new Date().toISOString()}] ✓ Database backed up and pushed to Git`
      );
      return { success: true, message: "Committed and pushed" };
    } catch (pushError) {
      console.log(
        `[${new Date().toISOString()}] ✓ Database committed (push failed - will retry later)`
      );
      return { success: true, message: "Committed locally, push failed" };
    }
  } catch (error) {
    // Check if error is just "nothing to commit"
    if (error.message?.includes("nothing to commit")) {
      console.log(
        `[${new Date().toISOString()}] No database changes to commit`
      );
      return { success: true, message: "No changes" };
    }

    console.error(
      `[${new Date().toISOString()}] ✗ Git backup failed:`,
      error.message
    );
    return { success: false, message: error.message };
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  gitBackup();
}

export default gitBackup;
