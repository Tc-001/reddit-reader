var synth = window.speechSynthesis;
const params = new URLSearchParams(window.location.search);
synth.cancel()

const current_sub = params.get('r')
const current_id = params.get('i')

var progress_max = 100


//This makes sure that you cannot double play a story if it is already playing.
//It gets reset only after full completion of the story.
//May cause bugs in the future if the playback breaks for any reason.
var playback_in_progress = false 	

console.log([current_sub,current_id]);

if (current_sub !== null && current_id !== null) {
	document.getElementById('main_sub').textContent = 'r/'+current_sub
	load_text(current_sub, current_id)
} else {
	document.getElementById('player_wrap').style.display = 'none'
}

var text = [] //Here is where the tts goes

//API is api.reddit.com
//Basic usage: https://api.reddit.com/r/maliciouscompliance/best
/* Returns json:
{data: {children: [{data: {name:"", selftext:""}}]}
} */

function start_playback(e) {
	if (playback_in_progress) {
		synth.resume()
		return
	}
	playback_in_progress = true
	for (const story of text) {
		story_split = story.text.split('.')
		progress_max = story_split.length
		document.getElementById('progress_bar').max = progress_max
		read(story.usr+" writes "+story.title).then(() => play(story_split))
	}
}

function play(sentences) {
	var sentence = sentences.shift()
	//Sets the progress bar at the bottom of the page
	document.getElementById('progress_bar').style.width = 100-(sentences.length / progress_max * 100) + "%"  
	if (sentence === undefined) {
		//If the array has ended, the shift() will return undefined, in that case, end the story
		playback_in_progress = false
		console.log("End");
		return
	}
	read(sentence).then(() => play(sentences))
	return
}

function pause_playback(e) {
	synth.pause()
}

function add_card(subreddit, title, id) {
	//this formats the suggestion cards to have all the reuiered parts
	var card = document.createElement("div")
	card.id = "suggestion_card"
	var subspan = document.createElement("span")
	var titlespan = document.createElement("span")
	subspan.className = "card_subreddit"
	titlespan.className = "card_topic"
	subspan.appendChild(document.createTextNode('r/'+subreddit))
	titlespan.appendChild(document.createTextNode(title))
	card.appendChild(subspan)
	card.appendChild(document.createElement("br"))
	card.appendChild(titlespan)
	var link = document.createElement('a')
	link.href = window.location.href.split('?')[0]+'?r='+subreddit+'&i='+id
	link.appendChild(card)
	document.getElementById('suggestion_wrap').appendChild(link)

}

function load_text(subreddit, id) {
	//this grabs the currently selected story and formats it to tts
	fetch("https://api.reddit.com/r/"+subreddit+"/comments/"+id+"/").then(x => x.json()).then(res => {
		post = res[0].data.children[0]
		text = [{usr: post.data.author, text: post.data.selftext.replace(/\\\w/g), title:post.data.title}]
		document.getElementById('main_title').textContent = post.data.title
		document.getElementById('play').disabled = false
	})
	
}

function read(text) { 
	//This initiates any and all reading, it is a future-proofing think in case I want to add more tts options
	var utterance = new SpeechSynthesisUtterance(text)
	document.getElementById('post_text').textContent = text
	return new Promise(res => {
		utterance.onend = res
		synth.speak(utterance)
	})
}

//populates the recommended feed, by grabbing all posts from a specific subreddit
//I plan to later let the user choose what subs to show, and a shuffle to keep it fresh
fetch('https://api.reddit.com/r/maliciouscompliance/hot').then(res => res.json()).then(posts => {
	posts.data.children.forEach(post => {
		add_card(post.data.subreddit,post.data.title, post.data.id)
	});
})