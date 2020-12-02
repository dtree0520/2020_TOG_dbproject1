var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 5,
    host: 'localhost',
    user: 'root',

    database: 'db_project',
    password: 'keonyoung520',
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
                        res.redirect('/login');
                    });
                });
            }
        });
    });
});

router.get('/main/:student_id', function(req,res,next) {
    var student_id = req.params.student_id;
    var date = new Date();
    var month = date.getMonth() + 1;
    //var month=7;
    /* 실제코드입니다.
    if ((1 <= month && month <= 2) || (month >= 8)) {
        var sem = 2;
    } else {
        var sem = 1;
    }
    */
     var sem=1;

    pool.getConnection(function (err, connection) {

        var sqlsearchclass = "SELECT student.class from student where student.student_id=?;"

        connection.query(sqlsearchclass, [student_id], function (err, classes) {
            if (err) console.error("err : " + err);
            var classresult = JSON.parse(JSON.stringify(classes));
            var year = classresult[0].class;


            var sqlForSelectRow = "SELECT distinct course.cname,student_info.section_id from student_info inner join course inner join section on course.cnumber= section.cnumber and student_info.section_id=section.section_id where student_info.student_id=? and student_info.s_semester=? and student_info.s_year=?";
            connection.query(sqlForSelectRow, [student_id, sem, year], function (err, rows) {

                if (err) console.error("err : " + err);
                pool.getConnection(function (err, connection) {
                    var sqlForSelectList = "select c.cname, s.ltime from course as c, section as s where c.cnumber = s.cnumber and s.section_id IN(select si.section_id from student_info as si where si.s_semester = ? and si.s_year = ? and si.student_id = ?);";
                    connection.query(sqlForSelectList, [sem, year, student_id], function (err, results) {
                        if (err) console.error("err : " + err);
                        res.render('main', {sid: student_id, rows: rows, results: results, year: year, sem: sem});
                        connection.release();
                    });
                });
            });
        });
    });
});
router.get('/mypage/:sid',function (req,res,next)
{
    var sid = req.params.sid;

    pool.getConnection(function (err, connection)
    {
        var sqlsearchstudent="SELECT sname,student_id,class,major,gender from student where student_id=?;"
        var sqlsearchcourse="SELECT student_info.s_semester,student_info.s_year, course.cname, course.department, course.credit_hours,student_info.grade From section,student_info,course where course.cnumber in (SELECT cnumber From section,student_info where student_info.student_id=? and section.section_id=student_info.section_id) and section.cnumber=course.cnumber and student_info.student_id=? and section.section_id=student_info.section_id;"
        connection.query(sqlsearchcourse,[sid,sid], function (err, courses){
            if (err) console.error(err);

            connection.query(sqlsearchstudent,[sid], function (err, rows) {
                if (err) console.error(err);
                res.render('mypage', {sid: sid, rows: rows[0],courses: courses});
                connection.release();
            });
        });
    });
});





router.get('/:sid/noticelist/:section_id', function (req,res,next){
    var sid = req.params.sid;
    var sect_id = req.params.section_id;
    pool.getConnection(function (err, connection){
        var sqlForSelectList =  "SELECT idx, title, files, writer, wdate, hit FROM SECTION_BOARD WHERE section_id = ? ORDER BY wdate";
        connection.query(sqlForSelectList,[sect_id], function (err, rows){
            if (err) console.error("err : " + err);

            res.render('noticelist', {title: '강의 공지사항', rows: rows, sid: sid});
            connection.release();
        });
    });
});

router.get('/:sid/notice/:idx',function (req,res,next)
{
    var sid = req.params.sid;
    var index = req.params.idx;
    pool.getConnection(function (err, connection)
    {
        var sql="select section_id, title, writer, wdate, hit, content from SECTION_BOARD where idx=?";
        connection.query(sql, [index], function (err, row){
            if(err) console.error(err);
            pool.getConnection(function (err, connection)
            {
                var sql1 = "update section_board set hit = hit + 1 where idx = ?;";
                connection.query(sql1, index, function (err, rows){
                    if(err) console.error(err);
                    res.render('notice', {title: "공지사항 조회", row:row[0], sid:sid});
                    connection.release();
                });
            });
        });
    });
});

