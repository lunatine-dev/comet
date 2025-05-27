import { User } from "#models/github/User";
import { issueAccessToken } from "#services/accessTokenService";
import { rotateRefreshToken } from "#services/refreshTokenService";

export default async function (fastify) {
    fastify.post("/refresh", async (request, reply) => {
        const { refreshToken } = request.body;
        const ip = request.ip;
        const userAgent = request.headers["user-agent"];

        console.log(request.body);

        // await RefreshToken.findOne()
        const { newRefreshToken, error, userId } = await rotateRefreshToken(
            refreshToken,
            ip,
            userAgent
        );

        if (error) return reply.unauthorized("Session expired or invalid");

        const user = await User.findById(userId);
        if (!user) return reply.unauthorized("Session expired or invalid");

        const accessToken = issueAccessToken(user, fastify);

        return { refreshToken: newRefreshToken, accessToken };
    });
}
