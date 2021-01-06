let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;

const express = require("express");
const session = require("express-session")
let app = express()

app.use(express.json());
app.use(session({
    secret: 'secret',
    saveUninitialized: false,
    resave: false,
    cookie: {
        secure: false,
        httpOnly: false,
        maxAge: 1000*60*60*24
    }
}))

app.use(express.static('static'));

app.get("/api/getProfile/:username", findUser, getGames, filterGames, sendProfile);
app.get("/api/friends", currUsernameToReq, findUser, sendFriendsPage);
app.get("/api/searchUsers/:username", searchUsers);
app.get("/api/searchUsers/", searchUsers);
app.get("/api/getGame/:game", findGame, sendGame);
app.get("/api/getActiveGames", sendActiveGames);
app.get("/api/getOpponents", currUsernameToReq, findUser, sendOpponents);

app.post("/api/login", express.json(), findUser, checkCredentials, authorize, updateUsers);
app.post("/api/register", express.json(), createUser, authorize, updateUsers);
app.post("/api/sendFriendRequest", findUser, makeFriend, updateUsers);
app.post("/api/acceptFriendRequest", currUsernameToReq, findUser, acceptFriend, removeFriendRequest, updateUsers);
app.post("/api/newGame", createGame);//games

app.put("/api/privacy", currUsernameToReq, findUser, updatePrivacy, updateUsers);
app.put("/api/move", findGame, currUsernameToReq, findUser, move, updateUsers);
app.put("/api/forfeit", findGame, forfeit);
app.put("/api/sendMessage", findGame, sendMessage);
app.put("/api/logout", currUsernameToReq, findUser, logout, updateUsers);

app.delete("/api/rejectFriendRequest", currUsernameToReq, findUser, removeFriendRequest, updateUsers);
app.delete("/api/removeFriend", currUsernameToReq, findUser, removeFriend, updateUsers);
app.delete("/api/leaveRoom", removeViewer);

//JSON REST API

app.get("/users", usersQueryParser, getUsers);
app.get("/users/:username", findUser, getUser);
app.get("/games", gamesQueryParser, games);

function getUsers(req, res){
    let queryObjects = [{privacy: "Public"}];
    if(req.query.name){
        queryObjects.push({username: {
            $regex: req.query.name, $options: 'i'
        }});
    }
    db.collection("users").find({
        $and: queryObjects
    }).toArray((err, users) => {
        if(err){
            res.status(500).send("Error querying db");
        }
        let userList = [];
        for(let user of users){
            userList.push(user.username);
        }
        res.status(200);
        res.send({users: userList});
        res.end()
    });
}

function getUser(req, res){
    db.collection("users").findOne({
        $and: [
            {privacy: "Public"},
            {username: {
                $eq: req.body.username
            }}
        ]
    }, (err, user) => {
        if(err){
            res.status(500).send("Error querying db");
        }
        if(!user){
            res.status(404).send("User was not found");
            res.end();
            return;
        }
        delete user._id;
        delete user.password;
        delete user.privacy;
        delete user.online;
        delete user.friends;
        delete user.friendRequests;
        delete user.gameHistory;

        db.collection("games").find({
            $or: [
                {"players.player1": user.username},
                {"players.player2": user.username}
            ]
        }).toArray((err, games) =>{
            if(err){
                res.status(500).send("Error querying db");
            }
            for(let game of games){
                delete game._id;
            }

            user.games = games;

            res.status(200);
            res.send(user);
            res.end();
        });
    });
}

function games(req, res){
    let queryObjects = [{privacy: 1}];
    if(req.query.player){
        queryObjects.push({
            $or: [
                {"players.player1": req.query.player},
                {"players.player2": req.query.player}
            ]
        });
    }
    if(req.query.active){
        if(req.query.active === "true"){
            queryObjects.push({winner: null});
        }else{
            queryObjects.push({winner: {$ne: null}});
        }
    }
    db.collection("games").find({
        $and: queryObjects
    }).toArray((err, games) => {
        if(err){
            res.status(500).send("Error querying db");
        }
        for (let game of games){
            if (req.query.detail === "summary"){
                delete game.moveOrder;
            }
            delete game.id;
            delete game.turn;
            delete game.chats;
            delete game.privacy;
            if(game.winner === null){
                game.status = "in progress";
            }else{
                game.status = "complete";
            }
            if(game.status === "in progress"){
                delete game.winner;
                delete game.forfeit
            }else{
                let turns = 0;
                for(let lis of game.board){
                    for(let ele of lis){
                        turns += ele;
                    }
                }
                game.turns = turns;
            }
            delete game.board;
        }
    
        res.status(200);
        res.send(games);
        res.end();
    });
}

