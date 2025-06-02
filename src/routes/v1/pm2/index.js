import { octokit } from "#services/github";
import runCommand from "#services/cli";

export default async function (fastify) {
    fastify.get("/:owner/:repo/restart", async (request, reply) => {
        const { owner, repo } = request.params;

        const {
            data: { id },
        } = await octokit.request("GET /repos/{owner}/{repo}", {
            owner,
            repo,
        });

        const { error } = await runCommand("pm2 restart " + id);

        if (error) return reply.internalServerError("Failed to restart");

        return { status: true };
    });
}
