const ADODB = require("node-adodb");
const conn = ADODB.open("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=database.mdb;");
const URL = require("url");
const execute = function (req, res) {
  const pathname = URL.parse(req.url).pathname;
  const path = URL.parse(req.url).path;
  const search = URL.parse(req.url).search;
  console.log("pathname=" + pathname + "\npath=" + path + "\nsearch=" + search);

  if (pathname === "/reverse_geocoding/v3/") {
    if (search && search.length > 0) {
      const params = search.substr(1).split("&");
      let Latitude, Longitude;
      for (let i = 0; i < params.length; i++) {
        if (params[i].startsWith("location=")) {
          let location = params[i].substr("location=".length);
          location = decodeURIComponent(location).split(",");
          if (location.length = 2) {
            Latitude = location[0];
            Longitude = location[1];
          }
          break;
        }
      }

      if (Latitude > 0 && Longitude > 0) {
        Latitude = formatLocation(Latitude);
        Longitude = formatLocation(Longitude);
        // res.writeHead(200, {"Content-Type": "application/json;charset=utf-8"});
        let country = "", province = "", city = "", district = "", street = "";
        conn.query("select * from gps2city where Latitude=\"" + Latitude + "\" and Longitude=\"" + Longitude + "\";").then(function (data) {
          if (data.length == 0) {
            const url = "http://api.map.baidu.com" + path;
            http.get(url, function (ret) {
              if (ret.statusCode == 200) {
                ret.setEncoding('utf8');
                ret.on("data", (chunk) => {
                  console.log("chunk=" + chunk);
                  chunk = JSON.parse(chunk);
                  if (chunk.result) {
                    if (chunk.result.addressComponent) {
                      if (chunk.result.addressComponent.country) {
                        country = chunk.result.addressComponent.country;
                      }
                      if (chunk.result.addressComponent.province) {
                        province = chunk.result.addressComponent.province;
                      }
                      if (chunk.result.addressComponent.city) {
                        city = chunk.result.addressComponent.city;
                      }
                      if (chunk.result.addressComponent.district) {
                        district = chunk.result.addressComponent.district;
                      }
                      if (chunk.result.addressComponent.street) {
                        street = chunk.result.addressComponent.street;
                      }
                    }
                  }
                });
                ret.on("end", () => {
                  console.log("end");
                  conn.execute("insert into gps2city (Latitude,Longitude,country,province,city,district,street) values (" +
                    "\"" + Latitude + "\"," +
                    "\"" + Longitude + "\"," +
                    "\"" + country + "\"," +
                    "\"" + province + "\"," +
                    "\"" + city + "\"," +
                    "\"" + district + "\"," +
                    "\"" + street + "\");").catch((err) => {
                  });

                  res.writeHead(200, {"Content-Type": "application/json;charset=utf-8"});
                  res.end(JSON.stringify([{
                    "Latitude": Latitude,
                    "Longitude": Longitude,
                    "country": country,
                    "province": province,
                    "city": city,
                    "district": district,
                    "street": street
                  }], null, 2));
                });
              } else {
                ret.resume();
                res.writeHead(ret.statusCode, ret.headers);
                res.end(ret.statusCode)
                return;
              }
            }).on('error', (e) => {
              console.error(`出现错误: ${e.message}`);
            });
          } else {
            res.writeHead(200, {"Content-Type": "application/json;charset=utf-8"});
            res.end(JSON.stringify(data, null, 2));
          }
        }).catch(function (error) {
          res.writeHead(200, {"Content-Type": "application/json;charset=utf-8"});
          console.error(error);
          res.end(error);
        })
      }
    }
  }
}


const formatLocation = function (location) {
  console.log("formatLocation enter(" + location + ")");
  const tmp1 = location.substr(0, location.indexOf("."));
  let tmp2 = "0" + location.substr(location.indexOf("."));
  // console.log("tmp1=" + tmp1 + ";tmp2=" + tmp2);
  tmp2 = tmp2 * 60 + "";
  // console.log("tmp2=" + tmp2);
  if (tmp2.indexOf(".") > 0) {
    tmp2 = tmp2.substr(0, tmp2.indexOf("."));
  }
  // console.log("tmp2=" + tmp2);
  tmp2 = tmp2 / 60;
  // console.log("tmp2=" + tmp2);
  location = tmp1 * 1 + tmp2;
  console.log("formatLocation leave(" + location + ")");
  return location;
};

module.exports = {
  execute: (req, res) => execute(req, res)
};
