const mysql = require('mysql2/promise');  // mysql 모듈 로드
const config = require('../config');

const dbConfig = {  // mysql 접속 설정
    host: config.db.host,
    port: config.db.port,
    user: config.db.username,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
    connectionLimit: config.db.connLimit,
    timezone: "Asia/Seoul"
};

module.exports = mysql.createPool(dbConfig);