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
			add_css_rule('#steezy-input', 'float:left;', self.client.doc())			
			add_css_rule('#steezy-input', 'width:300px;', self.client.doc())
			add_css_rule('#steezy-input', 'margin:5px;', self.client.doc())			
			add_css_rule('#steezy-input', 'padding:4px;', self.client.doc())	
					
			add_css_rule('.steezy-tag',   'color:#222222;', self.client.doc())			
			add_css_rule('.steezy-tag',   'font-weight:bold;', self.client.doc())			
			add_css_rule('.steezy-tag',  	'background:#f0e600;', self.client.doc())
			add_css_rule('.steezy-tag',  	'-webkit-border-radius:5px;', self.client.doc())
			add_css_rule('.steezy-tag',  	'padding:2px;', self.client.doc())			
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

			self.add_img_tags(message)
			self.add_twitter_img_tags(message)
self.highlight_aliases(message)
			// if message was written by current user
			if (self.get_aliases().some(function(a){ return message.author.toLowerCase() == a.toLowerCase() })){
				self.mark_all_read()
				message.mark_read(self.client.new_class)
				message.by_current_user = true
				message.elem.style['background'] = self.my_bg_color
				return
			}
			
			// if message has one of the words from the alias input in it
			if (self.get_aliases().some(function(a){ return (a.length > 0) && (message.body.match(new RegExp('\\b(' + a + ')\\b','i'))) })) {
				self.browser.alert(message.author + " said", message.body, message.icon)
				message.elem.style['background'] = self.important_bg_color
				self.highlight_aliases(message)
			}			

			self.new_messages.push(message)
			self.browser.set_counter(self.new_messages.length)
		},
		
		add_img_tags: function(message){
			var the_match = message.body.match(/(http:\/\/[^<>]+\.(jpg|png|gif))/)
			if (the_match) message.elem.innerHTML = message.elem.innerHTML + '<img src="'+ the_match[0] + '" />'
		},
		add_twitter_img_tags: function(message){
			var the_match = message.body.match(/http:\/\/twitter\.com\/[^<>/]+\/statuses\/([0-9]+)/)
			if (the_match && the_match.length > 1) message.elem.innerHTML = message.elem.innerHTML + '<img src="http://twictur.es/i/' + the_match[1] + '.gif" />'
		},
		highlight_aliases: function(message){
			var aliases = self.get_aliases()
			if (aliases) aliases.forEach(function(a){ wrap_in_span_tags(message.elem, a, 'steezy-tag') })
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
		
		insert_aliases_input: function(){			
			if (!self.client.doc().getElementById('steezy-input')){
				self.aliases_input = document.createElement("input")
				self.aliases_input.id = "steezy-input"
				self.aliases_input['class'] = "steezy-input"			

				self.client.footer().appendChild(self.aliases_input)
				self.aliases_input.value = self.aliases_input_cookie.get_value()				
				self.aliases_input.addEventListener('keyup', (function(cookie){ cookie.set_value(this.value) }).bind(self.aliases_input, self.aliases_input_cookie), true)
			}
			
			window.setTimeout(self.insert_aliases_input, self.period)
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
	self.insert_aliases_input()

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
		message_window 	: function() { return self.doc().getElementsByClassName('EntriesView-Entries')[0] },
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