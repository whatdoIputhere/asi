const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const index = require('../index');
const axios = require('axios');
const timeToDeleteMessage = 5;

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
            if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
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
            else {
                await interaction.reply('You don\'t have permission to run this command, only and administrator can run this command');
                console.log('setsavemessages run without permission');
                waitAndDelete(interaction);
            }
        }
        catch (error) {
            await interaction.reply('There was an issue running this command');
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

    }, timeToDeleteMessage * 1000);
}