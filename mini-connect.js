function merge(a, b) {
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
}

var proto = {};

function App() {
  function app(req, res, next) {
    app.handle(req, res, next);
  }
  merge(app, proto);
  app.stack = [];
  return app;
}

proto.use = function (route, fn) {
  var handle = fn;
  var path = route;
  if (typeof route !== "string") {
    handle = route;
    path = "/";
  }
  // proto 上本来没有，借用 app 上的属性
  this.stack.push({ route: path, handle: handle });
};

proto.handle = function (req, res) {
  console.log("handle...", req.url);
  var stack = this.stack;
  var index = 0;
  // var notFound = false
  function next(err) {
    layer = stack[index++];

    // 路由匹配
    if (
      req.url.toLowerCase().substr(0, layer.route.length) !=
      layer.route.toLowerCase()
    ) {
      return next(err);
    }
    // 这里只处理最简单的情况，所有 middleware 都执行
    // 这里的 next 是当前函数本身

    call(layer.handle, layer.route, req, res, next);
  }
  next();
};

/**
 *
 * @param {*} handle 中间件回调
 * @param {*} path 中间件匹配的路由路径
 * @param {*} req
 * @param {*} res
 * @param {*} next 下一个中间件触发函数
 */
function call(handle, path, req, res, next) {
  // 本质上就是这样
  // connect 还扩充了错误处理
  handle(req, res, next);
}
// mini-connect end...

const app = new App();
app.use(function (req, res, next) {
  console.log("middleware 1", req.url);
  res.write("middleware 1\n");
  next();
});

app.use(function (req, res, next) {
  console.log("middleware 2", req.url);
  res.write("middleware 2\n");
  next();
});

app.use("/hello", function (req, res, next) {
  res.end("hello world");
});

// 根路由必须放到最后
app.use("/", function (req, res, next) {
  res.end("index page");
});

const http = require("http");
http.createServer(app).listen(3000);

// test
// curl "http://localhost:3000/hello"
// curl "http://localhost:3000/xxx"
