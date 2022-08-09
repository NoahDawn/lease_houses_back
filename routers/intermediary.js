const router = require('koa-router') ()
const { getIntermediaryList, newEntrust, getEntrustList, getIntermediaryMessage, deleteEntrust } = require('../controller/intermediary.js')
const { SuccessModel, ErrorModel } = require('../model/resModel.js')

// 获取经纪人列表路由
router.get('/list-intermediary', async function (ctx, next) {
    const userId = ctx.query.userId || ''

    // 普通用户请求经纪人列表
    if(userId) {
        const intermediaryList = await getIntermediaryList(userId)
    
        for(let intermediary of intermediaryList) {
            const detailArr = []
            // 将原数据的字符串分割为数组
            detailArr.push(...intermediary.detail.split(","))
            intermediary.detail = detailArr
        }
        
        ctx.body = new SuccessModel(intermediaryList)
    } else {
        // 当前页数
        let page = parseInt(ctx.query.page)
        // 每页的最大显示量
        let maxEveryCount = ctx.query.maxEveryCount || 5
        // 管理员分页请求
        const intermediaryList = await getIntermediaryList(userId)
        let allCount = intermediaryList.length
    
        for(let intermediary of intermediaryList) {
            const detailArr = []
            // 将原数据的字符串分割为数组
            detailArr.push(...intermediary.detail.split(","))
            intermediary.detail = detailArr
        }

        if(page * maxEveryCount >= allCount) {
            if(page === 1) {
                ctx.body = new SuccessModel({intermediaryList,total:intermediaryList.length})
            } else {
                ctx.body = new SuccessModel({intermediaryList:intermediaryList.slice((page-1)*maxEveryCount),total:intermediaryList.length})
            }
        } else {
            ctx.body = new SuccessModel({intermediaryList:intermediaryList.slice((page-1)*maxEveryCount, page*maxEveryCount),total:intermediaryList.length})
        }
    }
})

// 新建委托关系路由
router.get('/entrust-new', async function (ctx, next) {
    const intermediaryId = ctx.query.intermediaryId
    const userId = ctx.query.userId

    const newData = await newEntrust(userId, intermediaryId)

    ctx.body = new SuccessModel(newData)
})

// 获取委托关系列表路由
router.get('/entrust-list', async function (ctx, next) {
    const userId = ctx.query.userId
    const getType = ctx.query.getType || ''

    const entrustList = await getEntrustList(userId,getType) || []

    if(entrustList.length > 0) {
        // 从关系中获取经纪人编号并追加对应信息
        for(let entrust of entrustList) {
            let intermediary = await getIntermediaryMessage(entrust.intermediaryId)
            const detailArr = []
            // 将原数据的字符串分割为数组
            detailArr.push(...intermediary.detail.split(","))
            intermediary.detail = detailArr
            entrust.intermediary = intermediary
        }
    }

    ctx.body = new SuccessModel(entrustList)
})

// 卸任委托关系路由
router.get('/entrust-fire', async function (ctx, next) {
    const userId = ctx.query.userId   // 个人编号
    const intermediaryId = ctx.query.intermediaryId   // 经纪人编号

    if(deleteEntrust(userId, intermediaryId)) {
        ctx.body = new ErrorModel('卸任成功')
    } else {
        ctx.body = new ErrorModel('卸任成功')
    }

})

module.exports = {
    router
}