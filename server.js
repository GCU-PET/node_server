require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;

// body-parser 미들웨어 설정
app.use(bodyParser.json());

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

var db;
MongoClient.connect(process.env.DB_URL, function(err, client){
    if (err) return console.log(err);
    
    db = client.db('PETapp');
    
    app.listen(process.env.PORT, function() {
        console.log('listening on 8080');
    });
    
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** 로그인 요청을 위한 POST 요청.
 *  로그인 시 전송할 json data 형식
 *  { "ID": "test", "PW": "test" }
  */
app.post('/api/user/login', passport.authenticate('local', {failureRedirect : '/api/user/fail'}), function(req, res){
    res.json({ result : 'success'});
});

/** 로그인 실패했을 시 반환할 메시지 */
app.all('/api/user/fail', function(req, res) {
    res.status(401).json({ message: 'Login Fail' });
});

/** 회원가입 요청을 위한 POST 요청
 *  { "ID": "test2", "PW": "test2" }
 */
app.post('/api/user/signup', function(req, res1) {
    db.collection('login').findOne({ ID : req.body.ID }, function(err, res) {
        if(!(res)) {
            db.collection('login').insertOne( { ID : req.body.ID, PW : req.body.PW }, function(err, res) {
                res1.status(200).send({ message : 'Sign Up Success!' });
            });
        } else {
            res1.status(400).send({ message : 'Duplicated ID'});
        }
    });
});

/** 비밀번호 변경을 위한 PUT 요청 */
app.put('/api/user/pwchange', function(req, res1) {
    db.collection('login').updateOne({ ID : req.body.ID }, { $set : { PW : req.body.PW } }, function(err, res) {
        if(err) res1.status(400).send({ message : 'Password change failed' });
        res1.status(200).send({ message : 'Password change Success!' });
    });
});

/** 로그인 검증을 위한 passport.js 라이브러리 설정 */
passport.use(new LocalStrategy({
    usernameField: 'ID',
    passwordField: 'PW',
    session: true,
    passReqToCallback: false,
}, function (getID, getPW, done) {
    db.collection('login').findOne({ ID: getID }, function (err, res) {
        if (err) return done(err);

        if (!res) return done(null, false, { message: 'Wrong ID' });

        if (getPW == res.PW) {
            return done(null, res);
        } else {
            return done(null, false, { message: 'Wrong PW' });
        }
    });
}));

/** 로그인 성공 시 세션 저장 */
passport.serializeUser(function (user, done) {
    done(null, user.ID);
});

/** 세션에 저장한 아이디를 통해서 사용자 정보 객체를 불러옴 */
passport.deserializeUser(function (getID, done) {
    db.collection('login').findOne({ ID : getID }, function(err, res) {
        done(null, res);
    });
});

/** 로그인 상태를 확인하기 위한 함수. */
function checkUser(req, res, next) { 
    if (req.user) next();
    else res.status(401).json({ message: 'No login information.' });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** 게시물 작성을 위한 POST 요청
 *  { "title": "title1", "content": "content1" }
 *  저장방식 { _id : 게시물번호, writer : user._id, title : title, content : content, date : YYYYMMDD HH:MM:SS:MM }
 */
app.post('/api/board/post', checkUser, function(req, res1) {
    db.collection('counter').findOne({name : 'board_count'}, function(err, res) {
        var cnt = res.count;
        var dateString = WhatTimeNow();

        if(req.user) var data = { _id : cnt, writer : req.user._id, title : req.body.title, content : req.body.content, date : dateString };
        else res1.status(400).json({ result : "Login first" });

        db.collection('board').insertOne(data, function() {
            db.collection('counter').updateOne({name : 'board_count'}, { $inc : {count : 1}}, function(err, res) {
                res1.status(200).json({ result : "Post Success!" });
            });

        });
    });
});

/** 게시물 전부 불러오기 GET 요청 */
app.get('/api/board/list', checkUser, function(req, res1) {
    db.collection('board').find().toArray(function(err, res) {
        res1.status(200).json({ board : res });
    });
});

/** 특정 게시물 번호로 불러오기 GET 요청
 *  /api/board/detail/번호
 */
app.get('/api/board/detail/:id', checkUser, function(req, res1) {
    db.collection('board').findOne({_id : parseInt(req.params.id)}, function(err, res) {
        if (res==null) res1.status(400).json({ message : "Cannot find the board" });
        else res1.status(200).json({ board : res });
    });
});

/** 게시물 번호로 수정하기 PUT 요청
 *  { "_id": 1, "title": "title1", "content": "content1" }
 */
app.put('/api/board/edit', checkUser, function(req, res1) {
    var dateString = WhatTimeNow();
    db.collection('board').updateOne({ _id : parseInt(req.body._id) }, { $set : { title : req.body.title, content : req.body.content, date : dateString }}, function(err, res) {
        res1.status(200).json({ message : "Edit Success" });
    });
});

/** 게시물 번호로 삭제하기 PUT 요청
 *  { "_id": 0 }
 */
app.put('/api/board/delete', function(req, res1) {
    req.body._id = parseInt(req.body._id);
    var data = { _id : req.body._id, writer : req.user._id };
    db.collection('board').deleteOne(data, function(err, res) {
        if (err) res1.status(400).send({ message : 'Delete Failed.'});
        else res1.status(200).send({ message : 'Delete Success!' });
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// 사용자 정보에 접근하는 예제 페이지 (인증이 필요한 페이지)
app.get('/api/mypage/dashboard', checkUser, (req, res) => {
    res.status(200).json({ userID : req.user });
});