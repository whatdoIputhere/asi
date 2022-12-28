const { SlashCommandBuilder } = require('discord.js');
const index = require('../index');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setsavemessages')
        .setDescription('Sets whether or not the bot will save messages from this server')
        .addStringOption(option =>
            option.setName('save-messages')
                .setDescription('Whether or not the bot will save messages from this server')
                .setRequired(true)
                .addChoices(
                    { name: 'Save all deleted messages', value: 'true' },
                    { name: 'Don\'t save deleted messages', value: 'false' },
                )),
    async execute(interaction) {
        try {
            console.log('setsavemessages run');
            const saveMessages = interaction.options.getString('save-messages');
            const currentValue = index.client.storeMessagesEnabled.get(interaction.guildId);

            if (currentValue == saveMessages) {
                await interaction.reply('This option is already set on this server');
                waitAndDelete(interaction);
                return;
            }
            index.client.storeMessagesEnabled.set(interaction.guildId, saveMessages);
            try {
                axios.put('http://localhost:4000/guild/updatestoremessagesenabled/' + interaction.guildId).then(res => {
                    if (res.status == 200) {
                        saveMessages == 'true'
                            ?
                            interaction.reply('The bot will now save deleted messages from this server')
                            :
                            interaction.reply('The bot will no longer save deleted messages from this server');

                        waitAndDelete(interaction);
                    }
                });
            }
            catch (error) {
                console.log(error);
            }
        }
        catch (error) {
            await interaction.reply('error running command');
            console.log(error);
        }
    },
};

function waitAndDelete(interaction) {
    setTimeout(() => {
        interaction.deleteReply()
            .then(() => {
                console.log('setsave message deleted');
            })
            .catch(() => {
                console.log('setsave message already deleted');
            });

    }, 3 * 1000);
}