import { octokit } from "#services/github";

export default async function (fastify) {
    fastify.get("/", async (request, reply) => {
        const { owner, repo } = request.params;

        const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
            owner,
            repo,
        });

        return data;
    });
}
