const jwt = require('jsonwebtoken')

//创建私匙
const priCert = 'DZG_dzg@'
// 生成token
function generateToken(id, username) {
    //设置过期时间
    const created = Math.floor(Date.now() / 1000) + (30 * 60)
    //存入token里的用户数据
    const payLoad = {id: id, username: username}
    console.log('username is: ', payLoad.username)
    // const token = jwt.sign(payLoad, {
    const token = jwt.sign(payLoad, priCert, { expiresIn: '24h' })
    console.log('payload is: ', token.username)
    return token
}

module.exports = {
    generateToken
}