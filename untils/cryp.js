const crypto = require('crypto')

//密匙
const SECRET_KEY = 'DZG_dzg@'

//md5 加密
function md5(content) {
    //创建md5哈希算法
    let md5 = crypto.createHash('md5')
    //update：添加要转换的值
    //digest('hex')以十六进制返回
    return md5.update(content).digest('hex')
}

//加密函数
function genPassword(password) {
    const str = `password=${password}&key=${SECRET_KEY}`
    return md5(str)
}

module.exports = {
    genPassword
}