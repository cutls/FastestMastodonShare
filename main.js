window.onload = function() {
    chrome.tabs.getSelected(null, function(tab) {
    if(~location.search.indexOf("setlang")){
        if(location.pathname=="/index.html"){
            //NowEnglishBrowsing
            localStorage.setItem("lang", "en");
        }else{
            //NowJapaneseBrowsing
            localStorage.setItem("lang", "ja");
        }
    }else{
    if(location.pathname=="/index.html"){
        //NowEnglishBrowsing
        if(localStorage.getItem("lang")=="ja"){
            location.href="index.ja.html"
        }else{
            localStorage.setItem("lang", "en");
        }
    }else{
        //NowJapaneseBrowsing
        if(localStorage.getItem("lang")!="ja"){
            location.href="index.html"
        }
    }
    }
    errorEL=document.getElementById("error");
    if(~location.search.indexOf("option")){
		option();
	}else if(localStorage.getItem("at")){
        toot(tab.title,tab.url);
    }else{
        document.getElementById("toot").classList.add("hide");
        document.getElementById("login").classList.remove("hide");
    }
});
}
document.getElementById("login-btn").addEventListener('click', login, false);
function login(){
    var red = "urn:ietf:wg:oauth:2.0:oob";
    var url=document.getElementById("login-form").value;
    localStorage.setItem("domain",url);
    var start = "https://" + url + "/api/v1/apps";
	var httpreq = new XMLHttpRequest();
	httpreq.open('POST', start, true);
	httpreq.setRequestHeader('Content-Type', 'application/json');
	httpreq.responseType = "json";
	httpreq.send(JSON.stringify({
		scopes: 'read write',
		client_name: "FastestMastodonShare",
		redirect_uris: red,
		website: "https://thedesk.top"
	}));
    httpreq.onreadystatechange = function() {
		if (httpreq.readyState === 4) {
			var json = httpreq.response;
			var auth = "https://" + url + "/oauth/authorize?client_id=" + json[
				"client_id"] + "&client_secret=" + json["client_secret"] +
			"&response_type=code&redirect_uri="+red+"&scope=read+write";
		localStorage.setItem("client_id", json["client_id"]);
        localStorage.setItem("client_secret", json["client_secret"]);
          document.getElementById("login").classList.add("hide");
          document.getElementById("auth").classList.remove("hide");
          chrome.windows.create({
            url: auth, 
            type: 'popup',
            width: 400, 
            height: 400
        });
		}
	}
}
document.getElementById("auth-btn").addEventListener('click', auth, false);
function auth() {
	var red = "urn:ietf:wg:oauth:2.0:oob";
    var url=document.getElementById("login-form").value
    var code=document.getElementById("auth-form").value;
	var start = "https://" + url + "/oauth/token";
	var id = localStorage.getItem("client_id");
	var secret = localStorage.getItem("client_secret");
	fetch(start, {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			grant_type: "authorization_code",
			redirect_uri: red,
			client_id: id,
			client_secret: secret,
			code: code
		})
	}).then(function(response) {
		return response.json();
	}).catch(function(error) {
		errorEL.innerHTML=error;
	}).then(function(json) {
		if (json["access_token"]) {
            localStorage.removeItem("client_id");
	        localStorage.removeItem("client_secret");
            localStorage.setItem("at", json["access_token"]);
            document.getElementById("auth").classList.add("hide");
            errorEL.innerHTML="Close Mastodon login window";
            option();
		}else{
            errorEL.innerHTML="Error: no valid token";
        }
    });
}
function option(){
    document.getElementById("toot").classList.add("hide");
    document.getElementById("option").classList.remove("hide");
    var sec = localStorage.getItem("sec");
    var vis = localStorage.getItem("vis");
    var templete = localStorage.getItem("templete");
    if(templete){
        document.getElementById("toot-templete").value=templete;
    }
    if(vis){
        document.getElementById("visible").value=vis;
    }
    if(sec){
        document.getElementById("toot-sec").value=sec;
    }
}
document.getElementById("optionSet-btn").addEventListener('click', optionSet, false);
function optionSet(){
    var vis = document.getElementById("visible").value;
    var sec = document.getElementById("toot-sec").value;
    var templete = document.getElementById("toot-templete").value;
    if(!sec || sec==""){
        sec=5;
    }
    localStorage.setItem("sec",sec);
    localStorage.setItem("vis",vis);
    localStorage.setItem("templete",templete);
    window.close();
}
function tootResize(){
    const target = document.getElementById("toot-txt");
    let lineHeight = Number(target.getAttribute("rows"));
    while (target.scrollHeight > target.offsetHeight){
        lineHeight++;
        target.setAttribute("rows", lineHeight);
    }
}
function toot(title,url){
    var templete = localStorage.getItem("templete");
    if(!templete){
        templete="{{title}} - {{url}}";
    }
    console.log(templete);
    var regExp = new RegExp("{{title}}", "g");
    templete = templete.replace(regExp, title);
    var regExp = new RegExp("{{url}}", "g");
    templete = templete.replace(regExp, url);
    document.getElementById("toot-txt").value=templete;
    var sec = localStorage.getItem("sec")*1000;
    if(!sec || sec==""){
        sec=5000;
    }
    var count = 0;
    var seek = document.getElementById("seek")
    var countup = function(){
        count=count*1+100;
        var per=count/sec*100;
        if(per<=100){
            seek.innerHTML=Math.round(per);
        }
    }
    id = setInterval(function(){
        countup();
        tootResize()
        if(count > sec){
            clearInterval(id);
            execToot();
        }
    }
    , 100);
}
document.getElementById("toot-btn").addEventListener('click', execToot, false);
function execToot(){
	var domain = localStorage.getItem("domain");
	var at = localStorage.getItem("at");
	var start = "https://" + domain + "/api/v1/statuses";
    var str=document.getElementById("toot-txt").value;
    var vis = localStorage.getItem("vis");
    if(!vis){
        vis="public";
    }
	var toot={
        status: str,
        visibility: vis
	}
	var httpreq = new XMLHttpRequest();
	httpreq.open('POST', start, true);
	httpreq.setRequestHeader('Content-Type', 'application/json');
	httpreq.setRequestHeader('Authorization', 'Bearer ' + at);
	httpreq.responseType = "json";
	httpreq.send(JSON.stringify(toot));
    httpreq.onreadystatechange = function() {
		if (httpreq.readyState === 4) {
			window.close();
		}
	}
}
document.getElementById("cancel-btn").addEventListener('click', cancel, false);
function cancel(){
    clearInterval(id);
}
document.getElementById("clear-btn").addEventListener('click', clear, false);
function clear(){
    localStorage.clear();
    location.reload;
}