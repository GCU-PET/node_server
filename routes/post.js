const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");
require("dotenv").config();

const multer = require("multer");
const multerS3 = require("multer-sharp-s3");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: "ap-northeast-2",
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    Bucket: "eehoforum",
    ACL: "private", // 액세스 권한 설정
    Key: (req, file, cb) => {
      // 파일 이름 설정
      var dateString = WhatTimeNow();
      let loginStatus = req.app.TokenUtils.verify(req.headers.token);
      dateString = dateString + "_" + loginStatus.id + ".jpeg";
      cb(null, dateString);
    },
    resize: {
      width: 600,
    },
    max: true, // 비율 유지
    format: "jpeg", // 변경할 이미지 포맷
    quality: 90, // 이미지 품질
  }),
});

/**
 * @swagger
 * /api/board/post:
 *   post:
 *     summary: "게시물 작성을 위한 POST 요청."
 *     description: "post 방식으로 title, content 전송. 이거 이미지 없이 보내는 거 테스트 용이에요. 성공은 아래 이미지 포함으로 해주세요."
 *     parameters:
 *       - in: body
 *         name: headers
 *         required: true
 *         schema:
 *           properties:
 *             token:
 *               type: string
 *     tags:
 *       - Board
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post Success
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
 *         description: Login first
 */
router.post("/post", function (req, res1) {
  let loginStatus = req.app.TokenUtils.verify(req.headers.token);
  req.app.db
    .collection("counter")
    .findOne({ name: "board_count" }, function (err, res) {
      var cnt = res.count;
      var dateString = WhatTimeNow();
      var data;
      if (loginStatus.id)
        data = {
          _id: cnt,
          writer: loginStatus.id,
          title: req.body.title,
          content: req.body.content,
          date: dateString,
        };
      else
        return res1.status(501).json({ result: false, message: "Login first" });

      req.app.db.collection("board").insertOne(data, function () {
        req.app.db
          .collection("counter")
          .updateOne(
            { name: "board_count" },
            { $inc: { count: 1 } },
            function (err, res) {
              return res1
                .status(201)
                .json({ result: true, message: "Post Success!" });
            }
          );
      });
    });
});

/**
 * @swagger
 * /api/board/post/image:
 *   post:
 *     summary: "이미지 게시물 작성을 위한 POST 요청."
 *     description: "post 방식으로 title, content, image 전송. 저장방식 { _id : 게시물번호, writer : user._id, title : title, content : content, image : image, date : YYYYMMDD HH:MM:SS:MM }"
 *     parameters:
 *       - in: body
 *         name: headers
 *         required: true
 *         schema:
 *           properties:
 *             token:
 *               type: string
 *     tags:
 *       - Board
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               profile:
 *                 type: image
 *     responses:
 *       201:
 *         description: Post Success
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
 *         description: Login first
 */
router.post("/post/image", upload.single("profile"), function (req, res1) {
  let loginStatus = req.app.TokenUtils.verify(req.headers.token);
  req.app.db
    .collection("counter")
    .findOne({ name: "board_count" }, function (err, res) {
      var cnt = res.count;
      var dateString = WhatTimeNow();
      var data;
      if (loginStatus.id)
        data = {
          _id: cnt,
          writer: loginStatus.id,
          title: req.body.title,
          content: req.body.content,
          image: req.file.Location,
          date: dateString,
        };
      else
        return res1.status(501).json({ result: false, message: "Login first" });

      req.app.db.collection("board").insertOne(data, function () {
        req.app.db
          .collection("counter")
          .updateOne(
            { name: "board_count" },
            { $inc: { count: 1 } },
            function (err, res) {
              return res1
                .status(201)
                .json({ result: true, message: "Post Success!" });
            }
          );
      });
    });
});

// router.post('/test', function (req, res1) {
//     console.log(req.body);
//     return res1.status(200).json({ result : 'success', board : req.body });
// });

/**
 * @swagger
 * /api/board/list:
 *   get:
 *     summary: "게시물 전부 불러오기 위한 GET 요청."
 *     description: "게시물 전부 로딩."
 *     parameters:
 *       - in: body
 *         name: headers
 *         required: true
 *         schema:
 *           properties:
 *             token:
 *               type: string
 *     tags:
 *       - Board
 *     responses:
 *       200:
 *         description: "response는 이 형식으로 list로 들어가있음. "
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 response:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: integer
 *                       writer:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       image:
 *                         type: string
 *                       date:
 *                         type: datetime
 *       500:
 *         description: Internal server error
 */
