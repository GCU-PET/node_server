// /////////////////////////////////////////////////////////////////////////////////////////////////
// // node.js <-> teachable machine model(keras)이용하여 이미지에 대한 결과 가져오기.
// //npm install @tensorflow/tfjs ->tensorflow설치
// //npm i @tensorflow/tfjs-node@3.18.0 -> tensorflow를 node.js에서 사용하기 위해 설치.
// //npm install jpeg-js
// //npm install node-fetch@^2 -> node.js환경에서 Fetch API를 사용할 수 있도록 만들어줌.
// //npm i --save-dev @types/node-fetch
// //npm install canvas
// //npm install ml5

// //ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
// // //teachable.js파일만 돌렸을때, 성공된 코드. 실행명령어: node teachable.js
// // //안쓰는 코드임. 기본이 되는 코드. 혹시 몰라서 따로 남겨놓는 코드임.
// // const TeachableMachine = require("@sashido/teachablemachine-node");

// // const model = new TeachableMachine({
// //   modelUrl: "https://teachablemachine.withgoogle.com/models/IYYVU1LrW/" //dog model
// // });

// // model.classify({
// //   imageUrl: "https://img.freepik.com/premium-photo/puppy-sitting-on-the-grass-american-bully-puppy-dog-pet-funny-and-cute_10541-4290.jpg?w=996",
// // }).then((predictions) => {
// //   console.log("Predictions:", predictions);
// // }).catch((e) => {
// //   console.log("ERROR", e);
// // });



// //ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
// //model 다운로드 후 사용하는 방법 test
// // const tf = require('@tensorflow/tfjs-node');
// // const { createCanvas, Image } = require('canvas');
// // const jimp = require('jimp');

// // async function loadAndPredict() {
// //   // Teachable Machine 모델 로드
// //   const model = await tf.loadLayersModel('file://./my_model/dog_js_model/model.json');

// //   // 예측을 위한 이미지 로드 및 리사이징
// //   const imageBuffer = require('fs').readFileSync('C:\\Users\\dongkwan\\Downloads\\sit_dog.jpg');
// //   const resizedImageBuffer = await resizeImage(imageBuffer, 224, 224);
// //   const tfImage = tf.node.decodeImage(resizedImageBuffer);
// //   const inputTensor = tfImage.expandDims();

// //   // 모델에 이미지 입력 및 예측
// //   const predictions = model.predict(inputTensor);
// //   const predictionData = predictions.dataSync();

// //   // 예측 결과 출력
// //   console.log('Prediction:', predictionData);

// //   // 메모리 정리
// //   tf.dispose([tfImage, inputTensor]);
// // }

// // // 이미지 리사이징 함수
// // async function resizeImage(imageBuffer, width, height) {
// //   const image = await jimp.read(imageBuffer);
// //   await image.resize(width, height);
// //   return image.getBufferAsync(jimp.MIME_JPEG);
// // }

// // // loadAndPredict 함수 실행
// // loadAndPredict().catch((error) => console.error(error));

// const tf = require('@tensorflow/tfjs-node');
// const { createCanvas, Image } = require('canvas');
// const jimp = require('jimp');

// async function loadAndPredict() {
//   // Load Teachable Machine model and metadata
//   const model = await tf.loadLayersModel('file://./my_model/dog_js_model/model.json');
//   const metadata = require('fs').readFileSync('./my_model/dog_js_model/metadata.json', 'utf8');
//   const classes = JSON.parse(metadata).labels;

//   // Load and resize the image for prediction
//   const imageBuffer = require('fs').readFileSync('C:\\Users\\dongkwan\\Downloads\\sit_dog.jpg');
//   const resizedImageBuffer = await resizeImage(imageBuffer, 224, 224);
//   const tfImage = tf.node.decodeImage(resizedImageBuffer);
//   const inputTensor = tfImage.expandDims();

//   // Model prediction
//   const predictions = model.predict(inputTensor);
//   const predictionData = predictions.dataSync();

//   // Display class names with corresponding probabilities
//   const result = classes.map((className, index) => ({
//     class: className,
//     probability: predictionData[index],
//   }));

//   // Print the result
//   console.log('Prediction:', result);

//   // Memory cleanup
//   tf.dispose([tfImage, inputTensor]);
// }

// // Image resizing function
// async function resizeImage(imageBuffer, width, height) {
//   const image = await jimp.read(imageBuffer);
//   await image.resize(width, height);
//   return image.getBufferAsync(jimp.MIME_JPEG);
// }

// // Run the loadAndPredict function
// loadAndPredict().catch((error) => console.error(error));








