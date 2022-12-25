const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('template')
        .setDescription('template'),
    async execute(interaction) {
        try {
            console.log('template run');
            await interaction.reply('template');
        }
        catch (error) {
            await interaction.reply('error running command');
            console.log(error);
        }

    },
};

// interaction.user is the object representing the User who ran the command
// interaction.member is the GuildMember object, which represents the user in the specific guild