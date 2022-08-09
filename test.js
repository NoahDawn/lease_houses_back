const Koa = require('koa')
const app = new Koa()
const koaBody = require('koa-body')
const router = require('koa-router')()
//解决跨域
const cors = require('koa2-cors')
//路径获取
const path = require('path')
//处理页面
const views = require('koa-views')
//处理json数据
const json = require('koa-json')
//处理报错
const onerror = require('koa-onerror')
//处理上传数据
const bodyparser = require('koa-bodyparser')
//处理日志
const logger = require('koa-logger')
//处理上传
const multer = require('koa-multer')
//处理文件读写
const fs = require('fs');

//error handler
onerror(app)


app.use(koaBody({
    multipart: true,
    formidable: {
        maxFileSize: 200*1024*1024    // 设置上传文件大小最大限制，默认2M
    }
}))
//注册middlewares(中间件)
app.use(bodyparser({
    //处理postdata不同格式的数据
    enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())

//处理静态数据
app.use(require('koa-static')(path.join(__dirname + '/static')))
//设置页面存储地
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
//抛出异常
app.on('error', (err, ctx) => {
    console.error('server error: ', err, ctx)
})

//实现跨域
app.use(cors({
    origin: function(ctx) { //设置允许来自指定域名请求
        return '*';  //直接设为所有域名都可访问
    },
    maxAge: 5, //指定本次预检请求的有效期，单位为秒。
    credentials: true, //是否允许发送Cookie
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], //设置所允许的HTTP请求方法
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'], //设置服务器支持的所有头信息字段
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'] //设置获取其他自定义字段
}))


//注册router
const user = require('./routers/user.js')
const house = require('./routers/house.js')
const record = require('./routers/record.js')
const order = require('./routers/order.js')
router.use('/api/user', user)
router.use('/api/house', house)
router.use('/api/record', record)
router.use('/api/order', order)

//上传文件方法3
router.post('/upload', async function (ctx, next) {
    const file = ctx.request.files.user; // 上传的文件在ctx.request.files.file
    const userid = ctx.request.query.userid
    // 创建可读流
    const reader = fs.createReadStream(file.path);
    // 修改文件的名称
    var myDate = new Date();
    // var newFilename = myDate.getTime()+'.'+file.name.split('.')[1];
    var newFilename = 'user_'+`${userid}`+'.'+file.name.split('.')[1]
    var uploadPath = path.join(__dirname, '/static/picture/user/') + `/${newFilename}`;
    
    //创建可写流
    const upStream = fs.createWriteStream(uploadPath);
    // 可读流通过管道写入可写流
    reader.pipe(upStream);
    //返回保存的路径
    return ctx.body = { code: 200, data: { url: 'http://' + ctx.headers.host + '/upload/' + newFilename } };
})

app.use(router.routes(), router.allowedMethods())

// const { genPassword } = require('./untils/cryp.js')
// console.log(genPassword('789'))

app.listen(8000)

module.exports = {
    app
}