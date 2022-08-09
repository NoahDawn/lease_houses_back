const { exec, escape } = require('../db/mysql.js')
const { genPassword } = require('../untils/cryp.js')
const xss = require('xss')

//用户登录
const login = async (username, password) => {
    //escape函数用于sql语句中符号的转义
    username = escape(username)

    //生成加密密码
    password = genPassword(password)
    password = escape(password)

    const sql = `select id, username, realname, picture, phone, money from userms where username=${username} and password=${password} `
    const rows = await exec(sql)
    return rows[0] || {}
}

//用户注册
const register = async (userData = {}) => {
    const username = xss(userData.username)
    const password = genPassword(xss(userData.password))
    const realname = xss(userData.realname)
    const phone = xss(userData.phone)
    //默认的头像路径
    //const picture = 'http://101.200.134.15:8000/picture/user/DefaultAvatar.jpg'
    const picture = 'http://127.0.0.1:8050/picture/user/DefaultAvatar.jpg'
    const money = 0.00

    const sql = `insert into userms (username, password, realname, phone, picture, money)
                 values ('${username}', '${password}', '${realname}', '${phone}', '${picture}', '${money}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

//查询用户名是否重名
const ifUserNameExit = async function(body = {}) {
    const sql = `select username, phone from userms where username='${body.username}' `
    const userData = await exec(sql)
    return userData[0] || {}
}

//修改密码
const changePwd = async (userData = {}) => {
    const username = xss(userData.username)
    const password = genPassword(xss(userData.password))
    const phone = xss(userData.phone)

    const sql = `update userms set password='${password}' where username='${username}' and phone='${phone}' `
    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

//修改个人信息前先获得个人信息
const getUserDetail = async function(id) {
    const sql = `select username, realname, phone, picture, money from userms where id='${id}' `
    const userData = await exec(sql)
    return userData[0] || {}
}

//个人设置
// const updateUserMS = async (userData = {}) => {
//     const id = userData.id
//     const realname = xss(userData.realname)
//     const phone = xss(userData.phone)
//     const picture = userData.picture

//     const sql = `update userms set realname='${realname}', phone='${phone}', picture='${picture}'
//                  where id='${id}' `
//     const insertData = await exec(sql)
//     return {
//         id: id
//     }
// }

//钱包设置
const changeWallet = async (userId, cost) => {
    const money = parseFloat(cost).toFixed(2)

    const sql = `update userms set money='${money}' where id='${userId}' `
    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

module.exports = {
    login,
    register,
    ifUserNameExit,
    changePwd,
    getUserDetail,
    changeWallet
    // updateUserMS
}