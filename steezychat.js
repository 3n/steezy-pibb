(function(){

///////////////////////////////////////////////////////////////////////////////
// Utility Functions

if (!Function.bind){
	Function.prototype.bind = function(bind, arg) {
		var fun = this
		return function(){ return fun.call(bind, arg) }
	}
}

function steezy_serialize(o) {
	var s = ""
	var x
	for (x in o){
		if (typeof o[x] !== 'function') s += (x + "::" + o[x] + ',,') 
	}
	return s.slice(0,-2)
}

function steezy_deserialize(s) {
	var obj = {}

	s.split(',,').forEach(function(x){
		var kv = x.split('::')
		obj[kv[0]] = kv[1]
	})

	return obj
}

// shitty, hacked function for inserting persistant debug comments on the page
function logg(message, id, doc, e){
	var elem = doc.getElementById(id)
	if (elem){
		elem.innerHTML = ''		
		elem.innerHTML = message
	}		
	else {
		var tmp = doc.createElement('div')
		tmp.innerHTML = ''
		tmp.innerHTML = message
		tmp.id = id
		e.appendChild(tmp)
	}		
}

var ChatRoom = function(client, browser) {

	// private	
	var self = {
		client							: client,
		browser							: browser,
		
		period 							: 1000,		
		my_bg_color 				: '#EEEEEE',
		important_bg_color 	: '#FFC670',	
		
		preferences_cookie: new CookieHash('steezy-preferences'),
		
		add_css_rules: function(){
			add_css_rule('#steezy-preferences', 'width:300px;text-align:left;font-size:10px;', self.client.doc())						
			add_css_rule('#aliases_text,#message_text', 		'padding:2px; width:200px !important;', self.client.doc())									
			add_css_rule('#steezy-preferences input', 'margin:5px', self.client.doc())									
			
			add_css_rule('.steezy-tag', 				'color:#222222; font-weight:bold; background:#f0e600; -webkit-border-radius:5px; padding:2px; -webkit-box-shadow:0 0 5px rgba(0, 0, 0, 0.5);', self.client.doc())						
			add_css_rule('.by-current-user', 		'background:' + self.my_bg_color + ' !important;color:#666;', self.client.doc())
			add_css_rule('.important-message', 	'background:' + self.important_bg_color + ';', self.client.doc())								
			
			add_css_rule('.steezy-new td', 	'background-color:#FFFFA0 !important;', self.client.doc())
		},
		
		new_messages : [],
		check_for_new_messages : function(){
			if (self.client.message_window()){
				var elems = self.client.get_new_message_elems()
				
				if (elems.length < self.new_messages.length)
					self.new_messages = []
				
				for (var i = self.new_messages.length; i < elems.length; i++)
					if (elems[i]) self.handle_new_message(elems[i])
			}
			window.setTimeout(self.check_for_new_messages, self.period)
		},
		handle_new_message: function(elem) {
			var message = new self.client.message(elem)
      var msg = message.body

      if (msg) {
        if (self.inline_images_checkbox.checked) 
  				msg += self.add_img_tags(msg)
  			if (self.inline_tweets_checkbox.checked) 				
        	msg += self.add_twitter_img_tags(msg)
  			if (self.emoticons_checkbox.checked)
        	msg =  self.add_emoticons(msg)
        if (self.videos_checkbox.checked) {
  				msg += self.add_youtube_embeds(msg)
  				msg += self.add_vimeo_embeds(msg)
  			}
  			msg += self.add_sad_trombone(msg)
        msg += self.add_gists(msg)
      }

      var from_current_user = self.get_aliases().some(function(a){ return message.author.toLowerCase() == a.toLowerCase() })

			// if message was written by current user
      if (from_current_user) {
				self.mark_all_read()
				message.mark_read(self.client.new_class, self.client.read_class)
				message.by_current_user = true		
				message.mark_by_current_user()
			}
			
			// if message has one of the words from the alias input in it
			if (msg && !from_current_user && self.get_aliases().some(function(a){ return (a.length > 0) && (message.body.match(new RegExp('\\b(' + a + ')\\b','i'))) })) {
				if (self.growl_checkbox.checked) self.browser.alert(message.author + " said", message.body, message.icon, self.growl_sticky_checkbox.checked)
				message.elem.className = message.elem.className + ' important-message'
        msg += self.add_haha(msg)
				if (self.away_checkbox.checked && self.away_message && self.away_message.value.length > 0) {
					self.client.message_input().value = "Auto Reply: " + self.away_message.value					
					var evt = document.createEvent("MouseEvents");
					evt.initMouseEvent("click", true, true, window,0, 0, 0, 0, 0, false, false, false, false, 0, null);
					self.client.post_button().dispatchEvent(evt);
				}
					
			}
			
			if (msg && Math.abs(self.client.message_window().scrollHeight - (self.client.message_window().scrollTop + self.client.message_window().offsetHeight)) < 10 )
  			var at_bottom = true
			
      message.elem.innerHTML = msg 
			self.highlight_aliases(message) 

			if (at_bottom) {
			  var time = msg.match(/twitctur/) ? 1200 : 650
			  setTimeout(self.scroll_message_window_to_bottom, time)
		  }
      
			if (!from_current_user) {
  			self.new_messages.push(message)
  			self.browser.set_counter(self.new_messages.length)
			}
		},
		
		scroll_message_window_to_bottom: function(){
			self.client.message_window().scrollTop = self.client.message_window().scrollHeight
		},
		
		highlight_aliases: function(message){
			var aliases = self.get_aliases()
			if (aliases) aliases.forEach(function(a){ wrap_in_span_tags(message.elem, a, 'steezy-tag') })
		},
		
		add_img_tags: function(message){
			var the_match = message.match(/([^"]http:\/\/[^<>]+\.(jpg|png|gif|jpeg))/gi)
			if (the_match)
			  return the_match.map(function(tm,i){
					return '<br /><img src="'+ tm.slice(1) + '" />'
				}).join('')
		  else
		    return ''
		},
		add_twitter_img_tags: function(message){
			var the_match = message.match(/http:\/\/twitter\.com\/[^<>\/]+\/statuses\/([0-9]+)/)
			if (the_match && the_match.length > 1)
			  return '<br /><img src="http://twictur.es/i/' + the_match[1] + '.gif" />'
		  else
		    return ''
		},
		
		add_sad_trombone: function(message) {
		  var the_match = message.match(/sadtrombone|wah/)
		  if (the_match) {
		    var embed = ' '
		    embed += '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,19,0" width="244" height="152">'
        embed += '<param name="movie" value="http://sadtrombone.com/sad_trombone.swf" />'
        embed += '<param name="quality" value="high" />'
        embed += '<param name="autoplay" value="true" />'
        embed += '</object>'
		    return embed
	    } else {
	      return ''
	    }
		},		
		add_haha: function(message) {
		  var the_match = message.match(/HAHA/)
		  if (the_match) {
		    var embed = ' '
		    embed += '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,28,0" width="400" height="373">'
        embed += '<param name="movie" value="http://crossgrain.info/haha/haha.swf" />'
        embed += '<param name="quality" value="high" />'
        embed += '<embed src="http://crossgrain.info/haha/haha.swf" quality="high" pluginspage="http://www.adobe.com/shockwave/download/download.cgi?P1_Prod_Version=ShockwaveFlash" type="application/x-shockwave-flash" width="400" height="373"></embed>'
        embed += '</object>'
        return embed
		  } else {
		    return ''
		  }
		},				
		add_emoticons: function(message) {
		  var base = '<img src="http://l.yimg.com/us.yimg.com/i/mesg/emoticons7/'
		  var end = '" />'
		  var emoticonned = message
  		  .replace(/:'-?\(/g, base + '20.gif' + end)
		    .replace(/:-?\)/g, base + '1.gif' + end)
		    .replace(/:-?\(/g, base + '2.gif' + end)
		    .replace(/:-?D/g, base + '4.gif' + end)
		    .replace(/8-?\)/g, base + '16.gif' + end)
		    .replace(/\*facepalm\*/g, '<img src="http://img.skitch.com/20081020-kqf6ar41tdrwiqp2k6ejhr3q3t.jpg" alt="facepalm">')
		    .replace(/tmyk/ig, '<img src="http://img.skitch.com/20081202-mfnhnh9nursmcs2fb8smj6w94q.jpg" alt="tmyk">')
		    .replace(/the more you know/gi, '<img src="http://img.skitch.com/20081202-nr24rt47pu6d26y3qnmu994cha.jpg" alt="the more you know">')
		    .replace(/8=+(>|D)/g, '<img src="http://img.skitch.com/20080801-f2k6r13iaw7xsrya39ftamugaa.png" />')
        .replace(/(DERP[!1]+)/g, '<img src="http://img.skitch.com/20080801-ehk4xc8n65xdx2sndc4scckyf2.jpg" alt="$1"/>')
        .replace(/^\*?ba+r+f+s*\*?/g, '<img src="http://img.skitch.com/20080808-t8shmyktk66i65rx425jgrrwae.jpg" alt="Achewood - October 3, 2006"/>')
        .replace(/do not want|dnw/gi, '<img src="http://img.skitch.com/20081031-1tt6dpsq42p85i2472xmc3yped.jpg" />')
        .replace(/odb/gi, '<img src="http://img.skitch.com/20081211-gwjfs9q8gcqjdq3sn6w13bd4at.jpg" alt="oh baby I like it raw"/>')
		  return emoticonned
		},		
		add_youtube_embeds: function(message){
		  var the_match = message.match(/youtube\.com\/watch\?v=([^&]+)/);
		  if (the_match) {
		    embed  = '<br />'
		    embed += '<object width="425" height="344">'
		    embed += '<param name="movie" value="http://www.youtube.com/v/' + the_match[2] + '&hl=pt-br&fs=1">'
		    embed += '</param><param name="allowFullScreen" value="true"></param>'
		    embed += '<embed src="http://www.youtube.com/v/' + the_match[2] + '&hl=pt-br&fs=1" type="application/x-shockwave-flash" allowfullscreen="true" width="425" height="344"></embed>'
		    embed += '</object>'
			  return embed
	    } else {
	      return ''
	    }
		},
		
		add_vimeo_embeds: function(message) {
		  var the_match = message.match(/vimeo.com\/\d{1,}/)
		  if (the_match) {
		    var id = the_match.toString().split('/')[1]
		    embed = '<br />'
		    embed += '<object width="501" height="334">'
		    embed += '<param name="allowfullscreen" value="true" />'
		    embed += '<param name="allowscriptaccess" value="always" />'
		    embed += '<param name="movie" value="http://vimeo.com/moogaloop.swf?clip_id=' + id
		    embed += '&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=a60011&amp;fullscreen=1" />'
		    embed += '<embed src="http://vimeo.com/moogaloop.swf?clip_id=' + id
		    embed += '&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=a60011&amp;fullscreen=1" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="501" height="334"></embed></object>'
		    return embed
	    } else {
	      return ''
		  }
		},
		
		add_gists: function(message) {
		  var the_match = message.match(/https?:\/\/gist\.github\.com\/\w{1,}/);
		  if (the_match) {
		    embed = "<br />"
		    embed += '<iframe width="100%" frameborder="0" src="' + the_match[0] + '.pibb" />'
		    return embed
		  } else {
		    return ''
		  }
		},
		
		setup_message_window_events: function(){
			if (self.client.message_window()){
				self.client.message_window().addEventListener('mousedown', self.message_window_mousedown, true)
				self.client.message_window().addEventListener('mouseup', self.message_window_clicked, true)
			} 
			window.setTimeout(self.setup_message_window_events, self.period)
		},
		message_window_mousedown : function(e){
			self.last_mousedown_x = e.clientX
		},
		message_window_clicked : function(e){
			if (e.clientX == self.last_mousedown_x)
				self.client.message_input().focus()
			self.mark_all_read()
		}, 
		mark_all_read : function() {
			self.new_messages.forEach(function(nm){ nm.mark_read(self.client.new_class, self.client.read_class) })
			self.new_messages = []
			self.browser.set_counter('')
		},
 
		insert_preferences_element: function(){
			if (!self.client.doc().getElementById('steezy-preferences')){
				self.preferences_element = document.createElement("form")
				self.preferences_element.id = "steezy-preferences"
				self.client.footer().appendChild(self.preferences_element)
				
				self.aliases_input 					= self.create_preference_element('aliases', 'text')		
				self.preferences_element.appendChild(document.createElement('br'))				
				self.growl_checkbox 				= self.create_preference_element('growls', 'checkbox', true)
				self.growl_sticky_checkbox 	= self.create_preference_element('sticky', 'checkbox')		
				self.preferences_element.appendChild(document.createElement('br'))				
				self.inline_images_checkbox = self.create_preference_element('images', 'checkbox', true)
				self.inline_tweets_checkbox = self.create_preference_element('tweets', 'checkbox', true)				
				self.videos_checkbox = self.create_preference_element('videos', 'checkbox', true)				
				self.emoticons_checkbox = self.create_preference_element('emoticons', 'checkbox', true)
				self.preferences_element.appendChild(document.createElement('br'))
				self.away_message 					= self.create_preference_element('message', 'text')		
				self.preferences_element.appendChild(document.createElement('br'))
				self.away_checkbox					= self.create_preference_element('away', 'checkbox')
			}
			window.setTimeout(self.insert_preferences_element, self.period)
		},
		create_preference_element: function(label_text, type, def){
			var cookie_name = label_text.replace(/\s/,'_') + '_' + type				
			
			var elem = document.createElement("input")			
			elem.className = "steezy-" + type		
			elem.id = cookie_name				
			elem.setAttribute("type", type);
			self.preferences_element.appendChild(elem)

			var label = document.createElement("label")
			label.className = 'steezy-label'			
			label.setAttribute('for', cookie_name)
			self.preferences_element.appendChild(label)
			label.innerHTML = label_text		

			switch(type){
				case 'checkbox': 
					if (self.preferences_cookie.get(cookie_name) == 'true')
						elem.checked = true
					else if (!self.preferences_cookie.get(cookie_name) && def)
						elem.checked = true
					else
						elem.checked = false
					elem.addEventListener('click', (function(cookie){ cookie.set(cookie_name, this.checked) }).bind(elem, self.preferences_cookie), true)
					break;
				case 'text':
					elem.value = self.preferences_cookie.get(cookie_name) || ''
					elem.addEventListener('keyup', (function(cookie){ cookie.set(cookie_name,this.value) }).bind(elem, self.preferences_cookie), true)
					break;
			}

			return elem
		},
		
		get_aliases: function(){
			if (self.aliases_input && self.aliases_input.value.length > 0)
				return self.aliases_input.value.split(',')
			else
				return []
		}
	};

	// public
	var that = {}
	
	// initialize
	self.add_css_rules()
	self.insert_preferences_element()	
	self.check_for_new_messages()	
	self.setup_message_window_events()

	return that
};


///////////////////////////////////////////////////////////////////////////////
// Utility Classes and Functions

var Cookie = function(key, value, max_days) {
	this.key = key
	
	if (max_days) {
		var tmp_date = new Date();
		tmp_date.setTime(tmp_date.getTime() + (max_days * 24 * 60 * 60 * 1000));
		this.expiry = '; expires=' + tmp_date.toGMTString()
	}
	
	this.set_value = function(val) {
		document.cookie = this.key + '=' + val.toString() + (this.expiry || '')
		return this
	}
	this.get_value = function() {
		var the_match = document.cookie.match(this.key + "=([^;]+)")
		if (the_match && the_match.length > 1) return the_match[1]
		else return null
	}
	this.clear = function(){
		return this.set_value('')
	}
	
	if (value) this.set_value(value)
	
	return this
}

var CookieHash = function(key) {
	this.coookie = new Cookie(key, null, 1000)
	this.obj = {}

	var prev = this.coookie.get_value()
	if (prev) this.obj = steezy_deserialize(prev)

	this.set = function(key, value){
		this.obj[key] = value
		this.coookie.set_value(steezy_serialize(this.obj))
	}
	this.get = function(key){
		if (this.obj[key])
			return this.obj[key].toString()
	}
	
	return this
}


function wrap_in_span_tags(element, what, class_name) {
	var re        	= new RegExp('\\b(' + what + ')\\b','ig');
	var text       	= element.innerHTML;
	var replaced   	= [];
	var result     	= '';

	if (text.match(re)) {
		result = text.split(/(<[^<>]*>)/).map(function(chunk,i){
			if (chunk[0] && chunk.match(/\w/) && (chunk.length > 0) && (chunk[0] != '<')){
				var the_match = chunk.match(re);
				if (the_match && the_match.length > 0) {
					replaced.push(the_match);
					return chunk.replace(re,'<span class="' + class_name + '">$1</span>');
				} else return chunk;
			} else return chunk;
		}).join('');

		if (replaced.length > 0)
			element.innerHTML = result;
		else
			return null
	}
	return true
}

function add_css_rule(selector, rule, doc) {
	var style_node = document.createElement("style");
	style_node.setAttribute("type", "text/css");
	style_node.setAttribute("media", "screen");
	style_node.appendChild(document.createTextNode(selector + " {" + rule + "}"));
	doc.getElementsByTagName("head")[0].appendChild(style_node);
}


///////////////////////////////////////////////////////////////////////////////
// Chat client wrapper classes

var Pibb = function(){
	var self = {
		doc  						: function() { return document }, // window.frames[0].document
		message_window 	: function() {
			var tmp = self.doc().getElementsByClassName('EntriesView-Entries')[0]
			if (tmp){
				if (navigator.userAgent.match(/webkit/i))
					return tmp.getElementsByClassName('OuterContainer')[0].childNodes[0]
				else
					return tmp.getElementsByClassName('OuterContainer')[0] 
			} 
			else return null
		},
		message_input		: function() { return self.doc().getElementsByClassName('gwt-TextBox EntriesView-textbox')[0] },
		post_button			: function() { return self.doc().getElementsByClassName('PostOptions')[0] },
		footer					: function() { return self.doc().getElementsByClassName('Footer')[0] },
		new_class				: 'NewEntry',
		read_class			: 'steezy-read',		
		
		message : function(elem){
			var self = {}
			self.elem				= elem
			self.body 			= self.elem.childNodes[0].innerHTML
			self.author 		= self.elem.parentNode.parentNode.getElementsByClassName('Metadata')[0].getElementsByTagName('h3')[0].getElementsByClassName('Name')[0].innerHTML
			self.icon				= self.elem.parentNode.parentNode.getElementsByClassName('UserThumb')[0]
			self.by_current_user = false
			self.mark_read 	= function(new_class, read_class) {
													self.elem.className = self.elem.className.replace(new_class, read_class)
												}
			self.mark_by_current_user = function() {
													self.elem.className += ' by-current-user'
												}
			return self
		},
		get_new_message_elems : function(){
			var elems = self.message_window().getElementsByClassName(self.new_class)
			var lame = []
			
			for (var i=0; i < elems.length; i++)
				if (elems[i] && elems[i].className && elems[i].className.match(self.new_class)) lame.push(elems[i])

			return lame
		}
	}
	return self
}

var SteezyCampfire = function(){
	var self = {
		doc  						: function() { return document },
		message_window 	: function() {
			return document.getElementById('chat')
		},
		message_input		: function() { return document.getElementById('input') },
		post_button			: function() { return document.getElementById('send') },
		footer					: function() { return document.getElementById('Sidebar') },
		new_class				: 'steezy-new',
		read_class			: 'steezy-read',
		
		message : function(elem){
			var self = {}
			self.elem				= elem.getElementsByClassName('body')[0].childNodes[0]
			self.body 			= self.elem.innerHTML
			self.author 		= elem.getElementsByClassName('person')[0].childNodes[0].innerHTML
			self.icon				= "FAKE ICON"
			self.by_current_user = false
			self.mark_read 	= function(new_class, read_class) {
													self.elem.parentNode.parentNode.className = self.elem.parentNode.parentNode.className.replace(new_class, read_class)
												}
			self.mark_by_current_user = function() {
												elem.getElementsByClassName('body')[0].className += ' by-current-user'
												}												
			return self
		},
		get_new_message_elems : function(){
			var tmp = []
			
			for ( var last = self.message_window().lastChild; last; last = last.previousSibling ){			
				if ((last.nodeType != 1) || (!last.id) || (!last.className) || (!last.className.match('text_message')))
					continue					
				
				if (last.className.match(self.read_class))
					break 
					
				if (!last.className.match(self.new_class))
					last.className += ' ' + self.new_class
				
				tmp.push(last)
			}
			
			return tmp.reverse()
		}
	}

	// todo: make simpler, maybe w/ css
	for ( var last = self.message_window().lastChild; last; last = last.previousSibling ){
		if ((last.nodeType != 1) || (!last.id) || (!last.className) || (!last.className.match('text_message')))
			continue
		else{
			last.className += (" " + self.read_class)
			break
		}			
	}

	return self
}

///////////////////////////////////////////////////////////////////////////////
// Browser wrapper classes

var Fluid = function(){
	return {
		alert : function(title, description, icon, sticky) {
			window.fluid.showGrowlNotification({
		    title				: title,
		    description	: description.replace(/<.*?>/g,''), 
		    priority		: 1,
		    sticky			: sticky,
				icon				: icon
			})
		},
		set_counter : function(to){
			window.fluid.dockBadge = to
		}
	}
}

var Callout = function(){
	return {
		alert : function(title, description, icon) {
			callout.notify(title, description, { icon : icon });
		},
		set_counter : function(){}
	}
}

var Other = function(){
	return {
		alert : function(){},
		set_counter : function(){}
	}
};
///////////////////////////////////////////////////////////////////////////////
// Initialization 

// only create pibb instance for second frame(set) (they all run this script)
(function steezy_init(){
	if (window.fluid)
		var browser = Fluid
	else if (window.callout)
		var browser = Callout
	else
		var browser = Other
	
	if (document.title == "Janrain PIBB")
		window.chat_room = new ChatRoom(new Pibb(), new browser())
	if (document.title.match('Campfire'))
		window.chat_room = new ChatRoom(new SteezyCampfire(), new browser())
})()

})()