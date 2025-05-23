import { rotateRefreshToken } from "#services/refreshTokenService";

export default async function (fastify) {
    fastify.post("/refresh", async (request, reply) => {
        const { refreshToken } = request.body;
        const ip = request.ip;
        const userAgent = request.headers["user-agent"];

        // await RefreshToken.findOne()
        const { newRefreshToken, error, userId } = await rotateRefreshToken(
            refreshToken,
            ip,
            userAgent
        );

        if (error) return reply.unauthorized("Session expired or invalid");

        const accessToken = fastify.jwt.sign(
            { sub: userId },
            {
                expiresIn: "30m",
            }
        );

        return { refreshToken: newRefreshToken, accessToken };
    });
}
