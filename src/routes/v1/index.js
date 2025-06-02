export default async function (fastify) {
    fastify.get("/ping", (request, reply) => {
        return {
            message: "pong!",
            timestamp: Date.now(),
        };
    });
}
