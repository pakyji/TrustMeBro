const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');
const { openAICompatible, askChat, buildAnswer } = require('../../lib/ai');

const PROVIDERS = {
    gemini: {
        name: 'Gemini (Google)',
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        keyEnv: 'GEMINI_API_KEY',
        createClient: (key) => new GoogleGenAI({ apiKey: key }),
        ask: async (client, model, system, question) => {
            const resp = await client.interactions.create({
                model,
                input: `${system}\n\nUser question: ${question}`,
            });
            return resp?.output_text || '';
        },
    },
    openrouter: {
        name: 'OpenRouter (Free Models)',
        model: process.env.OPENROUTER_MODEL || 'openrouter/free',
        keyEnv: 'OPENROUTER_API_KEY',
        baseUrl: 'https://openrouter.ai/api/v1',
        createClient: (key) => openAICompatible(key, 'https://openrouter.ai/api/v1'),
        ask: askChat,
    },
    grok: {
        name: 'Grok (xAI)',
        model: process.env.GROK_MODEL || 'grok-4.3',
        keyEnv: 'GROK_API_KEY',
        baseUrl: 'https://api.x.ai/v1',
        createClient: (key) => openAICompatible(key, 'https://api.x.ai/v1'),
        ask: askChat,
    },
    qwen: {
        name: 'Qwen (BazaarLink)',
        model: process.env.BAZAAR_MODEL || 'qwen/qwen3.7-flash:free',
        keyEnv: 'BAZAAR_API_KEY',
        baseUrl: 'https://api.bazaarlink.ai/v1',
        createClient: (key) => openAICompatible(key, 'https://api.bazaarlink.ai/v1'),
        ask: askChat,
    },
};

const SYSTEM_PROMPT = 'You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real.';

function getProvider(providerName) {
    return PROVIDERS[providerName];
}

function getProviderChoices() {
    return Object.entries(PROVIDERS).map(([key, p]) => ({ name: p.name, value: key }));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Ask anything to AI! Choose your provider.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask?')
                .setRequired(true)
                .setMaxLength(300)
        )
        .addStringOption(option =>
            option.setName('provider')
                .setDescription('AI provider to use (default: auto - picks first available)')
                .setRequired(false)
                .addChoices(...getProviderChoices())
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');
        const providerName = interaction.options.getString('provider');

        // If no provider specified, pick the first one with a valid key
        let provider = providerName ? getProvider(providerName) : null;
        if (!provider) {
            for (const [key, p] of Object.entries(PROVIDERS)) {
                const keys = (process.env[p.keyEnv] || '').split(/[\s,]+/).filter(k => k.trim());
                if (keys.length > 0) {
                    provider = p;
                    break;
                }
            }
        }

        if (!provider) {
            return interaction.editReply({
                content: 'Bro, no AI providers are configured! Ask the bot owner to set at least one API key.',
                allowedMentions: { parse: [] },
            });
        }

        // Get API key(s)
        const keys = (process.env[provider.keyEnv] || '').split(/[\s,]+/).filter(k => k.trim());
        if (keys.length === 0) {
            return interaction.editReply({
                content: `Bro, ${provider.keyEnv} is missing! Ask the bot owner to set it.`,
                allowedMentions: { parse: [] },
            });
        }

        // For Gemini, pick random key; for others, use first key
        let client;
        if (provider.name.includes('Gemini')) {
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            client = provider.createClient(randomKey);
        } else {
            client = provider.createClient(keys[0]);
        }

        if (!client) {
            return interaction.editReply({
                content: `Bro, could not create ${provider.name} client.`,
                allowedMentions: { parse: [] },
            });
        }

        try {
            const reply = await provider.ask(client, provider.model, SYSTEM_PROMPT, userPrompt);
            await interaction.editReply({
                content: buildAnswer({
                    question: userPrompt,
                    label: `${provider.name} Answer`,
                    reply,
                    fallback: "Bro, my brain lagged. Trust me, it's not my fault.",
                }),
                allowedMentions: { parse: [] },
            });
        } catch (error) {
            console.error(`${provider.name} error:`, error);
            await interaction.editReply({
                content: `Bro, ${provider.name} servers are taking a nap right now. Try again later!`,
                allowedMentions: { parse: [] },
            });
        }
    },
};