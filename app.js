const express = require('express');
const cors = require('cors');
const passport = require('passport');
const bodyParser = require('body-parser');
const auth = require('./routes/auth');
const tournaments = require('./routes/tournaments');
const teams = require('./routes/teams');
const calendars = require('./routes/calendars');
const matches = require('./routes/matches');
const clasifications = require('./routes/clasifications');
const users = require('./routes/users');

let app = express();

app.use(cors());

app.use(bodyParser.urlencoded({
    extended: true,
    limit: '5mb'
}));

app.use(bodyParser.json({
    extended: true,
    limit: '5mb'
}));

app.use('/public', express.static(__dirname + '/public'));

app.use('/auth', auth);
app.use('/tournaments', tournaments);
app.use('/teams', teams);
app.use('/calendars', calendars);
app.use('/matches', matches);
app.use('/clasifications', clasifications);
app.use('/users', users);

app.listen(8080);