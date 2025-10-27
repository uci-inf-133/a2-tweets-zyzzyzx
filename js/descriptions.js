let writtenTweets = []; // store only user-written tweets

function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	// Convert loaded tweets to Tweet objects
	const tweetObjects = runkeeper_tweets.map(t => new Tweet(t.text, t.time));

	// Filter only user-written texts
	writtenTweets = tweetObjects.filter(t => t.written);
	console.log(`Loaded ${writtenTweets.length} user-written tweets.`);
}

function addEventHandlerForSearch() {
	const searchInput = document.getElementById("textFilter");
	const searchCount = document.getElementById("searchCount");
	const searchText = document.getElementById("searchText");
	const tableBody = document.getElementById("tweetTable");

	searchInput.addEventListener("input", () => {
		const query = searchInput.value.trim().toLowerCase();

		// Clear old results
		tableBody.innerHTML = "";

		// If query is empty, reset counts
		if (query === "") {
			searchCount.textContent = 0;
			searchText.textContent = "";
			return;
		}

		// Filter tweets containing the query
		const matches = writtenTweets.filter(t => t.text.toLowerCase().includes(query));

		// Update counts
		searchCount.textContent = matches.length;
		searchText.textContent = query;

		// Add matching tweets to table
		matches.forEach((t, i) => {
			tableBody.insertAdjacentHTML("beforeend", t.getHTMLTableRow(i + 1));
		});
	});
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
	loadSavedRunkeeperTweets().then(tweets => {
        parseTweets(tweets);
        addEventHandlerForSearch();
    });
});