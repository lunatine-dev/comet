import runCommand from "#services/cli";
import { Repo } from "#models/github/Repo";

export default async function getPm2DashboardSummary() {
    const { stdout, error, stderr } = await runCommand("pm2 jlist");

    if (error || !stdout) {
        console.error("Failed to fetch PM2 list:", stderr || "Unknown error");
        return [];
    }

    try {
        const rawList = JSON.parse(stdout);

        const apps = rawList.map((proc) => ({
            name: proc.name,
            status: proc.pm2_env?.status ?? "unknown",
            cpu: proc.monit?.cpu ?? 0,
            mem: Math.round((proc.monit?.memory ?? 0) / 1024 / 1024), // bytes → MB
        }));

        return apps;
    } catch (e) {
        console.error("Failed to parse PM2 output:", e.message);
        return [];
    }
}

/**
 * Matches PM2 app names to GitHub repository_ids stored in MongoDB
 * and augments app info accordingly.
 */
export async function getAugmentedPm2Apps() {
    const { stdout, error } = await runCommand("pm2 jlist");

    if (error || !stdout) {
        console.error("Failed to fetch PM2 list");
        return [];
    }

    let rawList;
    try {
        rawList = JSON.parse(stdout);
    } catch (e) {
        console.error("Invalid JSON from pm2 jlist:", e);
        return [];
    }

    // Extract PM2 names that are numeric IDs
    const numericIds = rawList
        .map((proc) => Number(proc.name))
        .filter((n) => !isNaN(n));

    // Find matching repos
    const repos = await Repo.find({
        repository_id: { $in: numericIds },
    }).lean();

    const repoMap = Object.fromEntries(
        repos.map((repo) => [repo.repository_id, repo])
    );

    // Build app list
    const apps = rawList.map((proc) => {
        const rawId = proc.name;
        const maybeId = Number(rawId);
        const repo = !isNaN(maybeId) ? repoMap[maybeId] : null;

        return {
            id: rawId,
            name: repo?.name || rawId,
            githubUrl: repo
                ? `https://github.com/${repo.owner?.login}/${repo.name}`
                : null,
            status: proc.pm2_env?.status ?? "unknown",
            cpu: proc.monit?.cpu ?? 0,
            mem: Math.round((proc.monit?.memory ?? 0) / 1024 / 1024), // MB
        };
    });

    return apps;
}
