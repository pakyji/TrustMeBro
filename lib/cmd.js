// Shared checks for slash commands: guild-only, bot permissions, role hierarchy.

/** Returns an error string if the bot lacks the permissions in that channel, otherwise null. */
function missingBotPerms(interaction, channel, names) {
    const me = interaction.guild.members.me;
    const perms = channel && typeof channel.permissionsFor === 'function' ? channel.permissionsFor(me) : null;
    if (!perms) return 'I cannot see that channel.';
    const missing = names.filter(n => !perms.has(n));
    return missing.length ? `Bro, I need these permissions there: ${missing.join(', ')}.` : null;
}

/** Checks that the moderator and the bot can both give or remove this role. */
function roleBlocker(interaction, role) {
    const { guild, user } = interaction;
    if (role.managed || role.id === guild.id) return 'Bro, that role cannot be assigned.';
    if (role.position >= guild.members.me.roles.highest.position) {
        return 'Bro, that role is above my highest role. Move my role higher first.';
    }
    const modRole = interaction.member?.roles?.highest;
    if (guild.ownerId !== user.id && modRole && role.position >= modRole.position) {
        return 'Bro, that role is equal to or higher than your top role.';
    }
    return null;
}

function ephemeral(interaction, content) {
    return interaction.reply({ content, ephemeral: true });
}

/** Returns true (and replies) when the command was used outside a server. */
function requireGuild(interaction) {
    if (interaction.guild) return false;
    ephemeral(interaction, 'Bro, this command only works in a server.');
    return true;
}

module.exports = { missingBotPerms, roleBlocker, ephemeral, requireGuild };
