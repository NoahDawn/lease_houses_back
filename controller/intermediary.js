// 防输入型攻击注入
const xss = require('xss')
const { exec } = require('../db/mysql.js')

// 获取经纪人列表
const getIntermediaryList = async (userId) => {
    // 过滤自己已经委托的经纪人
    let sql = `select * from intermediary `
    if(userId) {
        sql += `where id not in (select intermediaryId from entrust where userId='${userId}') `
    }
    return await exec(sql)
}

// 新建委托关系
const newEntrust = async (userId, intermediaryId, have='', houseId=0) => {
    let mission = parseInt(0)
    // 若存在任务指定，直接将对应值改为1
    if(have) {
        mission = parseInt(1)
    }
    let sql = `insert into entrust `
    // 当houseId传递值为0则意味着初次添加入经纪人委托列表
    if(houseId === 0) {
        sql += `(userId,intermediaryId,mission) values ('${userId}','${intermediaryId}','${mission}') `
    } else {
        sql += `(userId,intermediaryId,mission,resHouseId) values ('${userId}','${intermediaryId}','${mission}','${houseId}') `
    }
    const insertData = await exec(sql)
    return{
        id:insertData.insertId
    }
}

// 获取委托关系列表
const getEntrustList = async (userId, getType='') => {
    // 查询存在任务的经纪人
    let sql = `select entrust.id,userId,entrust.intermediaryId,mission,resHouseId,housems.houseName,housems.picture from entrust `
    sql+= `inner join housems on resHouseId = housems.id where userId='${userId}' `
    
    // 查询未有任务的经纪人
    let sql2 = `select * from entrust where mission=0 `
    // 若是房源管理获取委托信息，过滤重复对象
    if(getType === 'houseManage') {
        sql += `group by entrust.intermediaryId `
        sql2 += `group by intermediaryId `
    }
    let withMission = await exec(sql)
    let withoutMission = await exec(sql2)

    return [...withMission,...withoutMission]
}

// 获取对应委托关系
const getEntrustDetail = async (userId, intermediaryId, houseId) => {
    let sql = `select * from entrust where userId='${userId}' and intermediaryId='${intermediaryId}' and resHouseId='${houseId}' `
    const rows = await exec(sql)
    return rows[0] || {}
}

// 修改对应委托关系
const updateEntrustMission = async (userId, intermediaryId, houseId) => {
    let mission = parseInt(1)
    const sql = `update entrust set mission='${mission}' where resHouseId='${houseId}' and userId='${userId}' and intermediaryId='${intermediaryId}' `

    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

// 获取经纪人个人信息
const getIntermediaryMessage = async (intermediaryId) => {
    const id = parseInt(intermediaryId)
    let sql = `select * from intermediary where id='${id}' `
    const rows = await exec(sql)
    return rows[0]
}

// 卸任委托关系
const deleteEntrust = async function(userId, intermediaryId) {
    const mission = parseInt(0)
    const sql = `delete from entrust where userId='${userId}' and intermediaryId='${intermediaryId}' and mission='${mission}' `
    const deleteData = await exec(sql)
    if (deleteData.affectedRows > 0) {
        return true
    }
    return false
}

// 房源删除/失效，恢复经纪人等待状态
const resetEntrust = async (userId, intermediaryId, houseId) => {
    // 对应房源没有经纪人时直接结束
    if(parseInt(intermediaryId) === 0) {
        return false
    }
    let mission = parseInt(0)
    // const sql = `update entrust set mission='${mission}' resHouseId=null where userId='${userId}' and intermediatyId='${intermediatyId}' and resHouseId='${houseId}' `
    const sql = `delete from entrust where userId='${userId}' and intermediaryId='${intermediaryId}' and resHouseId='${houseId}' `
    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

module.exports = {
    getIntermediaryList,
    newEntrust,
    getEntrustList,
    getEntrustDetail,
    getIntermediaryMessage,
    updateEntrustMission,
    deleteEntrust,
    resetEntrust
}