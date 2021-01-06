const http = require('http');
const fs = require('fs');


let nextId = 2;

let users = [
    {
        username: 'Jack',
        password: '123qwe',
        privacy: 'Public',
        online: false,
        stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalMoves: 0
        },
        friends: [
            'Tom',
            'Mike',
        ],
        friendRequests: [
            'Rohan',
        ],
        gameHistory: []
    },
    {
        username: 'Tom',
        password: '123qwe',
        privacy: 'Public',
        online: false,
        stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalMoves: 0
        },
        friends: [
            'Jack',
            'Mike',
        ],
        friendRequests: [
            'Rohan',
        ],
        gameHistory: []
    },
    {
        username: 'Mike',
        password: '123qwe',
        privacy: 'Public',
        online: false,
        stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalMoves: 0
        },
        friends: [
            'Tom',
            'Jack',
        ],
        friendRequests: [
            'Rohan',
        ],
        gameHistory: []
    },
    {
        username: 'Rohan',
        password: '123qwe',
        privacy: 'Public',
        online: false,
        stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalMoves: 0
        },
        friends: [
            
        ],
        friendRequests: [

        ],
        gameHistory: []
    }
];

let games = [
    {
        id: 0,
        board: [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
        moveOrder: [],
        players: {
            player1: 'Jack',
            player2: 'Tom'
        },
        turn: 'Tom',
        winner: null,
        chats: [
            {
                player: 'Jack',
                message: 'Hello'
            },
            {
                player: 'Tom',
                message: 'Sup dude'
            }
        ],
        privacy: 3
    },
    {
        id: 1,
        board: [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
        moveOrder: [],
        players: {
            player1: 'Jack',
            player2: 'Mike'
        },
        turn: 'Jack',
        winner: null,
        chats: [
            {
                player: 'Jack',
                message: 'Hello'
            },
            {
                player: 'Mike',
                message: 'Sup dude'
            }
        ],
        privacy: 3
    }
];


/*TODO: Implement HTTP requests:
        Change failed register message in front end
        Chat feature
            Socket IO
        view profile button on game board

        accounts-10
            replay games
                Implemented property in object & backend logic
                Need to add to front end
                Will have to change the get game board request to output this info


        Questions:
        using username instead of id.
            still not sending full object
            usernames are unique
        Can anyone view the player's game history regardless of the game privacy setting
*/

const server = http.createServer(function (request, response) {
    console.log(request.url);
    if(request.method === "GET"){
        if(request.url.startsWith("/api/getProfile") ){
            let usernameParam = request.url.slice(request.url.indexOf("username")+9, request.url.indexOf("&"));
            let requesterParam = request.url.slice(request.url.indexOf("requestedBy")+12);
            let user = users.filter((user) => {
                return user.username == usernameParam;
            });
            if(user.length === 1){
                user = user[0];
                let playerGames = games.filter((game) => (game.players.player1 === user.username || game.players.player2 === user.username)&&(game.turn !== null));

                if(user.friends.find(friend => friend === requesterParam)){
                    playerGames = playerGames.filter(game => game.privacy !== 3);
                }else if( usernameParam !== requesterParam){
                    playerGames = playerGames.filter(game => game.privacy !== 3 && game.privacy !== 2);
                }
                let gamesResponse = []
                for (let game of playerGames){
                    let opponent;
                    if(game.players.player1 === user.username){
                        opponent = game.players.player2;
                    }else{
                        opponent = game.players.player1;
                    }
                    gamesResponse.push({
                        id: game.id,
                        opponent: opponent
                    });
                }
                let historyResponse = [];
                for (let id of user.gameHistory){
                    let opponent;
                    game = games.filter((game) => game.id === id)[0];
                    if(game.players.player1 === user.username){
                        opponent = game.players.player2;
                    }else{
                        opponent = game.players.player1;
                    }
                    historyResponse.push({
                        id: id,
                        opponent: opponent,
                        win: game.winner === user.username
                    });
                }
                
                let responseObject = {
                username: user.username,
                gamesPlayed: user.stats.gamesPlayed,
                gamesWon: user.stats.gamesWon,
                totalMoves: user.stats.totalMoves,
                privacy: user.privacy,
                gamesList: gamesResponse,
                gameHistory: historyResponse
                };

                response.statusCode = 200;
                response.setHeader("Content-Type", "application/json");
                response.write(JSON.stringify(responseObject));
                response.end();
            }else{
                response.statusCode = 404;
                response.end();
            }
        }else if(request.url.startsWith("/api/friends")){
            let usernameParam = request.url.slice(request.url.indexOf('=')+1);
            let user = users.filter((user) => {
                return user.username == usernameParam;
            });
            if (user.length === 1){
                let friendListResponse = []
                for(let friend of user[0].friends){
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
                for (let req of user[0].friendRequests){
                    friendRequestResponse.push({
                        name: req,
                        canView: users.find((user) => user.username === req).privacy === "Public"
                    });
                }


                let responseObject = {
                    friends: friendListResponse,
                    friendRequests: friendRequestResponse
                };

                response.statusCode = 200;
                response.setHeader("Content-Type", "application/json");
                response.write(JSON.stringify(responseObject));
                response.end();
            }else{
                response.statusCode = 404;
                response.end();
            }
        }else if (request.url.startsWith("/api/searchUsers")){
            let usernameParam = request.url.slice(request.url.indexOf('=')+1);
            if (usernameParam){
                let userList = []
                for (let user of users.filter((user) => user.username.toLowerCase().includes(usernameParam.toLowerCase()) && user.privacy === 'Public')){
                    userList.push(user.username);
                }
                response.statusCode = 200;
                response.setHeader("Content-Type", "application/json");
                response.write(JSON.stringify({users: userList}));
                response.end();
            }else{
                response.statusCode = 200;
                response.setHeader("Content-Type", "application/json");
                response.write(JSON.stringify({users: []}));
                response.end();
            }
        }else if(request.url.startsWith("/api/getGame")){
            let gameIdParam = parseInt(request.url.slice(request.url.indexOf('=')+1));
            if (gameIdParam || gameIdParam === 0){
                game = games.filter((game) => game.id === parseInt(gameIdParam))[0];
                response.statusCode = 200;
                response.setHeader("Content-Type", "application/json");
                response.write(JSON.stringify(game));
                response.end();
            }else{
                response.statusCode = 404;
                response.end();
            }
        }else if (request.url.startsWith("/api/getActiveGames")){
            let usernameParam = request.url.slice(request.url.indexOf('=')+1);
            let user = users.filter((user) => {
                return user.username == usernameParam;
            })[0];
            if (user){
                let playerGames =  games.filter((game) => (game.turn === usernameParam));
                let gamesResponse = [];
                for (let game of playerGames){
                    let opponent;
                    if(game.players.player1 === user.username){
                        opponent = game.players.player2;
                    }else{
                        opponent = game.players.player1;
                    }
                    gamesResponse.push({
                        id: game.id,
                        opponent: opponent
                    });
                }
                response.statusCode = 200;
                response.setHeader("Content-Type", "application/json");
                response.write(JSON.stringify(gamesResponse));
                response.end()
            }else{
                response.statusCode = 404;
                response.end();
            }
        }else if (request.url.startsWith("/api/getOpponents")){
            let usernameParam = request.url.slice(request.url.indexOf('=')+1);
            let user = users.filter((user) => {
                return user.username == usernameParam;
            })[0];
            if (user){
                response.statusCode = 200;
                response.setHeader("Content-Type", "application/json");
                response.write(JSON.stringify({friends: user.friends}));
                response.end()
            }else{
                response.statusCode = 404;
                response.end();
            }
        }else{
        //console.log("Unknown resource.");
        response.statusCode = 400;
        //response.write("Unknwn resource.");
        response.end();
        }
    }else if (request.method === "POST"){
        //TODO: Remove game objects from login response
        if(request.url === "/api/login"){
            let postData = "";
            request.on("data", chunk => postData += chunk);
            request.on("end", () => {
                postData = JSON.parse(postData);
                user = users.filter(user => postData.username === user.username);
                //If user credentials are valid
                if(user[0] && user[0].password === postData.password){
                    user[0].online = true;
                    //Filter the games list to only return the games where the user is a player
                    let playerGames =  games.filter((game) => (game.turn === postData.username));
                    let gamesResponse = [];
                    for (let game of playerGames){
                        let opponent;
                        if(game.players.player1 === user[0].username){
                            opponent = game.players.player2;
                        }else{
                            opponent = game.players.player1;
                        }
                        gamesResponse.push({
                            id: game.id,
                            opponent: opponent
                        });
                    }
                    response.statusCode = 200;
                    response.setHeader("Content-Type", "application/json");
                    response.write(JSON.stringify(gamesResponse));
                    response.end()
                }else{
                    response.statusCode = 401;
                    response.end()
                }
            });
        }else if(request.url === "/api/register"){
            let postData = "";
            request.on("data", chunk => postData += chunk);
            request.on("end", () =>{
                postData = JSON.parse(postData);
                if(users.filter(user => postData.username === user.username).length === 0){
                    newUser = {
                        username: postData.username,
                        password: postData.password,
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
                    response.statusCode = 200;
                    response.end();
                }else{
                    response.statusCode = 409;
                    response.end();
                }

            });
        }else if(request.url === "/api/acceptFriendRequest"){
            let postData = "";
            request.on("data", chunk => postData += chunk);
            request.on("end", () => {
                postData = JSON.parse(postData);
                user = users.filter(user => postData.username === user.username);
                //If user credentials are valid
                if(user.length === 1){
                    user[0].friendRequests = user[0].friendRequests.filter(user => {user !== postData.friend});
                    user[0].friends.push(postData.friend);
                    response.statusCode = 200;
                    response.end()
                }else{
                    response.statusCode = 404;
                    response.end()
                }
            });
        }else if(request.url === "/api/sendFriendRequest"){
            let postData = "";
            request.on("data", chunk => postData += chunk);
            request.on("end", () => {
                postData = JSON.parse(postData);
                user = users.filter(user => postData.friend === user.username);
                //If user credentials are valid
                if(user.length === 1){
                    user[0].friendRequests.push(postData.username);
                    response.statusCode = 200;
                    response.end()
                }else{
                    response.statusCode = 404;
                    response.end()
                }
            });
        }else if (request.url === "/api/newGame"){
            let postData = "";
            request.on("data", chunk => postData += chunk);
            request.on("end", () => {
                postData = JSON.parse(postData);
                availableGame = games.filter((game) => game.players.player2 === "Random Opponent" && game.privacy === postData.privacy)[0];
                if (availableGame && postData.opponent === "Random Opponent"){
                    availableGame.players.player2 = postData.username;
                    response.statusCode = 200;
                    response.setHeader("Content-type", "application/json");
                    response.write(JSON.stringify({id: availableGame.id}));
                    response.end();
                }else{
                    let newGame = {
                        id: nextId,
                        board: [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
                        players: {
                            player1: postData.username,
                            player2: postData.opponent
                        },
                        turn: postData.username,
                        winner: null,
                        chats: [],
                        privacy: parseInt(postData.privacy)
                    };
                    games.push(newGame);
                    response.statusCode = 200;
                    response.setHeader("Content-type", "application/json");
                    response.write(JSON.stringify({id: nextId}));
                    response.end();
                    nextId++;
                }
            });
        }else{
            //console.log("Unknown resource.");
            response.statusCode = 400;
            //response.write("Unknown resource.");
            response.end();
        }
    }else if(request.method === "PUT"){
        if (request.url === "/api/privacy"){
            let putData = "";
            request.on("data", chunk => putData += chunk);
            request.on("end", () => {
                putData = JSON.parse(putData);
                user = users.filter(user => putData.username === user.username);
                if(user.length === 1){
                    user[0].privacy = putData.privacy;
                    response.statusCode = 200;
                    response.end();
                }else{
                    response.statusCode = 404;
                    response.end();
                }
            });
        }else if(request.url.startsWith("/api/logout")){
            let putData = "";
            request.on("data", chunk => putData += chunk);
            request.on("end", () => {
                putData = JSON.parse(putData);
                user = users.filter(user => putData.username === user.username);
                if(user.length === 1){
                    user[0].online = false;
                    response.statusCode = 200;
                    response.end();
                }else{
                    response.statusCode = 404;
                    response.end();
                }
            });
        }else if(request.url === "/api/move"){
            let putData = "";
            request.on("data", chunk => putData += chunk);
            request.on("end", () => {
                putData = JSON.parse(putData);
                let game = games.filter(game => putData.id === game.id)[0];
                if(game){

                    for (let i = 0; i<game.board.length; i++){
                        for(let j = 0; j< game.board[i].length; j++){
                            if (game.board[i][j] !== putData.board[i][j]){
                                game.moveOrder.push(j);
                            }
                        }
                    }

                    game.board = putData.board
                    if(putData.username === game.players.player1){
                        game.turn = game.players.player2;
                    }else{
                        game.turn = game.players.player1;
                    }
                    if(game.winner !== null){
                        game.winner = putData.winner;
                        winner = users.filter(user => user.username === putData.username)[0];
                        winner.stats.gamesPlayed++;
                        winner.stats.gamesWon++;
                        winner.stats.gameHistory.push(game.id);
                        loser = users.filter(user => user.username === putData.opponent)[0];
                        loser.stats.gamesPlayed++;
                        loser.gameHistory.push(game.id);
                    }
                    
                    users.filter(user => user.username === putData.username)[0].stats.totalMoves++;

                    response.statusCode = 200;
                    response.end();
                }else{
                    response.statusCode = 404;
                    response.end();
                }
            });
        }else if (request.url === "/api/forfeit"){
            let putData = "";
            request.on("data", chunk => putData += chunk);
            request.on("end", () => {
                putData = JSON.parse(putData);
                let game = games.filter(game => putData.id === game.id)[0];
                if(game){
                    game.turn = null;
                    if(putData.username === game.players.player1){
                        game.winner = game.players.player2;
                    }else{
                        game.winner = game.players.player1;
                    }

                    winner = users.filter(user => user.username === game.winner)[0];
                    winner.stats.gamesPlayed++;
                    winner.stats.gamesWon++;
                    winner.gameHistory.push(game.id);
                    loser = users.filter(user => user.username === putData.username)[0];
                    loser.stats.gamesPlayed++;
                    loser.gameHistory.push(game.id);

                    response.statusCode = 200;
                    response.end();
                }else{
                    response.statusCode = 404;
                    response.end();
                }
            });
        }else if (request.url === "/api/sendMessage"){

            let putData = "";
            request.on("data", chunk => putData += chunk);
            request.on("end", () => {
                putData = JSON.parse(putData);
                let game = games.filter(game => putData.id === game.id)[0];
                if(game){
                    game.chats.push({
                        player: putData.username,
                        message: putData.message
                    });
                    response.statusCode = 200;
                    response.end();
                }else{
                    response.statusCode = 404;
                    response.end();
                }

            });
        }else{
            response.statusCode = 400;
            response.end()
        }
    }else if(request.method === "DELETE"){
        if(request.url === "/api/rejectFriendRequest"){
            let delData = "";
            request.on("data", chunk => delData += chunk);
            request.on("end", () => {
                delData = JSON.parse(delData);
                user = users.filter(user => delData.username === user.username);
                if(user.length === 1){
                    user[0].friendRequests = users[0].friendRequests.filter(user => user !== delData.friend);
                    response.statusCode = 200;
                    response.end();
                }else{
                    response.statusCode = 404;
                    response.end();
                }
            });
        }else if(request.url === "/api/removeFriend"){
            let delData = "";
            request.on("data", chunk => delData += chunk);
            request.on("end", () => {
                delData = JSON.parse(delData);
                user = users.filter(user => delData.username === user.username);
                if(user.length === 1){
                    user[0].friends = users[0].friends.filter(user => user !== delData.friend);
                    oldFriend = users.filter(user => user.username === delData.friend)[0];
                    oldFriend.friends = oldFriend.friends.filter(user => user !== delData.username);
                    response.statusCode = 200;
                    response.end();
                }else{
                    response.statusCode = 404;
                    response.end();
                }
            });
        }else{
            response.statusCode = 400;
            response.end();
        }
    }else{
        response.statusCode = 400;
        response.end()
    }
});


server.listen(3000);
console.log('Server running at http://127.0.0.1:3000');