function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	const tweets = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));
	const completed = tweets.filter(t => t.source === "completed_event");

	// Count activity types 
	const activityCounts = {};
	for (const t of completed) {
		const act = t.activityType;
		if (act === "unknown") continue;
		if (!activityCounts[act]) activityCounts[act] = 0;
		activityCounts[act]++
	}

	// Sort and get top three
	const sorted = Object.entries(activityCounts)
		.sort((a, b) => b[1] - a[1]);
	const top3 = sorted.slice(0, 3);

	document.getElementById('numberActivities').innerText = Object.keys(activityCounts).length;
	document.getElementById('firstMost').innerText = top3[0][0];
	document.getElementById('secondMost').innerText = top3[1][0];
	document.getElementById('thirdMost').innerText = top3[2][0];

	// Vega-Lite: Activity frequency
	const freqData = sorted.map(([activity, count]) => ({ activity, count }));

	const activity_vis_spec = {
	  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
	  description: "A graph of the number of Tweets containing each type of activity.",
	  data: { values: freqData },
	  mark: "bar",
	  encoding: {
		x: { field: "activity", type: "nominal", sort: "-y", title: "Activity Type" },
		y: { field: "count", type: "quantitative", title: "Tweet Count" },
		color: { field: "activity", type: "nominal" }
	  }
	};
	vegaEmbed('#activityVis', activity_vis_spec, { actions: false });

	// Vega-Lite: Distance by day
	const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const distData = completed
		.filter(t => top3.some(([a]) => a === t.activityType))
		.map(t => ({
			activity: t.activityType,
			distance: t.distance,
			day: dayMap[t.time.getDay()]
		}));
	
	// Scatter plot: raw distances
	const distVis = {
		$schema: "https:vega.github.io/schema/vega-lite/v5.json",
		description: "Distance by day of week for top 3 activities",
		data: { values: distData },
		mark: "point",
		encoding: {
			x: { field: "day", type: "ordinal", sort: dayMap },
			y: { field: "distance", type: "quantitative", title: "Distance (mi)" },
			color: { field: "activity", type: "nominal" }
		}
	};
	vegaEmbed("#distanceVis", distVis, { actions: false });

	// Aggrevated means (average)
	const distAgg = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		description: "Average distance by day for top 3 activities",
		data: { values: distData },
		mark: "point",
		encoding: {
			x: { field: "day", type: "ordinal", sort: dayMap },
			y: { aggregate: "mean", field: "distance", type: "quantitative", title: "Avg Distance (mi)" },
			color: { field: "activity", type: "nominal" }
		}
	};
	vegaEmbed("#distanceVisAggregated", distAgg, { actions: false });

	// Toggle aggregated vs raw chart
	document.getElementById("distanceVisAggregated").style.display = "none";
	document.getElementById("aggregate").addEventListener("click", () => {
		const raw = document.getElementById("distanceVis");
		const agg = document.getElementById("distanceVisAggregated");
		if (raw.style.display === "none") {
			raw.style.display = "block";
			agg.style.display = "none";
			document.getElementById("aggregate").innerText = "Show means";
		} else {
			raw.style.display = "none";
			agg.style.display = "block";
			document.getElementById("aggregate").innerText = "Show all points";
		}
	});
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});