const swaggerUi = require("swagger-ui-express");
const swaggereJsdoc = require("swagger-jsdoc");

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "GCU-PET Node API Server",
      description:
        "Node.js Swaager swagger-jsdoc 방식 RestFul API 클라이언트 UI",
    },
    securityDefinitions: {
      // 헤더의 Authorization안에 값을 넣어줄수 있는 기능
      Authorization: {
        type: "apiKey",
        name: "authorization",
        scheme: "bearer",
        in: "header",
      },
    },
    servers: [
      {
        url: "https://www.feople-eeho.com/api", // 요청 URL
      },
    ],
  },
  apis: ["./routes/*.js", "./routers/user/*.js"], //Swagger 파일 연동
};
const specs = swaggereJsdoc(options);

module.exports = { swaggerUi, specs };
