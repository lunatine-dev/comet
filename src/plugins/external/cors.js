import cors from "@fastify/cors";
export const autoConfig = {
    methods: ["GET", "POST", "PUT", "DELETE"],
    origin: process.env.FRONTEND_URL,
};
export default cors;
