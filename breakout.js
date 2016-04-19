/* ********************************************
        UTILITIES
********************************************** */
var allBonus =[
    {
        "id": 1,
        effect : function() {
            paddle.loadTexture('breakout', 'paddle_small.png');
            console.log("Paddle Reduit");
        },
        endEffect : function () {
            paddle.loadTexture('breakout', 'paddle_big.png');
            console.log("Paddle normal");
        },
        bonusTime : 5000
    },
    {
        "id": 2,
        effect : function() {
            if (balls[0].speedFactor == 1) {
                balls[0].speedFactor = 0.5;
                balls[0].body.velocity.y *= balls[0].speedFactor;
                balls[0].body.velocity.x *= balls[0].speedFactor; 
            }
        },
        endEffect : function () {
            balls[0].speedFactor = 1;
            balls[0].body.velocity.y *= 2;
            balls[0].body.velocity.x *= 2;
        },
        bonusTime : 5000
    },
    {
        "id": 3,
        effect : function() {
            var moreBall = createBall(balls[0].position);
            moreBall.body.velocity.x = -75;
            moreBall.body.velocity.y = -300;
        },
        endEffect : function () {

        },
        bonusTime : 5000
    },
    {
        "id": 4,
        effect : function() {
            for (var i = 0; i < bricks.length; i++) {
                bricks.children[i].body.enable = false;
            }
            balls[0].scale.setTo(2,2);
            
        },
        endEffect : function () {
           for (var i = 0; i < bricks.length; i++) {
                bricks.children[i].body.enable = true;
            }
            balls[0].scale.setTo(1,1);
        },
        bonusTime : 5000
    }
]

