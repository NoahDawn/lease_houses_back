// 防输入型攻击注入
const xss = require('xss')
const { exec } = require('../db/mysql.js')

// 查询当前收藏是否存在
const getCollectIfExit = async (userId, houseId) => {
    const sql = `select * from collect where userId='${userId}' and houseId='${houseId}' `
    const rows = await exec(sql)
    return rows[0]
}

// 新建收藏
const newCollectData = async (userId, houseId) => {
    const sql = `insert into collect (houseId, userId) values ('${houseId}', '${userId}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

// 删除收藏记录
const deleteCollectData = async function(id='', houseId='') {
    let sql = `delete from collect where 1=1 `
    if(id) {
        sql += `and id='${id}' `
    }
    if(houseId) {
        sql += `and houseId='${houseId}' `
    }
    const deleteData = await exec(sql)
    if (deleteData.affectedRows > 0) {
        return true
    }
    return false
}

// 修改收藏热度
const changeCollectCount = async (houseId, changeType, currentCollectCount) => {
    if(changeType === 'cut') {
        currentCollectCount = parseInt(currentCollectCount) - 1
    } else if(changeType === 'add') {
        currentCollectCount = parseInt(currentCollectCount) + 1
    }
    const sql = `update housems set collectCount='${currentCollectCount}' where id='${houseId}' `

    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

// 获取收藏列表
const getCollectList = async (ownerId) => {
    let sql = `select * from collect where userId='${ownerId}' order by id desc `
    return await exec(sql)
}

// 改变收藏状态(针对当前用户同页面的重复操作，0是未收藏，1是已收藏)
const collectTypeChange = async (id, currentType) => {
    const sql = `update collect set `
    if(currentType === 1) {
        sql += `currentType='${0}' `
    } else if(currentType === 0) {
        sql += `currentType='${1}' `
    }
    sql += ` where id='${id}' `
    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

module.exports = {
    getCollectList,
    getCollectIfExit,
    newCollectData,
    changeCollectCount,
    deleteCollectData
}