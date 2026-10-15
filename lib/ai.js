const OpenAI = require('openai');

// Discord rejects messages longer than 2000 characters.
const DISCORD_LIMIT = 2000;

/**
 * Returns an OpenAI-compatible client, or null when the key is missing.
 * It is created when a command runs, not when the file loads, so a missing key
 * never stops the whole bot from starting.
 */
function openAICompatible(apiKey, baseURL) {
    if (!apiKey || !apiKey.trim()) return null;
    return new OpenAI({ apiKey: apiKey.trim(), baseURL });
}

/** One chat completion with a system rule and a user question. Returns the reply text. */
async function askChat(client, model, system, question) {
    const completion = await client.chat.completions.create({
        model,
        max_tokens: 100,
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: question }
        ]
    });
    return completion.choices?.[0]?.message?.content?.trim() || '';
}

/** Builds the answer message and keeps it inside Discord's length limit. */
function buildAnswer({ question, label, reply, fallback }) {
    const text = reply || fallback;
    const head = `❓ **Question:** ${question}\n\n💡 **${label}:** `;
    const tail = `\n\n*Trust me bro, this info is 100% real (I swear).*`;
    const room = DISCORD_LIMIT - head.length - tail.length;
    const body = text.length > room ? `${text.slice(0, Math.max(0, room - 1))}…` : text;
    return head + body + tail;
}

module.exports = { openAICompatible, askChat, buildAnswer, DISCORD_LIMIT };
