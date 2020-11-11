class ApiError extends Error {
    constructor(code, name, message) {
        super(message);
        if(Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
        this.code = code;
        this.name = name;
    }
}

module.exports = ApiError;