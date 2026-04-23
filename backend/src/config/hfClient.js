const axios = require("axios");

const HF_API_URL =
  process.env.HF_API_URL ||
  "https://router.huggingface.co/together/v1/chat/completions";

const MODEL = process.env.HUGGINGFACE_MODEL || "Qwen/Qwen2.5-7B-Instruct-Turbo";

let _client = null;

function getClient() {
  if (_client) return _client;
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey.startsWith("your_huggingface")) {
    return null;
  }
  _client = axios.create({
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });
  return _client;
}

module.exports = { getClient, MODEL, HF_API_URL };
