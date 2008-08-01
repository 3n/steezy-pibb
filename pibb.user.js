// ==UserScript==
// @name          Steezy Pibb
// @namespace     http://www.iancollins.me
// @description   Makes Pibb + Fluid/Firefox one hell of a steez
// @author        Ian Collins
// @homepage      http://www.iancollins.me
// @include       *pibb.com*
// ==/UserScript==

///////////////////////////////////////////////////////////////////////////////
// Native Extensions

Function.prototype.bind = function(bind, arg) {
	var fun = this
	return function(){ return fun.call(bind, arg) }
}

var ChatRoom = function(client, browser) {

	// private	
	var self = {
		client							: client,
		browser							: browser,
		
		period 							: 1000,		
		my_bg_color 				: '#EEEEEE',
		important_bg_color 	: '#FFC670',	
		
		aliases_input_cookie : new Cookie('aliases_input_value', null, 1000),
		
		add_css_rules: function(){
			add_css_rule('#steezy-preferences', 'float:left;', self.client.doc())			
			
			add_css_rule('.steezy-input', 'width:300px;', self.client.doc())
			add_css_rule('.steezy-input', 'margin:5px;', self.client.doc())			
			add_css_rule('.steezy-input', 'padding:2px;', self.client.doc())	
					
			add_css_rule('.steezy-tag',   'color:#222222;', self.client.doc())			
			add_css_rule('.steezy-tag',   'font-weight:bold;', self.client.doc())			
			add_css_rule('.steezy-tag',  	'background:#f0e600;', self.client.doc())
			add_css_rule('.steezy-tag',  	'-webkit-border-radius:5px;', self.client.doc())
			add_css_rule('.steezy-tag',  	'padding:2px;', self.client.doc())			
			add_css_rule('.steezy-tag',  	'-webkit-box-shadow:0 0 5px rgba(0, 0, 0, 0.5);', self.client.doc())	
			
			add_css_rule('.by-current-user', 'background:' + self.my_bg_color + ';', self.client.doc())
			add_css_rule('.important-message', 'background:' + self.important_bg_color + ';', self.client.doc())								
		},
		
		new_messages : [],
		check_for_new_messages : function(){
			if (self.client.message_window()){
				var elems = self.get_new_message_elems()
				
				if (elems.length < self.new_messages.length)
					self.new_messages = []
				
				for (var i = self.new_messages.length; i < elems.length; i++)
					if (elems[i]) self.handle_new_message(elems[i])
			}
			window.setTimeout(self.check_for_new_messages, self.period)
		},
		get_new_message_elems : function(){
			var elems = self.client.message_window().getElementsByClassName(self.client.new_class)
			var lame = []
			
			for (var i=0; i < elems.length; i++)
				if (elems[i] && elems[i].className && elems[i].className.match(self.client.new_class)) lame.push(elems[i])
				
			return lame
		},
		handle_new_message: function(elem) {
			var message = new self.client.message(elem)
      var msg = message.body
      
      msg += self.add_img_tags(msg)
      msg += self.add_twitter_img_tags(msg)
      msg = self.add_emoticons(msg)
      msg += self.add_sad_trombone(msg)
      msg += self.add_youtube_embeds(msg)
      msg += self.add_gists(msg)
      
      var from_current_user = self.get_aliases().some(function(a){ return message.author.toLowerCase() == a.toLowerCase() })

			// if message was written by current user
      if (from_current_user) {
				self.mark_all_read()
				message.mark_read(self.client.new_class)
				message.by_current_user = true
				message.elem.className = message.elem.className + ' by-current-user'		
			}
			
			// if message has one of the words from the alias input in it
			if (!from_current_user && self.get_aliases().some(function(a){ return (a.length > 0) && (message.body.match(new RegExp('\\b(' + a + ')\\b','i'))) })) {
				self.browser.alert(message.author + " said", message.body, message.icon)
				message.elem.className = message.elem.className + ' important-message'
        msg += self.add_haha(msg)
			}
			
			if ( Math.abs(self.client.message_window().scrollHeight - (self.client.message_window().scrollTop + self.client.message_window().offsetHeight)) < 10 )
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
			var the_match = message.match(/(http:\/\/[^<>]+\.(jpg|png|gif))/)
			if (the_match)
			  return '<br /><img src="'+ the_match[0] + '" />'
		  else
		    return ''
		},
		add_twitter_img_tags: function(message){
			var the_match = message.match(/http:\/\/twitter\.com\/[^<>/]+\/statuses\/([0-9]+)/)
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
        embed += '<param name="movie" value="http://crossgrain.com/haha/haha.swf" />'
        embed += '<param name="quality" value="high" />'
        embed += '<embed src="http://crossgrain.com/haha/haha.swf" quality="high" pluginspage="http://www.adobe.com/shockwave/download/download.cgi?P1_Prod_Version=ShockwaveFlash" type="application/x-shockwave-flash" width="400" height="373"></embed>'
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
		    .replace(/:-?\)/, base + '1.gif' + end)
		    .replace(/:-?\(/, base + '2.gif' + end)
		    .replace(/:-?D/, base + '4.gif' + end)
		    .replace(/8-?\)/, base + '16.gif' + end)
		    .replace(/8=+(>|D)/, '<img src="http://img.skitch.com/20080801-f2k6r13iaw7xsrya39ftamugaa.png" />')
            .replace(/DERP\!/, '<img src="http://img.skitch.com/20080801-ehk4xc8n65xdx2sndc4scckyf2.jpg" alt="DERP!"/>')
		  return emoticonned
		},		
		add_youtube_embeds: function(message){
		  var the_match = message.match(/http:\/\/(www.|)youtube\.com\/watch\?v=([^&]+)/);
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
		
		add_gists: function(message) {
		  var the_match = message.match(/https?:\/\/gist\.github\.com\/\w{1,}/);
		  if (the_match) {
		    embed = "<br />"
		    embed += '<iframe width="100%" border="0" src="' + the_match[0] + '.txt" />'
		    console.log(embed)
		    return embed
		  } else {
		    return ''
		  }
		},
		
		setup_message_window_events: function(){
			if (self.client.message_window()) self.client.message_window().addEventListener('click', self.message_window_clicked, true)
			window.setTimeout(self.setup_message_window_events, self.period)
		},
		message_window_clicked : function(){
			self.client.message_input().focus()
			self.mark_all_read()
		}, 
		mark_all_read : function() {
			self.new_messages.forEach(function(nm){ nm.mark_read(self.client.new_class) })
			self.new_messages = []
			self.browser.set_counter('')
		},
 
		insert_preferences_element: function(){
			if (!self.client.doc().getElementById('steezy-preferences')){
				self.preferences_element = document.createElement("div")
				self.preferences_element.id = "steezy-preferences"
				self.client.footer().appendChild(self.preferences_element)
				
				self.aliases_input = document.createElement("input")
				self.aliases_input.className = "steezy-input"

				self.preferences_element.appendChild(self.aliases_input)

				self.aliases_input.value = self.aliases_input_cookie.get_value()				
				self.aliases_input.addEventListener('keyup', (function(cookie){ cookie.set_value(this.value) }).bind(self.aliases_input, self.aliases_input_cookie), true)
			}
			window.setTimeout(self.insert_preferences_element, self.period)
		},
		
		get_aliases: function(){
			if (self.aliases_input)
				return self.aliases_input.value.split(',')
		}
	};

	// public
	var that = {}
	
	// initialize
	self.add_css_rules()
	self.check_for_new_messages()	
	self.setup_message_window_events()
	self.insert_preferences_element()

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
		document.cookie = this.key + '=' + val + (this.expiry || '')
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
		footer					: function() { return self.doc().getElementsByClassName('Footer')[0] },
		new_class				: 'NewEntry',
		
		message : function(elem){
			var self = {}
			self.elem				= elem
			self.body 			= self.elem.childNodes[0].innerHTML
			self.author 		= self.elem.parentNode.parentNode.getElementsByClassName('Metadata')[0].getElementsByTagName('h3')[0].getElementsByClassName('Name')[0].innerHTML
			self.icon				= self.elem.parentNode.parentNode.getElementsByClassName('UserThumb')[0]
			self.by_current_user = false
			self.mark_read 	= function(class_name) {
													self.elem.className = self.elem.className.replace(class_name,'')
												}
			return self
		}
	}
	return self
}

///////////////////////////////////////////////////////////////////////////////
// Browser wrapper classes

var Fluid = function(){
	return {
		alert : function(title, description, icon) {
			window.fluid.showGrowlNotification({
		    title				: title,
		    description	: description, 
		    priority		: 1,
		    sticky			: true,
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
}
///////////////////////////////////////////////////////////////////////////////
// Initialization 

// only create pibb instance for second frame(set) (they all run this script)
function init(){
	var client = Pibb
	
	if (window.fluid)
		var browser = Fluid
	else if (window.callout)
		var browser = Callout
	else
		var browser = Other
	
	if (document.title == "Janrain PIBB")
		window.chat_room = new ChatRoom(new client(), new browser())
}
init()