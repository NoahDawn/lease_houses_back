// 防输入型攻击注入
const xss = require('xss')
const { exec } = require('../db/mysql.js')
const date = require('silly-datetime')
const { genPassword } = require('../untils/cryp.js')

// 初始化经纪人数据
const initIntermediary = async (dataItem = {}) => {
    const sql = `insert into intermediary (realname, phone, avatar, location,
                                            detail, dealCount, credit, integral)
                    values ('${dataItem.realname}', '${dataItem.phone}', '${dataItem.avatar}', '${dataItem.location}',
                            '${dataItem.detail}', '${dataItem.dealCount}', '${dataItem.credit}', '${dataItem.integral}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

// 初始房源数据
const initHouse = async (houseData = {}) => {
    const id = xss(parseInt(houseData.id))
    const houseName = xss(houseData.houseName)
    const houseType = xss(houseData.houseType)
    const location = xss(houseData.location)
    const direction = houseData.direction
    const area = xss(parseInt(houseData.area)) || 0
    const floor = xss(parseInt(houseData.floor)) || 0
    const occupancy = xss(houseData.occupancy)
    const roomType = xss(houseData.roomType)
    const rent = xss(parseInt(houseData.rent)) || 0
    const owner = xss(houseData.owner)
    const ownerId = xss(parseInt(houseData.ownerId))
    const phone = xss(houseData.phone)
    const detail = xss(houseData.detail)
    const picture = xss(houseData.picture)
    const rentCount = xss(parseInt(houseData.rentCount)) || 0
    const collectCount = xss(parseInt(houseData.collectCount)) || 0
    const leaseTerm = xss(houseData.leaseTerm)
    const houseInspection = xss(houseData.houseInspection)
    const intermediaryId = xss(parseInt(houseData.intermediaryId))
    const state = xss(parseInt(houseData.state)) || 0
    const shelfTime = xss(parseInt(houseData.shelfTime)) || 0
    const createTime = date.format(new Date(xss(houseData.createTime)),'YYYY-MM-DD HH:mm:ss')
    const destroyTime = date.format(new Date(xss(houseData.destroyTime)),'YYYY-MM-DD HH:mm:ss')
    const leaseType = xss(houseData.leaseType)
    const ifLeased = xss(parseInt(houseData.ifLeased)) || 0

    const sql = `insert into housems (id, houseName, houseType, location, direction, area, floor, occupancy, roomType, rent, owner,
                                      ownerId, phone, detail, picture, rentCount, collectCount, leaseTerm, houseInspection, intermediaryId,
                                      state, shelfTime, createTime, destroyTime, leaseType, ifLeased)
                 values ('${id}', '${houseName}', '${houseType}', '${location}', '${direction}', '${area}', '${floor}', '${occupancy}', '${roomType}', '${rent}', '${owner}',
                         '${ownerId}', '${phone}', '${detail}', '${picture}', '${rentCount}', '${collectCount}', '${leaseTerm}', '${houseInspection}', '${intermediaryId}',
                         '${state}', '${shelfTime}', '${createTime}', '${destroyTime}', '${leaseType}', '${ifLeased}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

// 初始化用户数据
const initUser = async (userData = {}) => {
    const id = xss(parseInt(userData.id))
    const username = xss(userData.username)
    const password = genPassword(xss(userData.password))
    const realname = xss(userData.realname)
    const phone = xss(userData.phone)
    const picture = 'http://127.0.0.1:8050/picture/user/DefaultAvatar.jpg'
    const money = xss(parseFloat(userData.money).toFixed(2)) || 0.00

    const sql = `insert into userms (id, username, password, realname, phone, picture, money)
                 values ('${id}', '${username}', '${password}', '${realname}', '${phone}', '${picture}', '${money}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

// 初始化委托关系数据
const initEntrust = async (entrustData = {}) => {
    const id = xss(parseInt(entrustData.id))
    const userId = xss(parseInt(entrustData.userId))
    const intermediaryId = xss(parseInt(entrustData.intermediaryId))
    const mission = xss(parseInt(entrustData.mission))
    const resHouseId = xss(parseInt(entrustData.resHouseId)) || ''

    let sql = `insert into entrust (id,userId,intermediaryId,mission,resHouseId) 
    values ('${id}','${userId}','${intermediaryId}','${mission}','${resHouseId}') `

    const insertData = await exec(sql)
    return{
        id:insertData.insertId
    }
}

// 初始化对应房源的设施配备
const initFacility = async (facilityData = {}) => {
    const id = facilityData.id // 洗衣机
    const houseId = facilityData.houseId // 空调
    const washingMachine = facilityData.washingMachine // 洗衣机
    const airConditioner = facilityData.airConditioner // 空调
    const wardrobe = facilityData.wardrobe // 衣柜
    const television = facilityData.television // 电视
    const refrigerator = facilityData.refrigerator // 冰箱
    const heater = facilityData.heater // 热水器
    const bed = facilityData.bed // 床
    const heating = facilityData.heating // 暖气
    const broadband = facilityData.broadband // 宽带
    const naturalGas = facilityData.naturalGas // 天然气

    const sql = `insert into facilities (id, houseId, washingMachine, airConditioner, wardrobe, television, refrigerator, 
                                            heater, bed, heating, broadband, naturalGas)
                 values ('${id}', '${houseId}', '${washingMachine}', '${airConditioner}', '${wardrobe}', '${television}', '${refrigerator}', 
                         '${heater}', '${bed}', '${heating}', '${broadband}', '${naturalGas}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

// 初始化订单数据
const initOrder = async (orderData = {}) => {
    const id = orderData.id
    const houseId = orderData.houseId
    const renterId = orderData.renterId
    const ownerId = orderData.ownerId
    const rentMonth = xss(orderData.rentMonth)
    const renterState = orderData.renterState
    const ownerState = orderData.ownerState
    const detail = xss(orderData.detail)
    const invalidTime = date.format(new Date(xss(orderData.invalidTime)),'YYYY-MM-DD HH:mm:ss')

    const sql = `insert into orders (id, houseId, renterId, ownerId, rentMonth, renterState, ownerState, detail, invalidTime)
                 values ('${id}', '${houseId}', '${renterId}', '${ownerId}', '${rentMonth}', '${renterState}', '${ownerState}', '${detail}', '${invalidTime}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

module.exports = {
    initIntermediary,
    initHouse,
    initUser,
    initEntrust,
    initFacility,
    initOrder
}