import mongoose from "mongoose";

const schema = new mongoose.Schema({
    repo: { type: String, required: true },
    response: Number,
    install: Number,
    clone: Boolean,
});

export const RepoLog = mongoose.model("RepoLog", schema);
