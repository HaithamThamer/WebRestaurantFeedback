const express = require("express"),
  router = express.Router();

router.all("*", (req, res, next) => {
  res.app.locals.layout = "home/index";
  next();
});
router.get("/rate/:val", (req, res) => {
  const defaultStyle = req.app.get("defaultStyle");
  const Cookies = require("cookies");
  var cookies = new Cookies(req, res, { keys: ["haitham"] });
  // Get a cookie
  var lastVisit = cookies.get("LastVisit20", { signed: true });
  var myDate = new Date();
  var myDate_string = myDate.toISOString();
  var myDate_string = myDate_string.replace("T", " ");
  var myDate_string = myDate_string.substring(0, myDate_string.length - 5);

  if (!lastVisit) {
    cookies.set("LastVisit20", new Date(), {
      signed: true,
      expires: new Date(new Date().setHours(new Date().getHours() + 3))
    });
    mysqlConnection.getConnection((err, connection) => {
      console.log(req.params.val);
      connection.query(
        `insert into tbl_ratings (\`value\`,\`creation\`) value ('${
          req.params.val
        }','${myDate_string}');`,
        (errors, results, fields) => {
          if (errors) {
            console.log(errors);
            res
              .status(500)
              .json({ err: errors })
              .end();
            return;
          }
        }
      );

      connection.release();
    });
  }
  mysqlConnection.getConnection((err, connection) => {
    connection.query(
      `SELECT avg(if(VALUE = 1,1,0)) AS \`like\`, avg(if(VALUE = 0,1,0)) AS \`unlike\` FROM tbl_ratings ratings WHERE ratings.creation >= DATE_SUB('${myDate_string}', INTERVAL 3 HOUR)`,
      (errors, results, fields) => {
        if (errors) {
          console.log(errors);
          res
            .status(500)
            .json({ err: errors })
            .end();
          return;
        }
        res.render("home/index", {
          item: "index" /* For navbar active */,
          defaultStyle: defaultStyle,
          like: results[0]["like"] * 100,
          unlike: results[0]["unlike"] * 100
        });
      }
    );
    connection.release();
  });
});

router.get("/categories", (req, res) => {
  const defaultStyle = req.app.get("defaultStyle");
  res.render("home/categories", {
    item: "categories",
    defaultStyle: defaultStyle
  });
});

router.get("/book/:id", (req, res) => {
  var id = req.params.id;
  const defaultStyle = req.app.get("defaultStyle");
  const mysqlConnection = req.app.get("mysqlConnection");
  mysqlConnection.query(`CALL getBook(${id});`, (errors, results, fields) => {
    if (errors) {
      res.send("sql error");
    } else if (results[0].length == 0) {
      res.send("no book");
    } else {
      res.render("home/book", {
        item: "book",
        defaultStyle: defaultStyle,
        book: {
          id: results[0][0].id,
          name: results[0][0].name,
          description: results[0][0].description,
          pagesCount: results[0][0].page_count,
          category: results[0][0].categoryName,
          author: results[0][0].author,
          version: results[0][0].version,
          creation: results[0][0].creation,
          container: {
            color: results[0][0].color
          },
          floor: {
            name: results[0][0].floorName
          }
        }
      });
    }
  });
});

router.post("/download", (req, res) => {
  if (req.body.member_name) {
    mysqlConnection.getConnection((err, connection) => {
      const sql = `select 'haitham' as \`result\`,tbl_ylf_memebers.version  from tbl_ylf_memebers where name = ${mysqlConnection.escape(
        req.body.member_name
      )};`;

      connection.query(sql, (errors, results, fields) => {
        console.log(errors);

        if (errors) {
          throw errors;
        } else {
          if (results.length > 0 && results[0].result == "haitham") {
            var fs = require("fs");
            var PDFDocument = require("pdfkit");
            const uniqueName = require("unique-filename");
            var pdf = new PDFDocument({
              size: "A4", // See other page sizes here: https://github.com/devongovett/pdfkit/blob/d95b826475dd325fb29ef007a9c1bf7a527e9808/lib/page.coffee#L69
              layout: "landscape",
              info: {
                Title: "Tile of File Here",
                Author: "Some Author"
              }
            });
            const filePath = uniqueName("./public/tmp/") + ".pdf";
            if (results[0].version == 0) {
              // الانبار
              pdf
                .font("./public/fonts/Cairo-Regular.ttf")
                .fontSize("40")
                .image("./public/uploads/1.png", 0, 0, { scale: 0.24 })
                .text(
                  req.body.member_name
                    .toString()
                    .split(" ")
                    .reverse()
                    .join(" "),

                  req.body.member_name.toString().split(" ").length == 3
                    ? 280
                    : 200,
                  250
                )
                .pipe(fs.createWriteStream(filePath))
                .on("finish", function() {
                  fs.readFile(filePath, function(err, data) {
                    res.contentType("application/pdf");
                    console.log(err);
                    res.send(data);
                  });
                });

              // Close PDF and write file.
              pdf.end();
            } else if (results[0].version == 1) {
              // شكر عاملين الانبار
              pdf
                .font("./public/fonts/Cairo-Regular.ttf")
                .fontSize("40")
                .image("./public/uploads/2.png", 0, 0, { scale: 0.24 })
                .text(
                  req.body.member_name
                    .toString()
                    .split(" ")
                    .reverse()
                    .join(" "),

                  req.body.member_name.toString().split(" ").length == 3
                    ? 280
                    : 200,
                  250
                )
                .pipe(fs.createWriteStream(filePath))
                .on("finish", function() {
                  fs.readFile(filePath, function(err, data) {
                    res.contentType("application/pdf");
                    console.log(err);
                    res.send(data);
                  });
                });

              // Close PDF and write file.
              pdf.end();
            } else {
            }
          } else {
            const defaultStyle = req.app.get("defaultStyle");
            //mysqlConnection.end();
            res.render("home/index", {
              item: "index" /* For navbar active */,
              defaultStyle: defaultStyle,
              certification: false
            });
          }
        }
      });
      //
      connection.release();
    });
  }
});
module.exports = router;
