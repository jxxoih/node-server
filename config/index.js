const dotenv = require("dotenv");

dotenv.config({
    path: ".env.prod"
});

const config = {
    server: {
        serverport: process.env.SERVER_PORT,
        servername: process.env.SERVER_NAME || "nodeTest",
        serverdis: process.env.SERVER_DIS || "nodeTest",
    },
    db: {
        host: process.env.MYSQL_PRIMARY_HOST,
        port: process.env.MYSQL_PRIMARY_PORT,
        username:
            process.env.MYSQL_PRIMARY_USERNAME,
        password:
            process.env.MYSQL_PRIMARY_PASSWORD,
        database:
            process.env.MYSQL_PRIMARY_DATABASE,
        connLimit:
            process.env.MYSQL_CONNECTION_POOL_LIMIT,
    }
};

module.exports = config;