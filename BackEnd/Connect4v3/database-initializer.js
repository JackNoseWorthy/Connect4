let users = [
    {
      "username": "Jack",
      "password": "1234qwer",
      "privacy": "Public",
      "online": false,
      "stats": {
        "gamesPlayed": 0,
        "gamesWon": 0,
        "totalMoves": 0
      },
      "friends": [],
      "friendRequests": [],
      "gameHistory": []
    },
    {
      "username": "Dave",
      "password": "1234qwer",
      "privacy": "Public",
      "online": false,
      "stats": {
        "gamesPlayed": 0,
        "gamesWon": 0,
        "totalMoves": 0
      },
      "friends": [],
      "friendRequests": [],
      "gameHistory": []
    }
  ];

  let games = [
    {
      "id": 0,
      "board": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "moveOrder": [],
      "players": {
        "player1": "Jack",
        "player2": "Dave"
      },
      "turn": "Jack",
      "winner": null,
      "forfeit": false,
      "chats": [],
      "privacy": 1,
      "currViewers": []
    }
  ]

let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;

MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) throw err;	

  db = client.db('connect4');
  
  db.collection("users").insertOne({a:1}, function(err, result){
	  if(err) throw err;
  
	  db.collection("users").drop(function(err, delOK){
		if(err) throw err;
		
		console.log("Cleared users, if they existed already.");
		db.collection("users").insertMany(users, function(err, result){
			if(err) throw err;
			console.log("Successfuly inserted " + result.insertedCount + " users.")
			process.exit();
		})
	  });
  });

  db.collection("games").insertOne({a:1}, function(err, result){
    if(err) throw err;

    db.collection("games").drop(function(err, delOK){
      if(err) throw err;
      
      console.log("Cleared games, if they existed already.");
      db.collection("games").insertMany(games, function(err, result){
          if(err) throw err;
          console.log("Successfuly inserted " + result.insertedCount + " games.")
          process.exit();
      })
    });
  });

});