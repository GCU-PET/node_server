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
MongoClient.connect('mongodb+srv://admin:aYLjvr74yzBVTbyl@cluster0.xli1los.mongodb.net/?retryWrites=true&w=majority', function(err, client){
    if (err) return console.log(err);
    
    db = client.db('PETapp');
    // var 저장할데이터 = { ID : 'test', PW : 'test' };
    // db.collection('login').insertOne(저장할데이터, function(err, res) {
    //     console.log('저장완료');
    // });
    
    app.listen(8080, function() {
        console.log('listening on 8080');
    });
});


/**  */
app.get('/api/login', function(req, res) {
    res.json([{ ID : 'test', PW : 'test' }]);
});

app.post('/api/login', passport.authenticate('local', {failureRedirect : '/api/fail'}), function(req, res){
    res.json([{ result : 'success'}]);
});

app.all('/api/fail', function(req, res) {
    res.status(401).json({ message: '로그인 실패' });
});

passport.use(new LocalStrategy({
    usernameField: 'ID',
    passwordField: 'PW',
    session: true,
    passReqToCallback: false,
}, function (getID, getPW, done) {
    db.collection('login').findOne({ ID: getID }, function (err, res) {
        if (err) return done(err);
        console.log(res);

        if (!res) return done(null, false, { message: 'Wrong ID' });

        if (getPW == res.PW) {
            return done(null, res);
        } else {
            return done(null, false, { message: 'Wrong PW' });
        }
    });
}));

passport.serializeUser(function (user, done) {
    done(null, user.ID);
});

passport.deserializeUser(function (아이디, done) {
    done(null, {});
});
