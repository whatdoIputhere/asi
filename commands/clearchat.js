const { SlashCommandBuilder } = require('discord.js');
const index = require('../index.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearchat')
        .setDescription('Deletes X amount of messages from chat or/and from specific user limited to 100 messages')
        .addStringOption(option => option.setName('amount').setDescription('Amount of messages to delete').setRequired(false))
        .addStringOption(option => option.setName('user').setDescription('User to delete messages from').setRequired(false)),
    async execute(interaction) {
        try {
            if (index.client.cooldowns.has('clearchat')) {
                console.log('chatclear run while on cooldown');
                interaction.reply({ content: 'This command is on cooldown', ephemeral: true });
                waitAndDelete(interaction);
            }
            else {
                console.log('chatclear run');
                index.client.cooldowns.set('clearchat', true);
                const targetUser = interaction.options.getString('user')?.replace(/[^0-9]/g, '') ?? 'everyone';
                const channel = await index.client.channels.fetch(interaction.channelId);
                const deletedMessages = [];

                channel.messages.fetch({ limit: 100 }).then(async messages => {
                    const numberOfTargetMessages = targetUser == 'everyone' ? messages.size : getNumberOfMessagesByUser(messages, targetUser);
                    if (interaction.options.getString('amount') != null && isNaN(parseInt(interaction.options.getString('amount')))) {
                        interaction.reply('Invalid amount');
                        waitAndDelete(interaction);
                        return;
                    }
                    const amountToDelete = interaction.options.getString('amount') != null ? parseInt(interaction.options.getString('amount')) > numberOfTargetMessages ? numberOfTargetMessages : parseInt(interaction.options.getString('amount')) : numberOfTargetMessages;
                    if (numberOfTargetMessages == 0) {
                        interaction.reply('No messages to clear');
                        waitAndDelete(interaction);
                    }
                    else {
                        let finished = false;
                        await interaction.reply('Clearing chat messages');
                        let deletedMessagescounter = 0;
                        const messagesArray = Array.from(messages);

                        for (let i = 0; i < messagesArray.length; i++) {
                            const message = messagesArray[i][1];

                            if (message.interaction?.id != interaction.id && (targetUser == 'everyone' || message.author.id == targetUser) && !finished) {
                                await message.delete()
                                    .then(msg => {
                                        console.log(`Deleted message from ${msg.author.username}`);
                                        deletedMessagescounter++;
                                        deletedMessages.push(msg);
                                    })
                                    .catch(console.error);
                                if (deletedMessagescounter == amountToDelete) {
                                    finished = true;
                                    interaction.editReply('Chat cleared Succesfuly');
                                    waitAndDelete(interaction);
                                }
                            }
                        }
                        storeMessages(deletedMessages, interaction.guildId);
                    }
                });
            }
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
        index.client.cooldowns.delete('clearchat');
        console.log('clearchat cooldown ended');
    }, 20 * 1000);
    setTimeout(() => {
        interaction.deleteReply();
    }, 3 * 1000);
}

function storeMessages(messages, guildId) {
    const messagesArray = [];
    messages.forEach(message => {
        if (message.author.bot) return;
        const authorIndex = messagesArray.findIndex(author => author.author.id == message.author.id);
        if (authorIndex != -1) {
            messagesArray[authorIndex].author.messages.push({
                messageId: message.id,
                content: message.content,
                channelId: message.channelId,
                createdAt: message.createdTimestamp,
            });
        }
        else {
            messagesArray.push({
                author: {
                    id: message.author.id,
                    username: message.author.username,
                    discriminator: message.author.discriminator,
                    messages: [{
                        messageId: message.id,
                        content: message.content,
                        channelId: message.channelId,
                        createdAt: message.createdTimestamp,
                    }],
                },
            });
        }
    });
    axios.post('http://localhost:4000/guild/' + guildId, messagesArray)
        .then(res => {
            console.log(res.data);
        })
        .catch(err => {
            console.log(err.data);
        });
}