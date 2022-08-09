const router = require('koa-router')()
    // houseController下方法
const {
    getList,
    getOverdueList,
    getHouseDetail,
    getHouseFacilities,
    updateHouse,
    updateHouseState,
    deleteHouse,
    getHouseTypeList,
    initFacilities,
    deleteHouseFacilities
} = require('../controller/house.js')
    // recordController下方法
const { isExit, addRecord, updateRecord, deleteRecord } = require('../controller/record.js')
    // intermediaryController下方法
const { getIntermediaryMessage, getEntrustDetail, newEntrust, updateEntrustMission, resetEntrust, deleteEntrust } = require('../controller/intermediary.js')
    // collectController下方法
const { deleteCollectData } = require('../controller/collect.js')
    // newsController下方法
const { deleteNews, deleteReplys } = require('../controller/news.js')
    // orderController下方法
const { deleteOrder } = require('../controller/order.js')

const { SuccessModel, ErrorModel } = require('../model/resModel.js')
const { dateCodeChange } = require('../untils/dateTime.js')

//路径获取
const path = require('path')
    //文件操作
const fs = require('fs')
    // 日期操作
const date = require('silly-datetime')
const { dir } = require('console')

//获取列表路由
router.get('/list', async function(ctx, next) {
    console.log("房源列表获取")
        // 房主的编号，在个人房源查询时用到
    let ownerId = ctx.query.ownerId || ''
        // 用于判断是否是房主修改个人房源
    let pageType = ctx.query.pageType || ''
        // 房源查询关键字
    let keyword = ctx.query.keyword || ''
        // 当前页数
    let page = parseInt(ctx.query.page)
        // 每页的最大显示量
    let maxEveryCount = ctx.query.maxEveryCount || 2
        // 当前查询房源的类型：单租/合租
    let theType = ctx.query.theType || ''

    console.log('当前类型：' + theType)
        // 正常获取首页需要的数据
    const listData = await getList(ownerId, keyword, pageType, theType)
    let allCount = listData.length
    console.log("拿到的房源信息:", allCount)

    // 追加经纪人信息
    for (let data of listData) {
        // 默认未选择经纪人的情况下，无经纪人数据，返回{}
        const intermediary = await getIntermediaryMessage(data.intermediaryId) || { id: 0 }
        data.intermediary = intermediary
    }

    // 若是房源管理，直接查询列表返回，需要对逾期房子做状态修改
    if (pageType === 'houseManage') {
        // 将列表数据进行处理（修改逾期房源的状态和删除关联信息）
        // 此部操作为防止登录后绕过首页请求直接访问个人房源管理
        const dealData = await relationDelete(listData)

        ctx.body = new SuccessModel(dealData)
    } else {
        // 否则是首页列表，初步处理已逾期的房源
        const overdueList = await getOverdueList()
        const dealList = await relationDelete(overdueList)

        // 根据页数和房源类型进行分类返回
        if (page * maxEveryCount >= allCount) {
            if (page === 1) {
                ctx.body = new SuccessModel({ listData, total: listData.length })
            } else {
                ctx.body = new SuccessModel({ listData: listData.slice((page - 1) * maxEveryCount), total: listData.length })
            }
        } else {
            ctx.body = new SuccessModel({ listData: listData.slice((page - 1) * maxEveryCount, page * maxEveryCount), total: listData.length })
        }
    }
})

// 关联删除与失效房源有联系的信息
const relationDelete = async(listData) => {
    const now = dateCodeChange(new Date())
        // 循环将逾期的房源状态修改为state=3
    listData.forEach(houseData => {
        if (dateCodeChange(houseData.destroyTime) < now && houseData.state !== 3) {
            houseData.state = 3
            updateHouseState(houseData.id, houseData.state, '') // 修改状态，第三个参数是是否出租，此处传空

            // 删除该房源下所有关联信息
            deleteCollectData('', houseData.id) // 删除收藏信息，第一个参数是收藏编号，此处传空
            deleteHouseFacilities(houseData.id) // 删除设施配备信息
            deleteReplys(houseData.id) // 删除回复
            deleteNews(houseData.id) // 删除消息
            deleteOrder('', houseData.id) // 删除订单信息，第一个参数是订单编号，此处传空
            deleteRecord(houseData.id) // 删除浏览记录
            resetEntrust(houseData.ownerId, houseData.intermediaryId, houseData.id) // 重置委托经纪人的任务状态
        }
    })
    return listData
}

//获取详情路由
router.get('/detail', async function(ctx, next) {
    const houseid = ctx.query.houseid || ''
    const myid = ctx.query.myid || ''
        //获取房源详情
    const detailData = await getHouseDetail(houseid)

    //追加设施配备
    const facilities = await getHouseFacilities(houseid)
    detailData.facilities = facilities

    // 追加经纪人信息
    const intermediary = await getIntermediaryMessage(detailData.intermediaryId) || { id: 0 }
    detailData.intermediary = intermediary

    //若个人id和房源id都不为空，则生成浏览记录
    if (parseInt(myid) !== 0 && houseid) {
        const exitData = await isExit(myid, houseid)
            //若曾经进入过该房源，则修改浏览时间
        if (exitData) {
            const updatetime = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
            const id = exitData.id
            updateRecord(id, updatetime)
        } else {
            //若从未浏览过，则生成浏览记录
            const createtime = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
            const recordData = { myId: myid, houseId: houseid, createtime: createtime }
            addRecord(recordData)
        }
    }
    ctx.body = new SuccessModel(detailData)
})

