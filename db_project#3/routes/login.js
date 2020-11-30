var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 5,
    host: 'localhost',
    user: 'root',

    database: 'db_project',
    password: 'David6114@',
    multipleStatements : true
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
    var date=new Date();
    var month=date.getMonth()+1;
    //var month=7;
    if((1<=month && month<=2) || (month>=8)){
        var sem=2;
    }
    else{
        var sem=1;
    }

    pool.getConnection(function(err, connection){

        var sqlsearchclass = "SELECT student.class from student where student.student_id=?;"

        connection.query(sqlsearchclass, [student_id], function (err, classes) {
            if (err) console.error("err : " + err);
            console.log("학년:" + JSON.stringify(classes));
            var classresult=JSON.parse(JSON.stringify(classes));
            var year=classresult[0].class;


            var sqlForSelectRow = "SELECT distinct course.cname,student_info.section_id from student_info inner join course inner join section on course.cnumber= section.cnumber and student_info.section_id=section.section_id where student_info.student_id=? and student_info.s_semester=? and student_info.s_year=?";
            connection.query(sqlForSelectRow,[student_id,sem,year], function(err, rows){

                if(err) console.error("err : " + err);
                console.log(month,sem,year);
                console.log("듣는 수업 : ", rows);
                console.log("수업 갯수 : ", rows.length);
                res.render('main', {sid: student_id,rows: rows});
                connection.release();
            });
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

router.get('/drop/:s_id', function(req,res,next){
    var student_id = req.params.s_id;
    pool.getConnection(function(err, connection){
        var sqlForSelectRow = "SELECT distinct course.cname, course.credit_hours from student_info inner join course inner join section on course.cnumber= section.cnumber and student_info.section_id=section.section_id where student_info.student_id=? and student_info.s_semester=? and student_info.s_year=?";
        var sql1 = mysql.format(sqlForSelectRow, [student_id, '2', '3']);
        var sqlForSelectInfo = "SELECT sname, passwd from student where student_id = ?";
        var sql2 = mysql.format(sqlForSelectInfo, student_id);
        connection.query(sql1, function(err, rows){
            if(err) console.error("err : " + err);
            connection.query(sql2, function(err, name){
                if(err) console.error("err : " + err);
                console.log("이름 : " + JSON.stringify(name));
                res.render('drop', {s_id: student_id, rows: rows, info: name[0]});
                connection.release();
            });
        });
    });
});

router.post('/drop/:s_id', function(req, res, next){
    var course_name = req.body.course_name;
    var s_id = req.body.student_id;
    console.log(req.body);
    var s_id = req.params.url;
    var date=new Date();
    var month=date.getMonth()+1;
    var year = date.getFullYear();
    //var month=7;
    if((1<=month && month<=2) || (month>=8)){
        var sem=2;
    }
    else{
        var sem=1;
    }

    pool.getConnection(function(err, connection){
        var datas = [course_name, sem, year, s_id];
        console.log(datas);
        var sqlForSelectBoard = "select section_id from student_info where student_info.section_id in (select section.section_id from section, course where course.cname = ? and section.semester = ? and section.years = ? and course.cnumber = section.cnumber) and student_info.student_id = ?;"
        connection.query(sqlForSelectBoard,datas, function(err, results) {
            if(err) console.error("err : " + err);
            console.log(results);
            var sqlForDeleteBoard = "delete from student_info where student_info.section_id = ? and student_info.student_id = ?;"
            var sect_id = JSON.parse(JSON.stringify(results));
            sect_id=sect_id[0].section_id;
            var student_data = [sect_id, s_id];
            console.log(student_data);
            connection.query(sqlForDeleteBoard, student_data, function(err, del){
                if(err) console.error("err : " + err);
                res.redirect("/login/drop/" + s_id);
                connection.release();
            })
        });
    });
});

router.get('/register/:s_id',function (req,res,next)
{
    var s_id = req.params.s_id;
    let today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();
    let date = today.getDate();
    var month_date = ''.concat(month,date);
    var this_semester = 2;

    console.log(s_id);

    pool.getConnection(function (err, connection)
    {
        /*테스트용 코드*/
        var sql = "SELECT cname, credit_hours, section_id, instructor, total_number, ltime from course as c,section as s where c.cnumber = s.cnumber and s.semester = ? and s.years = ?";
        connection.query(sql, [this_semester,year], function (err, rows) {
            if (err) console.error(err);
            console.log("듣는 수업 : ", rows);
            console.log("수업 갯수 : ", rows.length);
            var sql = "SELECT passwd from student where student_id = ?";
            connection.query(sql, [s_id], function (err, password) {
                if (err) console.error(err);
                res.render('register', {title: "수강신청", sid: s_id, passwd: password, rows: rows, semester: this_semester, year: year});
                connection.release();
            });
        }); /**/
        /*실제 코드
        // 2학기
        if(month >= 6) {
            this_semester = 2;
            let start_day = '08/11';
            let end_day = '08/15';
            if(month_date < 711 || month_date > 715){
                res.render('term', {sid: s_id, title: "수강신청", year: full_year, start_day:start_day, end_day:end_day});
            }
            else {
                var sql = "SELECT cname, credit_hours, section_id, instructor, total_number, ltime from course as c,section as s where c.cnumber = s.cnumber and s.semester = ? and s.years = ?";
                connection.query(sql, [this_semester,year], function (err, rows) {
                    if (err) console.error(err);
                    console.log("듣는 수업 : ", rows);
                    console.log("수업 갯수 : ", rows.length);
                    var sql = "SELECT passwd from student where student_id = ?";
                    connection.query(sql, [s_id], function (err, password) {
                        if (err) console.error(err);
                        res.render('register', {title: "수강신청", sid: s_id, passwd: password, rows: rows, semester: this_semester, year: year});
                        connection.release();
                    });
                });
            }
        }
        // 1학기
        else {
            this_semester = 1;
            let start_day = '02/11';
            let end_day = '02/15';
            if(month_date < '0110' || month_date > '0114'){
                res.render('term', {sid: s_id, title: "수강신청", year: full_year, start:start_day, end:end_day});
            }
            else {
                var sql = "SELECT cname, credit_hours, section_id, instructor, total_number, ltime from course as c,section as s where c.cnumber = s.cnumber and s.semester = ? and s.years = ?";
                connection.query(sql, [this_semester,year], function (err, rows) {
                    if (err) console.error(err);
                    console.log("듣는 수업 : ", rows);
                    console.log("수업 갯수 : ", rows.length);
                    var sql = "SELECT passwd from student where student_id = ?";
                    connection.query(sql, [s_id], function (err, password) {
                        if (err) console.error(err);
                        res.render('register', {title: "수강신청", sid: s_id, passwd: password, rows: rows, semester: this_semester, year: year});
                        connection.release();
                    });
                });
            }
        }*/
    });
});

module.exports = router;
