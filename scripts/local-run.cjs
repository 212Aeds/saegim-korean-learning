const { spawn } = require("node:child_process");

const target = process.argv[2];
if (!["web", "api"].includes(target) || !process.env.npm_execpath) {
  console.error("Run npm run dev:web or npm run dev:api from the project root.");
  process.exit(1);
}

const env = {
  ...process.env,
  PORT: target === "web" ? "3016" : "4004",
  ...(target === "web" ? { SORI_WEB_DIST_DIR: ".next-live" } : {}),
};

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [process.env.npm_execpath, "--workspace", `@sori/${target}`, "run", script], {
      env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${target} ${script} exited with ${signal ?? code}`));
    });
  });
}

async function main() {
  await run("build");
  await run(target === "web" ? "start" : "start:prod");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
