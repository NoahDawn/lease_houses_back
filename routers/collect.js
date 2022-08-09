const router = require('koa-router') ()
const { getCollectList, getCollectIfExit, newCollectData, changeCollectCount, deleteCollectData } = require('../controller/collect.js')
const { getHouseDetail } = require('../controller/house.js')
const { SuccessModel, ErrorModel } = require('../model/resModel.js')

// 判断收藏记录是否存在
router.get('/getType', async function (ctx, next) {
    // 收藏者编号
    let userId = ctx.query.userId || ''
    // 房源编号
    let houseId = ctx.query.houseId || ''

    // 查询是否存在
    const ifDataExit = await getCollectIfExit(userId, houseId)
    ctx.body = new SuccessModel(ifDataExit)
})

// 保存该收藏记录
router.post('/newCollect', async function (ctx, next) {
    const houseId = ctx.query.houseId
    const userId = ctx.query.userId

    const newData = await newCollectData(userId, houseId)
    if(newData.id) {
        // 新建记录成功后，对应房源的热度+1
        const houseData = await getHouseDetail(houseId)
        if(houseData.id) {
            await changeCollectCount(houseId, 'add', houseData.collectCount)
        }
    }
    ctx.body = new SuccessModel(newData)
})

// 删除该收藏记录
router.post('/deleteCollect', async function (ctx, next) {
    const collectDeleteList = ctx.request.body.collectDeleteList   // 要删除记录的对象数组
    const type = ctx.query.type  ||  'inDetail'

    // 循环删除
    for(let deletItem of collectDeleteList) {
        // 因传递的参数可能占用同样的键值对，根据不同场景做转换
        if(type === 'inDetail') {
            // 在详情页，传递的id是collectId
            console.log("当前在详情页---------------")
            deletItem.collectId = deletItem.id
        } else if(type === 'inFollow') {
            // 在收藏页，传递的id是houseId
            console.log("当前在收藏页---------------")
            deletItem.houseId = deletItem.id
        } 
        
        // 根据收藏对象的编号删除数据
        const deleteValue = await deleteCollectData(deletItem.collectId)

        if (deleteValue) {
            // 删除记录成功后，对应房源的热度-1
            const houseData = await getHouseDetail(deletItem.houseId)
            if(houseData.id) {
                await changeCollectCount(deletItem.houseId, 'cut', houseData.collectCount)
            }
        }
    }
    ctx.body = new ErrorModel('取消收藏成功')
})

// 获取收藏记录列表
router.get('/collectList', async function (ctx, next) {
    let userId = ctx.query.userId || ''//没有数据返回空值

    const collectList = await getCollectList(userId)
    
    const houseCollectList = []
    for(let collect of collectList) {
        const houseData = await getHouseDetail(collect.houseId)
        // 追加当前用户对当前房源添加入收藏的编号
        houseData.collectId = collect.id
        // 追加房源信息
        houseCollectList.push(houseData)
    }
    
    ctx.body = new SuccessModel(houseCollectList)
})

module.exports = {
    router
}