function usersQueryParser(req, res, next){
    if (!req.query.page){
        req.query.page = 1;
    }
    if (!req.query.limit){
        req.query.limit = 10;
    }
    next();
}

function gamesQueryParser(req, res, next){

    if(!req.query.detail){
        req.query.detail = "summary"
    }
    if(req.query.detail !== "summary" && req.query.detail !== "full"){
        req.query.detail = "summary"
    }

    if(req.query.active){
        if(req.query.active !== "true" && req.query.active !== "false"){
            delete req.query.active;
        }
    }

    next();
}


app.param("username", (req, res, next) => {
    if (req.params.username){
        req.body.username = req.params.username;
    }else{
        req.body.username = "";
    }
    next();
});

app.param("game", (req, res, next) =>{
    req.body.id = req.params.game;
    next();
});

function currUsernameToReq(req, res, next){
    req.body.username = req.session.username;
    next()
}

function findUser(req, res, next){
    db.collection("users").findOne({username: req.body.username}, (err, user) => {
        if(err){
            res.status(500).send("Error querying db");
        }else if(user){
            delete user._id;
            req.user = user;
            next();
        }else{
            res.status(404).send("User not found");
        }

    });
}

function findGame(req, res, next){
    db.collection("games").findOne({id: parseInt(req.body.id)}, (err, game) => {
        if(err){
            res.status(500).send("Error querying db");
        }else if(!game){
            res.status(404).send("Game not found");
        }else{
            delete game._id;
            req.game = game;
            next();
        }
    });
}

function checkCredentials(req, res, next){
    if(req.user.password === req.body.password){
        next();
    }else{
        res.status(401).send("Invalid credentials");
    }

}

function getGames(req, res, next){
    db.collection("games").find({
        $and: [
            {        
                $or: [
                    {"players.player1": req.user.username},
                    {"players.player2": req.user.username}
                ]
            },
            {turn: {$ne: null} }
        ]
    }).toArray((err, games) => {
        if(err){
            res.status(500).send("Error querying db");
        }else{
            for(let game of games){
                delete game._id;
            }
            req.games = games;
            next();
        }
    });
}

function filterGames(req, res, next){
    if(req.user.friends.find(friend => friend === req.session.username)){
        req.games = req.games.filter(game => game.privacy !== 3);
    }else if(req.user.username !== req.session.username){
        req.games = req.games.filter(game => game.privacy !== 3 && game.privacy !== 2);
    }
    next();
}

function sendProfile(req, res){
    let gamesResponse = []
    for (let game of req.games){
        let opponent;
        if(game.players.player1 === req.user.username){
            opponent = game.players.player2;
        }else{
            opponent = game.players.player1;
        }
        gamesResponse.push({
            id: game.id,
            opponent: opponent
        });
    }
    db.collection("games").find({
            id: {$in: req.user.gameHistory}
    }).toArray((err, games) => {
        if(typeof games === "undefined"){
            games = [];
        }
        let historyResponse = [];
        for(let game of games){
            if(game.privacy === 3 && (req.session.username !== game.players.player1 && req.session.username !== game.players.player2)){
                continue;
            }else if(game.privacy === 2 && !req.user.friends.find(user => user === req.session.username) && req.user.username !== req.session.username){
                continue;
            }
            if(game.players.player1 === req.user.username){
                opponent = game.players.player2;
            }else{
                opponent = game.players.player1;
            }
            historyResponse.push({
                id: game.id,
                opponent: opponent,
                win: game.winner
            });
            if(req.session.username !== req.user.username && historyResponse.length >= 5){
                break;
            }
        }

        let orderedHistoryResponse = [];
        for(let i = 0; i < req.user.gameHistory.length; i++){
            orderedHistoryResponse.push(historyResponse.find(game => game.id === req.user.gameHistory[i]));
        }

        let responseObject = {
            username: req.user.username,
            gamesPlayed: req.user.stats.gamesPlayed,
            gamesWon: req.user.stats.gamesWon,
            totalMoves: req.user.stats.totalMoves,
            privacy: req.user.privacy,
            gamesList: gamesResponse,
            gameHistory: orderedHistoryResponse
        };

        res.set('Content-Type', 'application/json');
        res.status(200);
        res.send(JSON.stringify(responseObject));
        res.end();
    });
}

