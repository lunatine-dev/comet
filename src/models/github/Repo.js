import mongoose from "mongoose";

const repoSchema = new mongoose.Schema(
    {
        repository_id: {
            type: Number,
            required: true,
        },
        name: String,
        owner: {
            name: String,
            email: String,
            login: String,
            avatar_url: String,
            id: Number,
        },
        visibility: String,
        env: {
            type: String,
        },
        webhooks: {
            type: Boolean,
        },
        setup: {
            type: Boolean,
        },
    },
    { timestamps: true }
);

export const Repo = mongoose.model("Repo", repoSchema);
