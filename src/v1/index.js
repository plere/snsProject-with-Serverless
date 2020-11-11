const express = require('express');
const router = express.Router();
const routes = ['main', 'posts', 'users', 'comments'];

routes.forEach(route => router.use('/'+route, require('./'+route+'Router')))

module.exports = router;