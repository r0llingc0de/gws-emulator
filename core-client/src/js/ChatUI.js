function GenesysChatUI($, ndContainer, oTransport, oTransportData){

    var $ = $||jquery_inject||null;

    var ndContainer = $(ndContainer),
        oElements = {

            Transcript: ".transcript",
            Input: ".input",
            IsTyping: ".isTyping",
            Form: ".form"
        },
        oSession = null,
        oTypingSensor = {

            Timer: 0,
            Timeout: 2000,
            TimeInterval: 100,
            Interval: false
        },
        oChatAPI = new (GenesysChatAPI($)),
        isAgent = false;




    function init(){

        var oE = oElements;

        for(var sName in oE){

            oE[sName] = $(oE[sName], ndContainer);
        }

        oE.Input.keypress(function(e){

            if(e.which == 13 && !e.ctrlKey){

                sendMessage();
                e.preventDefault();
                e.stopPropagation();
                return true;
            }

            if(oSession){

                var oT = oTypingSensor;

                if(oT.Interval){

                    oT.Timer = 0;

                }else{

                    oSession.sendTyping({isTyping:true});

                    oT.Interval = setInterval(function(){

                        oT.Timer += oT.TimeInterval;

                        if(oT.Timer >= oT.Timeout){

                            clearInterval(oT.Interval);
                            oT.Interval = false;
                            oT.Timer = 0;
                            oSession.sendTyping({isTyping: false});
                        }

                    }, oT.TimeInterval);
                }
            }

        }).addClass("disabled")[0].disabled = true;
    }

    this.startSession = function(){
        
        if(this.checkForm()){

            clear();
            this.hideForm();

            oChatAPI.startSession({

                transport: new oTransport(oTransportData)

            }).done(function(oNewSession){

                var oE = oElements;

                oNewSession.onMessageReceived(function(e){

                    var bSystemMessage = (e.party.name == "system" && e.party.type.external);


                    if(e.content.type == "notice"){

                        addNotice(e.party.name, e.content.text);

                    }else{

                        addMessage(e.party.name, e.content.text, e.party.type.agent, bSystemMessage);
                    }

                    if(e.party.type.agent){

                        oE.IsTyping.fadeOut();
                    }
                });

                oNewSession.onAgentConnected(function(e){
                    
                    if(e.party.type == "Agent"){

                        addMessage(e.party.name, (e.party.name||"Agent")+" Connected", false, true);

                    }else if(e.party.type == "Client"){

                        addMessage(e.party.name, "Chat Started", false, true);
                    }
                });

                oNewSession.onAgentDisconnected(function(e){
                    
                    if(e.party.type == "Agent"){

                        addMessage(e.party.name, (e.party.name||"Agent")+" Disconnected", false, true);
                    
                    }else if(e.party.type == "Client"){

                        addMessage(e.party.name, "Chat Ended", false, true);
                    }
                });

                oNewSession.onAgentTyping(function(e){
                    
                    if(e.party.type == "Agent"){

                        if(e.isTyping){

                            oE.IsTyping.html((e.party.name||"Agent")+" is typing...").fadeIn();

                        }else{

                            oE.IsTyping.fadeOut();
                        }
                    }
                });

                oNewSession.onSessionEnded(function(event){

                    addMessage("", "Chat Ended", false, true);

                    oE.Input.addClass("disabled")[0].disabled = true;
                    oSession = null;
                });

                oSession = oNewSession;

                oE.Input.removeClass("disabled")[0].disabled = false;

                $(window).unload(function(){

                    endSession();
                });

            }).fail(function(){

                alert("Chat Session failed to start.");
            });
        }
    };
    
    this.joinSession = function(){
    	isAgent = true;
    	if(this.checkForm()){

            clear();
            this.hideForm();

            oChatAPI.joinSession({

                transport: new oTransport(oTransportData)

            }).done(function(oNewSession){

                var oE = oElements;

                oNewSession.onMessageReceived(function(e){

                    var bSystemMessage = (e.party.name == "system" && e.party.type.external);


                    if(e.content.type == "notice"){

                        addNotice(e.party.name, e.content.text);

                    }else{

                        addMessage(e.party.name, e.content.text, e.party.type.agent, bSystemMessage);
                    }

                    if(e.party.type.agent){

                        oE.IsTyping.fadeOut();
                    }
                });

                oNewSession.onAgentConnected(function(e){
                    
                    if(e.party.type == "Agent"){

                        addMessage(e.party.name, (e.party.name||"Agent")+" Connected", false, true);

                    }else if(e.party.type == "Client"){

                        addMessage(e.party.name, "Chat Started", false, true);
                    }
                });

                oNewSession.onAgentDisconnected(function(e){
                    
                    if(e.party.type == "Agent"){

                        addMessage(e.party.name, (e.party.name||"Agent")+" Disconnected", false, true);
                    
                    }else if(e.party.type == "Client"){

                        addMessage(e.party.name, "Chat Ended", false, true);
                    }
                });

                oNewSession.onAgentTyping(function(e){
                    
                    if(e.party.type == "Agent"){

                        if(e.isTyping){

                            oE.IsTyping.html((e.party.name||"Agent")+" is typing...").fadeIn();

                        }else{

                            oE.IsTyping.fadeOut();
                        }
                    }
                });

                oNewSession.onSessionEnded(function(event){

                    addMessage("", "Chat Ended", false, true);

                    oE.Input.addClass("disabled")[0].disabled = true;
                    oSession = null;
                });

                oSession = oNewSession;

                oE.Input.removeClass("disabled")[0].disabled = false;

                $(window).unload(function(){

                    endSession();
                });

            }).fail(function(){

                alert("Chat Session failed to join.");
            });
        }
    };

    this.endSession = function(){

        oSession.leave();
    };
    
    this.getActiveChatList = function(){
    	
    	oChatAPI.getChatList({

            transport: new oTransport(oTransportData)

        }).done(function(chatList){
        	//set select option elements
        	console.log("return from getChatList");
        	
        	var ndForm = oElements.Form;
        	var select = $(ndForm.find("select[name=chatlist]"));
        	var j;
        	for(j=0; j<select[0].options.length;j++){
        		select[0].remove(select[0].options[j]);
        	}
        	
        	select.change(function(ev) {
        		var chatIdInput = ndForm.find("input[name=chatid]")[0];
        		var id = this.options[this.selectedIndex].value
        		chatIdInput.value = id;
        	});
        	var i;
        	for(i=0; i< chatList.length; i++){
        		var chatInst = chatList[i];
        		select.append("<option value="+ chatInst.id +">" + chatInst.state + " - " + chatInst.subject +"</option>");
        	}
        	
        	if(select[0].options.length > 0){
	        	var chatIdInput = ndForm.find("input[name=chatid]")[0];
	    		var id = select[0].options[0].value
	    		chatIdInput.value = id;
        	}
        });
    };


    this.checkForm = function(){

        var ndForm = oElements.Form,
            bValid = true,
            aFields = ["firstname", "lastname", "nickname", "subject", "email", "chatid"],
            oFieldsRequired = {firstname: false, lastname: false, nickname: false, subject: false, email: false, chatid: false},
            aFieldsInvalid = [];

        ndForm.find("input").removeClass("error");

        // If userData object does not exist, create it
        oTransportData.formData = oTransportData.formData||{};


        $(aFields).each(function(){

            var ndField = ndForm.find("input[name="+this+"]");
            
            if(oFieldsRequired[this] && ndField.val() == ""){
            
                aFieldsInvalid.push(ndField);
                bValid = false;
            }

            oTransportData.formData[this] = ndField.val();
        });

        $(aFieldsInvalid).each(function(){this.addClass("error");});

        return bValid;
    };

    function clear(){

        var oE = oElements;

        oE.Input.val("");
        oE.Transcript.empty();
        oE.IsTyping.fadeOut();
    }

    this.showForm = function(){

        oElements.Form.slideDown();
        oElements.Transcript.slideUp();
    };

    this.hideForm = function(){

        oElements.Form.slideUp();
        oElements.Transcript.slideDown();
    };

    function sendMessage(){

        oSession.sendMessage({

            message: oElements.Input.val(),
            type: 'text'
        });

        oElements.Input.val("");
    }

    function addMessage(sName, sText, bAgent, bSystemMessage){
        
        var ndMessage = $("<p><span class='name'></span></p>");

        // non-agent participants don't see messages starting with #
        var isMeta = sText.indexOf('#')==0;
        var isHidden = isMeta && !isAgent;
        
        if (!isHidden) {
            ndMessage.addClass((bSystemMessage)?"system":"").addClass((bAgent)?"them":"you");
            if (isMeta) {
            	ndMessage.addClass("metaMessage");
            }
            ndMessage.append(sText);
            ndMessage.find(".name").text(sName);
            ndMessage.fadeIn();
        }
            
        oElements.Transcript.append(ndMessage);
            
        scrollToEnd();
    }

    function addNotice(sName, sURL){
        
        var wPopup = window.open(sURL);

        if(!wPopup){

            var ndNotice = $("<p class='notice them'><span class='name'></span><a href='' target='_BLANK'></a></p>");

            ndNotice.find(".name").text(sName);
            ndNotice.find("a").text(sURL)[0].href = sURL;
            oElements.Transcript.append(ndNotice);

            ndNotice.fadeIn();

            scrollToEnd();
        }
    }

    function scrollToEnd(){

        oElements.Transcript[0].scrollTop = 1000000;
    }

    init();
}


