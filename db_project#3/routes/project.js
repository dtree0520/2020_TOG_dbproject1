var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 5,
    host: 'localhost',
    user: 'root',
    database: 'db_3',
    password: 'Wkdtlzm97!'
});

router.get('/', function(req, res, next){
    res.render('login', {title: 'TOG 정보관리 시스템'});
});

router.get('/sign', function(req, res, next){
    res.render('sign', {title : "회원가입"});
});
router.post('/sign',function(req, res, next){
    var sname = req.body.sname;
    var student_id = req.body.student_id;
    var passwd = req.body.passwd;
    var sclass = req.body.class;
    var major = req.body.major;
    var gender = req.body.gender;
    var datas = [sname, student_id, passwd, sclass, major, gender];

    pool.getConnection(function (err, connection){

        var sqlForInsertBoard = "insert into student(sname, student_id, passwd, class, major, gender) values(?,?,?,?,?,?)"
        connection.query(sqlForInsertBoard,datas,function(err, rows) {
            if(err) console.error("err : " + err);
            console.log("rows : " + JSON.stringify(rows));
            res.redirect('/login');
            connection.release();
        });
    });
});
module.exports = router;
