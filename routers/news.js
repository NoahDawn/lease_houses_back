const router = require('koa-router') ()
const { SuccessModel, ErrorModel } = require('../model/resModel.js')
const { dateCodeChange } = require('../untils/dateTime.js')
const { getUserDetail } = require('../controller/user.js')
const { getNewsList, getReplyList, newComment, newReply, getMyNewsList, getMyReplyList} = require('../controller/news.js')

// 获取房源下留言列表路由
router.get('/list-comment', async function (ctx, next) {
    let houseId = ctx.query.houseId || ''//没有数据返回空值

    const newslist = await getNewsList(houseId)
    for(let news of newslist) {
        const replylist = await getReplyList(news.id)
        for (let reply of replylist) {
            // 回复时间显示转码
            reply.time = dateCodeChange(reply.time)
        }
        // 追加回复列表
        news.reply = replylist
        // 评论时间显示转码
        news.time = dateCodeChange(news.time)
    }
    
    ctx.body = new SuccessModel(newslist)
})

// 留言路由
router.post('/new-comment', async function (ctx, next) {
    const body = ctx.request.body
    body.myId = ctx.query.myId
    body.houseId = ctx.query.houseId
    const newData = await newComment(body)
    ctx.body = new SuccessModel(newData)
})
// 回复路由
router.post('/reply', async function (ctx, next) {
    const body = ctx.request.body
    body.houseId = ctx.query.houseId
    body.newsId = ctx.query.newsId
    body.fromId = ctx.query.fromId
    body.toId = ctx.query.toId
    const newData = await newReply(body)
    ctx.body = new SuccessModel(newData)
})


// 获取个人留言列表路由
router.get('/myCommentList', async function (ctx, next) {
    let myId = ctx.query.myId || ''//没有数据返回空值

    const newslist = await getMyNewsList(myId)
    for(let news of newslist) {
        const replylist = await getReplyList(news.id)
        for (let reply of replylist) {
            // 回复时间显示转码
            reply.time = dateCodeChange(reply.time)
        }
        // 追加回复列表
        news.reply = replylist
        // 评论时间显示转码
        news.time = dateCodeChange(news.time)
    }
    
    ctx.body = new SuccessModel(newslist)
})

// 获取个人回复列表路由
router.get('/myReplyList', async function (ctx, next) {
    let myId = ctx.query.myId || ''//没有数据返回空值

    const replylist = await getMyReplyList(myId)
    for(let reply of replylist) {
        const toUser = await getUserDetail(reply.fromId)
        // 追加回复对象真名
        reply.realName = toUser.realname
        // 回复时间显示转码
        reply.time = dateCodeChange(reply.time)
    }
    
    ctx.body = new SuccessModel(replylist)
})

module.exports = {
    router
}