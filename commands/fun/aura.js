const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aura')
        .setDescription('Scan a user with fake advanced AI and check their meme aura! Trust me bro.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user you want to scan')
                .setRequired(false)
        ),
    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;

        const fakeLevels = [
            "-9999 Aura (Bro negative riz, absolute negative IQ)",
            "+5000 Aura (Eats cereal with water, sigma grindset)",
            "Legendary Meme Lord (Braincells left the chat)",
            "+100000 Aura (Bro is literally Batman... in his dreams)",
            "0 Aura (NPC behavior detected)"
        ];

        const randomAura = fakeLevels[Math.floor(Math.random() * fakeLevels.length)];

        const embed = new EmbedBuilder()
            .setTitle('🤖 TrustMeBro AI Scanner')
            .setDescription(`Scanning aura for **${target.username}**... 100% real info (I swear).`)
            .addFields(
                { name: '🧠 AI Brain Analysis', value: randomAura, inline: false },
                { name: '💡 Trust Score', value: '0.1% (Totally legit)', inline: false }
            )
            .setColor(0xFF0055)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
