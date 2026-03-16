import fs from "fs";

export const SQL = {
    // exam section
    examInsert: fs.readFileSync("./src/controller/sql/exam/insert.sql", "utf8"),
    verifyExam: fs.readFileSync("./src/controller/sql/exam/verify.sql", "utf8"),
    activateExam: fs.readFileSync("./src/controller/sql/exam/activate.sql", "utf8"),
    readExam: fs.readFileSync("./src/controller/sql/exam/read.sql", "utf8"),
    deleteExam: fs.readFileSync("./src/controller/sql/exam/delete.sql", "utf8"),
    getExamIdByCode: fs.readFileSync("./src/controller/sql/exam/getIdByCode.sql", "utf8"),

    // student section
    studentInsert: fs.readFileSync("./src/controller/sql/student/insert.sql", "utf8"),
    verifyStudent: fs.readFileSync("./src/controller/sql/student/verify.sql", "utf8"),
    readStudentsByExam: fs.readFileSync("./src/controller/sql/student/readByExam.sql", "utf8"),
    deleteStudentsByExam: fs.readFileSync("./src/controller/sql/student/deleteByExam.sql", "utf8"),
    blockStudent: fs.readFileSync("./src/controller/sql/student/block.sql", "utf8"),
    unblockStudent: fs.readFileSync("./src/controller/sql/student/unblock.sql", "utf8")
};