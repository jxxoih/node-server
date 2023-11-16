var path = process.cwd();

const db = require(path + '/lib/dbQuery.js');

const getProjectSkills = async (query) => {
    var rows = await getProjectRows(query);
    var result = await getProjectSkillData(rows);

    return result;
}


const getProjectRows = async (query, arg) => {
    const rows = await db(null, query);
    return rows;
}

const getProjectSkillData = async (rows) => {
    const arr = await Promise.all(
        rows.map(async (data, idx) => {
            const pro_idx = data.pro_idx;
            const p_idx = 1;
            const sql = `SELECT ps_idx, pro_idx, s_idx FROM project_skill WHERE p_idx = ${p_idx} AND pro_idx = ${pro_idx}`;
            const result = await db(null, sql);
            rows[idx].project_skill = result;
            const newData = rows[idx];

            return getSkillPromise(newData);
        })
    );

    return arr;
}

const getSkillPromise = async (newData) => {
    return new Promise((resolve, reject) => {
        resolve(newData);
    })
}


exports.func = { getProjectSkills };