router.get("/list", function (req, res1) {
  req.app.db
    .collection("board")
    .find()
    .toArray(function (err, res) {
      console.log(res);
      res1.status(200).json({ result: true, response: res });
    });
});

/**
 * @swagger
 * /api/detail/:id:
 *   get:
 *     summary: "특정 게시물 번호로 불러오기 GET 요청."
 *     description: "엔드포인트에 파라미터로 게시물 ID로 요청."
 *     parameters:
 *       - in: body
 *         name: headers
 *         required: true
 *         schema:
 *           properties:
 *             token:
 *               type: string
 *     tags:
 *       - Board
 *     responses:
 *       200:
 *         description: "response는 이 형식으로 list로 들어가있음. "
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 response:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: integer
 *                     writer:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     image:
 *                       type: string
 *                     date:
 *                       type: datetime
 *       500:
 *         description: Internal server error
 *       501:
 *         description: Cannot find the board
 */
router.get("/detail/:id", function (req, res1) {
  req.app.db
    .collection("board")
    .findOne({ _id: parseInt(req.params.id) }, function (err, res) {
      if (res == null)
        res1.status(501).json({ message: "Cannot find the board" });
      else res1.status(200).json({ result: true, response: res });
    });
});

/**
 * @swagger
 * /api/board/edit:
 *   put:
 *     summary: "게시물 번호로 수정하기 PUT 요청."
 *     description: "put 방식으로 title, content, _id 전송."
 *     parameters:
 *       - in: body
 *         name: headers
 *         required: true
 *         schema:
 *           properties:
 *             token:
 *               type: string
 *     tags:
 *       - Board
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Edit Success
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
 *         description: Cannot Find board or Invalid User
 */
router.put("/edit", function (req, res1) {
  let loginStatus = req.app.TokenUtils.verify(req.headers.token);
  var dateString = WhatTimeNow();
  try {
    req.app.db.collection("board").updateOne(
      { _id: parseInt(req.body._id), writer: loginStatus.id },
      {
        $set: {
          title: req.body.title,
          content: req.body.content,
          date: dateString,
        },
      },
      function (err, res) {
        return res1.status(201).json({ result: true, message: "Edit Success" });
      }
    );
  } catch (error) {
    return res1
      .status(501)
      .json({ result: true, message: "Cannot Find board or Invalid User" });
  }
});

/**
 * @swagger
 * /api/board/delete:
 *   put:
 *     summary: "게시물 번호로 삭제하기 PUT 요청."
 *     description: "put 방식으로 _id 전송."
 *     parameters:
 *       - in: body
 *         name: headers
 *         required: true
 *         schema:
 *           properties:
 *             token:
 *               type: string
 *     tags:
 *       - Board
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Delete Success
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
 *         description: Delete Failed
 */
router.put("/delete", function (req, res1) {
  req.body._id = parseInt(req.body._id);
  var data = { _id: req.body._id, writer: req.user._id };
  req.app.db.collection("board").deleteOne(data, function (err, res) {
    if (err) res1.status(501).json({ message: "Delete Failed." });
    else res1.status(201).json({ message: "Delete Success!" });
  });
});

/** 현재 시간 구하기 위한 함수. */
function WhatTimeNow() {
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var dateNum = date.getDate();
  var hour = date.getHours();
  var min = date.getMinutes();
  var sec = date.getSeconds();
  var milsec = date.getMilliseconds();

  var dateString = year;
  if (month < 10) dateString += "0";
  dateString += String(month);
  if (dateNum < 10) dateString += "0";
  dateString += String(dateNum) + " ";
  if (hour < 10) dateString += "0";
  dateString += String(hour) + ":";
  if (min < 10) dateString += "0";
  dateString += String(min) + ":";
  if (sec < 10) dateString += "0";
  dateString += String(sec) + ":";
  if (milsec < 10) dateString += "00";
  else if (milsec < 100) dateString += "0";
  dateString += String(milsec);

  return dateString;
}

module.exports = router;
