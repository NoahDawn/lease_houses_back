const xss = require('xss')
const { exec } = require('../db/mysql.js')

const date = require('silly-datetime')

// 此部分用于房源详情留言板中使用
// 获取news留言列表
const getNewsList = async (houseId) => {
    let sql = `select news.id,myId,houseId,time,detail,realname,picture from news `//注意空格
    sql += `inner join userms on news.myId = userms.id where 1=1 ` // 内敛查询拼接用户真名
    if(houseId){
        sql += `and houseId='${houseId}' `
    }
    sql += `order by time desc;`

    return await exec(sql)
}
// 获取reply回复列表
const getReplyList = async (newsId) => {
    // 先获取包含对象真名在内的回复数据
    let tosql = `(select reply.id,houseId,newsId,fromId,toId,userms.realname as toName,reply,time `
    tosql += `from reply inner join userms on reply.toId = userms.id `
    if(newsId){
        tosql += `where newsId='${newsId}' `
    }
    tosql += `) as replyto `
    // 再从其中内联出发起者的真名
    let fromsql = `select replyto.id,houseId,newsId,fromId,userms.realname as fromName,toId,toName,reply,time `
    // 注意此处拼接的sql字符串，加上''包括会报错
    fromsql += `from ${tosql} INNER JOIN userms on replyto.fromId = userms.id `

    return await exec(fromsql)
}

// 新建留言
const newComment = async (commentData = {}) => {
    // commentData是一个评论对象，包含detail，myId等属性
    const detail = xss(commentData.detail)
    const time = date.format(new Date(),'YYYY-MM-DD HH:mm:ss')
    const myId = commentData.myId
    const houseId = commentData.houseId

    const sql = `insert into news (detail,time,myId,houseId) 
    values ('${detail}','${time}','${myId}','${houseId}') `

    const insertData = await exec(sql)
    return{
        id:insertData.insertId
    }
}

// 新建回复
const newReply = async (replyData = {}) => {
    //replyData是一个评论对象，包含reply，myId等属性
    const reply = xss(replyData.reply)
    const newsId = replyData.newsId
    const time = date.format(new Date(),'YYYY-MM-DD HH:mm:ss')
    const fromId = replyData.fromId
    const toId = replyData.toId
    const houseId = replyData.houseId

    const sql = `insert into reply (reply,newsId,time,fromId,houseId,toId) 
    values ('${reply}','${newsId}','${time}','${fromId}','${houseId}','${toId}') `

    const insertData = await exec(sql)
    return{
        id:insertData.insertId
    }
}


// 此部分用于个人主页中我的点评使用
// 获取个人发过的留言列表
const getMyNewsList = async (myId) => {
    let sql = `select news.id,myId,houseId,time,news.detail,houseName from news `//注意空格
    sql += `inner join housems on news.houseId = housems.id where 1=1 ` // 内敛查询拼接用户真名
    if(myId){
        sql += `and myId='${myId}' `
    }
    sql += `order by time desc;`

    return await exec(sql)
}

// 获取个人发过的留言列表
const getMyReplyList = async (myId) => {
    let sql = `select reply.id,fromId,toId,houseId,time,reply,houseName from reply `//注意空格
    sql += `inner join housems on reply.houseId = housems.id where 1=1 ` // 内敛查询拼接用户真名
    if(myId){
        sql += `and fromId='${myId}' `
    }
    sql += `order by time desc;`

    return await exec(sql)
}

//删除对应房源的所有回复
const deleteReplys = async function(houseId) {
    const sql = `delete from reply where houseId='${houseId}' `
    const deleteData = await exec(sql)
    if (deleteData.affectedRows > 0) {
        return true
    }
    return false
}

//删除对应房源的所有留言
const deleteNews = async function(houseId) {
    const sql = `delete from news where houseId='${houseId}' `
    const deleteData = await exec(sql)
    if (deleteData.affectedRows > 0) {
        return true
    }
    return false
}


module.exports = {
    getNewsList,
    getReplyList,
    newComment,
    newReply,
    getMyNewsList,
    getMyReplyList,
    deleteReplys,
    deleteNews
}