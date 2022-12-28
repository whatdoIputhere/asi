const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const index = require('../index.js');
const axios = require('axios');
const cooldown = 20;
const timeToDeleteMessage = 5;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearchat')
        .setDescription('Deletes X amount of messages from chat or/and from specific user limited to 100 messages')
        .addUserOption(option => option.setName('user').setDescription('User to delete messages from').setRequired(false))
        .addIntegerOption(option => option.setName('amount').setDescription('Amount of messages to delete').setRequired(false).setMinValue(1).setMaxValue(100)),
    async execute(interaction) {
        try {
            if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                if (index.client.cooldowns.get(interaction.guildId) == 'clearchat') {
                    console.log('chatclear run while on cooldown');
                    interaction.reply({ content: 'This command is on cooldown', ephemeral: true });
                    waitAndDelete(interaction, true);
                    return;
                }
                console.log('chatclear run');
                index.client.cooldowns.set(interaction.guildId, 'clearchat');
                const targetUser = interaction.options.getUser('user')?.id ?? 'everyone';
                const channel = await index.client.channels.fetch(interaction.channelId);
                const deletedMessages = [];

                channel.messages.fetch({ limit: 100 }).then(async messages => {
                    if (interaction.options.getInteger('amount') != null && isNaN(parseInt(interaction.options.getInteger('amount')))) {
                        interaction.reply('Invalid amount');
                        waitAndDelete(interaction);
                        return;
                    }
                    const numberOfTargetMessages = targetUser == 'everyone' ? messages.size : getNumberOfMessagesByUser(messages, targetUser);
                    if (numberOfTargetMessages == 0) {
                        interaction.reply('No messages to clear');
                        waitAndDelete(interaction);
                        return;
                    }
                    const amountToDelete = interaction.options.getInteger('amount') != null ? parseInt(interaction.options.getInteger('amount')) > numberOfTargetMessages ? numberOfTargetMessages : parseInt(interaction.options.getInteger('amount')) : numberOfTargetMessages;
                    let finished = false;
                    await interaction.reply('Clearing chat messages');
                    let deletedMessagescounter = 0;
                    const messagesArray = Array.from(messages);

                    for (let i = 0; i < messagesArray.length; i++) {
                        const message = messagesArray[i][1];

                        if (message.interaction?.id != interaction.id && (targetUser == 'everyone' || message.author.id == targetUser) && !finished) {
                            await message.delete()
                                .then(msg => {
                                    console.log(`deleted message from ${msg.author.username}`);
                                    deletedMessagescounter++;
                                    if (message.author.bot == false) {
                                        deletedMessages.push(msg);
                                    }
                                })
                                .catch(console.error);
                            if (deletedMessagescounter == amountToDelete) {
                                finished = true;
                                interaction.editReply('Chat cleared Succesfuly');
                                waitAndDelete(interaction);
                            }
                        }
                    }
                    if (index.client.storeMessagesEnabled.get(interaction.guildId) == 'true' && deletedMessages.length > 0) {
                        storeMessages(deletedMessages, interaction.guildId);
                    }
                });
            }
            else {
                interaction.reply({ content: 'You do not have permission to use this command', ephemeral: true });
                console.log('clearchat run without permission');
                waitAndDelete(interaction);
            }
        }
        catch (error) {
            await interaction.reply('There was an issue running this command');
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

function waitAndDelete(interaction, onCooldown) {
    if (!onCooldown) {
        setTimeout(() => {
            index.client.cooldowns.delete(interaction.guildId);
            console.log('clearchat cooldown ended for guild ' + interaction.guildId);
        }, cooldown * 1000);
    }
    setTimeout(() => {
        interaction.deleteReply()
            .then(() => {
                console.log('clearchat message deleted');
            })
            .catch(() => {
                console.log('clearchat message already deleted');
            });

    }, timeToDeleteMessage * 1000);
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
    try {
        axios.post('http://localhost:4000/guild/storemessages/' + guildId, messagesArray)
            .then(res => {
                console.log(res.data);
            })
            .catch(err => {
                console.log(err.data);
            });
    }
    catch (error) {
        console.log(error);
    }

}