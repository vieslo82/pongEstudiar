(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
 "use strict";
 /*jslint browser:true */
 /*jslint node:true */
 /*global $ */

/**
 * Ball prototype. We bounce an image on screen representing the ball
 *
 * @constructor
 * @param {string} id_Ball - html id property identifiyng ball
 * @param {Context} context_ - An instance of game context that let you traverse all game objects
 * @tutorial bouncing-ball-tutorial
 */

var Ball = function (id_Ball,context_) {
  this.$imageBallView = $("#"+id_Ball);

  this.state = "stop"; //startdbl,startclick

  this.ballX = 0; this.ballY = 0;   // position
  this.ballVx = 0; this.ballVy = 0; // velocity & direction

  this.context = context_;
  this.$imageBallView.width(this.context.viewPortHeight*0.05);

  this.bounceSound = new Audio('../frontend/sounds/bounce.mp3');//RUTAS SONIDO
  this.lostPointSound = new Audio ('../frontend/sounds/lost_point.mp3');//RUTAS SONIDO
};

Ball.prototype.scaleAndRealocate = function(){
  this.$imageBallView.width(this.context.viewPortHeight*0.05);
};

/** Get ball coordinates */
Ball.prototype.getPosition = function(){
     return {x:parseInt(this.$imageBallView.css("left")),y:parseInt(this.$imageBallView.css("top"))};
};

/** Simply change direction sense and do an angle correction depending where ball have hit the stick
*   @param {number} stickRelativeBallHitPoint - If we hit on upper middle stick percentage positive otherwise negative we use this value to change ballVy
*/
Ball.prototype.bounce = function(stickRelativeBallHitPoint){
      this.ballVy += (stickRelativeBallHitPoint/100);
      if (this.ballVy > 1) this.ballVy = 1;
      if (this.ballVy < -1) this.ballVy = -1;
      this.ballVx = -this.ballVx;
};

/** We put ball in X,Y coordinates and check boundaries in order to change direction */
Ball.prototype.locate = function(x,y){
    this.ballX = x;
    this.ballY = y;
    //Ball get out of boundaries in top or bottom edges
    if (y<=0 || y>=this.context.viewPortHeight-this.$imageBallView.height() ){
        //If we reach top or bottom and directions have not been yet inverted we do it.We avoid annoying bug with multiple repeated bouncings on edges
        if ( (y <= 0 && this.ballVy <0 ) || (y>=this.context.viewPortHeight-this.$imageBallView.height()) && this.ballVy >0){
            this.ballVy = -this.ballVy;
        }

    }

    this.$imageBallView.css("left",(Math.round(x))+ 'px');
    this.$imageBallView.css("top",(Math.round(y)) + 'px');

    //Ball notifies all observers if is under 25% viewport width or 75% onwards. Think it twice! Do we need patterns overburden for this game?
    if (x<((25*this.context.viewPortWidth)/100) || x> ((75*this.context.viewPortWidth)/100)){
        this.context.stickLeft.Update(this);
        this.context.stickRight.Update(this);
    }
 };

/** We RAMDOMLY choose ball direction and speed
* in this method and try not allow angles greater than 45 degrees in any
* of the four quarters
*/
Ball.prototype.ramdomDepartureAngle = function(){
    this.ballVx = 1;
    this.ballVy = Math.round(Math.random() * 100)/100;

    if (Math.round(Math.random()) === 0) this.ballVx = -this.ballVx;
    if (Math.round(Math.random()) === 0) this.ballVy = -this.ballVy;

};

module.exports = Ball;

},{}],2:[function(require,module,exports){
"use strict";
/*jslint browser:true */
/*jslint node:true */
/*global $ */

var ball = require('./ball');
var stick = require('./stick');
var utils = require('./utils');

var animate;
/**
 * Context prototype.
 * With this object (Singleton) by the way. We manage game context: points, on/off, balls location
 * on screen. It is a bridge that let you traverse whole game objects
 *
 * @constructor
 */
function Context(){

  this.score=0;
  this.state = "stop"; //STOP OR RUN
  this.speed = 1.8; //1 - 20;
  this.incSpeed = 0; //Dynamic speed increasing
  this.restart();
  var self = this; //Trick to run setInterval properly
  this.initWebSockets();

  this.getContextSelf = function(){return self;};
  //If both paddles are autopilot we start the game directly
  if (this.stickLeft.autopilot && this.stickRight.autopilot) this.start();
}

Context.prototype.initWebSockets = function(){
    this.socket = io(); //Third party lib loaded on html not included with require

    this.socket.on('stick id and position',function(msg){
        console.log(msg);
    });
    this.socket.on('ball position',function(msg){
        console.log(msg);
    });
};

/** Restart pong game after a resizing event*/
Context.prototype.restart = function(){
    this.viewPortWidth = $(window).innerWidth();
    this.viewPortHeight = $(window).innerHeight();
    this.speed = this.viewPortWidth/1000;

    if (this.ball && this.stickLeft && this.stickRight) {
      this.ball.scaleAndRealocate();
      this.stickLeft.scaleAndRealocate();
      this.stickRight.scaleAndRealocate();
    }else{
      this.ball = new ball("bola",this);
      this.stickLeft = new stick("stickLeft","left",this,true);
      this.stickRight = new stick("stickRight","right",this,true);
    }

    /** We put ball in the middle of the screen */

    this.ball.locate((this.viewPortWidth/2)-(this.ball.$imageBallView.width()/2),(this.viewPortHeight/2)-this.ball.$imageBallView.height());
    /** Vertical dotted separator decoration */
    var verticalSeparatorWidth = this.viewPortWidth * 0.02;
    $("#vertical").css({
        "left":(this.viewPortWidth/2-verticalSeparatorWidth/2),
        "border-left": verticalSeparatorWidth+"px dotted #444"
    });
};

Context.prototype.showBanner = function(message,millis){
   $("#banner").show().text(message);
   if (millis && (millis !== 0))
    setInterval(this.hideBanner,millis);
};

/** Hide game informative Banner */
Context.prototype.hideBanner = function(){
    $("#banner").hide();
};

/** Start pong game */
Context.prototype.start = function(){
    var self = this.getContextSelf();
    self.state = "run";
    self.ball.ramdomDepartureAngle();
    self.lastTime = new Date();
    animate=setInterval(function(){self.animate();}, 1);
};

/** Reset pong game scores*/
Context.prototype.gameOver = function(){

   this.stop();
   this.resetScores();
   utils.chooseGameMode(this);
};

Context.prototype.resetScores = function(){
    this.stickLeft.score = 0;
    this.stickRight.score = 0;

    $("#scorePlayerLeft").text(this.stickLeft.score);
    $("#scorePlayerRight").text(this.stickRight.score);
};

Context.prototype.increaseScore = function(side_){
     var $scoreEl = $("#scorePlayerLeft");
     if (side_ == "left"){
        this.stickLeft.score+=1;
        if (this.stickLeft.score >9) this.gameOver();
        else $("#scorePlayerLeft").text(this.stickLeft.score);
     }else{
        this.stickRight.score+=1;
        if (this.stickRight.score >9) this.gameOver();
        else $("#scorePlayerRight").text(this.stickRight.score);
     }
};

/** Stop pong game */
Context.prototype.stop = function(){
    this.state = "stop";
    this.stickLeft.consecutiveHits=0;
    this.stickRight.consecutiveHits=0;
    this.incSpeed = 0;
    clearTimeout(animate);

    //this.start();
};

Context.prototype.increaseSpeed = function(){
        this.incSpeed+=0.1;
};
/** Animate one new game frame */
Context.prototype.animate =function(){
    if (this.stickLeft.autopilot) this.processAI(this.stickLeft);
    if (this.stickRight.autopilot) this.processAI(this.stickRight);

    var currTime = new Date();
    var millis = currTime.getTime() - this.lastTime.getTime();
    this.lastTime = currTime;
    var ball_ = this.ball;
    if (this.stickLeft.consecutiveHits>=4 || this.stickRight.consecutiveHits>=4 ){
        this.stickLeft.consecutiveHits=0;
        this.stickRight.consecutiveHits=0;
        this.increaseSpeed();
        console.log("incSpeed == "+this.incSpeed);
    }
    ball_.locate(ball_.ballX + ((ball_.ballVx*millis)*(this.speed+this.incSpeed)) , ball_.ballY + ((ball_.ballVy*millis)*(this.speed+this.incSpeed)) );
};

/** Arificial intelligence behind stick movements when it is autopiloted by the computer */
Context.prototype.processAI = function(stick_){
    var stickPos = stick_.getPosition();
    var StickMAXSPEED = 10; //Max pixel speed per frame
    var stickVy = 1;
    var iamLeftStickAndBallIsCloseAndTowardsMe = (stick_.sideLocation === "left" && (this.ball.ballX < (this.viewPortWidth/2)) && (this.ball.ballVx < 0) );
    var iamRightStickAndBallIsCloseAndTowardsMe = (stick_.sideLocation === "right" && (this.ball.ballX > (this.viewPortWidth/2)) && (this.ball.ballVx > 0) );

    if (iamLeftStickAndBallIsCloseAndTowardsMe || iamRightStickAndBallIsCloseAndTowardsMe) {
                var timeTilCollision = ((this.viewPortWidth-stick_.gap-stick_.$imageStickView.width()) - this.ball.ballX) / (this.ball.ballVx);
                if (stick_.sideLocation === "left") timeTilCollision = ((stick_.$imageStickView.width()+stick_.gap) - this.ball.ballX) / (this.ball.ballVx);

                var distanceWanted = (stickPos.y+(stick_.$imageStickView.height()/2)) - (this.ball.ballY+(this.ball.$imageBallView.width()/2));
                var velocityWanted = -distanceWanted / timeTilCollision;
                if(velocityWanted > StickMAXSPEED)
                    stickVy = StickMAXSPEED;
                else if(velocityWanted < -StickMAXSPEED)
                    stickVy = -StickMAXSPEED;
                else
                    stickVy = velocityWanted*3;
                stick_.locate(stickPos.x,stick_.stickY + stickVy);
    }
};

/** Function Sound Bounce */
//Context.prototype.bounceSound = function(){
  //var bounceSound = new Audio('../frontend/sounds/bounce.mp3');
  //bounceSound.play();
//};

/** Function Sound Bounce */
Context.prototype.lostPointSound = function(){
    //this.speed += 0.1;
};

module.exports = Context;

},{"./ball":1,"./stick":6,"./utils":7}],3:[function(require,module,exports){
"use strict";
/*jslint browser:true */
/*jslint node:true */
/*global $ */

/**
 *  Pong main entry script
 *  @author Pere Crespo <pedcremo@iestacio.com>
 *  @version 0.0.1
 */

/** Prototype where all game objects are present and could be accessed */
var singletonContext = require('./patterns/singleton/singletonContext');
/** Game utils */
var utils = require('./utils');

/** Once the page has been completely loaded. Including images. We start the game logic */
window.onload=function(){

    var GameContext_ = singletonContext.getInstance();

    /** We check if player has chosen a nickname(mandatory) and a Picture Profile (optional). We store them as cookie and LocalStorage respectively
     If there is not profile we can not start the game otherwise we can start or stop the game pressing any key */
    utils.checkIfProfileHasBeenDefined(utils.chooseGameMode);
    $(window).resize(function(){
        GameContext_.restart();
    });
};

module.exports.singletonContext = singletonContext;

},{"./patterns/singleton/singletonContext":5,"./utils":7}],4:[function(require,module,exports){
module.exports=require(3)
},{"./patterns/singleton/singletonContext":5,"./utils":7}],5:[function(require,module,exports){
"use strict";

/*jslint browser:true */
/*jslint node:true */

/**
 *  Singleton pattern aplied to context
 */
var context = require('./../../context');

var SingletonContext = (function () {
    var instance;

    function createInstance() {
        var object = new context();
        return object;
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

module.exports = SingletonContext;

},{"./../../context":2}],6:[function(require,module,exports){
"use strict";
/*jslint browser:true */
/*jslint node:true */
/*global $ */

//var withObserver = require('./patterns/observer/Observer');
var utils = require('./utils');
/**
 * Create an instance of Stick.
 * This object let you move vertically using mouse pointer movements and hit the ball.
 *
 * @constructor
 * @param {string} id_stick - HTML Id attribute used to identify the stick
 * @param {string} sideLocation - Possible values "left" or "right"
 * @param {Context} context - An instance of game context that let you traverse all game objects
 * @param {boolean} autopilot - If true computer manage stick movement
 */

function Stick(id_stick,sideLocation,context,autopilot) {
  this.sideLocation = sideLocation || "left" ; //right or left,
  this.autopilot = autopilot || false;  //If true computer moves the stick automatically
  this.setAutopilot(this.autopilot);
  this.$imageStickView = $('#'+id_stick); //We get from index.html the image associated with the stick
  this.score = 0;

  this.gap = 50;    //Distance in pixels from sideLocation
  this.context = context;
  this.$imageStickView.height(this.context.viewPortHeight*0.2);

  this.stickY = 0;   // position
  this.stickVy = 0; // velocity & direction

  if (this.sideLocation == "left"){
      this.locate(this.gap,Math.round(this.context.viewPortHeight/2));
  }else{
      this.locate(this.context.viewPortWidth-this.$imageStickView.width()-this.gap,Math.round(this.context.viewPortHeight/2));
  }

  var self = this;

  $(document).on("mousemove touchmove",function(e){
      /** USED IN PCs: We move stick on y axis following mouse pointer location */
      var y= (window.Event) ? e.pageY : event.clientY + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
      /** USED IN TABLETS AND SMARTPHONES: We move stick on y axis following finger touching location */
      if (e.type == "touchmove")
        y =e.touches[0].pageY;
      if (!self.autopilot) self.locate(self.x,y-(self.$imageStickView.height()/2));
  });

  $('#'+id_stick).on("mousedown touchstart",function(e){
      e.preventDefault();
      //self.autopilot=false;
      self.setAutopilot(false);
      if (self.context.state === "stop") self.context.start();
      self.context.hideBanner();
  });

  $(window,'#'+id_stick).on("mouseup touchend",function(e){
      //self.autopilot=true;
      self.setAutopilot(true);
      self.context.showBanner("You should drag any stick with mouse or finger if you want to controll it");
  });

  /** As an Observer we should implement this mandatory method. Called
  *   everytime the object we observe (in this case ball) call to Notify Subject method
  */
  this.Update = function (ball){
      var ballPosition = ball.getPosition();
      var stickPosition = this.getPosition();

      var ballCloseStickLeftAndTowardsIt = (this.sideLocation == "left" && ((ballPosition.x + ball.ballVx) <= stickPosition.x+this.$imageStickView.width()) && ball.ballVx < 0);
      var ballCloseStickRightAndTowardsIt = (this.sideLocation == "right" && ((ballPosition.x + ball.ballVx + ball.$imageBallView.width()) >= stickPosition.x)) && ball.ballVx > 0;

      if (  ballCloseStickLeftAndTowardsIt || ballCloseStickRightAndTowardsIt) {
          var distance = (stickPosition.y+this.$imageStickView.height()/2)-(ballPosition.y+ball.$imageBallView.height()/2);
          var minDistAllowed = (this.$imageStickView.height()/2+ball.$imageBallView.height()/2);
          if (Math.abs(distance) < minDistAllowed) {
                ball.bounce(distance*100/minDistAllowed);
                this.consecutiveHits+=1;

                ball.bounceSound.play();//FUNCION SONIDO REBOTE
          }else{
            if ((ballPosition.x <= 0) || (ballPosition.x >= this.context.viewPortWidth)){
                this.context.increaseScore(this.sideLocation);
                //We locate ball on center
                this.context.ball.locate((this.context.viewPortWidth/2)-this.context.ball.$imageBallView.width(),(this.context.viewPortHeight/2)-this.context.ball.$imageBallView.height());  //Posicionem pilota al mig
                this.context.ball.ramdomDepartureAngle();
                
                ball.lostPointSound.play();//FUNCION SONIDO PUNTO
            }
          }
      }
  };
}
Stick.prototype.setAutopilot = function(true_or_false){
        this.autopilot = true_or_false;
};
/** For scaling game objects (ball, sticks ...) when viewport changes*/
Stick.prototype.scaleAndRealocate = function(){
  this.$imageStickView.height(this.context.viewPortHeight*0.2);
  if (this.sideLocation == "left"){
    this.$imageStickView.css("left",this.gap+'px');
  }else{
    this.$imageStickView.css("left",this.context.viewPortWidth-this.$imageStickView.width()-this.gap);
  }
};

/** Draw and locate stick on screen using x,y coordinates */
Stick.prototype.locate = function(x,y){
    this.stickY = y;
    if (this.stickY < 0 ) this.stickY =0;
    var hp = this.$imageStickView.height();

    if (this.stickY > (this.context.viewPortHeight - this.$imageStickView.height())) this.stickY = this.context.viewPortHeight - this.$imageStickView.height();
    this.$imageStickView.css("left",(Math.round(x))+ 'px');
    this.$imageStickView.css("top",(Math.round(this.stickY)) + 'px');

    this.oldPosition  = this.getPosition();
};

/** Get stick x,y pixel location on screen */
Stick.prototype.getPosition = function(){
     return {x:parseInt(this.$imageStickView.css("left")),y:parseInt(this.$imageStickView.css("top"))};
};

/** We export whole prototype */
module.exports = Stick;

},{"./utils":7}],7:[function(require,module,exports){
"use strict";
/*jslint browser:true */
/*jslint node:true */
/*global $ */

/**
 * Utils module.
 * @module utils
 * @see module:utils
 */

//var singleContext = require('./patterns/singleton/singletonContext');
var main = require('./main');

function setCookie(cname, cvalue, exdays) {
    if (cvalue && cvalue!== ""){
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
}

function getModalTemplate(idTemplate,callback){
  //If exists in the DOM tree we don't call via ajax again
  if ($('#'+idTemplate).length){
      $('#'+idTemplate).show();
      callback($('#'+idTemplate));
  }else{
      $.get("template/"+idTemplate,function(data,status){
              $('body').append(data);
              $('#'+idTemplate).show();
              callback($('#'+idTemplate));
      });
  }
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/**
 * Show nickname name and/or image if profile has been defined
 * @returns {Boolean}
 */

function showPlayerProfile(){
  var user = getCookie("username");
  if (user && user!==""){
    var $nicknameElement=$("#playerLeft");
    $nicknameElement.text(user);
    var dataImage = localStorage.getItem('imgData');
    if (dataImage){
      var $profileImg=$("<img/>");
      $profileImg.attr("src","data:image/jpg;base64," + dataImage).width(48).height(64);
      $("body").prepend($profileImg);
    }
    return true;
  }else{
    return false;
  }
}

/** Check if there is a cookie and/or image profile defined to identify user. If not we force definition */
function checkIfProfileHasBeenDefined(callBackFunction) {

    var user = getCookie("username");

    if (user !== "") {
        showPlayerProfile();
        callBackFunction();
    } else {
        getModalTemplate("modal-player-profile",function($template){
            $("#blah").hide();
            //$(document,".close:first").click(function(){
            $(".close:first").off("click").on("click",function(){
              if (showPlayerProfile()){
                $template.hide();
                callBackFunction();
              }
            });
            var $nickname = $("#nickname_");
            $nickname.on('change blur focus',function(){
              setCookie("username", $nickname.val(), 365);
            });

            $("#imgProfile").change(function(){
              readFileAndPreviewFromLocalFileSystem(this);
            });

        });

    }
    $("#playerRight").text("Computer");
}

//Encode an image using base64 previously to store it on LocalStorage
//Note: In HTML the img tag can load an image pointing src attribute to an URL or putting there the image in base64
function getBase64Image(img) {

    var $canvas = $("<canvas/>").attr("width",img.width).attr("height",img.height);

    var ctx = $canvas[0].getContext("2d");
    ctx.drawImage(img, 0, 0,48,64);
    var dataURL = $canvas[0].toDataURL("image/jpg");

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}
//We convert before saving to base64
function saveImageToLocalStorage(){
  var imgData = getBase64Image($('#blah')[0]);
  localStorage.setItem("imgData", imgData);
}

//We choose a image profile from local system and we do a preview
function readFileAndPreviewFromLocalFileSystem(input) {
  if (input.files && input.files[0]) {
      $('#blah').show();
      var reader = new FileReader();
      reader.onload = function (e) {
        $('#blah').attr('src',e.target.result);
        saveImageToLocalStorage();
      };
      reader.readAsDataURL(input.files[0]);
  }
}
function chooseGameMode(context_){    
    getModalTemplate("modal-game-mode",function($template){
        $template.find("#single").on("click",function(){
            if (context_ && context_.state === "stop") context_.start();
            $template.hide();
        });
    });
}

/** Before start any game we check if user has defined a profile. */
 module.exports.checkIfProfileHasBeenDefined = checkIfProfileHasBeenDefined;
 module.exports.getModalTemplate = getModalTemplate;
 module.exports.chooseGameMode = chooseGameMode;
 module.exports.getCookie = getCookie;

},{"./main":4}]},{},[3])