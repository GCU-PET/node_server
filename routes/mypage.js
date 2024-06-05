const express = require("express");
const router = express.Router();
require("dotenv").config();

// 사용자 정보에 접근하는 예제 페이지 (인증이 필요한 페이지)
router.get("/dashboard", (req, res) => {
  res.status(200).json({ userID: req.user });
});

// log list
// 헤더에 토큰, parameter 추가해서 날짜로 로그 조회하기
/**
 * @swagger
 * /api/mypage/log-list/:id:
 *   get:
 *     summary: "헤더에 토큰, URI parameter 추가해서 날짜로 로그 get 요청."
 *     description: "get 방식으로 요청."
 *     parameters:
 *       - in: body
 *         name: headers
 *         required: true
 *         schema:
 *           properties:
 *             token:
 *               type: string
 *     tags:
 *       - DashBoard
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ID:
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
 *                 response:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: integer
 *                       writer:
 *                         type: string
 *                       status:
 *                         type: string
 *                       date:
 *                         type: string
 *       400:
 *         description: Bad request, request body invalid
 *       500:
 *         description: Internal server error
 *       501:
 *         description: Login first
 */
router.get("/log-list/:id", async (req, res1) => {
  let loginStatus = req.app.TokenUtils.verify(req.headers.token);
  try {
    console.log(req.params.id);
    var result = await req.app.db
      .collection("login")
      .findOne({ ID: loginStatus.id });
    await req.app.db
      .collection("log")
      .find({ writer: result.userName, date: { $regex: "^" + req.params.id } })
      .toArray(function (err, res) {
        console.log(res);
        return res1.status(200).json({ result: true, response: res });
      });
  } catch (error) {
    return res1.status(501).json({ result: false });
  }
});

// log post
router.post("/log-post", function (req, res1) {
  let loginStatus = req.app.TokenUtils.verify(req.headers.token);
  console.log(loginStatus.id);
  req.app.db
    .collection("counter")
    .findOne({ name: "log_count" }, function (err, res) {
      var cnt = res.count;
      var dateString = WhatTimeNow();
      var data;
      //   if (loginStatus.id)
      data = {
        _id: cnt,
        writer: req.headers.token,
        status: req.body.status,
        date: dateString,
      };
      //   else
      // return res1.status(501).json({ result: false, message: "Login first" });

      req.app.db.collection("log").insertOne(data, function () {
        req.app.db
          .collection("counter")
          .updateOne(
            { name: "log_count" },
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

module.exports = router;

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
