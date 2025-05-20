import fp from "fastify-plugin";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifySwagger from "@fastify/swagger";
import fs from "fs/promises";
import v from "../../v.js";

export default fp(async function (fastify) {
    await fastify.register(fastifySwagger, {
        hideUntagged: true,
        openapi: {
            info: {
                title: "Comet",
                description: "GitHub project manager",
                version: v,
            },
        },
    });
    await fastify.register(fastifySwaggerUi, {
        routePrefix: "/documentation",
    });
});
