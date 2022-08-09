//防输入型攻击注入
const xss = require('xss')
const { exec } = require('../db/mysql.js')
const date = require('silly-datetime')
const { dateCodeChange } = require('../untils/dateTime.js')

//获取列表
const getList = async (typeid, type) => {
    //租户获取订单列表
    let sql = `select * from orders where 1=1 `
    if (type === 'renter') {
        sql += `and renterId='${typeid}' `
    }
    //户主获取订单列表
    if (type === 'owner') {
        sql += `and ownerId='${typeid}' `
    }
    //过滤在订单状态表中存在数据的订单信息，存在订单状态表意味着该用户已做删除处理
    sql += `and orders.id not in (select orderId from orders_state where userId='${typeid}') order by id desc `
    return await exec(sql)
}

//详情获取
const getOrderDetail = async (id) => {
    const sql = `select * from orders where id='${id}' `
    const rows = await exec(sql)
    return rows[0]
}

//判断当前是否是重复订单
const ifReOrder = async (houseId, renterId) => {
    const sql = `select * from orders where houseId='${houseId}' and renterId='${renterId}' `
    const rows = await exec(sql)
    return rows[0]
}

//新建订单
const newOrder = async (orderData = {}) => {
    const renterId = orderData.renterId
    const ownerId = orderData.ownerId
    const houseId = orderData.houseId
    const rentMonth = xss(orderData.rentMonth)
    const detail = xss(orderData.detail)
    const invalidTime = date.format(new Date(xss(orderData.invalidTime)),'YYYY-MM-DD HH:mm:ss')
    const ownerState = parseInt(1)

    const sql = `insert into orders (renterId, ownerId, houseId, rentMonth, detail, invalidTime, ownerState)
                 values ('${renterId}', '${ownerId}','${houseId}', '${rentMonth}', '${detail}', '${invalidTime}', '${ownerState}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

//更改订单表orders的确认态
const updateStatus = async (id, myid, type, confirm) => {
    //租户确认订单
    let sql = `update orders set `
    if (type === 'renter') {
        //租户认可订单
        if (confirm === 'sure') {
            sql += `renterState='1' `
        }
        //租户取消清单
        if (confirm === 'cancel') {
            sql += `renterState='2' `
        }
        //租户申请退租
        if (confirm === 'refund') {
            sql += `renterState='3' `
        }
        sql += `where renterId='${myid}' `
    }
    //房主确认订单
    if (type === 'owner') {
        //房主认可订单
        if (confirm === 'sure') {
            sql += `ownerState='1' `
        }
        //房主取消订单
        if (confirm === 'cancel') {
            sql += `ownerState='2' `
        }
        //房主申请退租
        if (confirm === 'refund') {
            sql += `ownerState='3' `
        }
        sql += `where ownerId='${myid}' `
    }
    sql += `and id='${id}' `
    const updateData = await exec(sql)
    if (updateData.affectedRows > 0) {
        return true
    }
    return false
}

//订单被双方取消后，从数据库删除该订单（也用于删除失效订单）
const deleteOrder = async (id='', houseId='') => {
    let sql = `delete from orders where 1=1 `
    if(id) {
        sql += `and id='${id}' `
    } else {
        sql += `and renterState in (0,2) or ownerState in (0,1,2) `
    }
    if(houseId) {
        /*
            租户存在状态：未确认（0），申请取消（2）
            户主存在状态：未确认（0），已确认（1），申请取消（2）
         */
        sql += `and houseId='${houseId}'  `
    }
    const deleteData = await exec(sql)
    if (deleteData.affectedRows > 0) {
        return true
    }
    return false
}

//插入新的逾期删除订单状态
const insertOrderState = async (userId, orderId) => {
    const sql = `insert into orders_state (userId,orderId) values ('${userId}', '${orderId}') `
    const insertData = await exec(sql)
    return {
        id: insertData.insertId
    }
}

module.exports = {
    getList,
    getOrderDetail,
    newOrder,
    updateStatus,
    deleteOrder,
    ifReOrder,
    insertOrderState
}