#### 实现一个静态服务器
* 实现了一个静态服务器
* 做了一个登陆注册功能
    * ajax
    * 服务端处理post请求
    * 服务端使用文件储存用户的信息
    * 登陆之后使用cookie保存登陆状态
    * 使用更安全的方式session，需要在服务端储存session
    * 将用户信息放在服务端，在给这个信息一个随机id，将id发给浏览器服务端通过用户信息[id]获取其他信息
    * session是借助cookie实现
    * 删除数据库中用户功能实现
    * 删除session