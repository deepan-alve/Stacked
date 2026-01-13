#!/usr/bin/env node

// generate-env.js - Interactive .env file generator for Stacked

const crypto = require("crypto");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🚀 Stacked - Environment Configuration Generator\n");
console.log(
  "This script will help you create a .env file for your deployment.\n"
);

const config = {
  NODE_ENV: "production",
  PORT: "80",
  JWT_SECRET: crypto.randomBytes(32).toString("hex"),
  FRONTEND_URL: "",
  DB_PATH: "/app/data/stacked.db",
  BACKUP_INTERVAL_HOURS: "6",
  TMDB_API_KEY: "",
  GOOGLE_API_KEY: "",
  GOOGLE_SEARCH_ENGINE_ID: "",
  VITE_API_URL: "http://backend:3000",
};

const questions = [
  {
    key: "FRONTEND_URL",
    question: "Enter your domain (e.g., https://yourdomain.com): ",
    required: true,
  },
  {
    key: "TMDB_API_KEY",
    question: "Enter TMDB API key (optional, press Enter to skip): ",
    required: false,
  },
  {
    key: "GOOGLE_API_KEY",
    question: "Enter Google API key (optional, press Enter to skip): ",
    required: false,
  },
  {
    key: "GOOGLE_SEARCH_ENGINE_ID",
    question: "Enter Google Search Engine ID (optional, press Enter to skip): ",
    required: false,
  },
];

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log(`✅ Auto-generated JWT_SECRET: ${config.JWT_SECRET}\n`);

  for (const q of questions) {
    let answer = await ask(q.question);

    if (q.required && !answer) {
      console.log("❌ This field is required!");
      answer = await ask(q.question);
    }

    if (answer) {
      config[q.key] = answer;
    }
  }

  // Generate .env content
  let envContent = "# Stacked Environment Configuration\n";
  envContent += "# Generated on: " + new Date().toISOString() + "\n\n";

  envContent += "# Node Environment\n";
  envContent += `NODE_ENV=${config.NODE_ENV}\n\n`;

  envContent += "# Server Configuration\n";
  envContent += `PORT=${config.PORT}\n`;
  envContent += `FRONTEND_URL=${config.FRONTEND_URL}\n\n`;

  envContent += "# JWT Secret (KEEP THIS SECURE!)\n";
  envContent += `JWT_SECRET=${config.JWT_SECRET}\n\n`;

  envContent += "# Database Configuration\n";
  envContent += `DB_PATH=${config.DB_PATH}\n`;
  envContent += `BACKUP_INTERVAL_HOURS=${config.BACKUP_INTERVAL_HOURS}\n\n`;

  if (
    config.TMDB_API_KEY ||
    config.GOOGLE_API_KEY ||
    config.GOOGLE_SEARCH_ENGINE_ID
  ) {
    envContent += "# API Keys (Optional)\n";
    if (config.TMDB_API_KEY) {
      envContent += `TMDB_API_KEY=${config.TMDB_API_KEY}\n`;
    }
    if (config.GOOGLE_API_KEY) {
      envContent += `GOOGLE_API_KEY=${config.GOOGLE_API_KEY}\n`;
    }
    if (config.GOOGLE_SEARCH_ENGINE_ID) {
      envContent += `GOOGLE_SEARCH_ENGINE_ID=${config.GOOGLE_SEARCH_ENGINE_ID}\n`;
    }
    envContent += "\n";
  }

  envContent += "# Frontend Build Variables\n";
  envContent += `VITE_API_URL=${config.VITE_API_URL}\n`;

  // Check if .env already exists
  if (fs.existsSync(".env")) {
    const overwrite = await ask(
      "\n⚠️  .env file already exists. Overwrite? (y/N): "
    );
    if (overwrite.toLowerCase() !== "y") {
      console.log("\n❌ Cancelled. Your existing .env file was not modified.");
      rl.close();
      return;
    }
  }

  // Write .env file
  fs.writeFileSync(".env", envContent);

  console.log("\n✅ .env file created successfully!\n");
  console.log("📋 Configuration Summary:");
  console.log("─────────────────────────────────────");
  console.log(`Frontend URL: ${config.FRONTEND_URL}`);
  console.log(`JWT Secret: ${config.JWT_SECRET.substring(0, 16)}...`);
  console.log(`Database Path: ${config.DB_PATH}`);
  console.log(
    `TMDB API: ${config.TMDB_API_KEY ? "✅ Configured" : "❌ Not set"}`
  );
  console.log(
    `Google API: ${config.GOOGLE_API_KEY ? "✅ Configured" : "❌ Not set"}`
  );
  console.log("─────────────────────────────────────\n");

  console.log("🎯 Next Steps:");
  console.log("1. Review the generated .env file");
  console.log("2. Run: docker-compose up -d");
  console.log("3. Access your app at: " + config.FRONTEND_URL);
  console.log(
    "\n💡 Tip: Keep your JWT_SECRET secure and never commit it to git!\n"
  );

  rl.close();
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  rl.close();
  process.exit(1);
});
