const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows the list of all available commands automatically!'),
    async execute(interaction, client) {
        const commands = Array.from(client.commands.values());
        const itemsPerPage = 5;
        let currentPage = 0;

        const generateEmbed = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const currentCommands = commands.slice(start, end);

            const embed = new EmbedBuilder()
                .setTitle('🤖 TrustMeBro - Command Menu')
                .setDescription('100% real info (I swear). Here is the list of available commands:')
                .setColor(0x00FF00)
                .setFooter({ text: `Page ${page + 1} of ${Math.ceil(commands.length / itemsPerPage)}` })
                .setTimestamp();

            currentCommands.forEach(cmd => {
                embed.addFields({
                    name: `/${cmd.data.name}`,
                    value: cmd.data.description || 'No description available',
                    inline: false
                });
            });

            return embed;
        };

        const generateRows = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled((page + 1) * itemsPerPage >= commands.length)
            );
        };

        const response = await interaction.reply({
            embeds: [generateEmbed(currentPage)],
            components: [generateRows(currentPage)],
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'This menu is not for you!', ephemeral: true });
            }

            if (i.customId === 'prev') {
                currentPage--;
            } else if (i.customId === 'next') {
                currentPage++;
            }

            await i.update({
                embeds: [generateEmbed(currentPage)],
                components: [generateRows(currentPage)]
            });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    },
};
