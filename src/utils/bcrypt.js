import bcrypt from "bcrypt";

export async function hashString(text) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(text, salt);
}

export async function compareString(plainText, hashedText) {
    return await bcrypt.compare(plainText, hashedText);
}