function sendFriendsPage(req, res){
    db.collection("users").find({
        username: {$in: req.user.friends}
    }).toArray((err, friends) => {
        if(err){
            res.status(500).send("Error querying db");
            return;
        }
        if(!friends){
            friends = [];
        }
        let friendListResponse = [];
        for (let friend of friends){
            friendListResponse.push({
                username: friend.username,
                online: friend.online
            });
        }
        db.collection("users").find({
            username: {$in: req.user.friendRequests}
        }).toArray((err, friendRequests) => {
            if(err){
                res.status(500).send("Error querying db");
                return;
            }
            let friendRequestResponse = [];
            for (let request of friendRequests){
                friendRequestResponse.push({
                    name: request.username,
                    canView: request.privacy === "Public"
                });
            }
            let responseObject = {
                friends: friendListResponse,
                friendRequests: friendRequestResponse
            };
        
            res.status(200);
            res.send(JSON.stringify(responseObject));
            res.end();
        });
    });
}

function searchUsers(req, res){
    if(!req.body.username){
        res.status(200);
        res.send({users: []});
        res.end()
        return;
    }
    db.collection("users").find({
        username: {
            $regex: req.body.username, $options: 'i'
        }
    }).toArray((err, users) => {
        if(err){
            res.status(500).send("Error querying db");
            return;
        }
        let usersResponse = [];
        for(let user of users){
            usersResponse.push(user.username);
        }
        res.status(200);
        res.send(JSON.stringify({users: usersResponse}));
    });
}

function sendGame(req, res){
    if(req.game.currViewers.indexOf(req.session.username) === -1){
        req.game.currViewers.push(req.session.username);
        db.collection("games").updateOne({id: req.game.id}, {$addToSet: {currViewers: req.session.username}});
    }
    res.status(200);
    res.send(JSON.stringify(req.game));
    res.end();
}

function sendActiveGames(req, res){
    db.collection("games").find({turn: req.session.username}).toArray((err, playerGames) => {
        if(err){
            res.status(500).send("Error querying db");
        }
        let gamesResponse = [];
        for (let game of playerGames){
            let opponent;
            if(game.players.player1 === req.session.username){
                opponent = game.players.player2;
            }else{
                opponent = game.players.player1;
            }
            gamesResponse.push({
                id: game.id,
                opponent: opponent
            });
        }
        res.status(200);
        res.send(JSON.stringify(gamesResponse));
        res.end();
    });
}

function sendOpponents(req, res){
    res.status(200);
    res.send(JSON.stringify({friends: req.user.friends}));
}

function createUser(req, res, next){
    db.collection("users").findOne({username: req.body.username}, (err, user) => {
        if(user){
            res.status(409).send("Username already taken");
            return;
        }
        let newUser = {
            username: req.body.username,
            password: req.body.password,
            privacy: 'Public',
            online: true,
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                totalMoves: 0
            },
            friends: [],
            friendRequests: [],
            gameHistory: []
        }
        db.collection("users").insertOne(newUser);
        req.user = newUser;
        next();
    });
}

function authorize(req, res, next){
    req.session.username = req.user.username;
    req.user.online = true;
    next();
}

function makeFriend(req, res, next){
    if(!req.user.friendRequests.find(user => user === req.session.username)){
        req.user.friendRequests.push(req.session.username);
    }
    next();
}

function acceptFriend(req, res, next){
    db.collection("users").findOne({username: req.body.friend}, (err, friend) => {
        if(err){
            res.status(500).send("Error querying db");
        }
        req.user.friends.push(req.body.friend);
        friend.friends.push(req.session.username);
        db.collection("users").replaceOne({username: req.user.username}, req.user);
        db.collection("users").replaceOne({username: friend.username}, friend);
        next();
    });
}

