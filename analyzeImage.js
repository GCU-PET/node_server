//YOLO로 이미지 분석하는 코드

const { exec } = require('child_process');

const imageFilePath = 'path_to_your_image.jpg'; // 이미지 파일 경로

// YOLO 실행 명령어
const yoloCommand = `./darknet/darknet detector test ./darknet/cfg/coco.data ./darknet/cfg/yolov3.cfg ./darknet/yolov3.weights ${imageFilePath}`;

exec(yoloCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Error executing YOLO:', error);
    return;
  }

  console.log('YOLO Output:', stdout);
});
