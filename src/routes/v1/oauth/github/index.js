import { User } from "#models/github/User";
import { issueAccessToken } from "#services/accessTokenService";
import { issueRefreshToken } from "#services/refreshTokenService";
import { getUser } from "#services/github";
import crypto from "crypto";
import { saveTempCode, useTempCode } from "#store/tempCodes";

export default async function (fastify) {
    fastify.get("/callback", async (request, reply) => {
        const { token } =
            await fastify.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(
                request
            );

        const user = await getUser(token.access_token);

        if (process.env.OWNER_ID !== user.id.toString())
            return reply.unauthorized("Invalid identifier");

        let dbUser = await User.findOne({ identifier: user.id });

        if (!dbUser) {
            dbUser = new User({
                identifier: user.id,
                login: user?.login,
                name: user?.name,
                avatar: user?.avatar_url,
            });
        } else {
            dbUser.avatar = user?.avatar_url;
        }

        await dbUser.save();

        const ip = request.ip;
        const userAgent = request.headers["user-agent"];

        //first create an access token
        const accessToken = issueAccessToken(dbUser, fastify);
        const refreshToken = issueRefreshToken(dbUser._id, ip, userAgent);

        const tempCode = crypto.randomUUID();
        saveTempCode(tempCode, {
            accessToken,
            refreshToken,
        });

        return reply.redirect(
            `${process.env.FRONTEND_URL}/callback?user=${tempCode}`
        );
    });

    fastify.post("/finalize", async (request, reply) => {
        const { code } = request.body;

        if (!code) return reply.badRequest("Missing code");

        const tokens = useTempCode(code);
        if (!tokens) return reply.badRequest("Invalid or expired code");

        reply.send(tokens);
    });
}
