import { octokit } from "#services/github";
import { Repo } from "#models/github/Repo";

export default async function (fastify) {
    fastify.get("/", async (request, reply) => {
        const { owner, repo } = request.params;

        const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
            owner,
            repo,
        });

        return data;
    });

    fastify.post("/manage", async (request, reply) => {
        const { owner, repo } = request.params;
        const {
            id,
            visibility,
            owner: { name: ownerName, login, avatar_url, id: ownerID },
            name,
        } = request.body;

        const newRepo = new Repo({
            repository_id: id,
            name: repo,
            visibility,
            owner: {
                name: ownerName,
                login,
                avatar_url,
                id: ownerID,
            },
            env: "",
            setup: true,
        });

        //check if webhook exists
        try {
            const { data: hooks } = await octokit.request(
                "GET /repos/{owner}/{repo}/hooks",
                {
                    owner,
                    repo,
                }
            );
            const hook = hooks.find(
                (hook) =>
                    hook.name === process.env.GITHUB_HOOK_NAME &&
                    hook.config?.url === process.env.GITHUB_HOOK_URL
            );
            newRepo.webhook = hook ? hook.id : null;
        } catch (e) {}

        await newRepo.save();

        return newRepo;
    });
}
