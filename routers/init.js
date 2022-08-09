const router = require('koa-router') ()
const { initIntermediary, initHouse, initUser, initEntrust, initFacility, initOrder } = require('../controller/init.js')
const { SuccessModel, ErrorModel } = require('../model/resModel.js')

// 初始化经纪人数据
router.post('/intermediary', async function (ctx, next) {
    const intermediaryDataList = ctx.request.body.intermediaryDataList   // 要初始化的数据

    // 循环添加
    for(let dataItem of intermediaryDataList) {
       await initIntermediary(dataItem)
    }
    ctx.body = new ErrorModel('成功')
})

// 初始化房源数据
router.post('/house', async function (ctx, next) {
    const houseDataList = ctx.request.body.houseDataList   // 要初始化的数据

    // 循环添加
    for(let dataItem of houseDataList) {
       await initHouse(dataItem)
    }
    ctx.body = new ErrorModel('成功')
})

// 初始化用户数据
router.post('/user', async function (ctx, next) {
    const userDataList = ctx.request.body.userDataList   // 要初始化的数据

    // 循环添加
    for(let dataItem of userDataList) {
       await initUser(dataItem)
    }
    ctx.body = new ErrorModel('成功')
})

// 初始化委托关系数据
router.post('/entrust', async function (ctx, next) {
    const entrustDataList = ctx.request.body.entrustDataList   // 要初始化的数据

    // 循环添加
    for(let dataItem of entrustDataList) {
       await initEntrust(dataItem)
    }
    ctx.body = new ErrorModel('成功')
})

// 初始化设施配备数据
router.post('/facility', async function (ctx, next) {
    const facilityDataList = ctx.request.body.facilityDataList   // 要初始化的数据

    // 循环添加
    for(let dataItem of facilityDataList) {
       await initFacility(dataItem)
    }
    ctx.body = new ErrorModel('成功')
})

// 初始化订单数据
router.post('/order', async function (ctx, next) {
    const orderDataList = ctx.request.body.orderDataList   // 要初始化的数据

    // 循环添加
    for(let dataItem of orderDataList) {
       await initOrder(dataItem)
    }
    ctx.body = new ErrorModel('成功')
})

module.exports = {
    router
}