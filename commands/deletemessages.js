const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletemessages')
        .setDescription('Deletes all stored messages from the database'),
    async execute(interaction) {
        try {
            axios.put(`http://localhost:4000/guild/deletemessages/${interaction.guildId}`).then(res => {
                if (res.status == 200) {
                    interaction.reply('Messages deleted');
                    waitAndDelete(interaction);
                }
            }).catch(err => {
                console.log(err);
            });
        }
        catch (error) {
            await interaction.reply('error running command');
            console.log('no success');
        }

    },
};

function waitAndDelete(interaction) {
    setTimeout(() => {
        interaction.deleteReply();
    }, 3000);
}