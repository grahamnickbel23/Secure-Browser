export default function validate (target) {

    return (req, res, next) => {
        req.target = target;
        next();
    };

};