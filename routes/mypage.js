const express = require("express");
const router = express.Router();
require("dotenv").config();

// 사용자 정보에 접근하는 예제 페이지 (인증이 필요한 페이지)
router.get("/dashboard", (req, res) => {
  res.status(200).json({ userID: req.user });
});

// log list
router.get("/log-list", async (req, res1) => {
  let loginStatus = req.app.TokenUtils.verify(req.headers.token);
  try {
    var result = await req.app.db
      .collection("login")
      .findOne({ ID: req.body.ID, PW: req.body.PW });
    await req.app.db
      .collection("log")
      .find({ writer: result.userName })
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
