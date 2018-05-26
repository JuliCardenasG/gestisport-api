const express = require('express');
const Errors = require('../utils/errors');
const passport = require('passport');
const Team = require('../models/team');
const ImageHandler = require('../utils/imageHandler');
const Calendar = require('../models/calendar');
const Matchday = require('../models/matchday');
const Match = require('../models/match');
const robin = require('roundrobin');

let router = express.Router();

router.use((req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            let resp = {
                ok: false,
                error: 'Ha ocurrido un error'
            };
            return res.status(500).send()
        }
        if (!user) {
            let resp = {
                ok: false,
                error: 'No autorizado'
            };
            return res.status(401).send(resp);
        }
        req.user = req.user;
        next();
    })(req, res);
})

router.get('/matchdays/tournament/:id', (req, res) => {
    let tournamentId = req.params.id;

    Matchday.getMatchdaysByTournament(tournamentId).then(matchdays => {
        let resp = {
            ok: true,
            matchdays: matchdays
        };
    }).catch(error => {
        let resp = {
            ok: false,
            error: error
        }
        res.status(500).send(resp);
    })
})

router.post('/matchdays', (req, res) => {
    let tournamentId = req.body.tournamentId;
    let matchdayNumber = req.body.matchdayNumber;

    Matchday.getMatchesFromMatchday(matchdayNumber, tournamentId).then(matches => {
        let resp = {
            ok: true,
            matches: matches
        };
    }).catch(error => {
        let resp = {
            ok: false,
            error: error
        }
        res.status(500).send(resp);
    })
})

router.get('/tournaments/:id', (req, res) => {
    const tournamentId = req.params.id;
    Match.getTournamentMatches(tournamentId).then(matches => {
        let resp = {
            ok: true,
            matches: matches
        };
        res.send(resp);
    }).catch(error => {
        let resp = {
            ok: false,
            error: error
        }
        res.status(500).send(resp);
    })
})

router.post('/', (req, res) => {
    const teams = req.body.teams;
    const tournamentId = req.body.tournamentId;
    const calendarId = req.body.calendarId;
    const matchdays = robin(teams.length, teams);

    let matchdaysPromises = [];
    const matchdayNumbers = teams.length % 2 == 0 ? teams.length - 1 : teams.length;
    let matchdayIds = [];

    for (let i = 1; i <= matchdayNumbers; i++) {
        let promise = new Promise((resolve, reject) => {
            let matchdayJson = {
                tournament_id: tournamentId,
                matchday_number: i
            }
            Matchday.createMatchday(matchdayJson).then(matchdayId => {
                matchdayIds.push(matchdayId);
                resolve()
            }).catch(error => {
                let resp = {
                    ok: false,
                    error: error
                }
                res.status(500).send(resp);
            })
        })
        matchdaysPromises.push(promise);
    }

    Promise.all(matchdaysPromises).then(() => {
        let matchesArray = [];
        let matchesPromises = [];
        console.log('Jornadas: ', matchdays);
        console.log(matchdays[0][0]);
        // console.log(matchdays[0][1]);
        console.log(matchdays[1][0]);
        // console.log(matchdays[1][1]);
        console.log(matchdays[2][0]);
        let matchesPerMatchday = Math.floor(teams.length / 2)
        console.log('Partidos por jornada', matchesPerMatchday);
        //Jornada
        for (let i = 0; i < matchdayNumbers; i++) {
            //Partido
            for(let j = 0; j < matchesPerMatchday; j++) {
                let matchPromise = new Promise((resolve, reject) => {
                    let match = matchdays[i][j]
                    console.log('Partido: ', match);
                    let matchJson = {
                        matchday_id: matchdayIds[i],
                        team_local_id: match[0].id,
                        team_visitor_id: match[1].id,
                        team_local_goals: 0,
                        team_visitor_goals: 0
                    }
                    // console.log(matchJson);
                    Match.createMatch(matchJson).then(matchId => {
                        resolve(matchId);
                    }).catch(error => {
                        let resp = {
                            ok: false,
                            error: error
                        }
                        res.status(500).send(resp);
                    })
                })
                matchesPromises.push(matchPromise)
            }
        }

        Promise.all(matchesPromises).then(matchesIds => {
            let resp = {
                ok: true,
                ids: matchesIds
            };
            res.send(resp);
        }).catch(error => {
            let resp = {
                ok: false,
                error: error
            }
            res.status(500).send(resp);
        })
    }).catch(error => {
        let resp = {
            ok: false,
            error: error
        }
        res.status(500).send(resp);
    })
})

module.exports = router;