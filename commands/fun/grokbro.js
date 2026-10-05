const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

// Initialize OpenAI client configured for xAI (Grok)
const grok = new OpenAI({
    apiKey: process.env.GROK_API_KEY,
    baseURL: "https://api.x.ai/v1",
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grokbro')
        .setDescription('Ask anything to Grok AI! Based-as-hell answers.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask the Grok bro?')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');

        try {
            if (!process.env.GROK_API_KEY) {
                await interaction.editReply("Bro, GROK_API_KEY environment variable is missing!");
                return;
            }

            const completion = await grok.chat.completions.create({
                model: "grok-beta",
                messages: [
                    { role: "system", content: "You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro powered by Grok. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real." },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 100,
            });

            const replyText = completion.choices[0].message.content || "Bro, my brain lagged. Trust me, it's not my fault.";

            const embed = new EmbedBuilder()
                .setTitle('🤖 TrustMeBro Grok Chat')
                .addFields(
                    { name: '❓ Question', value: userPrompt, inline: false },
                    { name: '💡 Grok Bro\'s Answer', value: replyText, inline: false }
                )
                .setColor(0x000000)
                .setFooter({ text: '100% real info (I swear).' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Grok Error:", error);
            await interaction.editReply({ content: `Bro, Grok servers are taking a nap right now. Try again later!` });
        }
    },
};
