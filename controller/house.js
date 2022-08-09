//防输入型攻击注入
const xss = require('xss')
const { exec } = require('../db/mysql.js')
const date = require('silly-datetime')
const { dateCodeChange } = require('../untils/dateTime.js')

//获取列表
const getList = async (ownerId, keyword, pageType, theType) => {
    //where 1=1用于为后续添加的查询条件做连接
    let sql = `select * from housems where 1=1 `
    if (ownerId) {
        sql += `and ownerId='${ownerId}' `
    }
    if(theType) {
        sql += `and leaseType='${theType}' `
    }
    // 带模糊匹配和or语句的放在最后面
    if (keyword) {
        sql += `and location like '%${keyword}%' `
        sql += `or houseName like '%${keyword}%' `
        sql += `or houseType like '%${keyword}%' `
        sql += `or detail like '%${keyword}%' `
    }
    if (pageType) {
        sql += `order by id desc `
    } else {
        // 取现在的时间戳并转码，比对数据的时间，直接忽略逾期额房源
        const now = dateCodeChange(new Date())
        sql += `and destroyTime>'${now}' `
        sql += `and state=0 order by id desc `
    }
    return await exec(sql)
}

//获取逾期房源列表（用于首页初步处理逾期房源）
const getOverdueList = async () => {
    // 取现在的时间戳并转码，比对数据的时间，直接忽略逾期额房源
    const now = dateCodeChange(new Date())
    //where 1=1用于为后续添加的查询条件做连接
    let sql = `select * from housems where 1=1 `
    // 时间已逾期
    sql += `and destroyTime<'${now}' `
    sql += `and state in (0,1,2) and ifLeased=0 order by id desc `
    return await exec(sql)
}

//详情获取
const getHouseDetail = async (id) => {
    const sql = `select * from housems where id='${id}' `
    const rows = await exec(sql)
    return rows[0]
}

//对应房源详情的设施配备获取
const getHouseFacilities = async (houseId) => {
    const sql = `select * from facilities where houseId='${houseId}' `
    const rows = await exec(sql)
    return rows[0]
}

//新建房源
const newHouse = async (houseData = {}) => {
    const houseName = xss(houseData.houseName)
    const houseType = xss(houseData.houseType)
    const location = xss(houseData.location)
    const direction = houseData.direction
    const floor = xss(parseInt(houseData.floor))
    const area = xss(parseInt(houseData.area))
    const roomType = xss(houseData.roomType)
    const rent = xss(parseInt(houseData.rent))
    const owner = houseData.owner
    const ownerId = houseData.ownerId
    const phone = xss(houseData.phone)
    const detail = xss(houseData.detail)
    const shelfTime = xss(parseInt(houseData.shelfTime))
    const occupancy = xss(houseData.occupancy)
    const houseInspection = xss(houseData.houseInspection)
    const createTime = date.format(new Date(xss(houseData.createTime)),'YYYY-MM-DD HH:mm:ss')
    const destroyTime = date.format(new Date(xss(houseData.destroyTime)),'YYYY-MM-DD HH:mm:ss')
    const leaseTerm = xss(houseData.leaseTerm)
    const leaseType = xss(houseData.leaseType)

    // 默认图片路径
    // const picture = 'http://101.200.134.15:8000/picture/house/DefaultAvatar.jpg'
    const picture = 'http://127.0.0.1:8050/picture/house/DefaultAvatar.jpg'
    const allURL = picture + ';' + picture + ';' + picture

    const sql = `insert into housems (houseName, houseType, location, direction, floor, area, roomType, rent, owner,
                                      ownerId, phone, detail, picture, occupancy, houseInspection, leaseTerm, leaseType,
                                      shelfTime, createTime, destroyTime)
                 values ('${houseName}', '${houseType}', '${location}', '${direction}', '${floor}', '${area}', '${roomType}', '${rent}', '${owner}',
                         '${ownerId}', '${phone}', '${detail}', '${allURL}', '${occupancy}', '${houseInspection}', '${leaseTerm}', '${leaseType}',
                         '${shelfTime}', '${createTime}', '${destroyTime}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

//填充图片路径
const pictureURL = async (id, picture) => {
    const sql = `update housems set picture='${picture}' where id='${id}' `

    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

//更改已租赁人数
const updateCount = async (id, count) => {
    const sql = `update housems set rentCount='${count}' where id='${id}' `

    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

//修改房源信息
const updateHouse = async (houseData = {}) => {
    const rent = xss(houseData.rent)
    const phone = xss(houseData.phone)
    const detail = xss(houseData.detail)
    const rentCount = parseInt(xss(houseData.rentCount))
    let state = xss(houseData.state)
    let intermediaryId = houseData.intermediaryId

    // 若当前是未选择经纪人的情况下修改信息，将对应的intermediaryId改为新传入的对象id
    if(houseData.state === '2') {
        intermediaryId = houseData.currentIntermediaryId
        state = '0'
    }
    const sql = `update housems set rent='${rent}', phone='${phone}', detail='${detail}', 
                                    state='${state}', rentCount='${rentCount}', intermediaryId='${intermediaryId}'
                 where id='${houseData.id}' and ownerId='${houseData.ownerId}' `
    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

//单独修改房源状态
const updateHouseState = async (houseId, state, ifLeased) => {
    let sql = `update housems set state='${state}'  `
    if(ifLeased !== '') {
        sql += `, ifLeased='${ifLeased}' `
    }
    sql += `where id='${houseId}' `
    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

//删除房源信息
const deleteHouse = async function(id, ownerId) {
    const sql = `delete from housems where id='${id}' and ownerId='${ownerId}' `
    const deleteData = await exec(sql)
    if (deleteData.affectedRows > 0) {
        return true
    }
    return false
}

// 获取房源类型列表
const getHouseTypeList = async () => {
    let sql = `select * from types `
    return await exec(sql)
}

// 初始化对应房源的设施配备
const initFacilities = async (houseId, facilityListObj = {}) => {
    const washingMachine = facilityListObj.washingMachine // 洗衣机
    const airConditioner = facilityListObj.airConditioner // 空调
    const wardrobe = facilityListObj.wardrobe // 衣柜
    const television = facilityListObj.television // 电视
    const refrigerator = facilityListObj.refrigerator // 冰箱
    const heater = facilityListObj.heater // 热水器
    const bed = facilityListObj.bed // 床
    const heating = facilityListObj.heating // 暖气
    const broadband = facilityListObj.broadband // 宽带
    const naturalGas = facilityListObj.naturalGas // 天然气

    const sql = `insert into facilities (houseId, washingMachine, airConditioner, wardrobe, television, refrigerator, 
                                            heater, bed, heating, broadband, naturalGas)
                 values ('${houseId}', '${washingMachine}', '${airConditioner}', '${wardrobe}', '${television}', '${refrigerator}', 
                         '${heater}', '${bed}', '${heating}', '${broadband}', '${naturalGas}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

//删除对应房源的设施配备信息
const deleteHouseFacilities = async function(houseId) {
    const sql = `delete from facilities where houseId='${houseId}' `
    const deleteData = await exec(sql)
    if (deleteData.affectedRows > 0) {
        return true
    }
    return false
}

module.exports = {
    getList,
    getOverdueList,
    getHouseDetail,
    newHouse,
    pictureURL,
    updateHouse,
    updateHouseState,
    updateCount,
    deleteHouse,
    getHouseTypeList,
    initFacilities,
    getHouseFacilities,
    deleteHouseFacilities
}