router.get('/drop/:sid', function(req,res,next){
    var student_id = req.params.sid;
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var date = "0" + today.getDate();
    var month_date = ''.concat(month,date);
    var this_semester = 2;
    pool.getConnection(function(err, connection){
        // 2학기
        if((1<=month && month<=2) || (month>=8)) {
            this_semester = 2;
            var start_day = '12/01';
            var end_day = '12/10';
            if(month_date < '1201' || month_date > '1210'){
                res.render('term', {sid: student_id, title: "수강 포기", year: year, start_day:start_day, end_day:end_day});
            }
            else {
                var sqlsearchclass = "SELECT student.class from student where student.student_id=?;"
                connection.query(sqlsearchclass, [student_id], function (err, classes) {
                    if (err) console.error("err : " + err);
                    var classresult=JSON.parse(JSON.stringify(classes));
                    var c_year=classresult[0].class;
                    var sqlForSelectRow = "SELECT distinct course.cname, course.credit_hours from student_info inner join course inner join section on course.cnumber= section.cnumber and student_info.section_id=section.section_id where student_info.student_id=? and student_info.s_semester=? and student_info.s_year=?";
                    var sqlForSelectInfo = "SELECT sname, passwd from student where student_id = ?";
                    connection.query(sqlForSelectRow, [student_id, this_semester, c_year], function(err, rows){
                        if(err) console.error("err : " + err);
                        connection.query(sqlForSelectInfo, student_id, function(err, name){
                            if(err) console.error("err : " + err);
                            res.render('drop', {sid: student_id, rows: rows, info: name[0]});
                            connection.release();
                        });
                    });
                });
            }
        }
        // 1학기
        else {
            this_semester = 1;
            var start_day = '03/06';
            var end_day = '03/09';
            if(month_date < '0306' || month_date > '0309'){
                res.render('term', {sid: student_id, title: "수강 포기", year: year, start_day:start_day, end_day:end_day});
            }
            else {
                var sqlsearchclass = "SELECT student.class from student where student.student_id=?;"
                connection.query(sqlsearchclass, [student_id], function (err, classes) {
                    if (err) console.error("err : " + err);
                    var classresult=JSON.parse(JSON.stringify(classes));
                    var c_year=classresult[0].class;
                    var sqlForSelectRow = "SELECT distinct course.cname, course.credit_hours from student_info inner join course inner join section on course.cnumber= section.cnumber and student_info.section_id=section.section_id where student_info.student_id=? and student_info.s_semester=? and student_info.s_year=?";
                    var sqlForSelectInfo = "SELECT sname, passwd from student where student_id = ?";
                    connection.query(sqlForSelectRow, [student_id, this_semester, c_year], function(err, rows){
                        if(err) console.error("err : " + err);
                        connection.query(sqlForSelectInfo, student_id, function(err, name){
                            if(err) console.error("err : " + err);
                            res.render('drop', {s_id: student_id, rows: rows, info: name[0]});
                            connection.release();
                        });
                    });
                });
            }
        }
    });
});

