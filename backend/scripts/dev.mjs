import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tscPath = path.join(backendDir, "node_modules", "typescript", "bin", "tsc");

const initialBuild = spawnSync(process.execPath, [tscPath], {
    cwd: backendDir,
    stdio: "inherit"
});

if (initialBuild.status !== 0) {
    process.exit(initialBuild.status ?? 1);
}

const compiler = spawn(process.execPath, [tscPath, "--watch", "--preserveWatchOutput"], {
    cwd: backendDir,
    stdio: "inherit"
});

const server = spawn(process.execPath, ["--watch", "dist/server.js"], {
    cwd: backendDir,
    stdio: "inherit"
});

function shutdown(signal) {
    compiler.kill(signal);
    server.kill(signal);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

server.on("exit", (code) => {
    compiler.kill();
    process.exitCode = code ?? 0;
});

compiler.on("exit", (code) => {
    if (code && code !== 0) {
        server.kill();
        process.exitCode = code;
    }
});
