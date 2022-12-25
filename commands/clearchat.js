const { SlashCommandBuilder } = require('discord.js');
const index = require('../index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearchat')
        .setDescription('Deletes X amount of messages from chat or/and from specific user limited to 100 messages')
        .addStringOption(option => option.setName('amount').setDescription('Amount of messages to delete').setRequired(false))
        .addStringOption(option => option.setName('user').setDescription('User to delete messages from').setRequired(false)),
    async execute(interaction) {
        try {
            console.log('chatclear run');
            const client = index.client;
            const targetUser = interaction.options.getString('user')?.replace(/[^0-9]/g, '') ?? 'everyone';
            const channelId = interaction.channelId;
            const channel = await client.channels.fetch(channelId);

            channel.messages.fetch({ limit: 100 }).then(async messages => {
                const numberOfMessages = targetUser == 'everyone' ? messages.size : getNumberOfMessagesByUser(messages, targetUser);
                const amountToDelete = interaction.options.getString('amount') != null ? parseInt(interaction.options.getString('amount')) : numberOfMessages;
                if (numberOfMessages == 0) {
                    interaction.reply('No messages to clear');
                    waitAndDelete(interaction);
                }
                else {
                    await interaction.reply('Clearing chat messages');
                    let deletedMessagescounter = 0;
                    messages.forEach(async (message) => {
                        if (message.interaction?.id != interaction.id && (targetUser == 'everyone' || message.author.id == targetUser)) {
                            await message.delete()
                                .then(msg => {
                                    console.log(`Deleted message from ${msg.author.username}`);
                                    deletedMessagescounter++;
                                })
                                .catch(console.error);
                            console.log(amountToDelete);
                            if (deletedMessagescounter == amountToDelete) {
                                interaction.editReply('Chat cleared Succesfuly');
                                waitAndDelete(interaction);
                                return;
                            }

                        }
                    });
                }
            });
        }
        catch (error) {
            await interaction.reply('Error occured');
            console.log(error);
        }

    },
};

function getNumberOfMessagesByUser(messages, targetUser) {
    let counter = 0;
    messages.forEach(message => {
        if (message.author.id == targetUser) {
            counter++;
        }
    });
    return counter;
}

function waitAndDelete(interaction) {
    setTimeout(() => {
        interaction.deleteReply();
    }, 3000);
}