router.post('/drop/:sid', function(req, res, next){
    var course_name = req.body.course_name;
    var s_id = req.body.student_id;
    var date=new Date();
    var month=date.getMonth()+1;
    var year = date.getFullYear();
    if((1<=month && month<=2) || (month>=8)){
        var sem=2;
    }
    else{
        var sem=1;
    }

    pool.getConnection(function(err, connection){
        var datas = [course_name, sem, year, s_id];
        var sqlForSelectBoard = "select section_id from student_info where student_info.section_id in (select section.section_id from section, course where course.cname = ? and section.semester = ? and section.years = ? and course.cnumber = section.cnumber) and student_info.student_id = ?;"
        connection.query(sqlForSelectBoard,datas, function(err, results) {
            if(err) console.error("err : " + err);
            var sqlForDeleteBoard = "delete from student_info where student_info.section_id = ? and student_info.student_id = ?;"
            var sect_id = JSON.parse(JSON.stringify(results));
            sect_id=sect_id[0].section_id;
            var student_data = [sect_id, s_id];
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
    let full_year = today.getFullYear();
    let month = today.getMonth();
    let date = today.getDate();
    var month_date = ''.concat(month,date);
    var this_semester = 1;
    var year = full_year;

    pool.getConnection(function (err, connection)
    {
        /*테스트용 코드*/
        var sql = "SELECT cname, credit_hours, section_id, instructor, total_number, ltime from course as c,section as s where c.cnumber = s.cnumber and s.semester = ? and s.years = ?";
        connection.query(sql, [this_semester,year], function (err, rows) {
            if (err) console.error(err);
            var sql = "SELECT passwd from student where student_id = ?";
            connection.query(sql, [s_id], function (err, password) {
                if (err) console.error(err);
                res.render('register', {title: "수강신청", sid: s_id, password: password[0].passwd, rows: rows, semester: this_semester, year: year});
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

                    var sql = "SELECT passwd from student where student_id = ?";
                    connection.query(sql, [s_id], function (err, password) {
                        if (err) console.error(err);
                        res.render('register', {title: "수강신청", sid: s_id, password: password[0].passwd, rows: rows, semester: this_semester, year: year});
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

                    var sql = "SELECT passwd from student where student_id = ?";
                    connection.query(sql, [s_id], function (err, password) {
                        if (err) console.error(err);
                        res.render('register', {title: "수강신청", sid: s_id, password: password[0].passwd, rows: rows, semester: this_semester, year: year});
                        connection.release();
                    });
                });
            }
        }*/
    });
});
router.post('/register/:student_id', function(req, res, next){
    var student_id = req.body.student_id;
    var cnames = req.body.cnames;
    var insts = req.body.instructors;
    var ltimes = req.body.lecture_times;
    var this_year = req.body.year;
    var year = 0;
    var sem = req.body.sem;
    var grade = null;
    pool.getConnection(function (err, connection) {
        var sqlForInsertBoard = "select MAX(s_year) as s_year from student_info where student_id = ?";
        connection.query(sqlForInsertBoard, [student_id], function (err, results) {
            if (err) console.error("err : " + err);
            if(results[0].s_year == null)
                results[0].s_year = 0;
            var sql = "SELECT Max(grade) as grade from student_info where student_id = ? and s_year = ?";
            connection.query(sql, [student_id, results[0].s_year], function (err, grade_result) {
                if (err) console.error(err);
                if(grade_result[0].grade != null || results[0].s_year == 0){
                    if(sem == 1)
                        year = Number(results[0].s_year) + 1;
                    else
                        year = Number(results[0].s_year);



                    cnames = cnames.substring(1, cnames.length - 1);
                    insts = insts.substring(1, insts.length - 1);
                    ltimes = ltimes.substring(1, ltimes.length - 1);

                    var sqlForInsertBoard = "select section_id,years,semester from section as s where instructor = ? and ltime = ? and years = ? and s.cnumber IN(select c.cnumber from course as c where cname = ?)";
                    for( var i = 0 ;  ; i ++) {
                        var idx1 = cnames.indexOf(',');
                        var idx2 = insts.indexOf(',');
                        var idx3 = ltimes.indexOf(',');

                        var old_cname;
                        var old_inst;
                        var old_ltime1;
                        var old_ltime2;
                        var old_ltime;

                        if(idx1 == -1){
                            old_cname = cnames.substring(1,cnames.length-1);
                            old_inst = insts.substring(1,insts.length-1);
                            old_ltime = ltimes.substring(1,ltimes.length-1);
                        }
                        else {
                            old_cname = cnames.substring(1, idx1-1);
                            old_inst = insts.substring(1, idx2-1);
                            old_ltime1 = ltimes.substring(1, idx3);

                            cnames = cnames.substring(idx1+1, cnames.length);
                            insts = insts.substring(idx2+1, insts.length);
                            ltimes = ltimes.substring(idx3+1, ltimes.length);

                            var idx4 = ltimes.indexOf(',');
                            old_ltime2 = ltimes.substring(0, idx4-1);
                            ltimes = ltimes.substring(idx4+1, ltimes.length);

                            old_ltime = old_ltime1 + "," + old_ltime2;
                        }
                        var datas = [old_inst, old_ltime, this_year, old_cname];

                        connection.query(sqlForInsertBoard, datas, function (err, result_section_id) {
                            if (err) console.error("err : " + err);

                            var insert_datas = [student_id, result_section_id[0].section_id, grade, sem, year];

                            var sql = "INSERT INTO STUDENT_INFO VALUES(?, ?, ?, ?, ?)";
                            connection.query(sql, insert_datas, function (err, rows) {
                                if (err) console.error(err);

                            });
                        });
                        if(idx1 == -1)
                            break;
                    }
                    res.redirect('/login/main/'+student_id);
                }
                else{

                    res.send({data: "no insert"});
                }
                connection.release();
            });
        });
    });
});

router.get('/search/:s_id', function(req, res, next){
    var s_id = req.params.s_id;
    var check = true;
    res.render('search', {title : "시간표 조회", check: check, s_id : s_id});
});

router.post('/search/:s_id', function(req, res, next){
    var search_id = req.body.student_id;
    var s_id = req.body.s_id;
    var s_year = req.body.s_year;
    var s_semester = req.body.s_semester;
    var check = true;
    pool.getConnection(function (err, connection) {
        var sqlForSelectRow = "select * from student where student_id = ?"
        var sql1 = mysql.format(sqlForSelectRow, [search_id]);
        connection.query(sql1, function (err, rows) {
            if (err) console.error("err : " + err);
            if(rows[0] == undefined){
                res.render('search',{check: false, s_id: s_id});
            }
            else{
                res.redirect("/login/schedule/" + s_id + "/" + search_id +"/" + s_year +"/" + s_semester);
            }
            connection.release();
        });
    });
});
router.get('/schedule/:data1/:data2/:data3/:data4', function(req, res, next){
    var s_id = req.params.data1;
    var search_id = req.params.data2;
    var s_year = req.params.data3;
    var s_semester = req.params.data4;
    pool.getConnection(function (err, connection){
        var sqlForSelectList = "select c.cname, s.ltime from course as c, section as s where c.cnumber = s.cnumber and s.section_id IN(select si.section_id from student_info as si where si.s_semester = ? and si.s_year = ? and si.student_id = ?);";
        connection.query(sqlForSelectList,[s_semester, s_year, search_id], function (err, rows){
            if (err) console.error("err : " + err);

            pool.getConnection(function (err, connection){
                var sqlForSelectList = "select c.cname, s.ltime from course as c, section as s where c.cnumber = s.cnumber and s.section_id IN(select si.section_id from student_info as si where si.s_semester = ? and si.s_year = ? and si.student_id = ?);";
                connection.query(sqlForSelectList,[s_semester, s_year, s_id], function (err, results){
                    if (err) console.error("err : " + err);
                    res.render('schedule', {title: '상세 조회',s_id : s_id, search_id : search_id, rows: rows, s_year: s_year, s_semester:s_semester, results: results});
                    connection.release();
                });
            });
        });
    });
});

router.get('/simul/:s_id',function (req,res,next)
{
    var s_id = req.params.s_id;
    let today = new Date();
    let year = today.getFullYear();
    var this_semester = 2;

    pool.getConnection(function (err, connection)
    {
        var sql = "SELECT cname, credit_hours, section_id, instructor, total_number, ltime from course as c,section as s where c.cnumber = s.cnumber and s.semester = ? and s.years = ?";
        connection.query(sql, [this_semester,year], function (err, rows) {
            if (err) console.error(err);
            var sql = "SELECT passwd from student where student_id = ?";
            connection.query(sql, [s_id], function (err, password) {
                if (err) console.error(err);
                res.render('simul', {title: "시뮬레이션", sid: s_id, passwd: password, rows: rows, semester: this_semester, year: year});
                connection.release();
            });
        });
    });
});

router.post('/simulcheck/:sid', function(req, res, next){
    var cname = req.body.cname;
    var sid = req.body.sid;

    pool.getConnection(function(err, connection){
        var datas = [cname, sid];
        var sqlForSelectBoard2 = "select grade from student_info where student_info.section_id in (select section_id from section, course where section.cnumber = course.cnumber and course.cname = ?) and student_info.student_id = ?;"
        connection.query(sqlForSelectBoard2, datas, function(err, result){
            if(err) console.error("err : " + err);
            if(result[0] == undefined){ //재수강이 아닌 경우
                var sqlForprenum = "select course.prenumber from course where course.cname = ?;";
                connection.query(sqlForprenum, cname, function(err, prenum_result){
                    if(err) console.error("err : " + err);
                    var prenum = JSON.parse(JSON.stringify(prenum_result));
                    prenum = prenum[0].prenumber;
                    if(prenum != null){ //선이수 과목이 있는 경우
                        var dataforprenum = [prenum, sid];
                        var sqlForcheckprenum = "select * from student_info where student_info.section_id in (select section_id from section where section.cnumber = ?) and student_id = ?;";
                        connection.query(sqlForcheckprenum, dataforprenum, function(err, check){
                            if(err) console.error("err : "+ err);
                            if(check[0] == undefined){  //선이수 과목을 듣지 않은 경우
                                res.send({data:"not okay by prenum"});
                            }
                            else{ //선이수 과목을 들은 경우
                                res.send({data:"okay"});
                            }
                        });
                    }
                    else{ //선이수 과목이 없는 경우
                        res.send({data:"okay"});
                    }
                });
            }
            else{ //재수강인 경우
                res.send({data:"not okay"});
            }
            connection.release();
        })
    });
});

module.exports = router;
