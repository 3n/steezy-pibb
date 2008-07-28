// ==UserScript==
// @name          Steezy Pibb
// @namespace     http://www.geocities.com/ian3n
// @description   Makes Pibb+Fluid one hell of a steez
// @author        Ian Collins
// @homepage      http://www.geocities.com/ian3n
// @include       *pibb.com*
// ==/UserScript==

var Pibb = function(spec) {
	var spec = spec || {}
	var that = {}
	
	// public
	that.blah = function() {
		window.console.log(spec['hello'])
	}
	
	// private	
	var self = {
		doc  						: function() { return window.frames[0].document },
		message_window 	: function() { return self.doc().getElementsByClassName('EntriesView-Entries')[0] },
		message_input		: function() { return self.doc().getElementsByClassName('gwt-TextBox EntriesView-textbox')[0] },
		footer					: function() { return self.doc().getElementsByClassName('Footer')[0] },
		
		period 							: 1000,
		new_class 					: 'NewEntry',
		my_bg_color 				: '#eee',
		important_bg_color 	: '#FFC670',
		
		// tabz : self.doc().getElementsByClassName('ChannelTabBar')[0].childNodes[0].getElementsByTagName('li'),
		// tab : function(num) {
		// 	return self.tabz[num]
		// },
		
		new_messages : [],
		check_for_new_messages : function(){
			if (self.message_window()){
				var elems = self.get_new_message_elems()
				
				if (elems.length < self.new_messages.length)
					self.new_messages = []
				
				for (var i = self.new_messages.length; i < elems.length; i++)
					if (elems[i]) self.handle_new_message(elems[i])
			}
			window.setTimeout(self.check_for_new_messages, self.period)
		},
		get_new_message_elems : function(){
			var elems = self.message_window().getElementsByClassName(self.new_class)
			var lame = []
			
			for (var i=0; i < elems.length; i++)
				if (elems[i] && elems[i].className && elems[i].className.match(self.new_class)) lame.push(elems[i])
				
			return lame
		},
		handle_new_message: function(elem) {
			var message = new Message(elem)

			// if message was written by current user
			if (self.get_aliases().some(function(a){ return message.author.toLowerCase() == a.toLowerCase() })){
				self.mark_all_read()
				message.mark_read(self.new_class)
				message.by_current_user = true
				message.elem.style['background-color'] = self.my_bg_color
				return
			}
			
			// if message has one of the words from the alias input in it
			if (self.get_aliases().some(function(a){ return (a.length > 0) && (message.body.match(new RegExp('\\b(' + a + ')\\b','i'))) })) {
				self.new_message_growl_alert(message)
				message.elem.style['background-color'] = self.important_bg_color
			}

			self.new_messages.push(message)
			self.set_dock_alert(self.new_messages.length)
		},
		
		new_message_growl_alert : function(message){
			window.fluid.showGrowlNotification({
		    title				: message.author + " said",
		    description	: message.body, 
		    priority		: 1,
		    sticky			: true,
				icon				: message.icon
			})
		},		
		set_dock_alert : function(to){
			window.fluid.dockBadge = to
		},
		
		setup_message_window_events: function(){
			if (self.message_window()) self.message_window().addEventListener('click', self.message_window_clicked)
			window.setTimeout(self.setup_message_window_events, self.period)
		},
		message_window_clicked : function(){
			self.message_input().focus()
			self.mark_all_read()
		}, 
		mark_all_read : function() {
			self.new_messages.forEach(function(nm){ nm.mark_read(self.new_class) })
			self.new_messages = []
			self.set_dock_alert('')
		},
		
		insert_aliases_input: function(){
			if (!self.doc().getElementsByClassName('steezy-input')[0]){
				self.aliases_input = document.createElement("input")
				self.aliases_input.className = "steezy-input"
				self.aliases_input.style.float = "left"
				// self.aliases_input.value = 'shit'
				
				self.footer().appendChild(self.aliases_input)
			}
			// self.get_aliases()
			
			
			window.setTimeout(self.insert_aliases_input, self.period)
		},
		get_aliases: function(){
			if (self.aliases_input)
				return self.aliases_input.value.split(',')
		}
	};
	
	// initialize
	self.check_for_new_messages()	
	self.setup_message_window_events()
	self.insert_aliases_input()
	
	return that
};

var Message = function(elem){
	this.elem				= elem
	this.body 			= this.elem.childNodes[0].innerHTML
	this.author 		= this.elem.parentNode.parentNode.getElementsByClassName('Metadata')[0].getElementsByTagName('h3')[0].getElementsByClassName('Name')[0].innerHTML
	this.icon				= this.elem.parentNode.parentNode.getElementsByClassName('UserThumb')[0]
	this.by_current_user = false
	this.mark_read 	= function(class_name) {
											this.elem.className = this.elem.className.replace(class_name,'')
											// elem.remove_class(class_name)
										}
	return this
}

// only create pibb instance for second frame(set) (they all run this script)
if (window.loaded_once){
	var the_pibb = Pibb()
	window.loaded_once = false
}else
	window.loaded_once = true
	
	

var Cookie = function(key, value) {
	this.key = key
	
	this.set_value = function(val) {
		document.cookie = this.key + '=' + val
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
	
	
///////////////////////////////////////////////////////////////////////////////
// Native Extensions

// Element.prototype.remove_class = function(class_name) {
// 	window.console.log('this: '+this)
// 	this.className = this.className.replace(class_name,'')
// 	return this
// }