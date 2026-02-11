const { createClient } =require('redis');

const client = createClient({
    username: 'default',
    password: 'szief0Aex566lhlmEZ6NzHhJUV0G8iRp',
    socket: {
        host: 'redis-14132.c301.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 14132
    }
});

client.on('error', err => console.log('Redis Client Error', err));




module.exports=client;

