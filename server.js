require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
const TokenUtils = require('./utils/tokenUtils');

// body-parser 미들웨어 설정
app.use(bodyParser.json());
app.use(cors({
    origin: [
        "*"
    ], // 모든 출처 허용 옵션. true 를 써도 된다.
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

//DB연결 설정
var db;
MongoClient.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
    if (err) return console.log(err);
    
    db = client.db('PETapp');
    
    app.listen(process.env.PORT, function () {
        console.log('listening on 8080');
    });
    
});


app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>');
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** 로그인 요청을 위한 POST 요청.
 *  로그인 시 전송할 json data 형식
 *  { "ID": "test", "PW": "test" }
  */
app.post('/api/user/login', passport.authenticate('local', { failureRedirect: '/api/user/fail' }), function (req, res) {
    console.log(req.body);
    const accessToken = TokenUtils.makeToken({ id: String(req.body.ID) });
    res.json({ token: accessToken, result: true }); // result: true
});

/** 로그인 실패했을 시 반환할 메시지 */
app.all('/api/user/fail', function(req, res) {
    res.status(401).json({ result: false, message: 'Login Fail' });
});

app.post('/api/user/isExisted', function (req, res1) {
    db.collection('login').findOne({ ID: req.body.ID }, (err, res) => {
        console.log(req.body);
        console.log(res);
        if (res) return res1.status(200).json({ result: false, message: "Existed ID" });
        return res1.status(200).json({ result: true, message: "availabe" });
    });
});

/** 회원가입 요청을 위한 POST 요청
 *  { "ID": "test2", "PW": "test2" }
 */
app.post('/api/user/signup', function(req, res1) {
    db.collection('login').findOne({ ID : req.body.ID }, function(err, res) {
        if(!(res)) {
            db.collection('login').insertOne( { ID : req.body.ID, PW : req.body.PW }, function(err, res) {
                const accessToken = TokenUtils.makeToken({ id: String(req.body.ID) });
                res1.status(200).json({ token: accessToken, result: true, message: 'Sign Up Success!' });
            });
        } else {
            res1.status(500).json({ result: false, message: 'Duplicated ID' });
        }
    });
});

/** 비밀번호 변경을 위한 PUT 요청 */
app.put('/api/user/pwchange', function(req, res1) {
    db.collection('login').updateOne({ ID : req.body.ID }, { $set : { PW : req.body.PW } }, function(err, res) {
        if(err) res1.status(400).json({ message : 'Password change failed' });
        res1.status(200).json({ message : 'Password change Success!' });
    });
});

/** 유저정보 변경을 위한 PUT 요청 */
app.post('/api/user/update', checkUser, function(req, res1) {
    let loginStatus = TokenUtils.verify(req.headers.token);
    db.collection('login').findOne({ ID : loginStatus.id }, function(err, res) {
        if (err) res1.status(400).json({ result: false, message: 'error' });
        db.collection('login').updateOne({ ID: loginStatus.id }, { $set: { PW: req.body.PW, userName: req.body.userName, petName: req.body.petName, petAge: req.body.petAge } });

        res1.status(200).json({ message : 'Password change Success!' });
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
    let loginStatus = TokenUtils.verify(req.headers.token);
    if(loginStatus.ok) {
        next();
    } else {
        res.status(500).json({ ok: false, message: loginStatus.message });
    }
    // if (req.user) next();
    // else res.status(401).json({ message: 'No login information.' });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** 게시물 작성을 위한 POST 요청
 *  { "title": "title1", "content": "content1" }
 *  저장방식 { _id : 게시물번호, writer : user._id, title : title, content : content, date : YYYYMMDD HH:MM:SS:MM }
 */
app.post('/api/board/post', checkUser, function (req, res1) {
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

// app.post('/api/board/test', checkUser, function (req, res1) {
//     console.log(req.body);
//     return res1.status(200).json({ result : 'success', board : req.body });
// });

/** 게시물 전부 불러오기 GET 요청 */
app.get('/api/board/list', checkUser, function(req, res1) {
    db.collection('board').find().toArray(function (err, res) {
        console.log(res);
        res1.status(200).json({ result : 'success', board : res });
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// 사용자 정보에 접근하는 예제 페이지 (인증이 필요한 페이지)
app.get('/api/mypage/dashboard', checkUser, (req, res) => {
    res.status(200).json({ userID : req.user });
});




//ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡteachable testㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
// const TeachableMachine = require("@sashido/teachablemachine-node");

// //teachable.js에 있는 teachable 기능 함수화 했음.
// async function classifyImage(imageUrl) {
//   try {
//     const model = new TeachableMachine({
//       modelUrl: "https://teachablemachine.withgoogle.com/models/IYYVU1LrW/" //dog model
//     });

//     const predictions = await model.classify({ imageUrl });
//     return predictions;
//   } catch (error) {
//     console.error("ERROR", error);
//     throw error;
//   }
// }

// // 함수화 된 teachable 에다가 이미지 링크 넣어서 분류 하는 기능. imageUrl은 추후 이미지 관리 방식에 따라 방식 바꿔야 될수도?
// const imageUrl = "https://img.freepik.com/premium-photo/puppy-sitting-on-the-grass-american-bully-puppy-dog-pet-funny-and-cute_10541-4290.jpg?w=996";
// classifyImage(imageUrl)
//   .then((predictions) => {
//     console.log("Predictions:", predictions);
//   })
//   .catch((error) => {
//     console.log("Something went wrong:", error);
//   });

