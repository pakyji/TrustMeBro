const { SlashCommandBuilder } = require('discord.js');
const { randomItem } = require('../../lib/content');

const EMOJI = { rock: '🪨', paper: '📄', scissors: '✂️' };
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Rock, paper, scissors against the bot.')
        .addStringOption(o => o.setName('choice').setDescription('Your move').setRequired(true)
            .addChoices({ name: 'Rock', value: 'rock' }, { name: 'Paper', value: 'paper' }, { name: 'Scissors', value: 'scissors' })),

    async execute(interaction) {
        const me = interaction.options.getString('choice');
        const bot = randomItem(['rock', 'paper', 'scissors']);
        let result = "It's a tie!";
        if (BEATS[me] === bot) result = 'You win, bro! 🏆';
        else if (BEATS[bot] === me) result = 'I win. Better luck next time 😎';
        return interaction.reply({ content: `You: ${EMOJI[me]} vs Bot: ${EMOJI[bot]}\n**${result}**` });
    },
};
