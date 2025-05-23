import crypto from "crypto";
import RefreshToken from "#models/github/RefreshToken";
import { TOKEN_EXPIRY_MS } from "#constants/auth";

const generateRawToken = () => {
    return crypto.randomBytes(32).toString("hex");
};
const hashToken = (raw) => {
    return crypto.createHash("sha256").update(raw).digest("hex");
};

export const issueRefreshToken = async (userId, ip, userAgent) => {
    const rawToken = generateRawToken();
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await RefreshToken.create({
        userId,
        hashedToken,
        expiresAt,
        ip,
        userAgent,
    });

    return rawToken;
};

export const rotateRefreshToken = async (rawOldToken, ip, userAgent) => {
    const hashedOldToken = hashToken(rawOldToken);
    const existing = await RefreshToken.findOne({
        hashedToken: hashedOldToken,
    });

    if (!existing || existing.invalidated || existing.expiresAt < new Date()) {
        return { error: "Invalid token" };
    }

    if (existing.replacedBy) {
        //user should not have access to this refresh token, assume leaked token and close the session for all users
        await RefreshToken.deleteMany({ userId: existing.userId });

        return { error: "Token reuse detected, please login again" };
    }

    const newRaw = generateRawToken();
    const newHashed = hashToken(newRaw);
    const newExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await RefreshToken.create({
        userId: existing.userId,
        hashedToken: newHashed,
        expiresAt: newExpiresAt,
        ip,
        userAgent,
    });

    // Mark old token as rotated
    existing.replacedBy = newHashed;
    existing.lastUsedAt = new Date();
    await existing.save();

    return { newRefreshToken: newRaw, userId: existing.userId };
};
