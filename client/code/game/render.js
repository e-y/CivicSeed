'use strict';

var _tilesheets = {},
    _currentTilesheet = null,
    _allImages = [],
    _tilesheetWidth = 0,
    _tilesheetHeight = 0,
    _skinSuitWidth = 0,
    _skinSuitHeight = 0,

    _tilesheetCanvas = [],
    _tilesheetContext = [],

    _offscreenBackgroundCanvas = null,
    _offscreenBackgroundContext = null,

    _offscreenSkinSuitCanvas = {},
    _offscreenSkinSuitContext = {},

    _offscreenPlayersCanvas = {},
    _offscreenPlayersContext = {},

    _backgroundContext    = null,
    _foregroundContext    = null,
    _charactersContext    = null,
    _gameboardHudContext  = null,
    _minimapPlayerContext = null,
    _minimapTileContext   = null,

    _prevMouseX = 0,
    _prevMouseY = 0,
    _hasNpc = false,
    _wasNpc = false,
    _playerColorNum = 0,
    _playerLevelNum = 0;

var $renderer = $game.$renderer = {

  ready: false,

  // setup all rendering contexts then load images
  init: function(callback) {
    // create offscreen canvases for optimized rendering
    _offscreenBackgroundCanvas = document.createElement('canvas');
    _offscreenBackgroundCanvas.setAttribute('width', $game.VIEWPORT_WIDTH * $game.TILE_SIZE);
    _offscreenBackgroundCanvas.setAttribute('height', $game.VIEWPORT_WIDTH * $game.TILE_SIZE);
    // offscreen contexts
    _offscreenBackgroundContext = _offscreenBackgroundCanvas.getContext('2d');

    // access the canvases for rendering
    _backgroundContext = document.getElementById('background').getContext('2d');
    _foregroundContext = document.getElementById('foreground').getContext('2d');
    _charactersContext = document.getElementById('characters').getContext('2d');
    _gameboardHudContext = document.getElementById('gameboardHud').getContext('2d')

    _gameboardHudContext.shadowColor = '#000';
    _gameboardHudContext.fillStyle = '#fff';
    _gameboardHudContext.textAlign = 'center';
    _gameboardHudContext.textBaseline = 'bottom';
    _gameboardHudContext.font = '12pt Inconsolata, monospace';

    _minimapPlayerContext = document.getElementById('minimapPlayer').getContext('2d');
    _minimapTileContext = document.getElementById('minimapTile').getContext('2d');

    // set stroke stuff for mouse
    _foregroundContext.strokeStyle = 'rgba(0,255,0,.4)'; // Green default
    _foregroundContext.lineWidth = 4;
    _foregroundContext.save();

    _allImages = ['tilesheet_gray', 'tilesheet_color', 'npcs', 'botanist', 'robot', 'boss_items', 'tiny_botanist','cursors'];

    _playerColorNum = $game.$player.getColorNum();
    _playerLevelNum = $game.$player.currentLevel;
    $renderer.loadTilesheets(0);

    // hack to check if all stuff is loaded so we can callback
    var checkDone = function() {
      if($renderer.ready) {
        callback();
      } else {
        setTimeout(checkDone, 30);
      }
    };
    checkDone();
  },

  resetInit: function() {
    _tilesheets = {};
    _currentTilesheet = null;
    _allImages = [];
    _tilesheetWidth = 0;
    _tilesheetHeight = 0;
    _skinSuitWidth = 0;
    _skinSuitHeight = 0;

    _tilesheetCanvas = [];
    _tilesheetContext = [];

    _offscreenBackgroundCanvas= null;
    _offscreenBackgroundContext = null;

    _offscreenSkinSuitCanvas = {};
    _offscreenSkinSuitContext = {};

    _offscreenPlayersCanvas = {};
    _offscreenPlayersContext = {};

    _backgroundContext    = null;
    _foregroundContext    = null;
    _charactersContext    = null;
    _gameboardHudContext  = null;
    _minimapPlayerContext = null;
    _minimapTileContext   = null;

    _prevMouseX = 0;
    _prevMouseY = 0;
    _hasNpc = false;
    _wasNpc = false;
    _playerColorNum = 0;
    _playerLevelNum = 0;

    $game.$renderer.ready = false;
  },

  // this loads the specified tilesheet
  loadTilesheets: function(num) {
    //load the images recursively until done
    var filename = _allImages[num];
    _tilesheets[filename] = new Image();
    _tilesheets[filename].src = CivicSeed.CLOUD_PATH + '/img/game/' + filename + '.png';
    _tilesheets[filename].onload = function() {
      var next = num + 1;
      if(num === _allImages.length - 1) {
        $renderer.loadSkinSuitImages();
      }
      else {
        //if they are the world ones, do render them to canvas
        if(num === 0) {
          //gray
          _tilesheetCanvas[0] = document.createElement('canvas');
          _tilesheetCanvas[0].setAttribute('width', _tilesheets[filename].width);
          _tilesheetCanvas[0].setAttribute('height', _tilesheets[filename].height);
          _tilesheetContext[0] = _tilesheetCanvas[0].getContext('2d');

          _tilesheetWidth = _tilesheets[filename].width / $game.TILE_SIZE;
          _tilesheetHeight = _tilesheets[filename].height / $game.TILE_SIZE;
          _tilesheetContext[0].drawImage(
            _tilesheets[filename],
            0,
            0
          );
        } else if(num === 1) {
          //color
          _tilesheetCanvas[1] = document.createElement('canvas');
          _tilesheetCanvas[1].setAttribute('width', _tilesheets[filename].width);
          _tilesheetCanvas[1].setAttribute('height', _tilesheets[filename].height);
          _tilesheetContext[1] = _tilesheetCanvas[1].getContext('2d');
          _tilesheetContext[1].drawImage(
            _tilesheets[filename],
            0,
            0
          );
        }
        $renderer.loadTilesheets(next);
      }
    };
  },

  //load all player images
  loadSkinSuitImages: function (num) {
    if (num === undefined) num = 0
      /*
    // TODO
    // Proposed refactor. Doesn't work. Causes player sprites to not load. Why is this?
    // Hacky way of keeping track of skin loads
    var total = $game.$skins.getSkinsList().length,
        count = 0

    function _onSkinLoad (image, id) {
      _offscreenSkinSuitCanvas[id] = document.createElement('canvas');
      _offscreenSkinSuitCanvas[id].setAttribute('width', image.width);
      _offscreenSkinSuitCanvas[id].setAttribute('height', image.height);
      _offscreenSkinSuitContext[id] = _offscreenSkinSuitCanvas[id].getContext('2d');

      _offscreenSkinSuitContext[id].drawImage(
        image,
        0,
        0
      );

      if ((count + 1) === total) {
        _skinSuitWidth = image.width;
        _skinSuitHeight = image.height;
        $renderer.ready = true;
        $game.$skins.renderSkinventory();
        $renderer.createCanvasForPlayer($game.$player.id, false);
      }
    }

    for (var id in $skins.data) {
      var filepath = CivicSeed.CLOUD_PATH + '/img/game/skins/' + id + '.png';

      var image = new Image()
      image.src = filepath
      image.onload = _onSkinLoad(image, id)

      if ($skins.data.hasOwnProperty(id)) {
        ++count
      }
    }
    */

    var next = num + 1,
        skinsList = $game.$skins.getSkinsList(),
        filename = skinsList[num],
        skinSuitFile = CivicSeed.CLOUD_PATH + '/img/game/skins/' + filename + '.png';

    var skinSuitImage = new Image();
    skinSuitImage.src = skinSuitFile;

    skinSuitImage.onload = function() {

      _offscreenSkinSuitCanvas[filename] = document.createElement('canvas');
      _offscreenSkinSuitCanvas[filename].setAttribute('width', skinSuitImage.width);
      _offscreenSkinSuitCanvas[filename].setAttribute('height', skinSuitImage.height);
      _offscreenSkinSuitContext[filename] = _offscreenSkinSuitCanvas[filename].getContext('2d');

      _offscreenSkinSuitContext[filename].drawImage(
        skinSuitImage,
        0,
        0
      );

      if(next === skinsList.length) {
        $renderer.ready = true;
        _skinSuitWidth = skinSuitImage.width;
        _skinSuitHeight = skinSuitImage.height;
        $game.$skins.renderSkinventory();
        $renderer.createCanvasForPlayer($game.$player.id, false);
        return;
      }
      else {
        $renderer.loadSkinSuitImages(next);
      }
    };

  },

  //render a frame on every tick, clear canvases and draw updated content
  renderFrame: function() {
    // $game.$others.clear();
    // $game.$player.clear();
    // $game.$npc.clear();
    // $game.$botanist.clear();
    // $game.$robot.clear();
    $renderer.clearAll();

    //only re-render all the tiles if the viewport is tranisitioning
    if($game.inTransit) {
      $renderer.renderAllTiles();
    }

    $renderer.makeQueue(function(all) {
      var a = all.length;
      while(--a > -1) {
        if(all[a].kind === 'npc') {
          $renderer.renderNpc(all[a]);
        }
        else if(all[a].kind === 'botanist') {
          $renderer.renderBotanist(all[a]);
        }
        else if(all[a].kind === 'robot') {
          $renderer.renderRobot(all[a]);
        }
        else {
          $renderer.renderPlayer(all[a]);
        }
      }
    });
  },

  //create order for drawing all characters (other players, your player, npcs, botanist, robot)
  makeQueue: function(callback) {
    var playerInfo = $game.$player.getRenderInfo(),
      order = [playerInfo],
      order2 = $game.$others.getRenderInfo(),
      order3 = $game.$npc.getRenderInfo(),
      botanistInfo = $game.$botanist.getRenderInfo(),
      robotInfo = $game.$robot.getRenderInfo();

    var finalOrder = order.concat(order2, order3);

    if(botanistInfo) {
      finalOrder.push(botanistInfo);
    }
    if(robotInfo) {
      finalOrder.push(robotInfo);
    }

    finalOrder.sort(function(a, b){
      return b.curY-a.curY;
    });
    callback(finalOrder);
  },

  //figure out the information to draw on a tile
  renderTile: function(i, j) {

    //get the index (which refers to the location of the image)
    //tilemap reference to images starts at 1 instead of 0
    var curTile = $game.$map.currentTiles[i][j],

      backIndex1 = curTile.background-1,
      backIndex2 = curTile.background2-1,
      backIndex3 = curTile.background3-1,
        //will be backIndex3
      foreIndex = curTile.foreground-1,
      foreIndex2 = curTile.foreground2-1,
      tileStateVal = curTile.tileState,
      colored = curTile.colored,

      tileData = {
        b1: backIndex1,
        b2: backIndex2,
        b3: backIndex3,
        destX: i,
        destY: j,
        colored: colored
      };

    //send the tiledata to the artist aka mamagoo
    $renderer.drawMapTile(tileData);

    //foreground tiles
    var foreData = {
      f1: foreIndex,
      f2: foreIndex2,
      destX: i,
      destY: j,
      colored: colored
    };

    if(foreIndex > -1 || foreIndex2 > -1) {
      $renderer.drawForegroundTile(foreData);
    }
  },

  //clear a single tile
  clearMapTile: function(x, y) {
    _backgroundContext.clearRect(
      x,
      y,
      $game.TILE_SIZE,
      $game.TILE_SIZE
      );
  },

  //draw the actual tile on the canvas
  drawMapTile: function(tileData) {

    var srcX,srcY;

    var tilesheetIndex = tileData.colored ? 1 : 0;
    //background1, the ground texture
    if(tilesheetIndex === 1) {
      //4 is bg
      _backgroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        4 * $game.TILE_SIZE,
        0,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
    }

    if(tileData.b1 > -1) {
      srcX =  tileData.b1 % _tilesheetWidth;
      srcY =  Math.floor(tileData.b1 / _tilesheetWidth);

      //draw it to offscreen
      _backgroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        srcX * $game.TILE_SIZE,
        srcY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
    }

    if(tileData.b2 > -1) {
      srcX = tileData.b2 % _tilesheetWidth;
      srcY =  Math.floor(tileData.b2 / _tilesheetWidth);
      //draw it to offscreen
      _backgroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        srcX * $game.TILE_SIZE,
        srcY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
    }
    if(tileData.b3 > -1) {
      srcX = tileData.b3 % _tilesheetWidth;
      srcY =  Math.floor(tileData.b3 / _tilesheetWidth);
      //draw it to offscreen
      _backgroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        srcX * $game.TILE_SIZE,
        srcY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
    }
  },

  //draw a foreground tile to the canvas
  drawForegroundTile: function(tileData) {
    var srcX, srcY;

    var tilesheetIndex = tileData.colored ? 1 : 0;
    if(tileData.f1 > -1) {
      srcX = tileData.f1 % _tilesheetWidth;
      srcY = Math.floor(tileData.f1 / _tilesheetWidth);
      _foregroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        srcX * $game.TILE_SIZE,
        srcY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
        );
    }
    if(tileData.f2 > -1) {
      srcX = tileData.f2 % _tilesheetWidth;
      srcY = Math.floor(tileData.f2 / _tilesheetWidth);
      _foregroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        srcX * $game.TILE_SIZE,
        srcY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
        );
    }

  },

  //create a canvas for each active player
  createCanvasForPlayer: function(id, suit) {
    //if it exists, clear it
    if(_offscreenPlayersContext[id]) {
      _offscreenPlayersContext[id].clearRect(0,0,_skinSuitWidth,_skinSuitHeight);
    } else {
      _offscreenPlayersCanvas[id] = document.createElement('canvas');
      _offscreenPlayersCanvas[id].setAttribute('width', _skinSuitWidth);
      _offscreenPlayersCanvas[id].setAttribute('height', _skinSuitHeight);
      _offscreenPlayersContext[id] = _offscreenPlayersCanvas[id].getContext('2d');
    }
    var skinSuit = suit;
    if(!skinSuit) {
      skinSuit = $game.$player.getSkinSuit();
    }
    //draw the head, torso, and legs
    var h = $game.TILE_SIZE * 2,
      numRows = Math.floor(_skinSuitHeight / h);

    var r = 0;
    //draw all the heads from this spritesheet
    var headHeight = 30,
      torsoHeight = 15,
      legsHeight = 19;


    for(r = 0; r < numRows; r++) {
      _offscreenPlayersContext[id].drawImage(
        _offscreenSkinSuitCanvas[skinSuit.head],
        0,
        r * h,
        _skinSuitWidth,
        headHeight,
        0,
        r * h,
        _skinSuitWidth,
        headHeight
      );
    }
    //draw all the torso from this spritesheet
    for(r = 0; r < numRows; r++) {
      _offscreenPlayersContext[id].drawImage(
        _offscreenSkinSuitCanvas[skinSuit.torso],
        0,
        r * h + headHeight,
        _skinSuitWidth,
        torsoHeight,
        0,
        r * h + headHeight,
        _skinSuitWidth,
        torsoHeight
      );
    }
    //draw all the legs from this spritesheet
    for(r = 0; r < numRows; r++) {
      _offscreenPlayersContext[id].drawImage(
        _offscreenSkinSuitCanvas[skinSuit.legs],
        0,
        r * h + headHeight + torsoHeight,
        _skinSuitWidth,
        legsHeight,
        0,
        r * h + headHeight + torsoHeight,
        _skinSuitWidth,
        legsHeight
      );
    }

        //tinting proof
    // var theImage = _offscreenSkinSuitContext.lion.getImageData(0, 0, _skinSuitWidth, _skinSuitHeight);
  //           pix = theImage.data;
            
  //       // Every four values equals 1 pixel. 
  //       for (i = 0; i < pix.length; i += 4) {
  //           pix[i]  = 255;
  //           pix[i + 1]  = 255;
  //           pix[i + 3] = 0;
  //           // green[i + 1] = 255;
  //           // blue[i + 2]  = pix[i + 2];
  //           // alpha[i + 3] = pix[i + 3];
  //       }
  //       _offscreenSkinSuitContext.lion.putImageData(theImage, 0,0);
  },

  //draw the player from backup to real canvas
  renderPlayer: function(info) {
    _charactersContext.drawImage(
      _offscreenPlayersCanvas[info.id],
      info.srcX,
      info.srcY,
      $game.TILE_SIZE,
      $game.TILE_SIZE*2,
      info.curX,
      info.curY - $game.TILE_SIZE,
      $game.TILE_SIZE,
      $game.TILE_SIZE*2
    );

    // Display player name
    _gameboardHudContext.save();
    _gameboardHudContext.shadowBlur = 3;
    _gameboardHudContext.shadowOffsetX = 0;
    _gameboardHudContext.shadowOffsetY = 0;
    _gameboardHudContext.fillText(info.firstName, info.curX + $game.TILE_SIZE / 2, info.curY - $game.TILE_SIZE);
    _gameboardHudContext.restore();
  },

  //clear the character canvas
  clearAll: function() {
    _charactersContext.clearRect(
      0,
      0,
      $game.VIEWPORT_WIDTH * $game.TILE_SIZE,
      $game.VIEWPORT_HEIGHT * $game.TILE_SIZE
    );
    _gameboardHudContext.clearRect(
      0,
      0,
      $game.VIEWPORT_WIDTH * $game.TILE_SIZE,
      $game.VIEWPORT_HEIGHT * $game.TILE_SIZE
    );
  },

  //clear a specific region on the character canvas
  clearCharacter: function(info) {
    _charactersContext.clearRect(
      info.prevX,
      info.prevY - $game.TILE_SIZE,
      $game.TILE_SIZE,
      $game.TILE_SIZE*2
    );
  },

  //clear all the canvases and draw all the tiles
  renderAllTiles: function() {

    _foregroundContext.clearRect(
      0,
      0,
      $game.VIEWPORT_WIDTH * $game.TILE_SIZE,
      $game.VIEWPORT_HEIGHT * $game.TILE_SIZE
      );

    //start fresh for the offscreen every time we change ALL tiles
    _offscreenBackgroundContext.clearRect(
      0,
      0,
      $game.VIEWPORT_WIDTH * $game.TILE_SIZE,
      $game.VIEWPORT_HEIGHT * $game.TILE_SIZE
      );
    _backgroundContext.clearRect(
      0,
      0,
      $game.VIEWPORT_WIDTH * $game.TILE_SIZE,
      $game.VIEWPORT_HEIGHT * $game.TILE_SIZE
      );

    //go through and draw each tile to the appropriate canvas
    var i = $game.VIEWPORT_WIDTH;
    while(--i >= 0) {
      var j = $game.VIEWPORT_HEIGHT;
      while(--j >= 0) {
        $renderer.renderTile(i,j);
      }
    }

    _charactersContext.clearRect(
      0,
      0,
      $game.VIEWPORT_WIDTH * $game.TILE_SIZE,
      $game.VIEWPORT_HEIGHT * $game.TILE_SIZE
      );
  },

  //draw and npc to the canvas
  renderNpc: function (npcData) {
    _charactersContext.drawImage(
      _tilesheets.npcs,
      npcData.srcX,
      npcData.srcY,
      $game.TILE_SIZE,
      $game.TILE_SIZE*2,
      npcData.curX,
      npcData.curY - $game.TILE_SIZE,
      $game.TILE_SIZE,
      $game.TILE_SIZE*2
    );
  },

  //draw the mouse box to the canvas
  renderMouse: function(mouse) {

    var mX = mouse.cX * $game.TILE_SIZE,
      mY = mouse.cY * $game.TILE_SIZE,
      state = $game.$map.getTileState(mouse.cX, mouse.cY);
      //clear previous mouse area
      _foregroundContext.clearRect(
        _prevMouseX * $game.TILE_SIZE,
        _prevMouseY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );

      //redraw that area
    var tile = $game.$map.currentTiles[_prevMouseX][_prevMouseY];
      var foreIndex = tile.foreground - 1,
        foreIndex2 =  tile.foreground2 - 1,
        colored = tile.colored,

        foreData = {
          f1: foreIndex,
          f2: foreIndex2,
          destX: _prevMouseX,
          destY: _prevMouseY,
          colored: colored
      };

      $renderer.drawForegroundTile(foreData);
      var srcX;
      if($game.$player.seedMode) {
        srcX  = $game.TILE_SIZE * 3;
      }
      else {
        // var user = $game.$others.playerCard(tile.x, tile.y);
        // console.log(tile.x, user);
        // if(user) {
        //  srcX = $game.TILE_SIZE * 2;
        // } else if(state === -1) {
        if(state === -1) {
          //go
          srcX = 0;
        } else if(state === -2) {
          //nogo
          srcX  = $game.TILE_SIZE;
        } else {
          //npc
          srcX  = $game.TILE_SIZE * 2;
        }
      }
      _foregroundContext.drawImage(
        _tilesheets.cursors,
        srcX,
        0,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        mX,
        mY,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );

      _prevMouseX = mouse.cX;
      _prevMouseY = mouse.cY;
  },

  //clear the mini mpa
  clearMiniMap: function() {
    _minimapPlayerContext.clearRect(0,0,$game.TOTAL_WIDTH,$game.TOTAL_HEIGHT);
  },

  //render a player to the mini map
  renderMiniPlayer: function(player) {
    //draw player
    _minimapPlayerContext.fillStyle = player.col;
    _minimapPlayerContext.fillRect(
      player.x,
      player.y,
      4,
      4
    );
  },

  //render the botanist and dividing lines on the mini map
  renderMiniMapConstants: function() {
    _minimapPlayerContext.fillStyle = 'rgb(150,150,150)';
    _minimapPlayerContext.fillRect(
      0,
      72,
      142,
      1
    );
    _minimapPlayerContext.fillRect(
      71,
      0,
      1,
      132
    );
    // _minimapPlayerContext.fillStyle = 'rgb(255,255,255)';
    // _minimapPlayerContext.fillRect(
    //  67,
    //  68,
    //  8,
    //  8
    // );
    _minimapPlayerContext.drawImage(
      _tilesheets.tiny_botanist,
      0,
      0,
      20,
      16,
      60,
      64,
      20,
      16
    );
  },

  //render a specific tile on the mini map
  renderMiniTile: function(x, y) {
    var rgba = 'rgb(124,202,176)';
    _minimapTileContext.fillStyle = rgba;
    _minimapTileContext.fillRect(
      x,
      y,
      1,
      1
    );
    
  },

  //clear the botanist from the canvas
  clearBotanist: function(info) {
    _charactersContext.clearRect(
      info.prevX,
      info.prevY - $game.TILE_SIZE * 4,
      $game.TILE_SIZE * 6,
      $game.TILE_SIZE * 5
    );
  },

  //clear the robot from canvas
  clearRobot: function(info) {
    _charactersContext.clearRect(
      info.prevX,
      info.prevY - $game.TILE_SIZE * 4,
      $game.TILE_SIZE * 6,
      $game.TILE_SIZE * 5
    );
  },

  //render the botanist on the canvas
  renderBotanist: function(info) {
    _charactersContext.drawImage(
      _tilesheets.botanist,
      info.srcX,
      info.srcY,
      $game.TILE_SIZE * 6,
      $game.TILE_SIZE * 5,
      info.curX,
      info.curY - $game.TILE_SIZE * 4,
      $game.TILE_SIZE * 6,
      $game.TILE_SIZE * 5
    );
  },

  //render the robot on the canvas
  renderRobot: function(info) {
    // console.log(info.srcX, info.srcY);
    _charactersContext.drawImage(
      _tilesheets.robot,
      info.srcX,
      info.srcY,
      64,
      64,
      info.curX,
      info.curY - $game.TILE_SIZE * 1,
      64,
      64
    );
  },

  //display the mini map image on the canvas
  imageToCanvas: function(map) {
    var newImg = new Image();

    newImg.onload = function() {
      _minimapTileContext.drawImage(newImg,0,0);
    };
    newImg.src = map;
  },

  renderBossTiles: function(tiles) {
    for(var t = 0; t < tiles.length; t++) {
      $renderer.clearMapTile(tiles[t].x * $game.TILE_SIZE, tiles[t].y * $game.TILE_SIZE);
      _backgroundContext.fillStyle = tiles[t].color;
      _backgroundContext.fillRect(
        tiles[t].x * $game.TILE_SIZE,
        tiles[t].y * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
      if(tiles[t].item > -1) {
        // _backgroundContext.fillStyle = 'rgba(0,' + tiles[t].item * 50 + ',200,0.5)';
        // _backgroundContext.fillRect(
        //  tiles[t].x * $game.TILE_SIZE,
        //  tiles[t].y * $game.TILE_SIZE,
        //  $game.TILE_SIZE,
        //  $game.TILE_SIZE
        // );
        _backgroundContext.drawImage(
          _tilesheets.boss_items,
          tiles[t].item * $game.TILE_SIZE,
          0,
          $game.TILE_SIZE,
          $game.TILE_SIZE,
          tiles[t].x * $game.TILE_SIZE,
          tiles[t].y * $game.TILE_SIZE,
          $game.TILE_SIZE,
          $game.TILE_SIZE             
        );
      }
      if(tiles[t].charger > -1) {
        // _backgroundContext.fillStyle = 'rgba(255,0,0,0.9)';
        // _backgroundContext.fillRect(
        //  tiles[t].x * $game.TILE_SIZE,
        //  tiles[t].y * $game.TILE_SIZE,
        //  $game.TILE_SIZE,
        //  $game.TILE_SIZE
        // );
        _backgroundContext.drawImage(
          _tilesheets.boss_items,
          128,
          0,
          $game.TILE_SIZE,
          $game.TILE_SIZE,
          tiles[t].x * $game.TILE_SIZE,
          tiles[t].y * $game.TILE_SIZE,
          $game.TILE_SIZE,
          $game.TILE_SIZE
        );
      }
    }
  },

  clearBossLevel: function() {
    _backgroundContext.clearRect(
      0,
      0,
      $game.TILE_SIZE * $game.VIEWPORT_WIDTH,
      $game.TILE_SIZE * $game.VIEWPORT_HEIGHT
    );
  },

  clearMap: function() {
    _backgroundContext.clearRect(
      0,
      0,
      $game.TILE_SIZE * $game.VIEWPORT_WIDTH,
      $game.TILE_SIZE * $game.VIEWPORT_HEIGHT
    );
    _foregroundContext.clearRect(
      0,
      0,
      $game.VIEWPORT_WIDTH * $game.TILE_SIZE,
      $game.VIEWPORT
    );
  }

};
