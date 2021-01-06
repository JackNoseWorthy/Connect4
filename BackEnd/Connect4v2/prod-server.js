
//TODO: Redirect to login page when there is no username in the session (not necessary until angular routing is introduced)

//TODO: Low priority (not mandatory before checkin 3): exploratory test sessions 
//          (i.e., what happens if a user refreshes and logs in without logging out, logs in as two users in two tabs, etc.)

//TODO: Lowish priority Remove all instances of this.user from client side requests (sessions replace this)

//TODO: Add routing

//TODO: replay games

//TODO: Socket io: Medium - low priority (Must be completed, not necessarily before checkin 3... hopefully)


/*
    TODO: Questions:
        Still need to ask about game history and privacy (last TA wasn't helpful)
        for the REST API GET/users do we return the entire user object, or just the username, or some specific collection of the users' properties
        include game object, or just game id for GET /user/:user
        does GET /games disregard privacy?
        Using completely different functions for api than the browser version; issue?
        Note: will remove /api at the biggining of request in final server. Currently used for proxy reasons
*/




const express = require("express");
const session = require("express-session")
const fs = require("fs");
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
app.get("/api/friends/:username", findUser, sendFriendsPage);
app.get("/api/searchUsers/:username", searchUsers);
app.get("/api/searchUsers/", searchUsers);
app.get("/api/getGame/:game", findGame, sendGame);
app.get("/api/getActiveGames", sendActiveGames);
app.get("/api/getOpponents", currUsernameToReq, findUser, sendOpponents);

app.post("/api/login", express.json(), findUser, checkCredentials, authorize, updateUsers); //users
app.post("/api/register", express.json(), createUser, authorize, updateUsers); //users
app.post("/api/sendFriendRequest", findUser, makeFriend, updateUsers); //users
app.post("/api/acceptFriendRequest", currUsernameToReq, findUser, acceptFriend, removeFriendRequest, updateUsers); //users
app.post("/api/newGame", createGame);//games

app.put("/api/privacy", currUsernameToReq, findUser, updatePrivacy, updateUsers); //users
app.put("/api/move", findGame, currUsernameToReq, findUser, move, updateUsers); //games
app.put("/api/forfeit", findGame, forfeit); //games and users?
app.put("/api/sendMessage", findGame, sendMessage); //games
app.put("/api/logout", currUsernameToReq, findUser, logout, updateUsers); //users

app.delete("/api/rejectFriendRequest", currUsernameToReq, findUser, removeFriendRequest, updateUsers); //users
app.delete("/api/removeFriend", currUsernameToReq, findUser, removeFriend, updateUsers); //users

//JSON REST API

app.get("/users", usersQueryParser, getUsers);
app.get("/users/:username", findUser, getUser);
app.get("/games", gamesQueryParser, games);

function getUsers(req, res){
    let users = JSON.parse(fs.readFileSync('data/users.json'));

    users = users.filter(user => user.privacy === 'Public');

    if(req.query.name){
        users = users.filter(user => user.username.toLocaleLowerCase().includes(req.query.name.toLowerCase()));
    }


    for(let user of users){
        delete user.password;
        delete user.privacy;
    }

    let userList = [];
    for(let i = (req.query.page - 1)*req.query.limit; i < req.query.page*req.query.limit; i++){
        if(i < users.length){
            userList.push(users[i]);
        }
    }

    res.status(200);
    res.send({users: userList});
    res.end()
}

function getUser(req, res){
    let users = JSON.parse(fs.readFileSync('data/users.json'));
    user = users.find(user => user.username === req.body.username && user.privacy === "Public");
    if(!user){
        res.sendStatus(404);
        res.end();
        return;
    }
    delete user.password;
    delete user.privacy;

    res.status(200);
    res.send(user);
    res.end();
}

