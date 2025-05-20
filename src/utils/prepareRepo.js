import fs from "fs/promises";
import path from "path";

/**
 * Checks the state of a GitHub repo directory.
 * - Determines if it should be pulled (has .git)
 * - Loads .env if it exists
 * - Deletes the repo if it's not a git repo
 *
 * @param {string} githubRepo - Full path to the repo directory
 * @returns {{ pull: boolean, env: string }} - Repo state
 */
export async function checkRepoState(githubRepo) {
    let env = "";
    let repoExists = false;

    try {
        // Check if the repo directory exists
        await fs.access(githubRepo);

        const gitPath = path.join(githubRepo, ".git");
        const envPath = path.join(githubRepo, ".env");

        try {
            // Check if it's a git repo
            await fs.access(gitPath);
            repoExists = true;
        } catch {
            // Not a git repo, check for .env
            try {
                await fs.access(envPath);
                env = await fs.readFile(envPath, "utf-8");
            } catch {
                // No .env file — ignore
            }

            // Remove the directory
            await fs.rm(githubRepo, { recursive: true, force: true });
        }
    } catch {
        // githubRepo does not exist — do nothing
    }

    return { repoExists, env };
}

/**
 *
 * @param {string} githubRepo - full path to repo directory
 */
export async function isESModule(githubRepo) {
    const pkg = await fs
        .readFile(path.join(githubRepo, "package.json"), "utf-8")
        .catch(() => null);

    return pkg ? JSON.parse(pkg).type === "module" : false;
}

export async function generateEcosystem(githubRepo, name, es6 = true) {
    const file = es6 ? "ecosystem.config.cjs" : "ecosystem.config.js";
    const ecosystemPath = path.join(githubRepo, file);

    let main = "src/app.js";

    const pkg = await fs
        .readFile(path.join(githubRepo, "package.json"), "utf-8")
        .catch(() => null);

    try {
        const parsed = pkg && JSON.parse(pkg);
        if (parsed?.main) {
            main = parsed.main.startsWith("./")
                ? parsed.main
                : `./${parsed.main}`;
        } else {
            main = "./src/app.js";
        }
    } catch {
        main = "./src/app.js";
    }

    const config = `module.exports = {
  apps: [
    {
      name: "${name}",
      kill_timeout: 3000,
      script: "${main}",
      env_production: {
        NODE_ENV: "production",
      },
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};`;

    await fs.writeFile(ecosystemPath, config);

    return { ecosystemPath, ecosystemFile: file };
}
