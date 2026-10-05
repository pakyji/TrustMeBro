const { SlashCommandBuilder } = require('discord.js');

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

        // Clean text-only response keeping the bro vibe alive
        const responseMessage = `🤖 **TrustMeBro AI Scanner**\nScanning aura for **${target.username}**... 100% real info (I swear).\n\n🧠 **AI Brain Analysis:** ${randomAura}\n💡 **Trust Score:** 0.1% (Totally legit)`;

        await interaction.reply({ content: responseMessage });
    },
};
