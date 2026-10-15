const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const PERMS = [
    'ViewChannel', 'SendMessages', 'EmbedLinks', 'ReadMessageHistory', 'AddReactions',
    'ManageMessages', 'ManageChannels', 'ManageRoles', 'ManageNicknames',
    'KickMembers', 'BanMembers', 'ModerateMembers', 'Connect', 'Speak',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the link to add this bot to another server.'),

    async execute(interaction) {
        const permissions = new PermissionsBitField(PERMS).bitfield.toString();
        const url = `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&scope=bot%20applications.commands&permissions=${permissions}`;
        return interaction.reply({ content: `🔗 Add me to your server: ${url}\nThe link asks for the permissions the moderation and music commands need.`, ephemeral: true });
    },
};
