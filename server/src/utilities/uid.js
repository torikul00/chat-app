const uid = () => Date.now() + '-' + Math.round(Math.random() * 1E9);
module.exports = uid;