function games(req, res){
    let games = JSON.parse(fs.readFileSync('data/games.json'));

    if(req.query.player){
        console.log(req.query.player);
        games = games.filter(game => game.players.player1 === req.query.player || game.players.player2 === req.query.player);
    }

    if(req.query.active){
        if(req.query.active === "true"){
            games = games.filter(game => game.winner === null);
        }else{
            games = games.filter(game => game.winner !== null);
        }
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
    let users = JSON.parse(fs.readFileSync('data/users.json'));
    let user = users.filter(user => req.body.username === user.username);
    if(user[0]){
        req.user = user[0];
        next();
    }else{
        res.sendStatus(404);
    }
}

function findGame(req, res, next){
    let games = JSON.parse(fs.readFileSync('data/games.json'));
    req.game = games.find(game => game.id === parseInt(req.body.id));
    if(typeof req.game === 'undefined'){
        res.end();
    }

    next();
}

function checkCredentials(req, res, next){
    if(req.user.password === req.body.password){
        next();
    }else{
        res.sendStatus(401);
    }

}

function getGames(req, res, next){
    let games = JSON.parse(fs.readFileSync('data/games.json'));
    req.games = games.filter((game) => (game.players.player1 === req.user.username || game.players.player2 === req.user.username) && (game.turn !== null));
    next();
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

    let games = JSON.parse(fs.readFileSync('data/games.json'));
    let historyResponse = [];
    for (let id of req.user.gameHistory){
        let opponent;
        game = games.find(game => game.id === id);
        if(game.players.player1 === req.user.username){
            opponent = game.players.player2;
        }else{
            opponent = game.players.player1;
        }
        historyResponse.push({
            id: id,
            opponent: opponent,
            win: game.winner === req.user.username
        });
    }

    let responseObject = {
        username: req.user.username,
        gamesPlayed: req.user.stats.gamesPlayed,
        gamesWon: req.user.stats.gamesWon,
        totalMoves: req.user.stats.totalMoves,
        privacy: req.user.privacy,
        gamesList: gamesResponse,
        gameHistory: historyResponse
    };

    res.set('Content-Type', 'application/json');
    res.status(200);
    res.send(JSON.stringify(responseObject));
    res.end();

}

function sendFriendsPage(req, res){
    let users = JSON.parse(fs.readFileSync('data/users.json'));
    let friendListResponse = []
    for(let friend of req.user.friends){
        let online;
        for (let user of users){
            if (user.username === friend){
                online = user.online;
            }
        }
        let friendObj = {
            username: friend,
            online: online
        }
        friendListResponse.push(friendObj);
    }

    let friendRequestResponse = [];
    for (let request of req.user.friendRequests){
        friendRequestResponse.push({
            name: request,
            canView: users.find((user) => user.username === request).privacy === "Public"
        });
    }

    let responseObject = {
        friends: friendListResponse,
        friendRequests: friendRequestResponse
    };

    res.status(200);
    res.send(JSON.stringify(responseObject));
    res.end();
}

function searchUsers(req, res){
    let users = JSON.parse(fs.readFileSync('data/users.json'));
    if(!req.body.username){
        res.status(200);
        res.send({users: []});
        res.end()
        return;
    }
    let userList = [];
    for(let user of users.filter(user => user.username.toLocaleLowerCase().includes(req.body.username.toLowerCase()) && user.privacy === 'Public')){
        userList.push(user.username);
    }
    res.status(200);
    res.send({users: userList});
    res.end()
}

function sendGame(req, res){
    res.status(200);
    res.send(JSON.stringify(req.game));
    res.end();
}

function sendActiveGames(req, res){
    let games = JSON.parse(fs.readFileSync('data/games.json'));
    let playerGames =  games.filter((game) => (game.turn === req.session.username));
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
}

function sendOpponents(req, res){
    res.status(200);
    res.send(JSON.stringify({friends: req.user.friends}));
}

function createUser(req, res, next){
    let users = JSON.parse(fs.readFileSync('data/users.json'));
    let user = users.filter(user => req.body.username === user.username);
    if (user[0]){
        res.sendStatus(409);
    }else{
        newUser = {
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
        users.push(newUser);
        fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2));
        req.user = newUser;
        next();
    }
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
    let users = JSON.parse(fs.readFileSync('data/users.json'));
    req.user.friends.push(req.body.friend);
    friend = users.find(user => user.username === req.body.friend)
    friend.friends.push(req.session.username);
    index = users.findIndex(user => user.username === friend.username);
    if(index === -1){
        users.push(friend);
    }else{
        users[index] = friend;
    }
    fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2));
    next();
}

