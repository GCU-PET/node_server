const express = require('express');
const router = express.Router();
require('dotenv').config();


/** 게시물 작성을 위한 POST 요청
 *  { "title": "title1", "content": "content1" }
 *  저장방식 { _id : 게시물번호, writer : user._id, title : title, content : content, date : YYYYMMDD HH:MM:SS:MM }
 */
router.post('/post', function (req, res1) {
    let loginStatus = TokenUtils.verify(req.headers.token);
    db.collection('counter').findOne({name : 'board_count'}, function(err, res) {
        var cnt = res.count;
        var dateString = WhatTimeNow();
        var data;
        if(loginStatus.id) data = { _id : cnt, writer : loginStatus.id, title : req.body.title, content : req.body.content, date : dateString };
        else res1.status(400).json({ result: false, message: "Login first" });

        db.collection('board').insertOne(data, function() {
            db.collection('counter').updateOne({name : 'board_count'}, { $inc : {count : 1}}, function(err, res) {
                res1.status(200).json({ result: true, message: "Post Success!" });
            });

        });
    });
});

// router.post('/test', function (req, res1) {
//     console.log(req.body);
//     return res1.status(200).json({ result : 'success', board : req.body });
// });

/** 게시물 전부 불러오기 GET 요청 */
router.get('/list', function(req, res1) {
    db.collection('board').find().toArray(function (err, res) {
        console.log(res);
        res1.status(200).json({ result : 'success', board : res });
    });
});

/** 특정 게시물 번호로 불러오기 GET 요청
 *  /detail/번호
 */
router.get('/detail/:id', function(req, res1) {
    db.collection('board').findOne({_id : parseInt(req.params.id)}, function(err, res) {
        if (res==null) res1.status(400).json({ message : "Cannot find the board" });
        else res1.status(200).json({ board : res });
    });
});

/** 게시물 번호로 수정하기 PUT 요청
 *  { "_id": 1, "title": "title1", "content": "content1" }
 */
router.put('/edit', function(req, res1) {
    var dateString = WhatTimeNow();
    db.collection('board').updateOne({ _id : parseInt(req.body._id) }, { $set : { title : req.body.title, content : req.body.content, date : dateString }}, function(err, res) {
        res1.status(200).json({ message : "Edit Success" });
    });
});

/** 게시물 번호로 삭제하기 PUT 요청
 *  { "_id": 0 }
 */
router.put('/delete', function(req, res1) {
    req.body._id = parseInt(req.body._id);
    var data = { _id : req.body._id, writer : req.user._id };
    db.collection('board').deleteOne(data, function(err, res) {
        if (err) res1.status(400).json({ message : 'Delete Failed.'});
        else res1.status(200).json({ message : 'Delete Success!' });
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
    if(month < 10) dateString += "0";
    dateString += String(month);
    if(dateNum < 10) dateString += "0";
    dateString += String(dateNum) + " ";
    if(hour < 10) dateString += "0";
    dateString += String(hour) + ":";
    if(min < 10) dateString += "0";
    dateString += String(min) + ":";
    if(sec < 10) dateString += "0";
    dateString += String(sec) + ":";
    if(milsec < 10) dateString += "00";
    else if(milsec < 100) dateString += "0";
    dateString += String(milsec);

    return dateString;
}


module.exports = router;
