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

CREATE INDEX IF NOT EXISTS idx_exam_code ON exams(code);
CREATE INDEX IF NOT EXISTS idx_student_exam ON students(examId);
CREATE INDEX IF NOT EXISTS idx_student_email_exam ON students(email, examId);
