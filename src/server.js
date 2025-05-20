import Fastify from "fastify";
import fp from "fastify-plugin";
import closeWithGrace from "close-with-grace";
import serviceApp from "./app.js";

import logger from "#constants/logger";

import mongoose from "mongoose";

const app = Fastify({
    logger: logger[process.env.NODE_ENV || "development"] ?? true,
    trustProxy: process.env.NODE_ENV === "production",
});

let connected = false;

const init = async () => {
    app.register(fp(serviceApp));

    closeWithGrace(
        {
            delay: 1000,
        },
        async ({ err }) => {
            if (err != null) app.log.error(err);
            if (connected) {
                await mongoose.disconnect();
            }
            await app.close();
        }
    );

    await app.ready();
    app.log.info("Plugins loaded");

    try {
        await mongoose.connect(
            `mongodb://${process.env.MONGO_DATABASE}_user:${process.env.MONGO_PASSWORD}@${process.env.MONGO_IP}:27017/${process.env.MONGO_DATABASE}?authSource=${process.env.MONGO_DATABASE}`
        );
        connected = true;
        app.log.info("Connected to MongoDB");

        await app.listen({
            port: process.env.PORT ?? 3000,
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

init();
