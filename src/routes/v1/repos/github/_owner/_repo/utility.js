import runCommand from "#services/cli";
import { octokit } from "#services/github";

export default async function (fastify) {
    fastify.get("/is_node_app", async (request, reply) => {
        try {
            const { owner, repo } = request.params;

            const { data } = await octokit.request(
                "GET /repos/{owner}/{repo}/contents/{path}",
                {
                    owner,
                    repo,
                    path: "package.json",
                }
            );

            const pkg = JSON.parse(
                Buffer.from(data.content, data.encoding).toString("utf8")
            );

            const deps = {
                ...pkg.dependencies,
                ...pkg.devDependencies,
            };

            const isFrontend =
                Object.keys(deps).some((dep) =>
                    ["svelte", "react", "next", "vite", "astro"].includes(dep)
                ) ||
                pkg.svelte ||
                pkg.react;

            const isLikelyNodeApp = !isFrontend && typeof pkg.main === "string"; // typically backend apps

            return { is_node_app: isLikelyNodeApp };
        } catch (err) {
            console.log(err);
            return { is_node_app: false };
        }
    });

    fastify.get("/pm2_status", async (request, reply) => {
        const { owner, repo } = request.params;

        const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
            owner,
            repo,
        });

        const { id } = data;

        const { stdout } = await runCommand(`pm2 jlist`);

        const apps = JSON.parse(stdout);
        const app = apps.find((itm) => itm.name === id.toString());

        let status = app ? app.pm2_env.status === "online" : false;

        return { status };
    });
}
