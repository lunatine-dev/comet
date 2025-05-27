import { Repo } from "#models/github/Repo";
import { octokit } from "#services/github";

export default async function (fastify) {
    fastify.get("/", async (request, reply) => {
        const repos = await Repo.find({
            setup: true,
        });

        return repos;
    });
    fastify.get("/:id", async (request, reply) => {
        const repo = await Repo.findOne({
            repository_id: request.params.id,
        });

        return repo;
    });

    fastify.post("/:id/env", async (request, reply) => {
        const repo = await Repo.findOne({
            repository_id: request.params.id,
        });

        if (!repo) return reply.notFound("No repo");

        const { env } = request.body;

        repo.env = env;

        await repo.save();

        return { env };
    });

    fastify.post("/:id/webhooks", async (request, reply) => {
        const repo = await Repo.findOne({
            repository_id: request.params.id,
        });

        if (!repo) return reply.notFound("No repo");

        const {
            name,
            owner: { login },
        } = repo;

        if (repo.webhook) return reply.badRequest("Hook already exists");

        const createHook = await octokit.request(
            "POST /repos/{owner}/{repo}/hooks",
            {
                owner: login,
                repo: name,
                config: {
                    url: process.env.GITHUB_HOOK_URL,
                    content_type: "json",
                    secret: process.env.GITHUB_HOOK_SECRET,
                    insecure_ssl: 0,
                },
            }
        );

        if (createHook.status !== 201)
            return reply.internalServerError("Failed to create webhook");

        const id = createHook.data.id;

        repo.webhook = id;

        await repo.save();

        return {
            id,
        };
    });
}
