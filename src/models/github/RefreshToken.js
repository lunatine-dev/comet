import mongoose from "mongoose";

const { Schema, model } = mongoose;

const RefreshTokenSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true,
        },
        hashedToken: { type: String, required: true, unique: true },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 60 * 60 * 24 * 30,
        }, // 180 days
        expiresAt: { type: Date, required: true },
        replacedBy: { type: String }, // hashed new token
        ip: { type: String },
        userAgent: { type: String },
        lastUsedAt: { type: Date },
        invalidated: { type: Boolean, default: false },
    },
    {
        versionKey: false,
    }
);

const RefreshToken = model("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
