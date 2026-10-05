const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, // New members detect karne ke liye zaroori hai!
        GatewayIntentBits.DirectMessages // DM bhejne ke liye zaroori hai!
    ] 
});

client.commands = new Collection();
const commandsArray = [];

// Function to read commands recursively from folders and subfolders
function loadCommands(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commandsArray.push(command.data.toJSON());
            }
        }
    }
}

// Load all commands automatically
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    loadCommands(foldersPath);
}

// Function to load events automatically from the /events folder
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Trust me, bro.`);

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsArray },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

// Handle command execution
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Universal Event Hook for modular features (like Anti-Link handleMessage)
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    if (client.commands) {
        for (const [name, command] of client.commands) {
            if (command.handleMessage && typeof command.handleMessage === 'function') {
                try {
                    await command.handleMessage(message);
                } catch (error) {
                    console.error(`Error in handleMessage for command ${name}:`, error);
                }
            }
        }
    }
});

client.login(process.env.TOKEN);
