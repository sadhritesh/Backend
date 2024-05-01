const asyncHandler = (requestHandler) => {

    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next)
        } catch (error) {
            return res
            .json({
                success: false,
                statusCode: error.statusCode,
                message: error.message
            })
        }
    }
}

export { asyncHandler }