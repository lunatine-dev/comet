export const issueAccessToken = (user, fastify) => {
    let accessToken;
    try {
        accessToken = fastify.jwt.sign(
            { sub: user._id },
            {
                expiresIn: "30m",
            }
        );
    } catch (err) {
        throw new Error("Internal server error.");
    }
};
