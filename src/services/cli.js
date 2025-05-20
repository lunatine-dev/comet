import util from "util";
import { exec as rawExec } from "child_process";

const exec = util.promisify(rawExec);

export default async function runCommand(cmd, cwd = undefined) {
    try {
        const { stdout, stderr } = await exec(cmd, { cwd });
        return { stdout, stderr };
    } catch (err) {
        return {
            error: true,
            code: err.code,
            stdout: err.stdout,
            stderr: err.stderr,
            message: err.message,
        };
    }
}
