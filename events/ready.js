const { Events } = require('discord.js');
const axios = require('axios');
const index = require('../index');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		const guildIds = [];
		client.guilds.cache.forEach(guild => {
			guildIds.push(guild.id);
		});

		try {
			axios.post('http://localhost:4000/guild/check', guildIds)
				.then(res => {
					res.data.forEach(guild => {
						if (typeof guild == 'string') {
							index.client.storeMessagesEnabled.set(guild, 'false');
						}
						else {
							index.client.storeMessagesEnabled.set(guild.guildID, guild.storeMessagesEnabled.toString());
						}
					});
					index.client.apirunning = true;
				})
				.catch(() => {
					console.log('Api not running');
				});
		}
		catch (error) {
			console.log(error);
		}

	},
};