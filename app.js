const Koa = require('koa')
const app = new Koa()
const router = require('koa-router')()
// 连接io服务
// const server = require('http').createServer(app.callback());
// require('./socketIO/socket')(server)

//处理页面
const views = require('koa-views')
//处理json数据
const json = require('koa-json')
//处理报错
const onerror = require('koa-onerror')
//处理上传数据(特别注意后续引用中间件时候body和bodyparser的先后顺序)
const koaBody = require('koa-body')
const bodyparser = require('koa-bodyparser')
//处理日志
const logger = require('koa-logger')
//session和redis
const session = require('koa-generic-session')
const redisStore = require('koa-redis')
//解决跨域
const cors = require('koa2-cors')
//路径获取
const path = require('path')
//文件操作
const fs = require('fs')

//动态引入redis
const { REDIS_CONF } = require('./conf/db.js')

//引用路由
const user = require('./routers/user.js')
const house = require('./routers/house.js')
const record = require('./routers/record.js')
const order = require('./routers/order.js')
const news = require('./routers/news.js')
const collect = require('./routers/collect.js')
const intermediary = require('./routers/intermediary.js')
const init = require('./routers/init.js')

//error handler
onerror(app)

//注册middlewares(中间件)
//设置图片的上传大小
app.use(koaBody({
    multipart: true,       //是否允许多张图片的上传
    formidable: {
        maxFileSize: 200*1024*1024    // 设置上传文件大小最大限制，默认2M
    }
}))
//设置接收数据的格式
app.use(bodyparser({
    //处理postdata不同格式的数据
    enableTypes:['json', 'form', 'text']
}))

app.use(json())
app.use(logger())

//处理静态数据
app.use(require('koa-static')(path.join(__dirname + '/static')))

app.use(views(__dirname + '/views', {
    extension: 'pug'
}))

//打印日志
app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    //服务耗时
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} ${ms}ms`)
})

//生成密匙
// app.keys = ['DZG_dzg@']
// app.use(session({
//     //配置cookie
//     cookie: {
//         path: '/',
//         httpOnly: true,
//         maxAge: 24 * 60 * 60 * 1000
//     },
//     //配置redis
//     store: redisStore ({
//         all: `${REDIS_CONF.host}:${REDIS_CONF.port}`
//     })
// }))

//实现跨域
app.use(cors({
    origin: function(ctx) { //设置允许来自指定域名请求
        return '*';  //直接设为所有域名都可访问
        // if (ctx.url === '/test') {
        //     return '*';// 允许来自所有域名请求
        // }
        // return 'http://localhost:8000'; //只允许http://localhost:8080这个域名的请求
    },
    maxAge: 5, //指定本次预检请求的有效期，单位为秒。
    credentials: true, //是否允许发送Cookie
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], //设置所允许的HTTP请求方法
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'], //设置服务器支持的所有头信息字段
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'] //设置获取其他自定义字段
}))

//用户个人信息修改，含头像上传
// const { updateUserMS } = require('./controller/user.js')
// router.post('/api/user/update', async function (ctx, next) {
//     const body = ctx.request.body
//     const userid = ctx.request.query.userid
//     // 头像的上传
//     const file = ctx.request.files.user
//     // 创建可读流
//     const reader = fs.createReadStream(file.path);
//     // 修改文件的名称,格式为user_userid.后缀
//     var newFilename = 'user_'+`${userid}`+'.'+file.name.split('.')[1]
//     var uploadPath = path.join(__dirname, '/static/picture/user/') + `/${newFilename}`;
    
//     // 创建可写流
//     const upStream = fs.createWriteStream(uploadPath);
//     // 可读流通过管道写入可写流
//     reader.pipe(upStream);
//     // 返回保存的路径
//     const url = 'http://' + ctx.headers.host + '/picture/user/' + newFilename

//     // 将保存的路径写入body
//     body.picture = url
//     body.id = userid
//     const newData = await updateUserMS(body)
//     return ctx.body = {userid:newData.id}
// })

//信件房源，含展示图片的多张上传
const { newHouse, pictureURL } = require('./controller/house.js')
const { getUserDetail } = require('./controller/user.js')
router.post('/api/house/new', async function (ctx, next) {
    const body = ctx.request.body
    body.ownerId = ctx.query.ownerId

    const ownerMS = await getUserDetail(body.ownerId)
    body.owner = ownerMS.realname
    body.phone = ownerMS.phone

    // console.log("传输的数据：",body)

    const newData = await newHouse(body)
    const houseid = newData.id
    // 上传多个文件
    const files = ctx.request.files.house // 获取上传文件
    let count = 1
    let picture = ``
    for (let file of files) {
        // 创建可读流
        const reader = fs.createReadStream(file.path)
        // 图片重命名，格式为house_houseid_图片组编号.后缀
        let newFilename = 'house_'+`${houseid}`+'_'+`${count}`+'.jpg'
        // 获取上传文件扩展名
        let filePath = path.join(__dirname, '/static/picture/house/') + `/${newFilename}`
        // 创建可写流
        const upStream = fs.createWriteStream(filePath)
        // 可读流通过管道写入可写流
        reader.pipe(upStream)
        // 获取图片的根目录
        const url = 'http://' + ctx.headers.host + '/picture/house/' + newFilename
        //判断当前图片是否是最后一张，若是，则总路径结尾不加';'作为分隔符
        if (count === files.length) {
            picture += url
        } else {
            picture += url + ';'
        }
        count++
    }
    console.log('allurl is: ', picture)
    const pictureValue = await pictureURL(houseid, picture)
    if (pictureValue) {
        return ctx.body = {newData:houseid}
    }
    return ctx.body = {ms:"新建房源失败"}
})

const {nanoid} = require('nanoid')
// 经纪人头像
router.post('/api/intermediary/avatar', async function (ctx, next) {
    // 上传多个文件
    const file = ctx.request.files.file // 获取上传文件
    // console.log('默认文件',files.file)
    // 创建可读流
    const reader = fs.createReadStream(file.path)
    // 图片重命名，格式为house_houseid_图片组编号.后缀
    let newFilename = 'intermediary_'+ nanoid() +'.jpg'
    // 获取上传文件扩展名
    let filePath = path.join(__dirname, '/static/picture/intermediary/') + `/${newFilename}`
    // 创建可写流
    const upStream = fs.createWriteStream(filePath)
    // 可读流通过管道写入可写流
    reader.pipe(upStream)
    // 获取图片的根目录
    const url = 'http://' + ctx.headers.host + '/picture/intermediary/' + newFilename
    console.log('allurl is: ', url)

    return ctx.body = {avatar:url}
})

//注册router
router.use('/api/user', user)
router.use('/api/house', house)
router.use('/api/record', record)
router.use('/api/order', order)
router.use('/api/news', news)
router.use('/api/collect', collect)
router.use('/api/intermediary', intermediary)
router.use('/api/init', init)
app.use(router.routes(), router.allowedMethods())

//抛出异常
app.on('error', (err, ctx) => {
    console.error('server error: ', err, ctx)
})

//端口号
app.listen(8050, () => {
    console.log('server in 8050')
})

module.exports = {
    app
}