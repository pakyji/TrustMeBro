const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

const bazaarClient = new OpenAI({
    apiKey: process.env.BAZAAR_API_KEY,
    baseURL: "https://api.bazaarlink.ai/v1",
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qwenbro')
        .setDescription('Ask anything to Qwen AI via BazaarLink! 100% fake & funny.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask the Qwen bro?')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');

        try {
            if (!process.env.BAZAAR_API_KEY) {
                await interaction.editReply("Bro, BAZAAR_API_KEY environment variable is missing!");
                return;
            }

            const completion = await bazaarClient.chat.completions.create({
                model: "qwen/qwen3.7-flash:free",
                messages: [
                    { role: "system", content: "You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real." },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 100,
            });

            const replyText = completion.choices[0].message.content || "Bro, my brain lagged. Trust me, it's not my fault.";

            const embed = new EmbedBuilder()
                .setTitle('🤖 TrustMeBro Qwen Chat')
                .addFields(
                    { name: '❓ Question', value: userPrompt, inline: false },
                    { name: '💡 Qwen Bro\'s Answer', value: replyText, inline: false }
                )
                .setColor(0xFFA500)
                .setFooter({ text: '100% real info (I swear).' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("BazaarLink Qwen Error:", error);
            await interaction.editReply({ content: `Bro, Qwen servers are taking a nap right now. Try again later!` });
        }
    },
};
