const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // Extended list of unlimited funny, chaotic, and meme-obsessed welcome banners/GIFs
            const welcomeBanners = [
                "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z2dDFlZ3g0dDF6MXR3YXZ2M3VjZ2NudHFlNWV4YXN2a3R2MWw0aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Lp71U7N5n0yA5m5U0K/giphy.gif",
                "https://media.giphy.com/media/l0HlRnAWXxn0MhOBK/giphy.gif",
                "https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif",
                "https://media.giphy.com/media/oWjyixDbWuAk8/giphy.gif",
                "https://media.giphy.com/media/fdyZ3qI0GVZC0/giphy.gif",
                "https://media.giphy.com/media/3o7TKSjRrfIPjeiOkM/giphy.gif",
                "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif",
                "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
                "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif",
                "https://media.giphy.com/media/xTiTnMhJTwNHCHdTZS/giphy.gif",
                "https://media.giphy.com/media/9uIZn5i0kXk9W/giphy.gif",
                "https://media.giphy.com/media/3orieXZ73V78JvQlao/giphy.gif",
                "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
                "https://media.giphy.com/media/8Iv5XqNgKsZ4g/giphy.gif",
                "https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif"
            ];

            const randomBanner = welcomeBanners[Math.floor(Math.random() * welcomeBanners.length)];

            const dmMessage = `🤖 **Yo ${member.user.username}, welcome to the server! (Trust me bro, you made the right choice).**\n\nListen up, bro. Now that you've successfully stepped foot in here, your IQ has officially dropped by 50 points—don't worry, you'll fit right in with the rest of us.\n\n💡 **Quick Survival Guide:**\n* Read the rules? Nah, just vibe and hope for the best.\n* If anyone asks, you're a certified sigma grindset expert (even if you sleep till 4 PM).\n\n*Welcome to the cult, bro. 100% real info (I swear).* 😎🔥\n\n${randomBanner}`;

            await member.send({ content: dmMessage });
        } catch (error) {
            console.error(`Could not send welcome DM to ${member.user.tag}:`, error);
        }
    },
};
