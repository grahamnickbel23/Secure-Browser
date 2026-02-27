const schemas = {
    student: [
        "enrollmentId",
        "name",
        "email",
        "password",
        "department",
        "section",
        "roll"
    ],

    teacher: [
        "name",
        "email",
        "password",
        "department"
    ],

    exam: [
        "name",
        "url",
        "examTime",
        "duration"
    ]
};

export default function validateRequest(req, res, next) {

    const requiredFields = schemas[req.target];

    if (!requiredFields) {
        return res.status(500).json({
            error: "Validation target not defined"
        });
    }

    const missingFields = requiredFields.filter(
        field =>
            req.body[field] === undefined ||
            req.body[field] === null
    );

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: "Missing required fields",
            missing: missingFields
        });
    }

    next();
}