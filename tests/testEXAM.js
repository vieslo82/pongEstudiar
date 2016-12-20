// Be descriptive with titles here. The describe and it titles combined read like a sentence.
describe('TEST 2nd DAW', function() {
    var audioOriginal, audioMock;
    var context;
  // inject the HTML fixture for the tests
  beforeEach(function() {
    var fixture = '<div id ="fixture"><img id="bola" style="position:absolute" src="images/squareWhite.png" />'+
    '<img id="stickLeft" style="position:absolute" src="images/stickWhite.png" />'+
    '<h2 id="playerLeft"></h2>'+
    '<p id="scorePlayerLeft">0</p>'+
    '<img id="stickRight" style="position:absolute" src="images/stickWhite.png" />'+
    '<h2 id="playerRight">v</h2>'+
    '<p id="scorePlayerRight">0</p>'+
    '<div id="vertical"></div></div>';

    document.body.insertAdjacentHTML(
      'afterbegin',
      fixture);

    audioOriginal = window.Audio;
    audioMock = {play:function(){},pause:function(){}};
    window.Audio = function() { return audioMock; };

    context = require('../frontend/javascript/context');
    this.context_ = new context();

    jasmine.clock().install();
  });

  // remove the html fixture from the DOM
  afterEach(function() {
    document.body.removeChild(document.getElementById('fixture'));
    window.Audio = audioOriginal;
    jasmine.clock().uninstall();
  }); 


  it("2. Scores font-size should be proportional to viewPort height. Exactly 20% (1 point)", function(){
      spyOn(context.prototype, 'restart');
      this.context_.restart();
      expect(context.prototype.restart).toHaveBeenCalled();
      expect(parseInt($("#scorePlayerRight").css("font-size"))).not.toBeLessThan(Math.floor(this.context_.viewPortHeight*0.2));
  });

  it("3. Play a sound when ball bounce on any paddle (1 point)", function(){
      var ball = this.context_.ball;
      expect(ball.bounceSound).toBeDefined();
      spyOn(ball.bounceSound,"play");
      ball.bounce();
      expect(ball.bounceSound.play).toHaveBeenCalled();
  });

  it("4. Play sound when point is lost(1 point)", function(){
       expect(this.context_.lostPointSound).toBeDefined();
      spyOn(this.context_.lostPointSound,"play");
      this.context_.increaseScore("left");
      expect(this.context_.lostPointSound.play).toHaveBeenCalled();
  });

});
