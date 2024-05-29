const express = require("express");
const router = express.Router();
require("dotenv").config();

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

router.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
router.use(passport.initialize());
router.use(passport.session());

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: "로그인 요청을 위한 POST 요청."
 *     description: "POST 방식으로 ID, PW 전송"
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ID:
 *                 type: string
 *               PW:
 *                 type: string
 *     responses:
 *       201:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 result:
 *                   type: boolean
 *       400:
 *         description: Bad request, request body invalid
 *       500:
 *         description: Internal server error
 */
router.post("/login", async function (req, res) {
  var result = await req.app.db
    .collection("login")
    .findOne({ ID: req.body.ID, PW: req.body.PW });
  console.log("result:", result);

  if (result) {
    console.log("req.body2:", req.body);
    const accessToken = req.app.TokenUtils.makeToken({
      id: String(req.body.ID),
    });
    return res.status(201).json({ token: accessToken, result: true }); // result: true
  } else {
    console.log("실패");
    return res.status(500).json({ result: false, message: "Login fail" });
  }
});

/** 로그인 실패했을 시 반환할 메시지 */
router.all("/fail", function (req, res) {
  res.status(401).json({ result: false, message: "Login Fail" });
});

/**
 * @swagger
 * /api/user/isExisted:
 *   post:
 *     summary: "아이디 중복확인 POST 요청."
 *     description: "POST 방식으로 ID 전송"
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ID:
 *                 type: string
 *     responses:
 *       201:
 *         description: 아이디 사용 가능
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *       400:
 *         description: Bad request, request body invalid
 *       500:
 *         description: Internal server error
 *       501:
 *         description: 아이디 사용 불가
 */
router.post("/isExisted", function (req, res1) {
  req.app.db.collection("login").findOne({ ID: req.body.ID }, (err, res) => {
    console.log(req.body);
    console.log(res);
    if (res)
      return res1.status(501).json({ result: false, message: "Existed ID" });
    return res1.status(201).json({ result: true, message: "availabe" });
  });
});

/**
 * @swagger
 * /api/user/signup:
 *   post:
 *     summary: "회원가입 요청을 위한 POST 요청."
 *     description: "POST 방식으로 ID, PW 전송"
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ID:
 *                 type: string
 *               PW:
 *                 type: string
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 result:
 *                   type: boolean
 *       400:
 *         description: Bad request, request body invalid
 *       500:
 *         description: Internal server error
 *       501:
 *         description: 아이디 사용 불가
 */
router.post("/signup", function (req, res1) {
  req.app.db
    .collection("login")
    .findOne({ ID: req.body.ID }, function (err, res) {
      if (!res) {
        req.app.db
          .collection("login")
          .insertOne(
            { ID: req.body.ID, PW: req.body.PW, petName: req.body.petName },
            function (err, res) {
              const accessToken = req.app.TokenUtils.makeToken({
                id: String(req.body.ID),
              });
              return res1.status(201).json({
                token: accessToken,
                result: true,
                message: "Sign Up Success!",
              });
            }
          );
      } else {
        return res1
          .status(501)
          .json({ result: false, message: "Duplicated ID" });
      }
    });
});

/**
 * @swagger
 * /api/user/pwchange:
 *   put:
 *     summary: "비밀번호 변경을 위한 PUT 요청."
 *     description: "PUT 방식으로 ID, PW 전송"
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ID:
 *                 type: string
 *               PW:
 *                 type: string
 *     responses:
 *       201:
 *         description: Password change Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *       400:
 *         description: Bad request, request body invalid
 *       500:
 *         description: Internal server error
 *       501:
 *         description: Password change failed
 */
router.put("/pwchange", function (req, res1) {
  req.app.db
    .collection("login")
    .updateOne(
      { ID: req.body.ID },
      { $set: { PW: req.body.PW } },
      function (err, res) {
        if (err)
          res1
            .status(501)
            .json({ result: false, message: "Password change failed" });
        res1
          .status(201)
          .json({ result: true, message: "Password change Success!" });
      }
    );
});

/**
 * @swagger
 * /api/user/update:
 *   post:
 *     summary: "유저정보 변경을 위한 post 요청."
 *     description: "post 방식으로 PW, userName, petName 전송"
 *     parameters:
 *       - in: body
 *         name: headers
 *         required: true
 *         schema:
 *           properties:
 *             token:
 *               type: string
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               PW:
 *                 type: string
 *               userName:
 *                 type: string
 *               petName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Password change Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *       400:
 *         description: Bad request, request body invalid
 *       500:
 *         description: Internal server error
 *       501:
 *         description: Password change failed
 */
router.post("/update", checkUser, function (req, res1) {
  let loginStatus = TokenUtils.verify(req.headers.token);
  req.app.db
    .collection("login")
    .findOne({ ID: loginStatus.id }, function (err, res) {
      if (err) res1.status(400).json({ result: false, message: "error" });
      req.app.db.collection("login").updateOne(
        { ID: loginStatus.id },
        {
          $set: {
            PW: req.body.PW,
            userName: req.body.userName,
            petName: req.body.petName,
          },
        }
      );

      res1.status(200).json({ message: "Password change Success!" });
    });
});

/** 로그인 상태를 확인하기 위한 함수. */
function checkUser(req, res, next) {
  let loginStatus = TokenUtils.verify(req.headers.token);
  if (loginStatus.ok) {
    next();
  } else {
    res.status(500).json({ ok: false, message: loginStatus.message });
  }
  // if (req.user) next();
  // else res.status(401).json({ message: 'No login information.' });
}

/** 로그인 검증을 위한 passport.js 라이브러리 설정 */
passport.use(
  new LocalStrategy(
    {
      usernameField: "ID",
      passwordField: "PW",
      session: true,
      passReqToCallback: false,
    },
    function (getID, getPW, done) {
      db.collection("login").findOne({ ID: getID }, function (err, res) {
        if (err) return done(err);

        if (!res) return done(null, false, { message: "Wrong ID" });

        if (getPW == res.PW) {
          return done(null, res);
        } else {
          return done(null, false, { message: "Wrong PW" });
        }
      });
    }
  )
);

/** 로그인 성공 시 세션 저장 */
passport.serializeUser(function (user, done) {
  done(null, user.ID);
});

/** 세션에 저장한 아이디를 통해서 사용자 정보 객체를 불러옴 */
passport.deserializeUser(function (getID, done) {
  req.app.db.collection("login").findOne({ ID: getID }, function (err, res) {
    done(null, res);
  });
});

module.exports = router;
