const axios = require("axios");

const HF_API_URL =
  process.env.HF_API_URL ||
  "https://router.huggingface.co/together/v1/chat/completions";

const MODEL_CANDIDATES = [
  process.env.HUGGINGFACE_MODEL,
  "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  "Qwen/Qwen2.5-7B-Instruct-Turbo",
].filter(Boolean);

const PRIMARY_MODEL = MODEL_CANDIDATES[0];

function getClient() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey === "your_huggingface_api_key_here") {
    return null;
  }
  return axios.create({
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 60000,
  });
}

module.exports = { getClient, PRIMARY_MODEL, MODEL_CANDIDATES, HF_API_URL };
