CREATE TABLE IF NOT EXISTS exams (
id TEXT PRIMARY KEY,
code INTEGER UNIQUE,
name TEXT,
url TEXT,
examTime INTEGER,
duration INTEGER,
isActive INTEGER
);

CREATE TABLE IF NOT EXISTS students (
id TEXT PRIMARY KEY,
email TEXT,   
name TEXT,
examId TEXT,
isBlocked INTEGER DEFAULT 0,
FOREIGN KEY (examId) REFERENCES exams(id)
);

CREATE TABLE IF NOT EXISTS screenshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId TEXT,
    examId TEXT,
    filePath TEXT,
    createdAt INTEGER,
    FOREIGN KEY (studentId) REFERENCES students(id),
    FOREIGN KEY (examId) REFERENCES exams(id)
);

CREATE INDEX IF NOT EXISTS idx_exam_code ON exams(code);
CREATE INDEX IF NOT EXISTS idx_student_exam ON students(examId);
CREATE INDEX IF NOT EXISTS idx_student_email_exam ON students(email, examId);
CREATE INDEX IF NOT EXISTS idx_screenshot_student ON screenshots(studentId);
CREATE INDEX IF NOT EXISTS idx_screenshot_exam ON screenshots(examId);
