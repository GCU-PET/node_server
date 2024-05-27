//웹캠으로부터 이미지 캡처 및 전송 코드

const cv = require('opencv4nodejs');
const http = require('http');
const fs = require('fs');

const webcamPort = 0; // 웹캠 포트 번호 (일반적으로 0 또는 1)
const serverAddress = 'http://your-server-url/upload'; // 이미지를 전송할 서버 주소

const captureInterval = 1000; // 1초마다 이미지를 캡처

const wCap = new cv.VideoCapture(webcamPort);

setInterval(() => {
  const frame = wCap.read();
  const timestamp = new Date().toISOString();

  // 이미지를 파일로 저장 (이미지 파일명: timestamp.jpg)
  const imageFilename = `${timestamp}.jpg`;
  cv.imwrite(`./captured_images/${imageFilename}`, frame);

  // HTTP 요청을 통해 이미지 전송
  const req = http.request({
    hostname: 'your-server-url', // your-server-url은 실제 서버의 URL로 바꿔야함.
    port: 80,
    path: '/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename=${imageFilename}`
    }
  });

  const imageStream = fs.createReadStream(`./captured_images/${imageFilename}`);
  imageStream.pipe(req, { end: false });
  imageStream.on('end', () => {
    req.end();
    console.log('Image sent:', imageFilename);
  });
}, captureInterval);
