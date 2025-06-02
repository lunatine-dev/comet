import si from "systeminformation";
import getPm2DashboardSummary from "#services/pm2";

export default async function (fastify) {
    fastify.get("/info", async (request, reply) => {
        try {
            // Run in parallel for performance
            const [cpu, currentSpeed, load, mem, osInfo, fsSize] =
                await Promise.all([
                    si.cpu(),
                    si.cpuCurrentSpeed(),
                    si.currentLoad(),
                    si.mem(),
                    si.osInfo(),
                    si.fsSize(),
                ]);

            // CPU usage
            const cpuData = {
                percent: parseFloat(load.currentLoad.toFixed(1)),
                used: parseFloat(
                    ((cpu.cores * currentSpeed.avg) / 100).toFixed(2)
                ), // GHz used
                total: parseFloat((cpu.cores * cpu.speed).toFixed(2)), // GHz total
            };

            // RAM usage
            const totalMem = mem.total / 1024 / 1024 / 1024;
            const usedMem = (mem.total - mem.available) / 1024 / 1024 / 1024;
            const memoryData = {
                percent: parseFloat(((usedMem / totalMem) * 100).toFixed(1)),
                used: parseFloat(usedMem.toFixed(2)),
                total: parseFloat(totalMem.toFixed(2)),
            };

            // Disk usage (sum across all mounted drives)
            const totalDisk = fsSize.reduce((acc, d) => acc + d.size, 0);
            const usedDisk = fsSize.reduce((acc, d) => acc + d.used, 0);
            const diskData = {
                percent: parseFloat(((usedDisk / totalDisk) * 100).toFixed(1)),
                used: parseFloat((usedDisk / 1024 / 1024 / 1024).toFixed(2)),
                total: parseFloat((totalDisk / 1024 / 1024 / 1024).toFixed(2)),
            };

            // OS info
            const osData = `${osInfo.distro} ${osInfo.release}`;

            const apps = await getPm2DashboardSummary();

            // Send final response
            reply.send({
                cpu: cpuData,
                ram: memoryData,
                disk: diskData,
                os: osData,
                // Optionally: include `apps: await getPm2Data()` here
                apps,
            });
        } catch (err) {
            console.error(err);
            reply.status(500).send({ error: "Failed to gather system info" });
        }
    });
}
