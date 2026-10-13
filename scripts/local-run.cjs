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
  ...(process.env.SAEGIM_LOCAL_FULL !== "false" ? {
    PAID_FEATURES_ENABLED:"false", TUTOR_PROVIDER:"local", LOCAL_TUTOR_MODEL:process.env.LOCAL_TUTOR_MODEL||"qwen3:14b",
    ...(target === "web" ? {
      STATIC_PUBLISH:"false", SORI_WEB_DIST_DIR:".next-local-full", NEXT_PUBLIC_FREE_PUBLISHING:"false",
      NEXT_PUBLIC_PAID_FEATURES_ENABLED:"false", NEXT_PUBLIC_LOCAL_TUTOR_ENABLED:"true",
      NEXT_PUBLIC_API_URL:"http://localhost:4004", NEXT_PUBLIC_LOCAL_SPEECH_URL:"http://127.0.0.1:5055",
    } : {WEB_ORIGINS:"http://localhost:3016,http://127.0.0.1:3016"}),
  } : {}),
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
