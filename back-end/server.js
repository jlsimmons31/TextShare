const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const webPush = require('web-push');
const moment = require('moment');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// connect to the mongodb database
mongoose.connect('mongodb://text-share:txt-j93-M3J@johnlsimmons.com:27017/text-share', {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
const textSchema = new mongoose.Schema({
	text: String,
	modified: Date
});
const Text = mongoose.model('Text', textSchema);

// push notifications
const pubKey = "BC4yQNCgkoLAGPLDZRPVD3iQll7lhnKUETgWin6PjP4vOs_S-IS8ojb-xU8tks9zi3B4ZLJNfuzt04iVvUe7sbY";
const privKey = "_0RjQO921seP8xtDuYH0RIlsU0__cEUl3kaZBCC5mKo";
webPush.setVapidDetails("mailto:johnny.simmons@outlook.com", pubKey, privKey);

// var subscriptions = ;
var subscriptions = new Map();


app.post("/api/subscribe/:id", async (req, res) => {
	try {
		let subs = subscriptions.get(req.params.id);
		if (!subs)
			subs = [ req.body ];
		else
			subs.push(req.body);
		subscriptions.set(req.params.id, subs);

		// console.log("Successful subscription from client: " + req.query.clientId + " for text id " + req.params.id);
		res.sendStatus(200);
	}
	catch (ex) {
		console.log(ex);
		res.sendStatus(500);
	}
});

//

app.get("/api/:id", async (req, res) => {
	try {
		let txt = await Text.findById(req.params.id);
		res.send({ text: txt.text });
	}
	catch (ex) {
		console.log(ex);
		res.sendStatus(500);
	}
});

app.post("/api", async (req, res) => {
	// console.log("posting");
	try {
		var txt = new Text({ modified: Date() });
		txt.save();
		subscriptions.set(txt._id, []);
		res.send({ "NewTextID": txt._id });
	}
	catch (ex) {
		console.log(ex);
		res.sendStatus(500);
	}
});

app.put("/api/:id", async (req, res) => {
	try {
		let txt = await Text.findById(req.params.id);
		txt.text = req.body.text; // might be quicker if we don't have to parse anything
		txt.modified = moment();
		await txt.save();
		res.sendStatus(200);

		//Notify subscribed of changes
		let subs = subscriptions.get(req.params.id);
		subs.forEach(s => {
			let payload = JSON.stringify({ clientId: req.body.clientId });
			webPush.sendNotification(s, payload);
			// console.log("sent push for text id: " + req.params.id);
		});
		
		// if (subscriptions.length) {
		// 	let payload = JSON.stringify({ clientId: req.body.clientId });
		// 	webPush.sendNotification(subscription, payload);
		// 	console.log("sent push");
		// }
	}
	catch (ex) {
		console.log(ex);
		res.sendStatus(500);
	}
});

app.delete("/api/:id", async (req, res) => {
	try {
		await Text.deleteOne({ _id: req.params.id });
		res.sendStatus(200);
	}
	catch (ex) {
		console.log(ex);
		res.sendStatus(500);
	}
});

// // POST from now on so clients can send beacons...
// app.post("/api/delete/:id", async (req, res) => {
// 	try {
// 		await Text.deleteOne({ _id: req.params.id });
// 		res.sendStatus(200);
// 	}
// 	catch (ex) {
// 		console.log(ex);
// 		res.sendStatus(500);
// 	}
// });

// Some periodic cleanup

async function cleanup() {
	var deletionCount = 0;
	Text.find({}).then(t => {
		t.forEach(x => {
			var diffMinutes = moment().diff(x.modified, 'minutes');
			if (diffMinutes > 60) {
				deletionCount++;
				subscriptions.delete(x._id);
				x.delete();
			}
		});
		console.log("Cleanup completed at " + moment().format("hh:mm:ss") + ". " + deletionCount + " items deleted");
	});
}
var cleanupTimer = setInterval(cleanup, 3600000); // 60 minutes

app.listen(3999, () => console.log("Listening on port 3999"));