/* ********************************************
        GAME
********************************************** */
    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update });

    function preload() {
        //game.load.json('bonus','bonus.json');
        game.load.atlas('breakout', 'images/breakout.png', 'breakout.json');
        game.load.image('starfield', 'images/starfield.jpg');

    }

    var leftEmitter, rightEmitter;

    var balls = [];
    //var ball;
    var paddle;
    var bricks;
    var bonus;

    var ballOnPaddle = true;

    var lives = 3;
    var score = 0;

    var idTimeout = [0,0,0,0,0,0,0,0,0,0];


    var scoreText;
    var livesText;
    var introText;

    var s;

    function create() {

        game.physics.startSystem(Phaser.Physics.ARCADE);

        //  We check bounds collisions against all walls other than the bottom one
        game.physics.arcade.checkCollision.down = false;

        s = game.add.tileSprite(0, 0, 800, 600, 'starfield');

        // Bonus group
        bonus = game.add.group();
        bonus.enableBody = true;
        bonus.physicsBodyType = Phaser.Physics.ARCADE;

        // Bricks group
        bricks = game.add.group();
        bricks.enableBody = true;
        bricks.physicsBodyType = Phaser.Physics.ARCADE;

        var brick;

        for (var y = 0; y < 4; y++)
        {
            for (var x = 0; x < 15; x++)
            {
                brick = bricks.create(120 + (x * 36), 100 + (y * 52), 'breakout', 'brick_' + (y+1) + '_1.png');
                brick.HP = 1;
                brick.body.bounce.set(1);
                brick.body.immovable = true;
            }
        }

        
        // Create paddle
        paddle = game.add.sprite(game.world.centerX, 500, 'breakout', 'paddle_big.png');
        paddle.anchor.setTo(0.5, 0.5);

        game.physics.enable(paddle, Phaser.Physics.ARCADE);

        paddle.body.collideWorldBounds = true;
        paddle.body.bounce.set(1);
        paddle.body.immovable = true;

        ball = createBall();
      
        scoreText = game.add.text(32, 550, 'score: 0', { font: "20px Arial", fill: "#ffffff", align: "left" });
        livesText = game.add.text(680, 550, 'lives: 3', { font: "20px Arial", fill: "#ffffff", align: "left" });
        introText = game.add.text(game.world.centerX, 400, '- click to start -', { font: "40px Arial", fill: "#ffffff", align: "center" });
        introText.anchor.setTo(0.5, 0.5);

        game.input.onDown.add(releaseBall, this);

    }

    function update () {
        //  Fun, but a little sea-sick inducing :) Uncomment if you like!
        // s.tilePosition.x += (game.input.speed.x / 2);
        for (var i = 0; i < bricks.length; i++) {
            var brick = bricks.children[i];
            for (var j = 0; j < balls.length; j++) {
                var ball = balls[j];
                if (brick.alive && checkOverlap(brick, ball)){
                    ballHitBrick(ball,brick);
                }
            }
        }

        paddle.x = game.input.x;

        if (paddle.x < 24)
        {
            paddle.x = 24;
        }
        else if (paddle.x > game.width - 24)
        {
            paddle.x = game.width - 24;
        }

        if (ballOnPaddle)
        {
            balls[0].body.x = paddle.x;
        }
        else
        {
            for (var i = 0; i < balls.length; i++) {
                game.physics.arcade.collide(balls[i], paddle, ballHitPaddle, null, this);
                game.physics.arcade.collide(balls[i], bricks, ballHitBrick, null, this);
            }
            //Collisions uniquement quand la balle ne se trouve pas sur le paddle
            /*game.physics.arcade.collide(ball, paddle, ballHitPaddle, null, this);
            game.physics.arcade.collide(ball, bricks, ballHitBrick, null, this);*/
        }
        //voir les conditions pour attraper le bonus : ici tout le temps possible
        game.physics.arcade.collide(bonus, paddle, bonusHitPaddle, null, this);
    }

    function checkOverlap(spriteA, spriteB) {

    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();

    return Phaser.Rectangle.intersects(boundsA, boundsB);
}

    function releaseBall () {

        if (ballOnPaddle)
        {
            ballOnPaddle = false;
            balls[0].body.velocity.y = -300; // init : -300
            balls[0].body.velocity.x = -75;
            balls[0].animations.play('spin');
            introText.visible = false;
        }

    }

    function ballLost (_ball) {

        if (balls.length > 1) {
            balls.splice(balls.indexOf(_ball),1);
        }
        else {
                          
            lives--;
            livesText.text = 'lives: ' + lives;

            if (lives === 0)
            {
                gameOver();
            }
            else
            {
                ballOnPaddle = true;

                balls[0].reset(paddle.body.x + 16, paddle.y - 16);

                balls[0].animations.stop();
            }
        }
        

    }

    function gameOver () {

        ball[0].body.velocity.setTo(0, 0);
        
        introText.text = 'Game Over!';
        introText.visible = true;

    }

    function brickTakeDamage(brick) {
        brick.HP -= 1;
        if (brick.HP < 1) {
            brick.kill();
        }
    }

    function ballHitBrick (_ball, _brick) {
        brickTakeDamage(_brick);
        

        dropBonus(_brick);
        score += 10;

        scoreText.text = 'score: ' + score;

        //  Are they any bricks left?
        if (bricks.countLiving() == 0)
        {
            //  New level starts
            score += 1000;
            scoreText.text = 'score: ' + score;
            introText.text = '- Next Level -';

            //  Let's move the ball back to the paddle
            ballOnPaddle = true;
            balls[0].body.velocity.set(0);
            balls[0].x = paddle.x + 16;
            balls[0].y = paddle.y - 16;
            balls[0].animations.stop();

            //  And bring the bricks back from the dead :)
            bricks.callAll('revive');
        }

    }

    function ballHitPaddle (_ball, _paddle) {

        var diff = 0;
        var test = 10; // init = 10
        if (_ball.x < _paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = _paddle.x - _ball.x;
            _ball.body.velocity.x = (-test * diff) * _ball.speedFactor;
        }
        else if (_ball.x > _paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = _ball.x -_paddle.x;
            _ball.body.velocity.x = (test * diff) * _ball.speedFactor;
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            _ball.body.velocity.x = 2 + Math.random() * multi;
        }
    }

    function bonusHitPaddle(_paddle, _bonus) {
         _bonus.kill();
        var r = Math.floor(Math.random()*allBonus.length) + 1;
        //var r = Math.floor(Math.random()*2) + 3;
        //var r = 4;
        var bonus = allBonus.filter(x => x.id == r)[0];
        //General
        bonus.effect();
        clearTimeout(idTimeout[bonus.id]);
        idTimeout[bonus.id] = setTimeout(bonus.endEffect, bonus.bonusTime);
    }

    function dropBonus(_brick) {

        if (Math.random() > 0.1) {
            var _bonus = bonus.create(_brick.body.position.x, _brick.body.position.y , 'breakout', "brick_4_4.png");
            _bonus.anchor.set(0.5);
            game.physics.enable(_bonus, Phaser.Physics.ARCADE);
     
            _bonus.body.velocity.y = 100;
        }
    }

    function createBall(position) {
        var posX = game.world.centerX;
        var posY = paddle.y - 16;
        if (position != undefined) {
            posX = position.x;
            posY = position.y;
        }
        var _ball = game.add.sprite(posX, posY, 'breakout', 'ball_1.png');
        _ball.anchor.set(0.5);
        _ball.checkWorldBounds = true;

        game.physics.enable(_ball, Phaser.Physics.ARCADE);

        _ball.body.collideWorldBounds = true;
        _ball.body.bounce.set(1);
        _ball.speedFactor = 1;

        _ball.animations.add('spin', [ 'ball_1.png', 'ball_2.png', 'ball_3.png', 'ball_4.png', 'ball_5.png' ], 50, true, false);

        _ball.events.onOutOfBounds.add(ballLost, this);

        balls.push(_ball);
        return _ball;
    }



