import { Algorithm, hash, verify } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plainTextPassword) {
  return hash(String(plainTextPassword || ""), ARGON2_OPTIONS);
}

export async function verifyPassword(hashValue, plainTextPassword) {
  if (!hashValue) {
    return false;
  }

  return verify(hashValue, String(plainTextPassword || ""));
}
