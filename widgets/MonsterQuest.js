/**
* Monster Quest - a typing RPG where you type words to slay monsters and level up.  Programmed by David Marron
 */
dojo.provide('myapp.MonsterQuest');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dojox.timing._base');
dojo.require('dojo.i18n');
dojo.require('dojo.number');
//dojo.require('uow.audio.JSonic');
dojo.requireLocalization('myapp', 'MonsterQuest');

dojo.declare('myapp.MonsterQuest', [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
	templatePath: dojo.moduleUrl('myapp.templates', 'MonsterQuest.html'),

	postCreate: function() {
		var xhrArgs = {
			url: 'input.txt',
			handleAs: "text",
			preventCache: true,
			load: dojo.hitch(this,"loadMonsterWords")
		}
		dojo.xhrGet(xhrArgs);
		this.connect(window,'onkeyup','_onKeyPress');
		this.connect(window,'onclick','_onClick');
		dojo.connect(dojo.doc, 'onkeypress', function(event) {
            if(event.target.size === undefined &&
               event.target.rows === undefined &&
               event.keyCode == dojo.keys.BACKSPACE) {
                // prevent backspace page nav
                event.preventDefault();
            }
        } );
		this.initialize();
	},
    postMixInProperties: function() {
		this.recordedLetters = [];
		this.recordedNumbers = [];
		this.recordedMessages = [];
		this.tutorialMessages = [];
		this.soundEffects = [];
		this.music = [];
		this.monsterMessages = [];
		this.recordedWords = [];
		this.duplicateWords = [];
		this.saidWords = [];
		this._ext = '.ogg';
		this.audioQueue = [];
		this.currentlyTalking = false;
		this.typeWord = false;
		this.readWord = false;
		this.startedTimer = false;
		this.stopTimer = false;
		this.timerCounter = 0;
		this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		this.gameStarted = false;
		this.waitNextLevel = false;
		this.mute = false;
		this.noDisable = false;
		this.tutorialPage = 0;
		this.currentRow = 2;
		this.area = 'intro';
		this.difficulty = 2;
		this.visitedAreas = [];
		this.typedLetters = [];
		this.inCombat = false;
		this.justWonBattle = false;
		this.combatMode = 'attack';
		this.skippedSound = 0;
		this.pressedShift = false;
		this.level = 1;
		this.baseCombatLevel = 10;
		this.combatLevel = 10;
		this.baseMagicLevel = 10;
		this.magicLevel = 10;
		this.maxHealth = 80 + 2*this.combatLevel;
		this.currentHealth = 80 + 2*this.combatLevel;
		this.maxMana = 80 + 2*this.magicLevel;
		this.currentMana = 80 + 2*this.magicLevel;
		this.power = 0;
		this.monsterName = '';
		this.monsterMaxHealth = 0;
		this.monsterHealth = 0;
		this.monsterAttack = 0;
		this.monsterExperience = 0;
		this.monsterGold = 0;
		this.experience = 0;
		this.gold = 0;
		this.knownSpells = ['DART'];
		this.monsters = [];
		this.currentWords = [];
		this.currentWord = 'undefined';
    },
	loadMonsterWords: function(data) {
		dataSplit = data.split('\n');
		for (i = 0; i < dataSplit.length; i++) {
			//remove all whitespace
			dataSplit[i] = dataSplit[i].split(' ').join('');
			if (dataSplit[i].indexOf(':') != -1) {
				var monster = {
					name: "Undefined",
					words: []
				}
				monster.name = dataSplit[i].split(':')[0];
				monster.words = dataSplit[i].split(':')[1].split(',');
				this.monsters.push(monster);
			}
		}
	},
	_onClick: function(e) {
		if (!this.gameStarted) {

		}
	},
	_onKeyPress: function(e) {
		//disable keyboard while talking
		//if (!this.currentlyTalking) {
			if (e.keyCode == 13 || e.keyCode == 32) {
				//enter or space pressed
				if (this.inCombat  && !this.currentlyTalking && !this.typeWord) {
					combatDelay = false;
					this.recordedMessages[5].volume = 1;
					this.recordedMessages[5].play();
				}
				if (this.justWonBattle) {
					this.justWonBattle = false;
					if (this.experience > this.level*this.level*100) {
						this.levelUp();
					} else if (this.area == 'town') {
						this.enterTown();
					}
				} else if (this.area == 'town') {
				
				} else if (this.area == 'intro') {
					this.recordedMessages[0].volume = 0;
					this.recordedMessages[1].volume = 0;
					this.recordedMessages[2].volume = 0;
					this.recordedMessages[3].volume = 0;
					this.recordedMessages[4].volume = 0;
					if (this.currentRow == 1) {
						this.difficulty = this.currentRow;
						this.area = 'tutorial';
						this.tutorial(0);
					} else if (this.currentRow == 2) {
						this.difficulty = this.currentRow;
						this.area = 'tutorial';
						this.tutorial(0);
					} else if (this.currentRow == 3) {
						this.difficulty = this.currentRow;
						this.area = 'tutorial';
						this.tutorial(0);
					} else if (this.currentRow == 4) {
						this.difficulty = this.currentRow;
						this.area = 'tutorial';
						this.tutorial(0);
					} else {
						//this.loadGame();
					}
				} else if (this.area == 'tutorial') {
					if (!this.inCombat) {
						this.tutorialMessages[0].volume = 0;
						this.tutorialMessages[1].volume = 0;
						this.tutorialMessages[2].volume = 0;
						this.tutorialMessages[3].volume = 0;
						this.tutorialPage ++;
						if (this.tutorialPage == 4) {
							this.combat('Tutorial',25,110,5,10);
						} else {
							this.tutorial(this.tutorialPage);
						}
					}
				}
			} else if (e.keyCode == 37) {
				//left arrow pressed
				if (this.inCombat && !this.currentlyTalking && !this.typeWord) {
					//say health and mana
					this.recordedMessages[5].volume = 0;
					combatDelay = false;
					this.readHealthAndMana();
				}
			} else if (e.keyCode == 38) {
				//up arrow pressed
				if (this.inCombat) {
					if (!this.currentlyTalking) {
						this.recordedMessages[5].volume = 0;
						combatDelay = false;
						this.currentlyTalking = true;
						this.recordedMessages[6].play();
						if (!this.typeWord) {
							this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
						} else {
							this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
						}
					}
				} else if (this.area == "intro") {
					this.currentRow --;
					if (this.currentRow < 1) {
						this.currentRow = 5;
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 1;
						this.recordedMessages[4].play();
					} else if (this.currentRow == 1) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[1].volume = 1;
						this.recordedMessages[1].play();
					} else if (this.currentRow == 2) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[2].volume = 1;
						this.recordedMessages[2].play();
					} else if (this.currentRow == 3) {
						
					} else if (this.currentRow == 4) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[3].volume = 1;
						this.recordedMessages[3].play();
					}
					this.drawIntroPage();
				}
				this.soundEnded();
			} else if (e.keyCode == 39) {
				//right arrow pressed
				if (this.inCombat && !this.currentlyTalking && !this.typeWord) {
					this.recordedMessages[5].volume = 0;
					combatDelay = false;
					//say: the monster has ... percent of its health left
					this.audioQueue = [];
					this.audioQueue.push(this.recordedMessages[15]);
					this.readNumber(Math.round(this.monsterHealth/this.monsterMaxHealth*100));
					this.audioQueue.push(this.recordedMessages[16]);
					this.soundEnded();
				}
			} else if (e.keyCode == 40) {
				//down arrow pressed
				if (this.inCombat) {
					if (!this.currentlyTalking) {
						this.recordedMessages[5].volume = 0;
						combatDelay = false;
					}
				} else if (this.area == "intro") {
					this.currentRow ++;
					if (this.currentRow > 5) {
						this.currentRow = 1;
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[1].volume = 1;
						this.recordedMessages[1].play();
					} else if (this.currentRow == 2) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[2].volume = 1;
						this.recordedMessages[2].play();
					} else if (this.currentRow == 3) {
						
					} else if (this.currentRow == 4) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[3].volume = 1;
						this.recordedMessages[3].play();
					} else if (this.currentRow == 5) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 1;
						this.recordedMessages[4].play();
					}
					this.drawIntroPage();
				} else if (this.area == 'tutorial') {
					if (!this.inCombat) {
						this.tutorialMessages[0].volume = 0;
						this.tutorialMessages[1].volume = 0;
						this.tutorialMessages[2].volume = 0;
						this.tutorialMessages[3].volume = 0;
						this.tutorial(this.tutorialPage);
					}
				}
			} else if (e.keyCode == 16) {
				//shift pressed - skip tutorial page
				/*if (this.area == 'intro') {
					this.tutorial(this.tutorialPage);
				}*/
				//shift pressed - skip tutorial
				if (this.area == 'tutorial' && !this.inCombat) {
					this.area = 'town';
					this.experience += 5;
					this.gold += 10;
					this.enterTown();
				}
			} else if (this.letters.indexOf(String.fromCharCode(e.keyCode)) != -1) {
				//letter typed
				if (this.inCombat) {
					if (!this.currentlyTalking) {
						if (this.typeWord) {
							if (this.readWord && !this.startedTimer) {
								this.startPowerTimer();
							}
							this.recordedLetters[e.keyCode - 65].volume = 0.5;
							this.recordedLetters[e.keyCode - 65].play();
							if (this.typedLetters.length == 0) {
								this.drawCombat();
							}
							this.typedLetters.push(String.fromCharCode(e.keyCode));
							if (this.typedLetters[this.typedLetters.length-1].toLowerCase() != this.currentWord.charAt(this.typedLetters.length-1).toLowerCase()) {
								this.currentlyTalking = true;
								var ctx = canvas.getContext("2d");
								ctx.fillStyle = "red";
								ctx.font = "25px Courier";
								ctx.fillText(this.typedLetters[this.typedLetters.length-1],10+20*(this.typedLetters.length-1),180);
								setTimeout(dojo.hitch(this,function(){
									//miss
									this.stopTimer = true;
									if (this.combatMode == 'defend') {
										this.power = 0;
										this.takeDamage();
									} else {
										this.onceConnect(this.recordedMessages[7],'ended',this,'monsterTurn');
										this.recordedMessages[7].play();
									}
								}),50);
								this.typeWord = false;
								this.typedLetters = [];
							} else if (this.typedLetters.length == this.currentWord.length) {
								//hit
								this.stopTimer = true;
								this.typeWord = false;
								var ctx = canvas.getContext("2d");
								ctx.fillStyle = "#000";
								ctx.font = "25px Courier";
								ctx.fillText(this.typedLetters[this.typedLetters.length-1],10+20*(this.typedLetters.length-1),180);
								this.typedLetters = [];
								if (this.combatMode == 'defend') {
									this.takeDamage();
								} else {
									this.hitMonster();
								}
								
							} else {
								if (this.power < 100) {
									this.power+=(3-this.difficulty/2);
									if (this.power > 102) {
										this.power = 102;
									}
								}
								var ctx = canvas.getContext("2d");
								ctx.fillStyle = "#000";
								ctx.font = "25px Courier";
								ctx.fillText(this.typedLetters[this.typedLetters.length-1],10+20*(this.typedLetters.length-1),180);
							}
							if (this.typedLetters.length > 0) {
								//this.recordedLetters[e.keyCode - 65].volume = 0.3;
								//this.recordedLetters[e.keyCode - 65].play();
							}
						} else {
							this.recordedLetters[e.keyCode - 65].volume = 0.5;
							this.recordedLetters[e.keyCode - 65].play();
						}
					}
				} else if (this.area == 'town') {
				
				} else {
					this.recordedLetters[e.keyCode - 65].volume = 0.3;
					this.recordedLetters[e.keyCode - 65].play();
				}
				/* else if (this.tutorialPage == 3) {
					this.recordedLetters[e.keyCode - 65].volume = 0.3;
					this.recordedLetters[e.keyCode - 65].play();
					this.typedLetters.push(String.fromCharCode(e.keyCode));
					if (this.typedLetters[this.typedLetters.length-1] != this.knownSpells[0].charAt(this.typedLetters.length-1)) {
						console.log("spell failed");
						this.typedLetters = [];
					} else if (this.typedLetters.length == this.knownSpells[0].length) {
						console.log("spell cast");
						this.typedLetters = [];
						setTimeout(dojo.hitch(this,function(){this.tutorial(this.tutorialPage);}),1000);
					}
				}*/
			}
		/*} else if (e.keyCode == 16) {
			//shift pressed - skip tutorial page
			if (this.area == 'intro') {
				this.tutorialMessages[0].volume = 0;
				this.tutorialMessages[1].volume = 0;
				this.tutorialMessages[2].volume = 0;
				this.tutorialMessages[3].volume = 0;
				this.pressedShift = true;
				this.tutorialPrompt();
				this.skippedSound ++;
			}
		}*/
	},
	//method that I didn't write that connects only once
	onceConnect: function(source, event, object, method){
		source = typeof(source)=="string" ? dojo.byId(source) : source;
		if(!source) throw new Error("Bad source passed to dojo.connect:", source);
		var callback = dojo.hitch(object, method);
		var handle = dojo.connect(source, event, function(){
			callback.apply(object, arguments);
			dojo.disconnect(handle);
		});
		return handle;
	},
	soundEnded: function(value) {
		if (!this.mute) {
			if (this.audioQueue.length > 0) {
				this.playAudioQueue();
			}
		}
	},
	audioSoundEnded: function(value) {
		this.playAudioQueue();
	},
	playAudioQueue: function(value) {
		if (this.audioQueue.length > 0) {
			this.currentlyTalking = true;
			this.onceConnect(this.audioQueue[0], 'ended', this, 'audioSoundEnded');
			this.audioQueue[0].load();
			this.audioQueue[0].play();
			//remove the first element of audioQueue
			this.audioQueue.shift();
			if (this.audioQueue.length == 0) {
				this.currentlyTalking = false;
			}
		}
	},
	tutorial: function(page) {
		dojo.empty(this.generateDiv);
		var canvas = dojo.doc.createElement('canvas');
		canvas.setAttribute('width',800);
		canvas.setAttribute('height',800);
		dojo.place(canvas, this.generateDiv);
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "20pt Bookman Old Style";
		ctx.fillText("Tutorial - listen to the audio instructions.",10,30);
		//ctx.fillText("Press shift to skip to the end of an audio clip.",10,60);
		ctx.fillText("Press shift to skip the tutorial.",10,60);
		this.currentlyTalking = true;
		this.onceConnect(this.tutorialMessages[page], 'ended', this, 'tutorialPrompt');
		this.tutorialMessages[page].volume = 1;
		this.tutorialMessages[page].play();
	},
	tutorialPrompt: function(e) {
		/*if (this.skippedSound == 0 || this.pressedShift) {
			this.pressedShift = false;
			setTimeout(dojo.hitch(this,function() {
				if (this.tutorialPage == 0) {
					this.soundEffects[0].play();
					this.currentlyTalking = false;
					this.tutorialPage ++;
					//tutorialDelay.stop();
				} else if (this.tutorialPage == 1) {
					setTimeout(dojo.hitch(this,function(){this.soundEffects[1].play();}),200);
					this.currentlyTalking = false;
					this.tutorialPage ++;
					//tutorialDelay.stop();
				} else if (this.tutorialPage == 2) {
					this.currentlyTalking = false;
					this.tutorialPage ++;
					//tutorialDelay.stop();
				} else if (this.tutorialPage == 3) {
					this.combat('Tutorial');
				}
			}),500);
		} else {
			console.log(this.skippedSound);
			this.skippedSound--;
		}*/
		this.currentlyTalking = false;
	},
	combat: function(name,monAttack,monHealth,monExp,monGold) {
		this.currentlyTalking = true;
		this.inCombat = true;
		this.monsterName = name;
		this.monsterMaxHealth = monHealth;
		this.monsterAttack = monAttack;
		this.monsterHealth = this.monsterMaxHealth;
		this.monsterExperience = monExp;
		this.monsterGold = monGold;
		this.drawCombat();
		this.soundEffects[2].volume = 0.5;
		this.onceConnect(this.soundEffects[2], 'ended', this, 'readMonster');
		this.soundEffects[2].play();
		for (i = 0; i < this.monsters.length; i++) {
			if (this.monsters[i].name == this.monsterName) {
				this.currentWords = this.monsters[i].words;
				i = this.monsters.length;
			}
		}
		this.recordedWords = [];
		for (i = 0; i < this.currentWords.length; i++) {
			var wordi = dojo.doc.createElement('audio');
			wordi.setAttribute('src', 'sounds/monsterwords/' + this.currentWords[i] + this._ext);
			this.recordedWords.push(wordi);
		}
		
	},
	readMonster: function(e) {
		this.music[0].volume = 0.15;
		this.onceConnect(this.music[0], 'ended', this, 'musicLoop');
		this.music[0].play();
		this.onceConnect(this.monsterMessages[0], 'ended', this, 'combatLoop');
		setTimeout(dojo.hitch(this,function(){this.monsterMessages[0].play();}),500);
	},
	combatLoop: function(e) {
		//regenerate health and mana
		this.currentHealth += this.combatLevel/5;
		this.currentMana += this.magicLevel/5;
		if (this.currentHealth > this.maxHealth) {
			this.currentHealth = this.maxHealth;
		}
		if (this.currentMana > this.maxMana) {
			this.currentMana = this.maxMana;
		}
		this.drawCombat();
		this.combatMode = 'attack';
		this.currentlyTalking = false;
		delay = 1500;
		combatDelay = true;
		setTimeout(dojo.hitch(this,function(){
			if (combatDelay) {
				//remind the player what to do if idle
				this.recordedMessages[5].volume = 1;
				this.recordedMessages[5].play();
			}
		}),delay);
	},
	hitMonster: function(e) {
		this.currentlyTalking = true;
		this.monsterHealth -= Math.round(((6/(this.difficulty+4))*(this.combatLevel + 10)*(this.power/75 + 1)));
		if (this.monsterHealth < 0) {
			this.monsterHealth = 0;
		}
		this.onceConnect(this.soundEffects[3], 'ended', this, 'readDamage');
		this.soundEffects[3].play();
	},
	readDamage: function(e) {
		this.drawCombat();
		this.currentlyTalking = true;
		this.audioQueue = [];
		this.readNumber(Math.round(((6/(this.difficulty+4))*(this.combatLevel + 10))*(this.power/75 + 1)));
		this.audioQueue.push(this.recordedMessages[11]);
		if (this.monsterHealth > 0) {
			this.onceConnect(this.recordedMessages[11], 'ended', this, 'monsterTurn');
		} else {
			this.onceConnect(this.recordedMessages[11], 'ended', this, 'winBattle');
		}
		this.soundEnded();
	},
	monsterTurn: function(e) {
		this.currentlyTalking = true;
		this.onceConnect(this.recordedMessages[12], 'ended', this, 'defend');
		this.recordedMessages[12].play();
	},
	defend: function(e) {
		this.combatMode = 'defend';
		setTimeout(dojo.hitch(this,function(){
			this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
			this.recordedMessages[6].play();
		}),500);
	},
	takeDamage: function(e) {
		this.currentHealth -= Math.round(((this.difficulty+4)/6)*this.monsterAttack*((100-this.power/1.5)/100));
		if (this.currentHealth <= 0) {
			this.currentHealth = 0;
			this.loseBattle();
		} else {
			this.audioQueue = [];
			this.audioQueue.push(this.recordedMessages[13]);
			this.readNumber(Math.round(((this.difficulty+4)/6)*this.monsterAttack*((100-this.power/1.5)/100)));
			this.audioQueue.push(this.recordedMessages[14]);
			this.onceConnect(this.recordedMessages[14], 'ended', this, 'combatLoop');
			this.soundEnded();
			this.drawCombat();
		}
	},
	winBattle: function(e) {
		if (this.area == 'tutorial') {
			this.area = 'town';
		}
		this.inCombat = false;
		this.justWonBattle = true;
		this.experience += this.monsterExperience;
		this.gold += this.monsterGold;
		this.music[0].volume = 0;
		this.onceConnect(this.soundEffects[4],'ended',this,'readExpGold');
		this.soundEffects[4].play();
	},
	loseBattle:function(e) {
		this.inCombat = false;
		this.music[0].volume = 0;
		if (this.area == 'tutorial') {
			dojo.empty(this.generateDiv);
			canvas = dojo.doc.createElement('canvas');
			canvas.setAttribute('width',800);
			canvas.setAttribute('height',800);
			dojo.place(canvas, this.generateDiv);
			var ctx = canvas.getContext("2d");
			ctx.lineWidth = 1;
			ctx.fillStyle = "#fff";
			ctx.fillRect(0,0,canvas.width,canvas.height);
			ctx.fillStyle = "#000";
			ctx.font = "20pt Bookman Old Style";
			ctx.fillText("You were defeated by the Tutorial!",10,30);
			ctx.fillText("Press space to return to the main level.",10,60);
			if (this.difficulty > 1) {
				ctx.fillText("(Consider choosing a lower difficulty level)",10,90);
			}
			//say, the tutorial monster defeated you.  Perhaps you should try a lower difficulty level.
		} else {
			this.area = 'town';
			//say, the monster beats you up and leaves you for dead.  Eventually, you wake up and drag yourself back to town.  Press space to continue.
		}
	},
	readExpGold: function(e){
		dojo.empty(this.generateDiv);
		canvas = dojo.doc.createElement('canvas');
		canvas.setAttribute('width',800);
		canvas.setAttribute('height',800);
		dojo.place(canvas, this.generateDiv);
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "20pt Bookman Old Style";
		ctx.fillText("Victory!",10,30);
		ctx.fillText("You have gained " + this.monsterExperience + " experience.",10,60);
		ctx.fillText("You have gained " + this.monsterGold + " gold.",10,90);
		ctx.fillText("Press space to continue.",10,120);
		this.audioQueue = [];
		this.audioQueue.push(this.recordedMessages[17]);
		this.readNumber(this.monsterExperience);
		this.audioQueue.push(this.recordedMessages[18]);
		this.audioQueue.push(this.recordedMessages[19]);
		this.readNumber(this.monsterGold);
		this.audioQueue.push(this.recordedMessages[20]);
		this.audioQueue.push(this.recordedMessages[21]);
		this.soundEnded();
	},
	levelUp: function(e) {
		this.level++;
	},
	drawCombat: function(e) {
		dojo.empty(this.generateDiv);
		canvas = dojo.doc.createElement('canvas');
		canvas.setAttribute('width',800); 
		canvas.setAttribute('height',800); 
		dojo.place(canvas, this.generateDiv);
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "20pt Bookman Old Style";
		ctx.fillText("You are fighting a " + this.monsterName,10,30);
		MAX_WIDTH = canvas.width;
		MAX_HEIGHT = canvas.height;
		HEALTHBAR_HEIGHT = 20;
		HEALTHBAR_WIDTH = 0.3 * MAX_WIDTH;
		ctx.font = '20px Bookman Old Style';
		ctx.fillText("Monster Health: ",10,70);
		ctx.fillStyle = "rgb(255,0,0)";
		var proportion = this.monsterHealth/this.monsterMaxHealth;
		ctx.fillRect(185,52,proportion * HEALTHBAR_WIDTH,HEALTHBAR_HEIGHT);
		proportion = this.currentHealth/this.maxHealth;
		ctx.fillRect(100,240,proportion * HEALTHBAR_WIDTH,HEALTHBAR_HEIGHT);
		//add notification text
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.font = '20px Bookman Old Style';
		ctx.textBaseline = 'top';
		ctx.fillText("Health:",12,240);
		ctx.font = '18px Bookman Old Style';
		ctx.fillText(Math.ceil(this.currentHealth) +"/"+this.maxHealth,100+HEALTHBAR_WIDTH/2-40,240);
		//ctx.fillStyle = "rgb(0,0,0)";
		//ctx.fillRect(10,80,HEALTHBAR_WIDTH,HEALTHBAR_HEIGHT);
		ctx.fillStyle = "rgb(0,0,255)";
		proportion = this.currentMana/this.maxMana;
		ctx.fillRect(100,270,proportion * HEALTHBAR_WIDTH,HEALTHBAR_HEIGHT);
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.font = '20px Bookman Old Style';
		ctx.fillText("Mana:",12,270)
		ctx.fillText("Power:",12,300)
		ctx.font = '18px Bookman Old Style';
		ctx.fillText(Math.ceil(this.currentMana) +"/"+this.maxMana,100+HEALTHBAR_WIDTH/2-40,270);
		ctx.fillStyle = "rgb(0,255,0)";
		ctx.fillRect(100,300,this.power/100 * HEALTHBAR_WIDTH,HEALTHBAR_HEIGHT);
	},
	musicLoop: function(e) {
		if (this.inCombat) {
			this.onceConnect(this.music[0], 'ended', this, 'musicLoop');
			this.music[0].play();
		}
	},
	sayWord: function(e) {
		if (this.saidWords.length == this.currentWords.length) {
			this.saidWords = [];
			this.recordedWords = [];
			this.saidWords.push(rand);
			for (i = 0; i < this.currentWords.length; i++) {
				var wordi = dojo.doc.createElement('audio');
				wordi.setAttribute('src', 'sounds/monsterwords/' + this.currentWords[i] + this._ext);
				this.recordedWords.push(wordi);
			}
		}
		alreadySaid = true;
		while (alreadySaid) {
			rand = Math.floor(Math.random()*this.currentWords.length);
			alreadySaid = false;
			for (i = 0; i < this.saidWords.length; i++) {
				if (this.saidWords[i] == rand) {
					alreadySaid = true;
					i = this.saidWords.length;
				}
			}
		}
		this.saidWords.push(rand);
		this.onceConnect(this.recordedWords[rand],'ended',this, 'playDing');
		this.recordedWords[rand].play();
		this.currentWord = this.currentWords[rand];
		this.typeWord = true;
	},
	repeatWord: function(e) {
		this.recordedWords = [];
		for (i = 0; i < this.currentWords.length; i++) {
			var wordi = dojo.doc.createElement('audio');
			wordi.setAttribute('src', 'sounds/monsterwords/' + this.currentWords[i] + this._ext);
			this.recordedWords.push(wordi);
		}
		for (i = 0; i < this.currentWords.length; i++) {
			if (this.currentWord == this.currentWords[i]) {
				this.onceConnect(this.recordedWords[i],'ended',this, 'playDing');
				this.recordedWords[i].play();
				i = this.currentWords.length;
			}
		}
	},
	playDing: function(e) {
		this.startedTimer = false;
		this.stopTimer = false;
		this.readWord = true;
		this.currentlyTalking = false;
		this.timerCounter = 0;
		this.power = 100;
		delay = 50;
		setTimeout(dojo.hitch(this,function(){
			this.currentlyTalking = false;
			this.soundEffects[0].play();
			this.startedTimer = true;
			this.startPowerTimer();
		}),delay);
	},
	startPowerTimer: function(e) {
		var t = new dojox.timing.Timer();
		t.setInterval(7-this.difficulty);
		t.onTick = dojo.hitch(this,function() {
			if (this.stopTimer) {
				t.stop();
			} else {
				if (!this.currentlyTalking) {
					if (this.typedLetters.length == 0) {
						this.power -= 0.05;
						this.timerCounter += 50;
					} else {
						if (this.power > 90) {
							this.power -= (0.15+0.025*this.difficulty);
							this.timerCounter += 200;
						} else if (this.power > 75) {
							this.power -= (0.125+0.025*this.difficulty);
							this.timerCounter += 175;
						} else if (this.power > 50) {
							this.power -= (0.1+0.025*this.difficulty);
							this.timerCounter += 150;
						} else if (this.power > 25) {
							this.power -= (0.075+0.025*this.difficulty);
							this.timerCounter += 125;
						} else if (this.power > 10) {
							this.power -= (0.05+0.025*this.difficulty);
							this.timerCounter += 100;
						} else {
							this.power -= (0+0.025*this.difficulty);
							this.timerCounter += 50;
						}
					}
					if (this.timerCounter >= 250) {
						this.timerCounter = 0;
						var ctx = canvas.getContext("2d");
						ctx.fillStyle = "rgb(255,255,255)";
						ctx.fillRect(90,290,HEALTHBAR_WIDTH+20,HEALTHBAR_HEIGHT+20);
						ctx.fillStyle = "rgb(0,255,0)";
						ctx.fillRect(100,300,this.power/100 * HEALTHBAR_WIDTH,HEALTHBAR_HEIGHT);
					}
				}
				if (this.power <= 0) {
					this.power = 0;
					t.stop();
				}
			}
		});
		t.start();
	},
	enterTown: function(e) {
		dojo.empty(this.generateDiv);
		canvas = dojo.doc.createElement('canvas');
		canvas.setAttribute('width',800); 
		canvas.setAttribute('height',800); 
		dojo.place(canvas, this.generateDiv);
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "20pt Bookman Old Style";
		ctx.fillText("You are in town.",10,30);
	},
	readHealthAndMana: function() {
		this.audioQueue = [];
		this.audioQueue.push(this.recordedMessages[8]);
		this.readNumber(Math.ceil(this.currentHealth));
		this.audioQueue.push(this.recordedMessages[10]);
		this.readNumber(this.maxHealth);
		this.audioQueue.push(this.recordedMessages[9]);
		this.readNumber(Math.ceil(this.currentMana));
		this.audioQueue.push(this.recordedMessages[10]);
		this.readNumber(this.maxMana);
		this.soundEnded();
	},
	readNumber: function(numberToRead) {
		if (numberToRead <= 20) {
			this.audioQueue.push(this.recordedNumbers[numberToRead]);
		} else {
			var numDigits = numberToRead.toString().length;
			var readArray = []
			//first two digits
			var digitGroup = numberToRead % 100;
			var newEntry = 0;
			if (digitGroup <= 20) {
				if (digitGroup != 0) {
					readArray[0] = digitGroup;
				}
			} else {
				newEntry = numberToRead % 10;
				if (newEntry != 0) {
					readArray.push(newEntry);
				}
				readArray.push(Math.floor(digitGroup/10) + "ty");
			}
			//hundreds digit
			newEntry = Math.floor((numberToRead % 1000)/100);
			if (newEntry != 0) {
				readArray.push(newEntry + " hundred");
			}
			//first two thousands digits
			digitGroup = Math.floor((numberToRead % 100000)/1000);
			if (digitGroup <= 20) {
				if (digitGroup != 0) {
					readArray.push(digitGroup + " thousand");
				}
			} else {
				newEntry = digitGroup % 10;
				if (newEntry != 0) {
					readArray.push(newEntry + " thousand");
					readArray.push(Math.floor(digitGroup/10) + "ty");
				} else {
					readArray.push(Math.floor(digitGroup/10) + "ty" + " thousand");
				}
			}
			//hundred thousands digit
			newEntry = Math.floor((numberToRead % 1000000)/100000);
			if (newEntry != 0) {
				if (digitGroup != 0) {
					readArray.push(newEntry + " hundred");
				} else {
					readArray.push(newEntry + " hundred" + " thousand");
				}
			}
			//first two millions digits
			digitGroup = Math.floor((numberToRead % 100000000)/1000000);
			if (digitGroup <= 20) {
				if (digitGroup != 0) {
					readArray.push(digitGroup + " million");
				}
			} else {
				newEntry = digitGroup % 10;
				if (newEntry != 0) {
					readArray.push(newEntry + " million");
					readArray.push(Math.floor(digitGroup/10) + "ty");
				} else {
					readArray.push(Math.floor(digitGroup/10) + "ty" + " million");
				}
			}
			//hundred millions digit
			newEntry = Math.floor((numberToRead % 1000000000)/100000000)
			if (newEntry != 0) {
				if (digitGroup != 0) {
					readArray.push(newEntry + " hundred");
				} else {
					readArray.push(newEntry + " hundred" + " million");
				}
			}
			for (i = readArray.length-1; i >= 0; i--) {
				if (!isNaN(readArray[i])) {
					this.audioQueue.push(this.recordedNumbers[readArray[i]]);
				} else {
					var elements = readArray[i].split(" ");
					for (j = 0; j < elements.length; j++) {
						if (!isNaN(elements[j])) {
							this.audioQueue.push(this.recordedNumbers[elements[j]]);
						} else {
							if (elements[j].indexOf("ty") != -1) {
								tySplit = elements[j].split("ty")[0];
								this.audioQueue.push(this.recordedNumbers[dojo.number.parse(tySplit)+18]);
							} else if (elements[j].indexOf("hundred") != -1) {
								this.audioQueue.push(this.recordedNumbers[28]);
							} else if (elements[j].indexOf("thousand") != -1) {
								this.audioQueue.push(this.recordedNumbers[29]);
							} else if (elements[j].indexOf("million") != -1) {
								this.audioQueue.push(this.recordedNumbers[30]);
							} else if (elements[j].indexOf("billion") != -1) {
								this.audioQueue.push(this.recordedNumbers[31]);
							}
						}
					}
				}
			}
		}
	},
	//method that I didn't write that connects only once
	onceConnect: function(source, event, object, method){
		source = typeof(source)=="string" ? dojo.byId(source) : source;
		if(!source) throw new Error("Bad source passed to dojo.connect:", source);
		var callback = dojo.hitch(object, method);
		var handle = dojo.connect(source, event, function(){
			callback.apply(object, arguments);
			dojo.disconnect(handle);
		});
		return handle;
	},
	drawIntroPage: function(event) {
		dojo.empty(this.generateDiv);
		canvas = dojo.doc.createElement('canvas');
		canvas.setAttribute('width',800); 
		canvas.setAttribute('height',800); 
		dojo.place(canvas, this.generateDiv);
		this.area = "intro";
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "40pt Bookman Old Style";
		ctx.fillText("Monster Quest!",10,60);
		ctx.font = "20pt Bookman Old Style";
		ctx.fillText("New Easy Game",50,120);
		ctx.fillText("New Normal Game",50,150);
		ctx.fillText("New Difficult Game",50,180);
		ctx.fillText("New Insane Game",50,210);
		ctx.fillText("Load Game",50,240);
		ctx.font = "12pt Bookman Old Style";
		ctx.fillText("Scroll through the choices with up and down and press space bar to select",10,270);
		ctx.beginPath();
		ctx.arc(35,81+30*this.currentRow,5,0,2*Math.PI,true);
		ctx.fill();
	},
	initialize: function(event) {
		var node = dojo.create('audio');
        if (node.canPlayType('audio/ogg') && node.canPlayType('audio/ogg') != 'no') {
            this._ext = '.ogg';
        } else if (node.canPlayType('audio/mpeg') && node.canPlayType('audio/mpeg') != 'no') {
            this._ext = '.mp3';
        }
		this.recordedLetters = [];
		this.recordedNumbers = [];
		this.recordedMessages = [];
		this.tutorialMessages = [];
		this.soundEffects = [];
		this.music = [];
		this.monsterMessages = [];
		
		for (var i = 1; i <= 26; i++) {
			var letteri = dojo.doc.createElement('audio');
			letteri.setAttribute('src', 'sounds/letters/letter' + i + this._ext);
			this.recordedLetters.push(letteri);
		}
		for (var i = 0; i < 32; i++) {
			var numberi = dojo.doc.createElement('audio');
			numberi.setAttribute('src', 'sounds/numbers/number' + i + this._ext);
			numberi.volume = 0.5;
			this.recordedNumbers.push(numberi);
		}
		//(0) Say "Monster Quest!  Press space to play a normal game, or up and down to change the difficulty."
		var welcome = dojo.doc.createElement('audio');
		welcome.setAttribute('src', 'sounds/intro/Welcome' + this._ext);
		this.recordedMessages.push(welcome);
		//(1) Say "New Easy Game"
		var easy = dojo.doc.createElement('audio');
		easy.setAttribute('src', 'sounds/intro/NewEasyGame' + this._ext);
		this.recordedMessages.push(easy);
		//(2) Say "New Normal Game"
		var normal = dojo.doc.createElement('audio');
		normal.setAttribute('src', 'sounds/intro/NewNormalGame' + this._ext);
		this.recordedMessages.push(normal);
		//(3) Say "New Insane Game"
		var insane = dojo.doc.createElement('audio');
		insane.setAttribute('src', 'sounds/intro/NewInsaneGame' + this._ext);
		this.recordedMessages.push(insane);
		//(4) Say "Load Game"
		var load = dojo.doc.createElement('audio');
		load.setAttribute('src', 'sounds/intro/LoadGame' + this._ext);
		this.recordedMessages.push(load);
		// (5) Say "Press up to attack or down to cast a spell"
		var updown = dojo.doc.createElement('audio');
		updown.setAttribute('src', 'sounds/combat/PressUpToAttack' + this._ext);
		this.recordedMessages.push(updown);
		// (6) Say "Your Word Is"
		var yourword = dojo.doc.createElement('audio');
		yourword.setAttribute('src', 'sounds/combat/YourWordIs' + this._ext);
		this.recordedMessages.push(yourword);
		// (7) Say "Miss"
		var miss = dojo.doc.createElement('audio');
		miss.setAttribute('src', 'sounds/combat/Miss' + this._ext);
		this.recordedMessages.push(miss);
		// (8) Say "Your health is"
		var yourhealth = dojo.doc.createElement('audio');
		yourhealth.setAttribute('src', 'sounds/combat/YourHealthIs' + this._ext);
		this.recordedMessages.push(yourhealth);
		// (9) Say "Your mana is"
		var yourmana = dojo.doc.createElement('audio');
		yourmana.setAttribute('src', 'sounds/combat/YourManaIs' + this._ext);
		this.recordedMessages.push(yourmana);
		// (10) Say "Out of"
		var outof = dojo.doc.createElement('audio');
		outof.setAttribute('src', 'sounds/combat/OutOf' + this._ext);
		this.recordedMessages.push(outof);
		// (11) Say "Damage"
		var damage = dojo.doc.createElement('audio');
		damage.setAttribute('src', 'sounds/combat/Damage' + this._ext);
		this.recordedMessages.push(damage);
		// (12) Say "Monster's Turn"
		var mturn = dojo.doc.createElement('audio');
		mturn.setAttribute('src', 'sounds/combat/MonstersTurn' + this._ext);
		this.recordedMessages.push(mturn);
		// (13) Say "Lost"
		var lost = dojo.doc.createElement('audio');
		lost.setAttribute('src', 'sounds/combat/Lost' + this._ext);
		this.recordedMessages.push(lost);
		// (14) Say "Health"
		var health = dojo.doc.createElement('audio');
		health.setAttribute('src', 'sounds/combat/Health' + this._ext);
		this.recordedMessages.push(health);
		// (15) Say "The Monster Has"
		var monhas = dojo.doc.createElement('audio');
		monhas.setAttribute('src', 'sounds/combat/TheMonsterHas' + this._ext);
		this.recordedMessages.push(monhas);
		// (16) Say "Percent of its health left"
		var perhealth = dojo.doc.createElement('audio');
		perhealth.setAttribute('src', 'sounds/combat/PercentHealthLeft' + this._ext);
		this.recordedMessages.push(perhealth);
		// (17) Say "You have gained"
		var yougained = dojo.doc.createElement('audio');
		yougained.setAttribute('src', 'sounds/general/YouHaveGained' + this._ext);
		this.recordedMessages.push(yougained);
		// (18) Say "Experience"
		var exp = dojo.doc.createElement('audio');
		exp.setAttribute('src', 'sounds/general/Experience' + this._ext);
		this.recordedMessages.push(exp);
		// (19) Say "And"
		var and = dojo.doc.createElement('audio');
		and.setAttribute('src', 'sounds/general/And' + this._ext);
		this.recordedMessages.push(and);
		// (20) Say "Gold"
		var gold = dojo.doc.createElement('audio');
		gold.setAttribute('src', 'sounds/general/Gold' + this._ext);
		this.recordedMessages.push(gold);
		// (21) Say "Press space to continue"
		var gold = dojo.doc.createElement('audio');
		gold.setAttribute('src', 'sounds/general/PressSpaceToContinue' + this._ext);
		this.recordedMessages.push(gold);
		
		//Sound effects
		//(0) "Ding" sound for player attack
		//(1) "Ding" sound for monster attack
		//(2) Battle intro clip
		//(3) Hit sound
		//(4) Congratulatory sound
		for (var i = 0; i <= 4; i++) {
			var sfxi = dojo.doc.createElement('audio');
			sfxi.setAttribute('src', 'sounds/effects/effect' + i + this._ext);
			this.soundEffects.push(sfxi);
		}
		
		//Music
		//(0) Tutorial battle
		for (var i = 0; i <= 0; i++) {
			var musici = dojo.doc.createElement('audio');
			musici.setAttribute('src', 'sounds/music/music' + i + this._ext);
			//musici.setAttribute('loop', true);
			this.music.push(musici);
		}
		
		//Monster messages
		//(0) You are fighting a Tutorial
		for (var i = 0; i <= 0; i++) {
			var monsteri = dojo.doc.createElement('audio');
			monsteri.setAttribute('src', 'sounds/monsters/monster' + i + this._ext);
			this.monsterMessages.push(monsteri);
		}
		
		//Tutorial recordings
		//(0) Say "Monster quest is a game about slaying monsters.  You battle monsters with the space bar.  When you hear a 'ding', press
		//space as soon as possible to attack.  The sooner you press space, the more damage you will do.  Try it now."
		//(0) To fight a monster, press the up arrow to attack.  You will hear a word, followed by a ding.  Once that sound plays, type the word as quickly as possible.  The faster you type it, the more damage you will do.  If you type a wrong letter, you will miss the attack.  Press space to continue or down to repeat this.  Press shift to skip the tutorial.
		//(1) Say "Good.  When you hear a 'dong', press space as soon as possible to block the monster's attack.  If you press it quickly enough,
		//you might even avoid the attack completely."
		//(1) When it is the monster's turn, you will hear another word, followed by a ding.  If you type the word quickly enough, you will take less damage from the monster's attack.  Press space to continue or down to repeat this.
		//(2) Say "In addition to attacking or blocking, you can also cast magic spells.  The only spell you know right now is called magic dart.
		//To cast it, type D A R T.  If you type a wrong letter, you will fail the spell and have to start over.  Try typing DART now."
		//(2) You can also press the down arrow to cast a spell, which will use up mana points.  Right now you know the magic dart spell.  After pressing down, type D A R T to cast magic dart.  You will then type a word as quickly as possible just like in attacking.  Press space to continue or down to repeat this.
		//(3) Say "Good.  Now using what you have learned, try to defeat the tutorial monster.  Remember to attack and block with space and
		//type D A R T to cast magic dart."
		//(3) Now, using what you have learned, try to defeat the tutorial monster.  Remember to press up to attack or down to cast a spell on your turn.  You can also press left to show how much health and mana you have and right to show how much health the monster has.  Press space to begin the battle or down to repeat this.
		for (var i = 0; i <= 3; i++) {
			var tutoriali = dojo.doc.createElement('audio');
			tutoriali.setAttribute('src', 'sounds/intro/tutorial' + i + this._ext);
			this.tutorialMessages.push(tutoriali);
		}
		
		this.recordedMessages[0].play();
		this.drawIntroPage();
	},
});