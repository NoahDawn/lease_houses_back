const router = require('koa-router') ()
const fs = require('fs')
const path = require('path')
const { login, register, ifUserNameExit, changePwd, changeWallet, getUserDetail } = require('../controller/user.js')
const { SuccessModel, ErrorModel } = require('../model/resModel.js')

//添加路由前缀
// router.prefix('/api/user')

//用户登录
router.post('/login', async function (ctx, next) {
    const { username, password } = ctx.request.body
    const data = await login(username, password)
    if (data.username) {
        ctx.body = {loginUserMS:data}
        return
    }
    ctx.body = new ErrorModel('登录失败')
})

//用户注册
router.post('/register', async function (ctx, next) {
    const body = ctx.request.body
    const theUser = await ifUserNameExit(body)
    //返回数据中不存在对象：该用户名未被占用
    if (!theUser.uername) {
        const newData = await register(body)
        ctx.body = new SuccessModel(newData)
    } else {
        console.log(theUser)
        ctx.body = {ifExit:true}
    }
})

//密码找回
router.post('/getPwd', async function (ctx, next) {
    const body = ctx.request.body
    const index = body.currentIndex || '0'
    const theUser = await ifUserNameExit(body)
    console.log(index)
    // 根据index的值来进行不同的验证
    switch (index) {
        case '0' : 
            if (theUser.username) {
                ctx.body = {ifExit:true}
            } else {
                ctx.body = {ifExit:false}
            };break;
        case '1' : 
            if (theUser.phone === body.phone) {
                ctx.body = {ifRight:true}
            } else {
                ctx.body = {ifRight:false}
            };break;
        case '2' : 
            const ifChange = await changePwd(body)
            ctx.body = {ifChange:ifChange};break;
        default:
    }
})

//获取详情路由
// router.get('/detail', async function (ctx, next) {
//     const detailData = await getUserDetail(ctx.query.id)
//     ctx.body = new SuccessModel(detailData)
// })

//修改钱包余额路由
router.get('/wallet', async function (ctx, next) {
    const userId = ctx.query.userId
    const cost = ctx.query.cost
    const detailData = await changeWallet(userId, cost)
    ctx.body = new SuccessModel(detailData)
})

//获取用户个人信息路由
router.get('/detail', async function (ctx, next) {
    const userId = ctx.query.userId
    const detailData = await getUserDetail(userId)
    ctx.body = new SuccessModel(detailData)
})

module.exports = {
    router
}