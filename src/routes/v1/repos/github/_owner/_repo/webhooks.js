import { octokit } from "#services/github";

export default async function (fastify) {
    fastify.get("/webhooks", async (request, reply) => {
        const { owner, repo } = request.params;

        const { data } = await octokit.request(
            "GET /repos/{owner}/{repo}/hooks",
            {
                owner,
                repo,
            }
        );

        return data;
    });
    /**
     * TODO: Create, delete, edit webhooks
     * TODO: Route to check if webhooks are already setup, e.g check for url being the correct URL or the name of the webhook (preferred, we'll name webhooks expilicitly something from the ENV)
     */
}
