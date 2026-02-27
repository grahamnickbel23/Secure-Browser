export const asyncHandeller = (func, perpous) => async (req, res, next) => {
    try {

        await func(req, res, next);

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: `error in ${perpous}`,
            error: err.message
        });
    }
}