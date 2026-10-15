const { Events } = require('discord.js');
const store = require('../lib/store');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const roleId = store.get('autorole', {})[member.guild.id];
        if (!roleId) return;
        const role = member.guild.roles.cache.get(roleId);
        if (!role || role.managed) return;
        if (role.position >= member.guild.members.me.roles.highest.position) return;
        await member.roles.add(role, 'Auto role').catch(error => {
            console.error('Auto role failed:', error.message);
        });
    },
};
