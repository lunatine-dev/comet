export default async function (fastify) {
    fastify.get("/ping", (request, reply) => {
        return {
            message: "Pong!",
            timestamp: Date.now(),
        };
    });
}
