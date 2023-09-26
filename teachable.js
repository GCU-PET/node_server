/////////////////////////////////////////////////////////////////////////////////////////////////
// node.js <-> teachable machine model(keras)이용하여 이미지에 대한 결과 가져오기.
//npm install @tensorflow/tfjs ->tensorflow설치
//npm install jpeg-js
//npm install node-fetch@^2 -> node.js환경에서 Fetch API를 사용할 수 있도록 만들어줌.
//npm i --save-dev @types/node-fetch


// const tf = require('@tensorflow/tfjs'); //tensorflow.js 모델을 가져옴.
// const model = await tf.loadLayersModel('C:\\Users\\dongkwan\\Desktop\\final\\dog_model_keras2\\keras_model.h5'); //teachable machine에서 학습한 keras 모델을 tensorflow.js로 로드함.

// const fs = require('fs');
// const jpeg = require('jpeg-js');
// const fetch = require('node-fetch');

// //만약 이미지를 YOLO에서 넘겨받았을때, 이미지 전처리 진행.
// function loadAndPreprocessImage(imagePath) {
//   const buf = fs.readFileSync(imagePath);
//   const pixels = jpeg.decode(buf, true);
//   const input = tf.node.encodeJpeg(pixels);

//   // Normalize the pixel values to be between 0 and 1
//   const normalized = tf.div(tf.cast(input, 'float32'), tf.scalar(255));
//   const expanded = normalized.expandDims(0); // Add a batch dimension

//   return expanded;
// }

// const image = loadAndPreprocessImage('C:\\Users\\dongkwan\\Desktop\\final\\test\\Training\\DOG\\[원천]SIT\\SIT\\dog-sit-088121\\frame_105_timestamp_4200.jpg'); //이미지 전처리 함수 호출. image.jpg자리에는 YOLO에서 받은 이미지가 들어가야함.

// //전처리한 이미지를 모델에 입력하고 예측을 진행함.
// const predictions = model.predict(image);
// const result = predictions.arraySync();
// console.log('Predictions:', result);

const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const jpeg = require('jpeg-js');
const fetch = require('node-fetch');

// 비동기 함수를 이용하여 모델을 로드하는 함수 정의
async function loadModel() {
  const model = await tf.loadLayersModel('file://C:/Users/dongkwan/Desktop/final/dog_model_keras2/keras_model.h5');
  return model;
}

// 이미지 전처리 함수 정의
function loadAndPreprocessImage(imagePath) {
  const buf = fs.readFileSync(imagePath);
  const pixels = jpeg.decode(buf, true);
  const input = tf.node.encodeJpeg(pixels);

  // Normalize the pixel values to be between 0 and 1
  const normalized = tf.div(tf.cast(input, 'float32'), tf.scalar(255));
  const expanded = normalized.expandDims(0); // Add a batch dimension

  return expanded;
}

// 모델 로드와 이미지 전처리를 비동기적으로 처리
async function predict() {
  try {
    // 모델 로드
    const model = await loadModel();

    // 이미지 전처리
    const image = loadAndPreprocessImage('C:\\Users\\dongkwan\\Desktop\\final\\test\\Training\\DOG\\[원천]SIT\\SIT\\dog-sit-088121\\frame_105_timestamp_4200.jpg');

    // 전처리한 이미지를 모델에 입력하고 예측을 진행
    const predictions = model.predict(image);
    const result = predictions.arraySync();
    console.log('Predictions:', result);
  } catch (error) {
    console.error('Error predicting:', error);
  }
}

// predict 함수 호출
predict();
