function dateCodeChange(datetime) {
    // 以2020-12-21T06:40:29.000Z为例，直接取出后时部分为乱码，需要进行格式转换
    var date = new Date(datetime);

    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    var hour = date.getHours();
    var minute = date.getMinutes();
    if (month < 10) {
        month = "0" + month
    }
    if (day < 10) {
        day = "0" + day
    }
    if (hour < 10) {
        hour = "0" + hour;
    }
    if (minute < 10) {
        minute = "0" + minute;
    }
    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute
}

// 计算两个日期之间的相差天数，向下取整
function differDays(dateTimeStart, dateTimeEnd) {
    // 转为时间戳
    let startDate = (new Date(dateTimeStart)).getTime()
    let endDate = (new Date(dateTimeEnd)).getTime()
    // 时间戳计算相差天数
    const time = (endDate - startDate)/(1*24*60*60*1000)
  
    // 向上取整
    return Math.floor(time)
  }

module.exports = {
    dateCodeChange,
    differDays
}