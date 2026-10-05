const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gptbro')
        .setDescription('Ask anything to OpenAI GPT! Fast & smart bro answers.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask the GPT bro?')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');

        try {
            if (!process.env.OPENAI_API_KEY) {
                await interaction.editReply("Bro, OPENAI_API_KEY environment variable is missing!");
                return;
            }

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real." },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 100,
            });

            const replyText = completion.choices[0].message.content || "Bro, my brain lagged. Trust me, it's not my fault.";

            const embed = new EmbedBuilder()
                .setTitle('🤖 TrustMeBro gpt Chat')
                .addFields(
                    { name: '❓ Question', value: userPrompt, inline: false },
                    { name: '💡 GPT Bro\'s Answer', value: replyText, inline: false }
                )
                .setColor(0x10A37F)
                .setFooter({ text: '100% real info (I swear).' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("OpenAI Error:", error);
            await interaction.editReply({ content: `Bro, OpenAI servers are taking a nap right now. Try again later!` });
        }
    },
};
