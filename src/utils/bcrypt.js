import bcrypt from "bcrypt";

// Generate hash for any string
export async function hashString(text) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(text, salt);
}

// Compare plain text with hashed text
export async function compareString(plainText, hashedText) {
    return await bcrypt.compare(plainText, hashedText);
}

// export default{ hashString, compareString };