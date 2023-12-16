const express = require('express');
const router = express.Router();
require('dotenv').config();

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

router.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
router.use(passport.initialize());
router.use(passport.session()); 

/** 로그인 요청을 위한 POST 요청.
 *  로그인 시 전송할 json data 형식
 *  { "ID": "test", "PW": "test" }
  */
router.post('/login', passport.authenticate('local', { failureRedirect: '/api/user/fail' }), function (req, res) {
    console.log(req.body);
    const accessToken = TokenUtils.makeToken({ id: String(req.body.ID) });
    res.json({ token: accessToken, result: true }); // result: true
});

/** 로그인 실패했을 시 반환할 메시지 */
router.all('/fail', function(req, res) {
    res.status(401).json({ result: false, message: 'Login Fail' });
});

router.post('/isExisted', function (req, res1) {
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
router.post('/signup', function(req, res1) {
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
router.put('/pwchange', function(req, res1) {
    db.collection('login').updateOne({ ID : req.body.ID }, { $set : { PW : req.body.PW } }, function(err, res) {
        if(err) res1.status(400).json({ message : 'Password change failed' });
        res1.status(200).json({ message : 'Password change Success!' });
    });
});

/** 유저정보 변경을 위한 PUT 요청 */
router.post('/update', checkUser, function(req, res1) {
    let loginStatus = TokenUtils.verify(req.headers.token);
    db.collection('login').findOne({ ID : loginStatus.id }, function(err, res) {
        if (err) res1.status(400).json({ result: false, message: 'error' });
        db.collection('login').updateOne({ ID: loginStatus.id }, { $set: { PW: req.body.PW, userName: req.body.userName, petName: req.body.petName, petAge: req.body.petAge } });

        res1.status(200).json({ message : 'Password change Success!' });
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

module.exports = router;
