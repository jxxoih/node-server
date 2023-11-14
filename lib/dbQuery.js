const db = require('./db.js');

const dbQuery = async (res, query) => {
    return new Promise(async (resolve, reject) => {
        let conn = null;
        try {
            conn = await db.getConnection();
            await conn.beginTransaction(); //트랜잭션 시작

            const [results] = await conn.query(query);
            if (!!res) {
                res.json({ "data": results });
            }

            await conn.commit(); //커밋
            conn.release();
            resolve(results);

        } catch (error) {
            if (conn !== null) {
                await conn.rollback();
                conn.release();
            }
            reject(error);
        }
    })
}

module.exports = dbQuery;