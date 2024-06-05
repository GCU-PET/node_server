const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const cors = require("cors");
const TokenUtils = require("./utils/tokenUtils");
app.TokenUtils = TokenUtils;
require("dotenv").config();

// body-parser 미들웨어 설정
app.use(bodyParser.json());
// app.use(
//   cors({
//     origin: ["*"], // 모든 출처 허용 옵션. true 를 써도 된다.
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   })
// );
app.use(cors());

var db;
MongoClient.connect(
  process.env.DB_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err, client) {
    if (err) return console.log(err);
    db = client.db("PETapp");
    app.db = db;
    app.listen(process.env.PORT, () =>
      console.log("listening on", process.env.PORT)
    );
  }
);

const { swaggerUi, specs } = require("./swagger.js");
app.use("/api/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

const routes_login = require("./routes/login.js");
app.use("/api/user", routes_login);

const routes_post = require("./routes/post.js");
app.use("/api/board", checkUser, routes_post);

const routes_mypage = require("./routes/mypage.js");
app.use("/api/mypage", checkUser, routes_mypage);

/** 로그인 상태를 확인하기 위한 함수. */
function checkUser(req, res, next) {
  let loginStatus = TokenUtils.verify(req.headers.token);
  if (loginStatus.ok) {
    next();
  } else {
    res.status(500).json({ ok: false, message: loginStatus.message });
  }
}
