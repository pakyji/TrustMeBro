const { SlashCommandBuilder } = require('discord.js');
const OpenAI =ській = require('openai');
const OpenAI = require('openai');

const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('heybro')
        .setDescription('Ask anything to the Bro! 100% fake & funny.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask the bro?')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');

        try {
            if (!process.env.OPENROUTER_API_KEY) {
                await interaction.editReply("Bro, OPENROUTER_API_KEY environment variable is missing!");
                return;
            }

            const completion = await openrouter.chat.completions.create({
                model: "openrouter/free",
                messages: [
                    { role: "system", content: "You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real." },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 100,
            });

            const replyText = completion.choices[0].message.content || "Bro, my brain lagged. Trust me, it's not my fault.";

            // Clean, text-only response keeping the bro style intact
            const responseMessage = `❓ **Question:** ${userPrompt}\n\n💡 **Bro's Answer:** ${replyText}\n\n*Trust me bro, this info is 100% real (I swear).*`;

            await interaction.editReply({ content: responseMessage });
        } catch (error) {
            console.error("OpenRouter Error:", error);
            await interaction.editReply({ content: `Bro, servers are taking a nap right now. Try again later!` });
        }
    },
};
