Jack Noseworthy
101156279
COMP2406 Project Checkin #3

Connect4 (solo project)

Note that instructions on how to visit my open stack instance are in the ProjectReport.pdf file.

Some notes on the layout of my project file (in case you want to look at the files or run my project locally):
	The /FrontEnd folder contains all of the front end angular stuff (cd to /FrontEnd, npm install, then npm start to run on localhost:4200). This was included because the static files are pretty much illegible (because of how angular works).
	Inside of the /BackEnd folder, the dev-server.js can be run in conjunction with the front end in dev mode (cd to /BackEnd, npm install, then node database-initializer.js to initialize the db (make sure you have mongo daemon running), then node dev-server.js). The server and front end connect via a proxy
	*NOTE These files (the files in /FontEnd and the dev server) are not what should be run to evaluate my code. They are included so that you can read the front end files.
	The server.js file in the /BackEnd folder can be ignored. It was from the previous checkin.
	The /BackEnd/Connect4v1, v2, and v3 folders can be ignored. They are previous versions.
	The /BackEnd/Connect4v4 folder contains the same thing as what is hosted on OpenStack.
