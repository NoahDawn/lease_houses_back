const router = require('koa-router') ()
const { getList, newOrder, getOrderDetail, updateStatus, deleteOrder, ifReOrder, insertOrderState } = require('../controller/order.js')
const { getHouseDetail, updateCount, updateHouseState } = require('../controller/house.js')
const { SuccessModel, ErrorModel } = require('../model/resModel.js')
const { dateCodeChange, differDays } = require('../untils/dateTime.js')

//添加路由前缀
// router.prefix('/api/order')

//订单列表路由
router.get('/list', async function (ctx, next) {
    let myid = ctx.query.myid || ''
    //根据type的值筛选作为不同身份的订单列表
    let type = ctx.query.type || ''
    const listData = await getList(myid, type)
    // 将时间编码转义
    listData.forEach((item) => {
        dateCodeChange(new Date(item.invalidTime))
    });
    ctx.body = new SuccessModel(listData)
})

//获取详情路由
router.get('/detail', async function (ctx, next) {
    const detailData = await getOrderDetail(ctx.query.id)
    ctx.body = new SuccessModel(detailData)
})

//查询当前订单是否重复发起路由
router.get('/ifOrderExit', async function (ctx, next) {
    const houseId = ctx.query.houseId
    const renterId = ctx.query.renterId
    const detailData = await ifReOrder(houseId, renterId)
    ctx.body = new SuccessModel(detailData)
})

//新建订单路由
router.post('/new', async function (ctx, next) {
    const body = ctx.request.body
    const month = body.month
    let myid = ctx.query.myid || ''
    let houseid = ctx.query.houseid || ''
    const invalidTime = body.invalidTime
    const houseData = await getHouseDetail(houseid)
    const ownerid = houseData.ownerId
    const orderData = { renterId: myid, ownerId: ownerid, houseId: houseid, rentMonth: month, detail: body.detail, invalidTime:invalidTime }
    const newData = await newOrder(orderData)
    ctx.body = new SuccessModel(newData)
})

//更新订单确认态路由
router.post('/updatestatus', async function (ctx, next) {
    const id = ctx.query.id
    const myid = ctx.query.myid
    const type = ctx.query.type || ''     //身份类型
    const confirm = ctx.query.confirm || ''    //确认类型
    const updateValue = await updateStatus(id, myid, type, confirm)
    if (updateValue) {
        const theOrder = await getOrderDetail(id)
        //当双方都确认时，或者完成退租时，修改该房源的已租赁用户数、房源上架状态、房源出租状态
        if ((theOrder.renterState === 1 && theOrder.ownerState === 1) || 
            (theOrder.renterState === 3 && theOrder.ownerState === 3)) {
            //根据订单里的房源id获取该房源信息
            const houseData = await getHouseDetail(theOrder.houseId)

            let ifLeased = 0  // 房源出租状态
            let rentCount = 0  // 房源租赁人数
            let message = ''  // 返回的提示信息
            if(theOrder.renterState + theOrder.ownerState === 2) {
                ifLeased = 1
                rentCount = (houseData.rentCount) + 1
                message = '订单已被双方确认'

                // 为房主退回部分上架手续费，金额为（下架时间-确认时间）/30计算月数*40%
                // 本打算这么做，但可能存在恶意刷单，暂时不考虑
            } else {
                ifLeased = 0
                rentCount = (houseData.rentCount) - 1
                message = '订单已结束'
            }

            //判断当前房源是否是整租，整租且双方确认后房源状态state改为1，出租状态改为1
            if(houseData.leaseType === 'single') {
                updateHouseState(houseData.id, 1, ifLeased)
            } else {
                // 此处可能会有小问题，若房源已逾期，可能会导致重新上架（若绕过时间判断），后续测试修改
                updateHouseState(houseData.id, 0, ifLeased)
            }
            //修改已租赁用户数
            updateCount(houseData.id, rentCount)
            ctx.body = new SuccessModel(message)
        }
        //当双方都取消订单时删除该订单信息
        if (theOrder.renterState === 2 && theOrder.ownerState === 2){
            deleteOrder(id)
            ctx.body = new SuccessModel('订单已取消')
        }
        ctx.body = new ErrorModel('您已更改订单状态')
    } else {
       ctx.body = new ErrorModel('更新状态失败')
    }
})

//插入逾期订单删除状态路由
router.post('/insert-orderState', async function (ctx, next) {
    const body = ctx.request.body
    const userId = body.userId
    const orderId = body.orderId
    const orderType = body.orderType // 用于判断当前操作的类型属于renter还是owner
    const newData = await insertOrderState(userId,orderId)
    ctx.body = new SuccessModel({result:true,message:'删除成功'})
})

module.exports = {
    router
}