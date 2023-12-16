const express = require('express');
const router = express.Router();
require('dotenv').config();


// 사용자 정보에 접근하는 예제 페이지 (인증이 필요한 페이지)
router.get('/dashboard', (req, res) => {
    res.status(200).json({ userID : req.user });
});

module.exports = router;


