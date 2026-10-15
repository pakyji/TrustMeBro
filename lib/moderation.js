/**
 * Checks whether the moderator may act on the target.
 * Returns an error message to show the moderator, or null when the action is allowed.
 */
function moderationBlocker(interaction, target, member) {
    const { guild, user, client } = interaction;

    if (target.id === user.id) return 'Bro, you cannot use this on yourself!';
    if (target.id === client.user.id) return 'Bro, nice try. I am not punishing myself!';
    if (target.id === guild.ownerId) return 'Bro, the server owner is untouchable!';

    const moderatorRole = interaction.member?.roles?.highest;
    const isOwner = guild.ownerId === user.id;
    if (member && moderatorRole && !isOwner && member.roles.highest.position >= moderatorRole.position) {
        return 'Bro, that member has an equal or higher role than you!';
    }

    return null;
}

module.exports = { moderationBlocker };
