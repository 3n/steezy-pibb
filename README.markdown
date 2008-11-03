*Steezy Chat*  
*by Ian Collins and Toby Sterrett*  
*Grade 3*


BRIEF OVERVIEW
==============

  This script aims to make the experience of using a web-based chat client    
  completely awesome. It is to be used as either a userscript in [Fluid][fluid] or 
  Firefox 3 (with [Greasemonkey][gm]).
  
  Currently [Pibb][pibb] and [Campfire][cf] are supported and more can be added easily by    
  request, or you could fork this on [Github][gh] and HAAAACK.

  ![Preferences panel][1]
  
WHAT IT DOES
============

Fluid Specific
--------------

  -  number of new messages on dock, for currently focused tab.  
     ![number of unread messages on dock icon (Fluid)][6]

[Fluid][fluid] or Firefox + [Callout][cp] plugin
------------------------------------------------  

  - Inserts input on page for comma-delineated list of strings to growl 
  alert on.  
  ![alt text][3]  

Usability
---------

  - Clicking in message window clears unread messages and focuses message 
    input.
  - If you type message it is marked as unread, as well as all others above 
    it.
  - When elements are injected by this script the message window will scroll
    to fit them, unless the user is currently scrolled upwards in the 
    conversation (because that would get annoying).
    
Away status auto-reply
----------------------
  - Enter a string into the provided "away message" text box and check "away" 
    -- now anytime someone mentions one of your aliases it will submit that 
    string you provided as a message automatically. 
  
Message Styling
---------------

  - Unread messages are colored. 
  - Message with aliases from alias list highlighted.
  - Messages you wrote are colored for quick-scanning chat history.
  
Fun
---
  - Inserting of img tags for messages that contain img urls.  
    ![alt text][2]
  - Inserting of images of tweets when a tweet url is in a message.  
    ![alt text][4]
  - Put someone's alias and the string "HAHA" in a message if they did some 
    stupid shit.
  - "sadtrombone" or "wah" in a message to bring up a sadtrombone button.
  - "dnw" or "do not want" to inline the famous darth vader image.
  - In-lined emoticons.
  - In-lining of YouTube and Vimeo videos.  
    ![alt text][5]

Preferences
-----------
  - Almost all of the above features can be configured through a cookie-saved, 
    inline form.
  
HOW TO INSTALL IT
=================
  
Fluid
-----
  1.  Make sure you have the latest [Fluid][fluid]
  2.  Save the script and put it into your ~/Library/Application\ 
      Support/Fluid/SSB/(app name)/Userscripts/
      directory.
  3.  Set the icon to [this][icon] (if Pibb)      
  
Firefox
-------
  1.  Install [Greasemonkey][gm]
  2.  Install [Callout][cp] plugin (currently requires Mozilla login) 
  3.  Install this script. Easiest at [Userscripts][us]      
        
HOW TO MAKE IT WORK
===================

  There should be a little INPUT box at the bottom right or left of your 
  screen. Fill it in with a list of aliases, comma-separated without spaces 
  (e.g. "ian,Ian C.,3n,titanian,everyone").

  If any of those strings appear in a message, it will turn orange and you 
  should get a growl alert. It is saved in a cookie, so you should only have
  to write it once. 

  [fluid]: http://www.fluidapp.com
  [gh]: http://github.com/3n/steezy-pibb/tree/master
  [gm]: https://addons.mozilla.org/en-US/firefox/addon/748
  [us]: http://userscripts.org/scripts/show/30798d
  [icon]: http://dl.getdropbox.com/u/33956/pibb_icon.png
  [cf]: http://www.campfirenow.com/
  [pibb]: http://www.pibb.com
  [cp]:https://addons.mozilla.org/en-US/firefox/addon/7458
  [1]: http://img.skitch.com/20081013-dudy64iaqfpj9mijeuwaym5akq.jpg
  [2]: http://img.skitch.com/20081013-nkx3m7rrgaj8qhxxciuiqp3yrb.jpg
  [3]: http://img.skitch.com/20081013-k74s79f1kxm8t969m4cbejurjw.jpg
  [4]: http://img.skitch.com/20081013-tjqq2sb52p2xtk2gi4sqjrargp.jpg
  [5]: http://img.skitch.com/20081013-1qqqetudp1a4f2kk9xwuhqgxip.jpg
  [6]: http://idisk.mac.com/iancollins/Public/Pictures/Skitch/Dock-20081021-210932.jpg