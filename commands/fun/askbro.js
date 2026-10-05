const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini client safely with the environment variable
const ai = new GoogleGenAI({});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('askbro')
        .setDescription('Ask anything to TrustMeBro AI! 100% fake & funny answers.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask the bro?')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');

        try {
            if (!process.env.GEMINI_API_KEY) {
                await interaction.editReply("Bro, GEMINI_API_KEY environment variable is missing!");
                return;
            }

            // Generate content using the stable flash model
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction: "You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. Always claim your info is 100% real (even if it's completely fake)."
                }
            });

            const aiReply = response.text || "Bro, my brain lagged. Trust me, it's not my fault.";

            const embed = new EmbedBuilder()
                .setTitle('🤖 TrustMeBro AI Chat')
                .addFields(
                    { name: '❓ Question', value: userPrompt, inline: false },
                    { name: '💡 Bro\'s Answer', value: aiReply, inline: false }
                )
                .setColor(0x00AAFF)
                .setFooter({ text: '100% real info (I swear).' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Gemini Error:", error);
            await interaction.editReply(`Bro, AI crashed: \`${error.message}\``);
        }
    },
};
