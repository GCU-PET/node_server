/////////////////////////////////////////////////////////////////////////////////////////////////
// node.js <-> teachable machine model(keras)이용하여 이미지에 대한 결과 가져오기.
//npm install @tensorflow/tfjs ->tensorflow설치
//npm i @tensorflow/tfjs-node@3.18.0 -> tensorflow를 node.js에서 사용하기 위해 설치.
//npm install jpeg-js
//npm install node-fetch@^2 -> node.js환경에서 Fetch API를 사용할 수 있도록 만들어줌.
//npm i --save-dev @types/node-fetch

//ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
// //teachable.js파일만 돌렸을때, 성공된 코드. 실행명령어: node teachable.js
// //안쓰는 코드임. 기본이 되는 코드. 혹시 몰라서 따로 남겨놓는 코드임.
const TeachableMachine = require("@sashido/teachablemachine-node");

const model = new TeachableMachine({
  modelUrl: "https://teachablemachine.withgoogle.com/models/IYYVU1LrW/" //dog model
});

model.classify({
  imageUrl: "https://img.freepik.com/premium-photo/puppy-sitting-on-the-grass-american-bully-puppy-dog-pet-funny-and-cute_10541-4290.jpg?w=996",
}).then((predictions) => {
  console.log("Predictions:", predictions);
}).catch((e) => {
  console.log("ERROR", e);
});

