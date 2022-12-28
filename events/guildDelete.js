const { Events } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: Events.GuildDelete,
    execute(guild) {
        try {
            axios.delete('http://localhost:4000/guild/deleteguild/' + guild.id).then(res => {
                console.log(res.data);
            });
        }
        catch (error) {
            console.log(error);
        }
    },
};