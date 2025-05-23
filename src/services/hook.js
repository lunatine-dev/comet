import runCommand from "./cli.js";
import path from "path";
import fs from "fs/promises";
import {
    checkRepoState,
    generateEcosystem,
    isESModule,
} from "#utils/prepareRepo";
import { RepoLog } from "#models/github/RepoLog";
import { Repo } from "#models/github/Repo";

const listenEvents = ["push"];

export default async (request, reply) => {
    const event = request.headers["x-github-event"];

    if (event === "ping") return reply.send({ message: "Pong!" });

    if (!listenEvents.includes(event))
        return reply.send({ message: "Invalid event" });

    const { repository, hook, sender } = request.body;
    const { default_branch } = repository;
    const branch = request.body.ref.split("/").pop();

    if (branch !== default_branch)
        return reply.send({ message: "Must be default branch" });

    const localRepoDir = path.join(process.env.GITHUB_SAVE_DIR, repository.id);

    let { repoExists, env } = checkRepoState(localRepoDir);

    const RepoDB = await Repo.findOne({
        repository_id: repository.id,
    });

    env = RepoDB?.env ?? env;

    if (repoExists) {
        const stash = await runCommand("git stash", localRepoDir);
        const pull = await runCommand("git pull", localRepoDir);

        if (stash.error || pull.error)
            return reply.internalServerError("Failed to pull repo.");
    } else {
        const cloneURI = `https://oauth2:${process.env.GITHUB_PAT_TOKEN}@github.com/${repository.full_name}.git`;
        const clone = await runCommand(
            `git clone ${cloneURI} ${repository.id}`,
            process.env.GITHUB_SAVE_DIR
        );

        if (clone.error)
            return reply.internalServerError("Failed to clone repo.");
    }

    await fs
        .writeFile(path.join(localRepoDir, ".env"), env, "utf-8")
        .catch(() => {});

    const pkgExists = await fs
        .access(path.join(localRepoDir, "package.json"))
        .then(() => true)
        .catch(() => false);
    if (!pkgExists) return reply.internalServerError("Not a Node app");

    //repo is now either pulled or cloned, time to check if it's an ES Module or CommonJS

    const install = await runCommand(
        "pnpm install --dangerously-allow-all-builds",
        localRepoDir
    );

    if (install.error)
        return reply.internalServerError("Failed to install modules");

    const { ecosystemFile } = await generateEcosystem(
        localRepoDir,
        repository.id,
        await isESModule(localRepoDir)
    );

    let cmd = `env -i NODE_ENV=production PATH=${process.env.PATH} HOME=${process.env.HOME}`;

    if (repoExists) {
        cmd += ` pm2 restart ${repository.id}`;
    } else {
        cmd += ` pm2 start ${ecosystemFile} --env production`;
    }

    const run = await runCommand(cmd, localRepoDir);
    if (run.error) return reply.internalServerError("Failed to run app");

    //save apps, silently error
    const saveState = await runCommand("pm2 save", localRepoDir);

    await RepoLog.create({
        repository_id: repository.id,
        install: install.error ? 1 : 0,
        response: run.error ? 1 : 0,
        clone: !repoExists,
    });
    await Repo.findOneAndUpdate(
        {
            repository_id: repository.id,
        },
        {
            repository_id: repository.id,
            name: repository.name,
            owner: {
                ...repository.owner,
            },
            visibility: repository.visibility,
        },
        {
            upsert: true,
            new: true,
        }
    );

    return reply.send({
        message: `App ${repoExists ? "restarted" : "started"}`,
    });
};
