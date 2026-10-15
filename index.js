const { Client, GatewayIntentBits, Collection, REST, Routes, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { announceNewBuild } = require('./lib/announce');

// Keep the process alive on unexpected errors. They are logged, not hidden.
process.on('unhandledRejection', (reason) => console.error('Unhandled promise rejection:', reason));
process.on('uncaughtException', (error) => console.error('Uncaught exception:', error));

const TOKEN = process.env.TOKEN;
if (!TOKEN || !TOKEN.trim()) {
    console.error('TOKEN is not set. Add it to your environment or .env file, then start again.');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Privileged: enable in the Developer Portal
        GatewayIntentBits.GuildMembers,   // Privileged: welcome DMs and member moderation
        GatewayIntentBits.GuildVoiceStates, // Needed for /play and the other music commands
        GatewayIntentBits.DirectMessages,
    ],
});

client.commands = new Collection();
const commandsArray = [];

// Loads every command file in a folder tree. One broken file is logged and skipped.
function loadCommands(dir) {
    for (const file of fs.readdirSync(dir)) {
        const filePath = path.join(dir, file);

        if (fs.statSync(filePath).isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            try {
                const command = require(filePath);
                if (!('data' in command) || typeof command.execute !== 'function') {
                    console.warn(`Skipped ${filePath}: it must export data and execute.`);
                    continue;
                }
                if (client.commands.has(command.data.name)) {
                    console.warn(`Duplicate command name "${command.data.name}" in ${filePath}. The first one is kept.`);
                    continue;
                }
                client.commands.set(command.data.name, command);
                commandsArray.push(command.data.toJSON());
            } catch (error) {
                console.error(`Failed to load ${filePath}:`, error);
            }
        }
    }
}

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) loadCommands(commandsPath);

// Events are loaded from /events. A bad file is logged and skipped.
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
        try {
            const event = require(path.join(eventsPath, file));
            const handler = (...args) => event.execute(...args, client);
            if (event.once) client.once(event.name, handler);
            else client.on(event.name, handler);
        } catch (error) {
            console.error(`Failed to load event ${file}:`, error);
        }
    }
}

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}! Trust me, bro.`);

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log(`Registering ${commandsArray.length} application (/) commands.`);
        await rest.put(Routes.applicationCommands(readyClient.user.id), { body: commandsArray });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Could not register slash commands:', error);
    }

    // Start scheduled jobs (reminders, temporary bans). They survive restarts.
    try {
        require('./lib/jobs').init(readyClient);
    } catch (error) {
        console.error('Scheduler failed to start:', error);
    }

    // Post the "live" message (with @everyone) in guilds that set it up, once per new build.
    try {
        await announceNewBuild(readyClient);
    } catch (error) {
        console.error('Update announcement failed:', error);
    }
});

client.on(Events.Error, (error) => console.error('Discord client error:', error));

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`Error in /${interaction.commandName}:`, error);
        const text = 'Bro, something broke while running this command. Try again later!';
        try {
            // Use editReply / followUp if the interaction was already acknowledged.
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: text }).catch(() => interaction.followUp({ content: text, ephemeral: true }));
            } else {
                await interaction.reply({ content: text, ephemeral: true });
            }
        } catch (replyError) {
            console.error('Could not send the error reply:', replyError.message);
        }
    }
});

// Modular message hooks (for example anti-link). Each one runs in its own try block.
client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot) return;

    for (const [name, command] of client.commands) {
        if (typeof command.handleMessage !== 'function') continue;
        try {
            await command.handleMessage(message);
        } catch (error) {
            console.error(`Error in handleMessage for /${name}:`, error);
        }
    }
});

client.login(TOKEN).catch((error) => {
    console.error('Login failed. Check that TOKEN is correct and the privileged intents are enabled:', error.message);
    process.exit(1);
});
