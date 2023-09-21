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

/** 로그인 요청을 위한 POST 요청.
 *  로그인 시 전송할 json data 형식
 *  { "ID": "test", "PW": "test" }
  */
app.post('/api/login', passport.authenticate('local', {failureRedirect : '/api/fail'}), function(req, res){
    res.json([{ result : 'success'}]);
});

/** 로그인 실패했을 시 반환할 메시지 */
app.all('/api/fail', function(req, res) {
    res.status(401).json({ message: '로그인 실패' });
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

// 사용자 정보에 접근하는 예제 페이지 (인증이 필요한 페이지)
app.get('/dashboard', checkUser, (req, res) => {
    res.status(200).json({ user: req.user.ID });
});

/** 로그인 상태를 확인하기 위한 함수. */
function checkUser(req, res, next) { 
    if (req.user) next();
    else res.status(401).json({ message: '로그인 정보 없음.' });
}
