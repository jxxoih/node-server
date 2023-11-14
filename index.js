const express = require('express')
var cors = require('cors')
const app = express()

const mysql = require('mysql2/promise');
const db = require('./lib/dbQuery.js');
const dbFunc = require('./lib/dbFunc.js');

const config = require('./config');
const port = config.server.serverport;

// express cors 설정
// origin: 요청한 front 주소
app.use(cors({
    credentials: true,
    origin: '*'
}));

app.get('/', function (req, res) {
    res.send(`
    <h1>Node Server</h1>
  `)
})

app.post('/data', (req, res) => {
    const { p_idx, action, arg } = req.query;

    var query = "";

    if (action === "getAbout") {
        query = "SELECT p_name, p_email, p_birth, p_description, p_about_title, p_about_context, p_github FROM `profile` WHERE p_idx = " + p_idx;
    } else if (action === "getSkill") {
        query = `SELECT DISTINCT s.s_idx, s.s_name, s.s_img, sf.sf_name, s.sf_idx, p.p_github FROM project_skill AS ps  
        INNER JOIN skill AS s ON ps.s_idx = s.s_idx
        LEFT JOIN skill_field AS sf ON s.sf_idx = sf.sf_idx
        LEFT JOIN profile AS p ON p.p_idx = ps.p_idx
        WHERE ps.p_idx = ${p_idx}
        ORDER BY s.sf_idx ASC;`;
    } else if (action === "getSkillField") {
        query = `SELECT sf_name, sf_idx FROM skill_field`;
    } else if (action === "getCompany") {
        query = "SELECT c_idx, company_nm, emp_status, DATE_FORMAT(w_start_date, '%Y-%m-%d') AS w_start_date, DATE_FORMAT(w_end_date, '%Y-%m-%d') AS w_end_date, use_status FROM `company` WHERE use_status = 1 AND p_idx = " + p_idx;
    } else if (action === "getProject") {
        query = `
        SELECT p.pro_idx, p.c_idx, p.pro_name, p.pro_position, pos.pos_name, p.pro_detail, p.pro_url, 
            DATE_FORMAT(p.pro_start_date, '%Y-%m-%d') AS pro_start_date, 
            DATE_FORMAT(p.pro_end_date, '%Y-%m-%d') AS pro_end_date, 
            w.use_status
        FROM project AS p
        INNER JOIN position AS pos ON p.pro_position = pos.pos_type
        LEFT JOIN company AS w ON p.c_idx = w.c_idx
        WHERE w.use_status = 1 AND p.use_status = 1 AND p.p_idx = ${p_idx}
        ORDER BY p.c_idx, p.pro_idx ASC
        `;
    } else if (action === "getProjectSkills") {
        query = `
            SELECT ps.pro_idx, s.s_name, s.sf_idx
            FROM project_skill AS ps 
            INNER JOIN skill AS s ON ps.s_idx = s.s_idx
            WHERE ps.p_idx = ${p_idx}
            AND sf_idx < 3
            ORDER BY ps.pro_idx, s.sf_idx, s.s_idx ASC;
        `;
    } else if (action === "getAdmCompany") {
        query = `
            SELECT 
                c_idx, 
                company_nm, 
                emp_status, 
                DATE_FORMAT(w_start_date, '%Y-%m-%d') AS w_start_date, 
                DATE_FORMAT(w_end_date, '%Y-%m-%d') AS w_end_date, 
                use_status 
            FROM company 
            WHERE p_idx = ${p_idx}
            ORDER BY c_idx ASC
        `;
    } else if (action === "getAdmProject") {
        query = `
        SELECT 
            p.pro_idx, 
            p.c_idx, 
            p.pro_name, 
            p.pro_position, 
            pos.pos_name, 
            p.pro_detail, 
            p.pro_url, 
            DATE_FORMAT(p.pro_start_date, '%Y-%m-%d') AS pro_start_date, 
            DATE_FORMAT(p.pro_end_date, '%Y-%m-%d') AS pro_end_date, 
            w.use_status
        FROM project AS p
        INNER JOIN position AS pos ON p.pro_position = pos.pos_type
        LEFT JOIN company AS w ON p.c_idx = w.c_idx
        WHERE p.p_idx = ${p_idx}
        ORDER BY p.c_idx, p.pro_idx ASC
        `;

        dbFunc.func.getProjectSkills(query).then((resolvedData) =>
            res.json({ "data": resolvedData })
        )

        return;
    } else if (action === "getSkillList") {
        query = `
            SELECT s_idx, s_name FROM skill ORDER BY sf_idx ASC;
        `;
    }








    // TODO:: update, insert
    else if (action === "updateAbout") {
        query = `
            UPDATE profile 
            SET p_about_title = "${arg.aboutTitle}", 
                p_about_context = "${arg.aboutContext}", 
                updated_at = NOW()
            WHERE p_idx = ${p_idx}; 
        `;
    } else if (action === "updateCompany") {
        var sql = `
            UPDATE company 
            SET company_nm = ?
                , emp_status = ?
                , w_start_date = ?
                , w_end_date = ?
                , use_status = ?
                , updated_at = NOW() 
            WHERE c_idx = ? AND p_idx = ${p_idx};`;
        var params = [];

        arg.map(company => {
            params = [company.company_nm, company.emp_status, company.w_start_date, company.w_end_date, company.use_status, company.c_idx];
            query += mysql.format(sql, params);
        });
    } else if (action === "insertCompany") {
        var query = `
            INSERT INTO company (p_idx, company_nm, emp_status, w_start_date, w_end_date, use_status) VALUES 
        `;

        arg.map((company, idx) => {
            var sql = "(";
            sql += `
                ${p_idx}
                , "${company.company_nm}"
                , ${company.emp_status}
                , "${company.w_start_date}"
                , "${company.w_end_date}"
                , ${company.use_status}
            `;
            sql += ")";

            if (idx + 1 >= arg.length) {
                sql += ";";
            } else {
                sql += ",";
            }

            query += sql;
        })
    } else if (action === "updateProject") {
        const projectData = arg.projectData;
        const newProjectSkillData = arg.newProjectSkill;
        var sql = `
            UPDATE project 
            SET c_idx = ?
                , pro_name = ?
                , pro_position = ?
                , pro_detail = ?
                , pro_url = ?
                , pro_start_date = ?
                , pro_end_date = ?
                , use_status = ?
                , updated_at = NOW() 
            WHERE pro_idx = ? AND p_idx = ${p_idx};`;
        var params = [];

        var updateSkillQuery = `
            UPDATE project_skill 
            SET pro_idx = ?
                , updated_at = NOW() 
            WHERE ps_idx = ? AND p_idx = ${p_idx};
        `;
        var skillParams = [];

        projectData.map(project => {
            params = [
                project.c_idx
                , project.pro_name
                , project.pro_position
                , project.pro_detail
                , project.pro_url
                , project.pro_start_date
                , project.pro_end_date
                , project.use_status
                , project.pro_idx
            ];

            query += mysql.format(sql, params);

            project.project_skill.map((skill) => {
                skillParams = [
                    skill.pro_idx,
                    skill.ps_idx
                ];

                query += mysql.format(updateSkillQuery, skillParams);
            })
        });

        if (!!newProjectSkillData) {

            query += "INSERT INTO project_skill (p_idx, pro_idx , s_idx) VALUES";

            newProjectSkillData.map((newData, idx) => {
                var newSql = "(";
                newSql += `
                ${p_idx}
                , ${newData.pro_idx}
                , ${newData.s_idx}
            `;
                newSql += ")";

                if (idx + 1 >= newProjectSkillData.length) {
                    newSql += ";";
                } else {
                    newSql += ",";
                }

                query += newSql;
            });
        }

        query += `DELETE FROM project_skill WHERE p_idx = ${p_idx} AND pro_idx = 0;`;
    } else if (action === "insertProject") {
        var query = `
            INSERT INTO project (p_idx, c_idx, pro_name, pro_position, pro_detail, pro_url, pro_start_date, pro_end_date, use_status) VALUES 
        `;

        arg.map((newData, idx) => {
            var sql = "(";
            sql += `
                ${p_idx}
                , ${newData.c_idx}
                , "${newData.pro_name}"
                , ${newData.pro_position}
                , "${newData.pro_detail}"
                , "${newData.pro_url}"
                , "${newData.pro_start_date}"
                , "${newData.pro_end_date}"
                , ${newData.use_status}
            `;
            sql += ")";

            if (idx + 1 >= arg.length) {
                sql += ";";
            } else {
                sql += ",";
            }

            query += sql;
        })
    }

    db(res, query);
})

app.listen(port);