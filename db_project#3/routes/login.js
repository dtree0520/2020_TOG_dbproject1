var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 5,
    host: 'localhost',
    user: 'root',

    database: 'db_2',
    password: 'Eogus153@'


});

router.get('/', function(req, res, next){
    res.render('login', {title: 'TOG 정보관리 시스템'});
});
router.post('/', function(req, res, next){
    var student_id = req.body.student_id;
    var passwd = req.body.passwd;
    var datas = [student_id, passwd];
    pool.getConnection(function (err, connection){
        var sqlForInsertBoard = "select * from student where student_id = ? AND passwd = ?"
        connection.query(sqlForInsertBoard,datas, function(err, results) {
            if(err) console.error("err : " + err);
            if(!results[0]) {
                res.send('<script type="text/javascript">alert("학번 또는 비밀번호를 잘 못 입력하셨습니다."); document.location.href="/login";</script>');
            }
            else
                res.redirect('login/main/'+student_id);
            connection.release();
        });
    });
});

router.get('/sign', function(req, res, next){
    res.render('sign', {title : "회원가입"});
});

router.post('/sign',function(req, res, next) {

    var sname = req.body.sname;
    var student_id = req.body.student_id;
    var passwd = req.body.passwd;
    var sclass = req.body.class;
    var major = req.body.major;
    var gender = req.body.gender;
    var datas = [sname, student_id, passwd, sclass, major, gender];

    pool.getConnection(function (err, connection) {
        var sqlForInsertBoard = "select * from student where student_id = ?"
        connection.query(sqlForInsertBoard, student_id, function (err, results) {
            if (err) console.error("err : " + err);
            if (sname == 0 || student_id == 0 || passwd == 0 || sclass == 0 || major == 0 || gender == 0) {
                res.send('<script type="text/javascript">alert("모든 정보를 입력해주세요."); document.location.href="sign";</script>');
            } else if (results[0]) {
                res.send('<script type="text/javascript">alert("이미 회원가입한 학번입니다."); document.location.href="sign";</script>');
            } else {
                pool.getConnection(function (err, connection) {

                    var sqlForInsertBoard = "insert into student(sname, student_id, passwd, class, major, gender) values(?,?,?,?,?,?)"
                    connection.query(sqlForInsertBoard, datas, function (err, rows) {
                        if (err) console.error("err : " + err);
                        console.log("rows : " + JSON.stringify(rows));
                        res.redirect('/login');
                    });
                });
            }
        });
    });
});

router.get('/main/:student_id', function(req,res,next){
    var student_id = req.params.student_id;
    pool.getConnection(function(err, connection){
        var sqlForSelectRow = "SELECT distinct course.cname,student_info.section_id from student_info inner join course inner join section on course.cnumber= section.cnumber and student_info.section_id=section.section_id where student_info.student_id=? and student_info.s_semester=\"2\"and student_info.s_year=\"3\"";
        connection.query(sqlForSelectRow,[student_id], function(err, rows){

            if(err) console.error("err : " + err);
            console.log(typeof(student_id));
            console.log("듣는 수업 : ", rows);
            console.log("수업 갯수 : ", rows.length);
            res.render('main', {url: student_id,rows: rows});
            connection.release();
        });
    });

});

router.get('/notice/:section_id', function (req,res,next){
    var s_id = req.params.section_id;
    console.log(s_id);
    pool.getConnection(function (err, connection){
        var sqlForSelectList =  "SELECT idx, title, files, writer, wdate, hit FROM SECTION_BOARD WHERE section_id = ? ORDER BY wdate";
        connection.query(sqlForSelectList,[s_id], function (err, rows){
            if (err) console.error("err : " + err);
            console.log("rows : "+ JSON.stringify(rows));

            res.render('noticelist', {title: '강의 공지사항', rows: rows});
            connection.release();
        });
    });
});

router.get('/notice',function (req,res,next)
{
    var index = req.query.idx;
    console.log(index);
    pool.getConnection(function (err, connection)
    {
        var sql="select section_id, title, writer, wdate, hit, content from SECTION_BOARD where idx=?";
        connection.query(sql,[index], function (err, row){
            if(err) console.error(err);
            res.render('notice', {title: "공지사항 조회", row:row[0]});
            connection.release();
        });
    });
});
module.exports = router;