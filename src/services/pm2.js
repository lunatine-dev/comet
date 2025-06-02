import runCommand from "#services/cli";

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
