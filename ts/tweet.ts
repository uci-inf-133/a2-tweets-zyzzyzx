class Tweet {
	private text:string;
	time:Date;

	constructor(tweet_text:string, tweet_time:string) {
        this.text = tweet_text;
		this.time = new Date(tweet_time);//, "ddd MMM D HH:mm:ss Z YYYY"
	}

	//returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source(): string {
        const text = this.text.toLowerCase();
        if (text.startsWith("just completed") || text.startsWith("just posted a")) {
            return "completed_event";
        } else if (text.startsWith("watch my") || text.includes("#rklive")) {
            return "live_event";
        } else if (text.startsWith("achieved") || text.includes("personal record")) {
            return "achievement";
        } else {
            return "miscellaneous";
        }
    }

    //returns a boolean, whether the text includes any content written by the person tweeting.
    get written(): boolean {
        // Normalize and clean tweet text (remove URLs, hashtags, mentions)
        let cleaned = this.text.toLowerCase()
            .replace(/https?:\/\/\S+/g, "")
            .replace(/#\S+/g, "")
            .replace(/@\S+/g, "")
            .trim();

        // Direct signal — user-added dash comment at the end (e.g., " - felt good today")
        const dash = cleaned.match(/-\s*([^#@]+?)\s*$/);
        if (dash && /[a-z]{3,}/i.test(dash[1])) return true;

        // Remove default RunKeeper structure
        let s = cleaned.toLowerCase();
        s = s.replace(/^\s*just\s+(completed|posted)\b.*?\b(\d+(\.\d+)?)\s*(km|mi)\b\s+\w+\b/gi, "");
        s = s.replace(/^\s*just\s+(completed|posted)\b.*?\b(run|walk|ride|ride|bike|cycling|hike|swim|yoga|workout)\b/gi, "");

        // Remove common trailing phases found in auto-generated tweets  
        s = s.replace(/\bwith\s+@?runkeeper\b\.?/gi, "")
            .replace(/\bcheck\s+it\s+out!?/gi, "")
            .replace(/\blive\b/gi, "")
            .replace(/\bright\s+now\b/gi, "")
            .replace(/\bachieved\s+a\s+new\s+personal\s+record\b/gi, "")
            .replace(/\bnew\s+personal\s+record\b/gi, "");

        // Remove numbers, units, punctuation, and extra spaces
        s = s.replace(/\b\d+(\.\d+)?\s*(km|mi)\b/gi, "")
            .replace(/[^\p{L}\s]/gu, " ")
            .replace(/\s+/g, " ")
            .trim();

        // Filter out short or generic text that likely isn't written by the user
        const stop = new Set([
            "a","an","the","my","run","runs","running","walk","walked","ride","bike","biked",
            "activity","workout","morning","afternoon","evening","good","nice","great","slow","fast"
        ]);
        const words = s.split(" ").filter(w => w.length);
        const informative = words.filter(w => !stop.has(w));

        // Require at least 3 non-generic words to count as user-written text
        return informative.length >= 3;
    }

    get writtenText(): string {
        // Clean text
        const cleaned = this.text.replace(/https?:\/\/\S+/gi, "")
            .replace(/#\S+/g, "")
            .replace(/@\S+/g, "")
            .trim();
        
        // If a dash comment is found, return that as user-written text
        const dash = cleaned.match(/-\s*([^#@]+?)\s*$/);
        if (dash && /[a-z]{3,}/i.test(dash[1])) return dash[1].trim();

        // Otherwise, remove all default RunKeeper phrases
        let s = cleaned
            .replace(/^\s*just\s+(completed|posted)\b.*?\b(\d+(\.\d+)?)\s*(km|mi)\b\s+\w+\b/gi, "")
            .replace(/^\s*just\s+(completed|posted)\b.*?\b(run|walk|ride|bike|cycling|hike|swim|yoga|workout)\b/gi, "")
            .replace(/\bwith\s+@?runkeeper\b\.?/gi, "")
            .replace(/\bcheck\s+it\s+out!?/gi, "")
            .replace(/\bright\s+now\b/gi, "")
            .replace(/\bachieved\s+a\s+new\s+personal\s+record\b/gi, "")
            .replace(/\bnew\s+personal\s+record\b/gi, "")
            .replace(/\b\d+(\.\d+)?\s*(km|mi)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
        
        return s;
    }

    // Extract the type of physical activity (running, biking, walking, etc.)
    get activityType(): string {
        if (this.source !== "completed_event") return "unknown";

        const lower = this.text.toLowerCase();

        // Regex: find the word immediately following the distance + unit
        const match = lower.match(/\b\d+(\.\d+)?\s*(km|mi)\s+([a-z]+)/);
        if (match && match[3]) return match[3];

        // Fallback patterns (e.g., “just completed a run”)
        const alt = lower.match(/just\s+(completed|posted)\s+(a|an)?\s*(\w+)/);
        if (alt && alt[3]) return alt[3];

        return "unknown";
    }

    get distance():number {
        if (this.source !== "completed_event") return 0;
        const m = this.text.toLowerCase().match(/(\d+(\.\d+)?)\s*(km|mi)/);
        if (!m) return 0;
        let value = parseFloat(m[1]);
        const unit = m[3];
        if (unit === "km") value /= 1.609; // convert km -> mi
        return Math.round(value * 100) / 100; // 2 decimals
    }

    getHTMLTableRow(rowNumber:number):string {
        const link = this.text.match(/https?:\/\/\S+/);
        const href = link ? link[0] : "#";
        const userText = this.writtenText || "(no user text)";
        const type = this.activityType;
        const sentiment = getSentiment(this.writtenText);
        return `<tr>
                    <td>${rowNumber}</td>
                    <td>${type}</td>
                    <td><a href="${href}" target="_blank">${userText}</a></td>
                        <td>${sentiment}</td> <!-- ✅ New column -->
                </tr>`;
    }
}

// Sentiment helper function 
function getSentiment(text: string): string {
    const positives = ["great", "awesome", "good", "amazing", "strong", "fast", "happy", "fantastic", "love"];
    const negatives = ["tired", "sore", "bad", "hurt", "slow", "weak", "terrible", "awful"];
    let score = 0;

    const words = text.toLowerCase().split(/\W+/);
    for (const w of words) {
        if (positives.includes(w)) score++;
        else if (negatives.includes(w)) score--;
    }

    if (score > 0) return "😁 Positive";
    if (score < 0) return "☹️ Negative";
    return "😐 Neutral";
}