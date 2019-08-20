const gps2city = require("gps2citybybaidu");
const http = require("http");

http.createServer(function (req, res) {
  gps2city.execute(req, res);
}).listen(8888);
console.log("Server running at http://127.0.0.1:8888 /");