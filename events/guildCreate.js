const { Events } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: Events.GuildCreate,
    execute(guild) {
        try {
            axios.post('http://localhost:4000/guild/createguild/' + guild.id).then(res => {
                console.log(res.data);
            });
        }
        catch (error) {
            console.log(error);
        }
    },
};