//更新房源信息(包含部分房源信息及经纪人选择)
router.post('/update', async function(ctx, next) {
    const body = ctx.request.body
    body.id = ctx.query.id // 房源的id
    body.ownerId = ctx.query.ownerId // 房主的编号

    const updateValue = await updateHouse(body)
    if (updateValue) {
        // 根据当前的state判断是不是已选中经纪人
        if (body.state === '2') {
            // 根据经纪人情况修改对应数据库
            const entrustData = await getEntrustDetail(body.ownerId, body.currentIntermediaryId, body.id)
                // 判断当前委托任务是否存在
            if (!entrustData.id) {
                // 不存在，新建操作
                const newEntrustData = await newEntrust(body.ownerId, body.currentIntermediaryId, 'have', body.id)
                    // 顺便删除同经纪人的等待数据
                deleteEntrust(body.ownerId, body.currentIntermediaryId)
                console.log("新建的委托：", newEntrustData)
            } else {
                // 存在，更新任务指令
                await updateEntrustMission(body.ownerId, body.currentIntermediaryId, body.id)
            }
        }
        ctx.body = new SuccessModel('更新房源信息成功')
    } else {
        ctx.body = new ErrorModel('更新房源信息失败')
    }
})

//删除房源路由
router.post('/delete', async function(ctx, next) {
    const id = ctx.query.id
    const ownerId = ctx.query.ownerId

    const houseData = await getHouseDetail(id)

    // 判断逾期时间，若过期直接删除，若未逾期，当前租赁人数为0亦可删除
    const now = dateCodeChange(new Date())
    if (dateCodeChange(houseData.destroyTime) < now || houseData.rentCount === 0) {
        // 删除该房源下所有关联信息
        deleteCollectData('', houseData.id) // 删除收藏信息，第一个参数是收藏编号，此处传空
        deleteHouseFacilities(houseData.id) // 删除设施配备信息
        deleteReplys(houseData.id) // 删除回复
        deleteNews(houseData.id) // 删除消息
        deleteOrder('', houseData.id) // 删除订单信息，第一个参数是订单编号，此处传空
        deleteRecord(houseData.id) // 删除浏览记录
        resetEntrust(houseData.ownerId, houseData.intermediaryId, houseData.id) // 重置委托经纪人的任务状态
        deleteFile(id) // 删除该房源的展示文件

        const deleteValue = await deleteHouse(id, ownerId)
        if (deleteValue) {
            // ctx.body = new SuccessModel('删除房源成功')
            ctx.body = { result: true, message: '删除房源成功' }
        } else {
            // ctx.body = new ErrorModel('删除房源失败')
            ctx.body = { result: false, message: '删除房源失败' }
        }
    } else {
        ctx.body = new ErrorModel('当前房源存在租户,不可删除')
        ctx.body = { result: false, message: '当前房源存在租户,不可删除' }
    }
})

// 删除静态资源对应文件
function deleteFile(houseId) {
    // 暂未找到直接获取根路径的方法，此处用字符串裁剪的方式
    const currentPath = __dirname.split('routers')[0]
    const delPath1 = path.join(currentPath, 'static/picture/house/house_' + houseId + '_1.jpg')
    const delPath2 = path.join(currentPath, 'static/picture/house/house_' + houseId + '_2.jpg')
    const delPath3 = path.join(currentPath, 'static/picture/house/house_' + houseId + '_3.jpg')
    try {
        // 先判断文件路径是否存在
        if (fs.existsSync(delPath1) && fs.existsSync(delPath2) && fs.existsSync(delPath3)) {
            console.log('要删除的目标文件存在')
                // 执行文件删除
            fs.unlinkSync(delPath1)
            fs.unlinkSync(delPath2)
            fs.unlinkSync(delPath3)
        } else {
            console.log('inexistence path：', delPath1);
        }
    } catch (error) {
        console.log('del error', error);
    }
}

//获取房源类型列表路由
router.get('/houseTypeList', async function(ctx, next) {
    const TypeListData = await getHouseTypeList()

    ctx.body = new SuccessModel(TypeListData)
})

//获取不生成浏览记录的房源信息，用作订单的信息获取
router.get('/main', async function(ctx, next) {
    const houseid = ctx.query.houseid || ''
        //获取房源详情
    const detailData = await getHouseDetail(houseid)
        // 追加经纪人信息
    const intermediary = await getIntermediaryMessage(detailData.intermediaryId)
    detailData.intermediary = intermediary
    ctx.body = new SuccessModel(detailData)
})

// 增加对应房源的设施配备到数据库
router.post('/init-facilities', async function(ctx, next) {
    const houseId = ctx.query.houseId
    const facilityList = ctx.request.body.facilitiesImg // 要删除记录的对象数组

    const facilityListObj = {}
    facilityList.forEach(facility => {
        // 对应设施的ifMatch，true则代表有，对象值是1，反之为0
        facilityListObj[facility.title] = facility.ifMatch ? 1 : 0
    })

    await initFacilities(houseId, facilityListObj)

    ctx.body = new ErrorModel('追加设施配置成功')
})

module.exports = {
    router
}