function createGame(req, res){
    db.collection("games").findOne({
        $and: [
            {"players.player2": "Random Opponent"},
            {"players.player1": {$ne: req.session.username}},
            {privacy: parseInt(req.body.privacy)}
        ]
    }, (err, game) => {
        if(err){
            res.status(500).send("Error querying db");
            return;
        }
        if(game){
            game.players.player2 = req.session.username;
            game.turn = req.session.username;
            db.collection("games").replaceOne({id: game.id}, game);
            res.status(200);
            res.send(JSON.stringify({id: game.id}));
            res.end();
            return;
        }
        db.collection("games").find().toArray((err, games) => {
            if(err){
                res.status(500).send("Error querying db");
                return;
            }
            let nextId = Math.max.apply(Math, games.map(game => game.id)) + 1;
            let newGame = {
                id: nextId,
                board: [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
                moveOrder: [],
                players: {
                    player1: req.session.username,
                    player2: req.body.opponent
                },
                turn: req.session.username,
                winner: null,
                forfeit: false,
                chats: [],
                privacy: parseInt(req.body.privacy),
                currViewers: []
            };
            db.collection("games").insertOne(newGame);
            res.status(200);
            res.send(JSON.stringify({id: nextId}));
            res.end();
        });
    });
}

function updatePrivacy(req, res, next){
    req.user.privacy = req.body.privacy;
    next();
}

function move(req, res, next){
    for (let i = 0; i<req.game.board.length; i++){
        for(let j = 0; j< req.game.board[i].length; j++){
            if (req.game.board[i][j] !== req.body.board[i][j] && req.body.board[i][j] !== 4){
                req.game.moveOrder.push(j);
            }
        }
    }

    req.game.board = req.body.board;

    if(req.session.username === req.game.players.player1){
        req.game.turn = req.game.players.player2;
    }else{
        req.game.turn = req.game.players.player1;
    }

    db.collection("games").replaceOne({id: req.game.id}, req.game);

    req.user.stats.totalMoves++;

    if(req.body.winner === "Tie"){
        setWinner(req, res, req.user, true);
    }else if(req.body.winner !== null){
        setWinner(req, res, req.user, false);
    }else{
        next();
    }
}

function forfeit(req, res){
    req.game.turn = null;
    req.game.forfeit = true;

    if(req.session.username === req.game.players.player1){
        req.game.winner = req.game.players.player2;
    }else{
        req.game.winner = req.game.players.player1;
    }
    req.body.winner = req.game.winner;

    db.collection("games").replaceOne({id: req.game.id}, req.game);

    db.collection("users").findOne({username: req.game.winner}, (err, winner) => {
        if(err){
            res.status(500).send("Error querying db");
            return;
        }
        setWinner(req, res, winner, false);
    });
}

function removeFriendRequest(req, res, next){
    req.user.friendRequests = req.user.friendRequests.filter(user => user !== req.body.friend);
    next();
}

function logout(req, res, next){
    req.user.online = false;
    req.session.destroy();
    next();
}

function sendMessage(req, res){
    if(req.body.username !== req.game.players.player1 && req.body.username !== req.game.players.player2 && req.body.username){
        res.status(401).end("Users cannot send chats when spectating");
        return;
    }
    req.game.chats.push({
        player: req.body.username,
        message: req.body.message
    });

    db.collection("games").replaceOne({id: req.game.id}, req.game);

    res.status(200).send();
}

function removeFriend(req, res, next){
    db.collection("users").findOne({username: req.body.friend}, (err, friend) => {
        if(err){
            res.status(500).send("Error querying db");
        }
        req.user.friends = req.user.friends.filter(user => user !== req.body.friend);
        friend.friends = friend.friends.filter(user => user !== req.body.username);
        db.collection("users").updateOne({username: req.user.username}, {$set: {friends: req.user.friendRequests}});
        db.collection("users").updateOne({username: friend.username}, {$set: {friends: friend.friends}});
        next();
    });
}

function removeViewer(req, res){
    db.collection("games").updateOne({id: req.body.id}, {$pull: {currViewers: req.session.username}});
    res.status(200).send();
}

function setWinner(req, res, winner, isTie){
    if(winner){
        req.game.winner = req.body.winner;
        winner.stats.gamesPlayed++;
        if(!isTie){
            winner.stats.gamesWon++;
        }
        winner.gameHistory.splice(0, 0, req.game.id);
    }
    let opponent;
    if(req.game.winner === req.game.players.player1 || req.game.winner === "Tie"){
        opponent = req.game.players.player2;
    }else{
        opponent = req.game.players.player1;
    }
    db.collection("users").findOne({username: opponent}, (err, loser) => {
        loser.stats.gamesPlayed++;
        loser.gameHistory.splice(0, 0, req.game.id);
        req.game.turn = null;
        if(winner){
            db.collection("users").replaceOne({username: winner.username}, winner);
        }
        db.collection("users").replaceOne({username: loser.username}, loser);
        if(req.game.winner === "Tie"){
            req.game.chats.push({
                player: "",
                message: "The game ends in a tie"
            });
        }else{
            req.game.chats.push({
                player: "",
                message: req.game.winner + " wins!"
            });
        }
        db.collection("games").replaceOne({id: req.game.id}, req.game);
        res.status(200).send();
    });
}

function updateUsers(req, res){
    db.collection("users").replaceOne({username: req.user.username}, req.user);
    res.status(200).end();
}

const server = app.listen(3000);
console.log("Server listening at http://localhost:3000");

MongoClient.connect("mongodb://localhost:27017/", function (err, client){
    if(err) throw err;

    db = client.db("connect4");
});


const io = require('socket.io')(server, {cors:true});

io.on("connection", socket => {

    socket.on("join", data => {
        socket.join(data.toString());
    });

    socket.on("gameUpdate", data => {
        if(data || data === 0){
            io.in(data.toString()).emit("updateGame", data);
        }
    });

    socket.on("leaveGameRoom", data => {
        if(data || data === 0){
            socket.leave(data.toString());
        }
    });
});