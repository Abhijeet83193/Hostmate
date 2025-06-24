module.exports = (fn) => {
    return (req, res, next) => {
        return (req, res, next) => {
            fn(req, res, next).catch(fn);
        }
    }
}