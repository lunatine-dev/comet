import fp from "fastify-plugin";

export default fp(async function (fastify) {
    fastify.decorate("verify_token", async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.notAuthorized(err);
        }
    });

    fastify.decorate("verify_user", async (request, reply) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = await fastify.jwt.verify(token);
            const user = await User.findById(decoded.id);

            if (!user || user.accessToken !== token)
                return res.code(401).send({ message: "Token not valid" });

            if (user.identifier.toString() !== process.env.OWNER_ID)
                return res.code(401).send({ message: "Not owner" });

            req.user = user;

            return;
        } catch (err) {
            reply.internalServerError(err);
        }
    });
});
