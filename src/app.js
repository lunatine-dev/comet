import path from "path";
import fastifyAutoload from "@fastify/autoload";
import env from "@fastify/env";
const schema = {
    type: "object",
    required: [
        "MONGO_IP",
        "MONGO_DATABASE",
        "MONGO_PASSWORD",
        "GITHUB_HOOK_SECRET",
        "GITHUB_PAT_TOKEN",
        "GITHUB_SAVE_DIR",
        "GITHUB_CLIENT_ID",
        "GITHUB_CLIENT_SECRET",
        "GITHUB_CALLBACK_URL",
        "OWNER_ID",
        "JWT_SECRET",
    ],
    properties: {
        RATE_LIMIT_MAX: {
            type: "number",
            default: 100,
        },
    },
};
export default async (fastify, opts) => {
    delete opts.skipOverride;
    await fastify.register(env, {
        confKey: "config",
        schema,
        dotenv: true,
        data: process.env,
    });
    await fastify.register(fastifyAutoload, {
        dir: path.join(import.meta.dirname, "plugins/external"),
        options: { ...opts },
    });
    fastify.register(fastifyAutoload, {
        dir: path.join(import.meta.dirname, "plugins/app"),
        options: { ...opts },
    });
    fastify.register(fastifyAutoload, {
        dir: path.join(import.meta.dirname, "routes"),
        autoHooks: true,
        routeParams: true,
        options: { ...opts },
    });
    fastify.setErrorHandler((err, request, reply) => {
        fastify.log.error(
            {
                err,
                request: {
                    method: request.method,
                    url: request.url,
                    query: request.query,
                    params: request.params,
                },
            },
            "Unhandled error occurred"
        );
        reply.code(err.statusCode ?? 500);
        let message = "Internal Server Error";
        if (err.statusCode && err.statusCode < 500) {
            message = err.message;
        }
        return { message };
    });
    fastify.setNotFoundHandler(
        {
            preHandler: fastify.rateLimit({
                max: 3,
                timeWindow: 500,
            }),
        },
        (request, reply) => {
            request.log.warn(
                {
                    request: {
                        method: request.method,
                        url: request.url,
                        query: request.query,
                        params: request.params,
                    },
                },
                "Resource not found"
            );
            reply.code(404);
            return { message: "Not Found" };
        }
    );
};
