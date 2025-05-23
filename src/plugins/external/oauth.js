import oauth from "@fastify/oauth2";

export const autoConfig = {
    name: "githubOAuth2",
    scope: [],
    credentials: {
        client: {
            id: process.env.GITHUB_CLIENT_ID,
            secret: process.env.GITHUB_CLIENT_SECRET,
        },
        auth: oauth.GITHUB_CONFIGURATION,
    },
    startRedirectPath: "/v1/oauth/github",
    callbackUri: process.env.GITHUB_CALLBACK_URL,
};

export default oauth;
