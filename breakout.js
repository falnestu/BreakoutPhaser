/* ********************************************
        UTILITIES
********************************************** */

// Tableau d'objets JSON contenant les différents comportements des bonus/malus
//      id : Identifiant du bonus
//      effect : fonction pour lancer le comportement voulu
//      endEffect : fonction pour annuler l'effet du bonus
//      bonusTime : temps de l'effet du bonus
var allBonus =[
    {
        "id": 1,
        effect : function() {
            paddle.loadTexture('breakout', 'paddle_small.png');
        },
        endEffect : function () {
            paddle.loadTexture('breakout', 'paddle_big.png');
        },
        bonusTime : 5000
    },
    {
        "id": 2,
        effect : function() {
            for (var i = 0; i < balls.length; i++) {
                if (balls[i].speedFactor == 1) {
                    balls[i].speedFactor = 0.5;
                    balls[i].body.velocity.y *= balls[0].speedFactor;
                    balls[i].body.velocity.x *= balls[0].speedFactor; 
                }
            }   
        },
        endEffect : function () {
            for (var i = 0; i < balls.length; i++) {
                balls[i].speedFactor = 1;
                balls[i].body.velocity.y *= 2;
                balls[i].body.velocity.x *= 2;
            }
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
        game.load.atlas('breakout', 'images/breakout.png', 'breakout.json');
        game.load.image('starfield', 'images/starfield.jpg');

    }

    var leftEmitter, rightEmitter;

    var balls = [];
    var paddle;
    var bricks;
    var bonus;

    var ballOnPaddle = true;

    var lives = 3;
    var score = 0;

    var idTimeout = new Array(allBonus.length).fill(0);

    var scoreText;
    var livesText;
    var introText;

    var background;

    function create() {

        game.physics.startSystem(Phaser.Physics.ARCADE);

        //  We check bounds collisions against all walls other than the bottom one
        game.physics.arcade.checkCollision.down = false;

        background = game.add.tileSprite(0, 0, 800, 600, 'starfield');

        // Bonus group avec physic ARCADE
        bonus = game.add.group();
        bonus.enableBody = true;
        bonus.physicsBodyType = Phaser.Physics.ARCADE;

        // Bricks group avec physic ARCADE
        bricks = game.add.group();
        bricks.enableBody = true;
        bricks.physicsBodyType = Phaser.Physics.ARCADE;

        //Create all bricks
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

        //Create firstBall
        ball = createBall();
      
        scoreText = game.add.text(32, 550, 'score: 0', { font: "20px Arial", fill: "#ffffff", align: "left" });
        livesText = game.add.text(680, 550, 'lives: 3', { font: "20px Arial", fill: "#ffffff", align: "left" });
        introText = game.add.text(game.world.centerX, 400, '- click to start -', { font: "40px Arial", fill: "#ffffff", align: "center" });
        introText.anchor.setTo(0.5, 0.5);

        //Launch ball on clickDown
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

    //Ball begins move and animation
    function releaseBall () {
        if (ballOnPaddle)
        {

            ballOnPaddle = false;
            balls[0].body.velocity.y = -300;
            balls[0].body.velocity.x = -75;
            balls[0].animations.play('spin');
            introText.visible = false;
        }
    }

    //Fonction quand la balle atteint le bord inférieur
    //  Si une seule balle, on perds une vie et on remet la balle sur le paddle
    //  Sinon on enleve juste une balle
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

    //Game Over : on inscrit GameOver et la balle n'est plus jouable - donc le jeu
    function gameOver () {

        balls[0].body.velocity.setTo(0, 0);
        
        introText.text = 'Game Over!';
        introText.visible = true;

    }

    //Fonction pour permettre des briques solides - Une création d'objet brick est conseillé
    function brickTakeDamage(brick) {
        brick.HP -= 1;
        if (brick.HP < 1) {
            brick.kill();
        }
    }

    //Collision de la balle sur une brique
    function ballHitBrick (_ball, _brick) {
        brickTakeDamage(_brick);

        //Random pour savoir si on créer un bonus
        if (Math.random() > 0.75) {
            dropBonus(_brick);
        }

        //Augmentation du score
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

    //Balle rebondit sur le paddle
    function ballHitPaddle (_ball, _paddle) {
        var diff = 0;
        if (_ball.x < _paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = _paddle.x - _ball.x;
            _ball.body.velocity.x = (-10 * diff) * _ball.speedFactor;
        }
        else if (_ball.x > _paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = _ball.x -_paddle.x;
            _ball.body.velocity.x = (10 * diff) * _ball.speedFactor;
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            _ball.body.velocity.x = 2 + Math.random() * multi;
        }
    }

    //Le paddle attrape le bonus
    function bonusHitPaddle(_paddle, _bonus) {
         _bonus.kill();
         //Choix du bonus
        var r = Math.floor(Math.random()*allBonus.length) + 1;
        //recuperation de l'objet JSON correspondant
        var bonus = allBonus.filter(x => x.id == r)[0];
        //Action d'un bonus
        bonus.effect();
        clearTimeout(idTimeout[bonus.id]);
        idTimeout[bonus.id] = setTimeout(bonus.endEffect, bonus.bonusTime);
    }

    //Chute d'un bonus selon la brick
    function dropBonus(_brick) {
        var _bonus = bonus.create(_brick.body.position.x, _brick.body.position.y , 'breakout', "brick_4_4.png");
        _bonus.anchor.set(0.5);
        game.physics.enable(_bonus, Phaser.Physics.ARCADE);
 
        _bonus.body.velocity.y = 100;
    }

    //Fonction pour ajouter des balles au jeu
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



