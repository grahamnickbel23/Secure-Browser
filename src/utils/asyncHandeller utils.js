export const asyncHandeller = (func, perpous) => async (req, res, next) => {
    try {

        await func(req, res, next);

    } catch (err) {
        
        const status = err.status || 500;

        return res.status(status).json({
            success: false,
            message: `error in ${perpous}`,
            error: err.message
        });
    }
}