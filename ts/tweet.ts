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
        // Strip URLs and hashtags
        let stripped = this.text.replace(/https?:\/\/\S+/g, "")
                                .replace(/#\S+/g, "")
                                .trim();

        // Remove default RunKeeper phrases
        const defaults = [
            "just completed", "just posted", "check it out",
            "watch my run right now", "achieved a new personal record",
            "with @runkeeper"
        ];
        for (const phrase of defaults) {
            stripped = stripped.replace(new RegExp(phrase, "ig"), "");
        }

        // If meaningful characters remain, it’s user-written
        return stripped.replace(/[^a-zA-Z0-9]/g, "").length > 0;
    }

    get writtenText():string {
        if (!this.written) return "";

        return this.text
            .replace(/https?:\/\/\S+/g, "")
            .replace(/#\S+/g, "")
            .replace(/with @runkeeper/gi, "")
            .replace(/check it out/gi, "")
            .trim();
    }

    get activityType():string {
        if (this.source !== "completed_event") return "unknown";
        const match = this.text.toLowerCase().match(/(\d+(\.\d+)?)\s*(km|mi)\s+(\w+)/);
        if (match && match[4]) return match[4];
        // Fallback if not matched (some tweets say "activity" instead)
        const alt = this.text.toLowerCase().match(/\s(a|an)\s(\w+)\s(with|in|on)/);
        return alt && alt[2] ? alt[2] : "unknown";
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
        return `<tr>
                    <td>${rowNumber}</td>
                    <td>${type}</td>
                    <td><a href="${href}" target="_blank">${userText}</a></td>
                </tr>`;
    }
}