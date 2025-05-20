export default async function (fastify) {
    fastify.get(
        "/base",
        {
            schema: {
                tags: ["Base"],
            },
        },
        (request, reply) => {
            return {
                message: "Hello!",
            };
        }
    );
}