//TODO: Ask about stringify causing bug
function createGame(req, res){
    let games = JSON.parse(fs.readFileSync('data/games.json'));
    if (req.body.opponent === "Random Opponent"){
        let availableGame = games.find(game => game.players.player2 === "Random Opponent" && game.players.player1 !== req.session.username && game.privacy === parseInt(req.body.privacy));
        if (availableGame){
            availableGame.players.player2 = req.session.username;
            index = games.findIndex(game => game.id === availableGame.id);
            fs.writeFileSync('data/games.json', JSON.stringify(games, null, 2));
            res.status(200);
            res.send(JSON.stringify({id: availableGame.id}));
            res.end();
            return;
        }
    }
    let nextId = Math.max.apply(Math, games.map(game => game.id)) + 1;
    let newGame = {
        id: nextId,
        board: [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
        players: {
            player1: req.session.username,
            player2: req.body.opponent
        },
        turn: req.session.username,
        winner: null,
        forfeit: false,
        chats: [],
        privacy: parseInt(req.body.privacy)
    };
    games.push(newGame);
    fs.writeFileSync('data/games.json', JSON.stringify(games, null, 2));
    res.status(200);
    res.send(JSON.stringify({id: nextId}));
    res.end();
}

function updatePrivacy(req, res, next){
    req.user.privacy = req.body.privacy;
    next();
}

function move(req, res, next){
    for (let i = 0; i<req.game.board.length; i++){
        for(let j = 0; j< req.game.board[i].length; j++){
            if (req.game.board[i][j] !== req.body.board[i][j]){
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

    let games = JSON.parse(fs.readFileSync('data/games.json'));
    index = games.findIndex(game => game.id === req.game.id);
    if(index === -1){
        games.push(req.game);
    }else{
        games[index] = req.game;
    }
    fs.writeFileSync('data/games.json', JSON.stringify(games, null, 2));

    req.user.stats.totalMoves++;

    if(req.body.winner !== null){
        setWinner(req, req.user);
    }else{
        next();
    }

    res.status(200).send();

}

function forfeit(req, res){
    req.game.turn = null;
    req.game.forfeit = true;

    if(req.session.username === req.game.players.player1){
        req.game.winner = req.game.players.player2;
    }else{
        req.game.winner = req.game.players.player1;
    }

    let games = JSON.parse(fs.readFileSync('data/games.json'));
    index = games.findIndex(game => game.id === req.game.id);
    if(index === -1){
        games.push(req.game);
    }else{
        games[index] = req.game;
    }
    fs.writeFileSync('data/games.json', JSON.stringify(games, null, 2));

    let users = JSON.parse(fs.readFileSync('data/users.json'));
    let winner = users.find(user => user.username === req.game.winner);

    setWinner(req, winner)

    res.status(200).send();

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
    req.game.chats.push({
        player: req.body.username,
        message: req.body.message
    });

    let games = JSON.parse(fs.readFileSync('data/games.json'));
    index = games.findIndex(game => game.id === req.game.id);
    if(index === -1){
        games.push(req.game);
    }else{
        games[index] = req.game;
    }
    fs.writeFileSync('data/games.json', JSON.stringify(games, null, 2));

    res.status(200).send();
}

function removeFriend(req, res, next){
    let users = JSON.parse(fs.readFileSync('data/users.json'));
    req.user.friends = req.user.friends.filter(user => user !== req.body.friend);
    let oldFriend = users.find(user => user.username === req.body.friend);
    oldFriend.friends = oldFriend.friends.filter(user => user !== req.body.username);
    index = users.findIndex(user => user.username === oldFriend.username);
    if(index === -1){
        users.push(oldFriend);
    }else{
        users[index] = oldFriend;
    }
    fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2));
    next();
}

function setWinner(req, winner){
    req.game.winner = req.body.winner;
    winner.stats.gamesPlayed++;
    winner.stats.gamesWon++;
    winner.gameHistory.push(req.game.id);
    let opponent;
    if(req.game.winner == req.game.players.player1){
        opponent = req.game.players.player2;
    }else{
        opponent = req.game.players.player1;
    }
    let users = JSON.parse(fs.readFileSync('data/users.json'));
    let loser = users.find(user => user.username === opponent);
    loser.stats.gamesPlayed++;
    loser.gameHistory.push(req.game.id);
    req.game.turn = null;

    index = users.findIndex(user => user.username === winner.username);
    users[index] = winner;
    index = users.findIndex(user => user.username === loser.username);
    users[index] = loser;

    fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2));
}

function updateUsers(req, res){
    let users = JSON.parse(fs.readFileSync('data/users.json'));
    index = users.findIndex(user => user.username === req.user.username);
    if(index === -1){
        users.push(req.user);
    }else{
        users[index] = req.user;
    }
    fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2));
    res.status(200).end();
}

app.listen(3000);
console.log("Server listening at http://localhost:3000");