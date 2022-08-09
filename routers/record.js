const router = require('koa-router') ()
const { getList} = require('../controller/record.js')
const { getHouseDetail } = require('../controller/house')
const { SuccessModel, ErrorModel } = require('../model/resModel.js')
// const loginCheck = require('../middleware/loginCheck.js')

//添加路由前缀
// router.prefix('/api/record')

//获取列表路由
router.get('/list', async function (ctx, next) {
    let myId = ctx.query.myId || ''
    //创建json数组用于添加后续的json对象
    let listData = []

    //根据自身id获取浏览记录的列表
    const listRecordData = await getList(myId)
    //判断是否存在浏览浏览记录
    if (listRecordData) {
        //存在，根据反馈的houseId来注意查询该房源的具体信息
        console.log('记录条数: ', listRecordData.length)
        for (let i = 0; i < listRecordData.length; i++) {
            const houseId = listRecordData[i].houseId
            const houseData = await getHouseDetail(houseId)
            listData.push(houseData)
        }
        ctx.body = {listData: listData}
    } else {
        //不存在，反馈提示信息
        ctx.body = new SuccessModel('暂无浏览记录')
    }
})

module.exports = {
    router
}