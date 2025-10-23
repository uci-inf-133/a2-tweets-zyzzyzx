function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	// Convert raw tweets into Tweet objects
	const tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));
	
	//This line modifies the DOM, searching for the tag with the numberTweets ID and updating the text.
	//It works correctly, your task is to update the text of the other tags in the HTML file!
	document.getElementById('numberTweets').innerText = tweet_array.length; // Total count

	// Earliest and latest dates
	const times = tweet_array.map(t => t.time.getTime());
	const earliest = new Date(Math.min(...times));
	const latest = new Date(Math.max(...times));

	document.getElementById('firstDate').innerText = earliest.toLocaleDateString(
		'en-US',
		{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
	);
	document.getElementById('lastDate').innerText = latest.toLocaleDateString(
		'en-US',
		{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
	);

	// Counts and percentages
	let completed = 0, live = 0, achievements = 0, misc = 0;
	for (const tweet of tweet_array) {
		switch (tweet.source) {
			case 'completed_event': completed++; break;
			case 'live_event': live++; break;
			case 'achievement': achievements++; break;
			default: misc++; break;
		}
	}
	const total = tweet_array.length;
	const fmt = x => math.format(x, { notation: 'fixed', precision: 2});

	// Update counts
	document.querySelectorAll('.completedEvents').forEach(e => e.textContent = completed);
	document.querySelector('.completedEventsPct').textContent = fmt((completed/total)*100) + '%';
	document.querySelector('.liveEvents').textContent = live;
	document.querySelector('.liveEventsPct').textContent = fmt((live/total)*100) + '%';
	document.querySelector('.achievements').textContent = achievements;
	document.querySelector('.achievementsPct').textContent = fmt((achievements/total)*100) + '%';
	document.querySelector('.miscellaneous').textContent = misc;
	document.querySelector('.miscellaneousPct').textContent = fmt((misc/total)*100) + '%';

	// Written text
	const completedTweets = tweet_array.filter(t => t.source === 'completed_event');
	const writtenCount = completedTweets.filter(t => t.written).length;
	const writtenPct = (writtenCount / completedTweets.length) * 100;

	document.querySelector('.written').textContent = writtenCount;
	document.querySelector('.writtenPct').textContent = fmt(writtenPct) + '%';
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});