const http = require("http");
const fs = require("fs");
const url = require("url");
const port = process.argv[2];
if (!port) {
    console.log("请指定端口号好不啦？\\nnode server.js 8888 这样不会吗？");
    process.exit(1);
}

const session = JSON.parse(fs.readFileSync('./public/session.json').toString())
let server = http.createServer((request, response) => {
    const parsedUrl = url.parse(request.url, true);
    const pathWithQuery = request.url;
    let queryString = "";
    if (pathWithQuery.indexOf("?") >= 0) {
        queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"));
    }
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;
    const method = request.method;

    console.log("有个傻子发请求过来啦！路径（带查询参数）为：" + pathWithQuery + method);
    if (path === "/register" && method === "POST") {
        response.statusCode = 200
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
        let data = ''
        request.on('data', (chunk) => {
            data += chunk
        })
        request.on('end', () => {

            let obj = JSON.parse(data)
            //需要加一个判断，不能有重复用户名
            let lastUser = userArray[userArray.length - 1]
            const newUser = {
                id: lastUser ? lastUser.id + 1 : 1,
                name: obj.name,
                password: obj.password

            }
            userArray.push(newUser)
            console.log(newUser);
            fs.writeFileSync("./db/users.json", JSON.stringify(userArray));
            response.end()


        })


    } else if (path === '/login' && method === 'POST') {
        response.statusCode = 200
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        let data = ''
        request.on('data', chunk => {
            data += chunk
        })
        request.on('end', () => {
            const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
            let obj = JSON.parse(data)
            const user = userArray.find(
                user => user.name === obj.name && user.password === obj.password
            )
            if (user === undefined) {
                response.statusCode = 404
                response.setHeader("Content-Type", "text/json; charset=utf-8");
            } else {
                response.statusCode = 200
                // session就是在cookie中再加入一个验证在服务端存储
                const random = Math.random()
                session[random] = {user_id: user.id}
                fs.writeFileSync('./public/session.json', JSON.stringify(session))
                response.setHeader("Set-Cookie", `session_id=${random}; HttpOnly`);
                // response.setHeader("Set-Cookie", `${user.id}`);
            }
            response.end()
        })

    } else if (path === '/home.html') {
        // 1. let cookie = request.headers["cookie"]
        // let flag = parseInt(cookie.split(';')[3])
        // let sessionId = cookie.split(';').filter(s=>{s.indexOf("session_id=")>=0})[0].split("=")[1]
        // console.log(sessionId);
        // const string = homeHtml.replace("{{loginStatus}}", "未登录")
        //     .replace('{{user.name}}', '')
        //这个flag是用户的id，根据cookie传递过来，但是会被篡改，不安全 cookie是票据
        //加入一个更安全的方式 session
        // if (flag) {
        //     //flag 就是用户的id
        //     let userArray = JSON.parse(fs.readFileSync('./db/users.json'))
        //     let user = userArray.reduce((item, e) => {
        //         // console.log(e.id === flag)
        //         if (e.id === flag) {
        //             item.name = e.name
        //             item.password = e.password
        //             item.id = e.id
        //         }
        //         return item
        //     }, {})
        //     string = homeHtml.replace("{{loginStatus}}", "已登录").replace("{{user.name}}", user.name).replace("{{user.id}}", user.id)
        //
        // }
        //2.使用session
        const cookie = request.headers["cookie"];
        let sessionId;
        try {
            sessionId = cookie
                .split(";")
                .filter(s => s.indexOf("session_id=") >= 0)[0]
                .split("=")[1];
        } catch (error) {
        }
        console.log(sessionId)
        console.log(session[sessionId]);
        if (sessionId && session[sessionId]) {
            const userId = session[sessionId].user_id
            const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
            const user = userArray.find(user => user.id === userId);
            const homeHtml = fs.readFileSync("./public/home.html").toString();
            let string = ''
            if (user) {
                string = homeHtml.replace("{{loginStatus}}", "已登录")
                    .replace('{{user.name}}', user.name).replace("{{user.id}}", user.id)
            }
            response.write(string)
        } else {
            const homeHtml = fs.readFileSync("./public/home.html").toString();
            const string = homeHtml.replace("{{loginStatus}}", "未登录")
                .replace('{{user.name}}', '')
            response.write(string);
        }
        response.end()
    } else if (path === '/logout') {
        const cookie = request.headers["cookie"];
        let sessionId;
        try {
            sessionId = cookie
                .split(";")
                .filter(s => s.indexOf("session_id=") >= 0)[0]
                .split("=")[1];
        } catch (error) {
        }
        //根据sessionId删除数据
        // console.log(session[sessionId]);
        let id = session[sessionId]["user_id"]
        let userArray = JSON.parse(fs.readFileSync('./db/users.json'))
        userArray = userArray.reduce((item, e, index) => {
            if (e.id === id) {
                console.log(`找到了`, e)
            } else {
                item.push(e)
            }
            return item
        }, [])
        fs.writeFileSync('./db/users.json', JSON.stringify(userArray))
        let sessionArray = JSON.parse(fs.readFileSync('./public/session.json'))
        // console.log(sessionArray);
        let idArray = Object.values(sessionArray)

    } else {
        response.statusCode = 200
        const filePath = path === '/' ? '/index.html' : path
        const index = filePath.lastIndexOf('.')
        const suffix = filePath.substring(index)//��ȡĩβ����
        const fileType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/ipeg'
        }
        response.setHeader(
            "Content-Type", `${filePath[suffix] || "text/html"};charset=utf-8`
        );
        let content
        try {
            content = fs.readFileSync(`./public/${filePath}`);
        } catch (error) {
            content = "没有内容"
            response.statusCode = 404

        }

        response.write(content)
        response.end()
    }


})
server.listen(port)
console.log("打开" + port)