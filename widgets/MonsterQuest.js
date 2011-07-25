/**
* Monster Quest - an RPG where you type words to slay monsters and level up.  Programmed by David Marron.
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
		this.questMessages = [];
		this.areaMessages = [];
		this.recordedSpells = [];
		this.recordedWords = [];
		this.duplicateWords = [];
		this.saidWords = [];
		this._ext = '.ogg';
		this.audioQueue = [];
		this.currentlyTalking = false;
		this.typeWord = false;
		this.spelling = false;
		this.readWord = false;
		this.startedTimer = false;
		this.stopTimer = true;
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
		this.justLostBattle = false;
		this.combatMode = 'attack';
		this.combatDelay = false;
		this.typingDelay = false;
		this.skippedSound = 0;
		this.pressedShift = false;
		this.level = 1;
		this.minCombatLevel = 10;
		this.combatLevel = 10;
		this.minMagicLevel = 10;
		this.magicLevel = 100;
		this.maxHealth = 80 + 2*this.combatLevel;
		this.currentHealth = 80 + 2*this.combatLevel;
		this.maxMana = 80 + 2*this.magicLevel;
		this.currentMana = 80 + 2*this.magicLevel;
		this.power = 0;
		this.monsterName = '';
		this.monsterIndex = 0;
		this.monsterMaxHealth = 0;
		this.monsterHealth = 0;
		this.monsterAttack = 0;
		this.monsterExperience = 0;
		this.monsterGold = 0;
		this.damage = 0;
		this.experience = 0;
		this.gold = 0;
		this.trainingGold = 100;
		this.questLevel = 0;
		this.numQuests = 1;
		this.acceptedQuest = false;
		this.itemsNeeded = 0;
		this.knownSpells = ['LIST','DART'];
		this.knownAreas = [];
		this.allAreas = [];
		this.totalSpells = 1;
		this.possibleSpells = [];
		this.currentWords = [];
		this.currentWord = 'undefined';
		this.currentArea = {
			name: 'The Unknown',
			monsters: []
		};
    },
	loadMonsterWords: function(data) {
		dataSplit = data.split('\n');
		for (i = 0; i < dataSplit.length; i++) {
			//if there is a { or }, that defines an area
			//otherwise, that defines a monster and its words
			if (dataSplit[i].indexOf("{") != -1) {
				dataSplit[i] = dataSplit[i].replace(" {","{");
				//this.allAreas.push(dataSplit[i].split("{")[0]);
				var area = {
					name: 'The Unknown',
					monsters: []
				}
				area.name = dataSplit[i].split("{")[0];
				if (area.name.length == 0 || area.name == ' ') {
					area.name = "The Unknown";
				}
				this.currentArea = area;
				this.allAreas.push(area);
			} else if (dataSplit[i].indexOf("}") != -1) {
				this.currentArea = {
					name: 'The Unknown',
					monsters: []
				};
			} else {
				var monster = {
					name: "Undefined",
					words: []
				}
				//if there is no name given, call the monster "Random Monster"
				if (dataSplit[i].indexOf(':') == -1) {
					monster.name = "Random Monster";
				} else {
					monster.name = dataSplit[i].split(':')[0];
					if (monster.name.length == 0 || monster.name == ' ') {
						monster.name = "Random Monster";
					}
				}
				//remove all whitespace
				dataSplit[i] = dataSplit[i].split(' ').join('');
				dataSplit[i] = dataSplit[i].replace(/[\r\n]+/g, "");
				if (dataSplit[i].indexOf(':') == -1) {
					monster.words = dataSplit[i].split(',');
				} else {
					monster.words = dataSplit[i].split(':')[1].split(',');
				}
				this.currentArea.monsters.push(monster);
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
				if (this.inCombat) {
					if (!this.currentlyTalking) {
						this.recordedMessages[22].volume = 0;
						combatDelay = false;
						this.currentlyTalking = true;
						this.recordedMessages[6].play();
						if (!this.typeWord) {
							this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
						} else {
							this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
							this.typedLetters = [];
							this.drawCombat();
						}
					}
				} else if (this.justWonBattle) {
					this.justWonBattle = false;
					this.audioQueue = [];
					this.recordedMessages[21].volume = 0;
					this.currentlyTalking = false;
					this.currentHealth = this.maxHealth;
					this.currentMana = this.maxMana;
					if (this.experience > this.level*this.level*100) {
						this.levelUp();
					} else if (this.area == 'town') {
						this.enterTown();
					} else if (this.area == 'training') {
						this.enterTraining();
						this.tutorialMessages[7].volume = 1;
						this.tutorialMessages[7].play();
					} else {
						//say "press space to adventure again"
						this.leaveTown();
					}
				} else if (this.area == 'town') {
					if (this.questLevel > 0) {
						this.currentlyTalking = false;
						this.recordedMessages[31].volume = 0;
						this.questMessages[this.questLevel-1].volume = 0;
						this.leaveTown();
					}
				} else if (this.area == 'intro') {
					this.recordedMessages[0].volume = 0;
					this.recordedMessages[1].volume = 0;
					this.recordedMessages[2].volume = 0;
					this.recordedMessages[3].volume = 0;
					this.recordedMessages[4].volume = 0;
					this.recordedMessages[5].volume = 0;
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
					if (this.justLostBattle) {
						this.area = 'intro';
						this.tutorialPage = 0;
						this.justLostBattle = false;
						this.recordedMessages[26].volume = 0;
						this.recordedMessages[0].volume = 1;
						this.recordedMessages[0].play();
						this.currentRow = 2;
						this.currentHealth = this.maxHealth;
						this.currentMana = this.maxMana;
						this.drawIntroPage();
					} else if (!this.inCombat) {
						this.tutorialMessages[0].volume = 0;
						this.tutorialMessages[1].volume = 0;
						this.tutorialMessages[2].volume = 0;
						this.tutorialMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.tutorialPage ++;
						if (this.tutorialPage == 1) {
							this.tutorialPage ++;
						}
						if (this.tutorialPage == 4) {
							this.combat('Tutorial',25,110,5,10);
						} else {
							this.tutorial(this.tutorialPage);
						}
					}
				} else if (this.area == 'training') {
					this.tutorialMessages[5].volume = 0;
					this.tutorialMessages[7].volume = 0;
					this.currentArea = this.allAreas[1];
					this.combat(this.currentArea.name,5,75,5,0);
				} else if (this.area == 'outside') {
					this.combat(this.currentArea.name,30,125,10,20);
				}
			} else if (e.keyCode == 37) {
				//left arrow pressed - player health & mana information
				if (this.inCombat && !this.currentlyTalking && !this.typeWord) {
					//say health and mana
					this.recordedMessages[22].volume = 0;
					combatDelay = false;
					this.readHealthAndMana();
				} else if (this.typeWord) {
					this.recordedMessages[6].play();
					this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
					this.typedLetters = [];
					this.drawCombat();
				}
			} else if (e.keyCode == 38) {
				//up arrow pressed - currently has no function in combat
				if (this.inCombat) {
					if (!this.currentlyTalking) {
						/*this.recordedMessages[22].volume = 0;
						combatDelay = false;
						this.currentlyTalking = true;
						this.recordedMessages[6].play();
						if (!this.typeWord) {
							this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
						} else {*/
						if (this.typeWord) {
							this.recordedMessages[6].play();
							this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
							this.typedLetters = [];
							this.drawCombat();
						} else {
							combatDelay = false;
							this.recordedMessages[22].volume = 1;
							this.recordedMessages[22].play();
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
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 1;
						this.recordedMessages[5].play();
					} else if (this.currentRow == 1) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[1].volume = 1;
						this.recordedMessages[1].play();
					} else if (this.currentRow == 2) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[2].volume = 1;
						this.recordedMessages[2].play();
					} else if (this.currentRow == 3) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[3].volume = 1;
						this.recordedMessages[3].play();
					} else if (this.currentRow == 4) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[4].volume = 1;
						this.recordedMessages[4].play();
					}
					this.drawIntroPage();
				} else if (this.area == 'tutorial' && !this.justLostBattle) {
					this.tutorialMessages[0].volume = 0;
					this.tutorialMessages[1].volume = 0;
					this.tutorialMessages[2].volume = 0;
					this.tutorialMessages[3].volume = 0;
					this.tutorial(this.tutorialPage);
				} else if (this.area == 'town') {
					this.enterTown();
				} else if (this.area == 'training') {
					this.tutorialMessages[5].volume = 1;
					this.tutorialMessages[5].play();
				}
				this.soundEnded();
			} else if (e.keyCode == 39) {
				//right arrow pressed - enemy health information
				if (this.inCombat && !this.currentlyTalking && !this.typeWord) {
					this.recordedMessages[22].volume = 0;
					combatDelay = false;
					//say: the monster has ... percent of its health left
					this.audioQueue = [];
					this.audioQueue.push(this.recordedMessages[15]);
					this.readNumber(Math.round(this.monsterHealth/this.monsterMaxHealth*100));
					this.audioQueue.push(this.recordedMessages[16]);
					this.soundEnded();
				} else if (this.typeWord) {
					this.recordedMessages[6].play();
					this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
					this.typedLetters = [];
					this.drawCombat();
				}
			} else if (e.keyCode == 40) {
				//down arrow pressed - currently has no function in combat
				if (this.inCombat) {
					if (!this.currentlyTalking) {
						if (this.typeWord) {
							this.recordedMessages[6].play();
							this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
							this.typedLetters = [];
							this.drawCombat();
						}
					}
				} else if (this.area == "intro") {
					this.currentRow ++;
					if (this.currentRow > 5) {
						this.currentRow = 1;
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
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
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[3].volume = 1;
						this.recordedMessages[3].play();
					} else if (this.currentRow == 4) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[4].volume = 1;
						this.recordedMessages[4].play();
					} else if (this.currentRow == 5) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 1;
						this.recordedMessages[5].play();
					}
					this.drawIntroPage();
				} else if (this.area == 'tutorial' && !this.justLostBattle) {
					this.tutorialMessages[0].volume = 0;
					this.tutorialMessages[1].volume = 0;
					this.tutorialMessages[2].volume = 0;
					this.tutorialMessages[3].volume = 0;
					this.tutorial(this.tutorialPage);
				}
			} else if (e.keyCode == 16) {
				//shift pressed - skip tutorial page
				/*if (this.area == 'intro') {
					this.tutorial(this.tutorialPage);
				}*/
				//shift pressed - spell out a word
				if (this.inCombat) {
					if (this.typeWord && !this.currentlyTalking) {
						this.audioQueue = [];
						this.stopTimer = true;
						this.recordedMessages[29].volume = 0;
						this.typingDelay = false;
						this.onceConnect(this.recordedMessages[28],'ended',this,'spellWord');
						this.recordedMessages[28].play();
					}
				} else if (this.area == 'tutorial' && !this.justLostBattle) {
					//skip tutorial
					this.tutorialMessages[0].volume = 0;
					this.tutorialMessages[1].volume = 0;
					this.tutorialMessages[2].volume = 0;
					this.tutorialMessages[3].volume = 0;
					this.combat('Tutorial',25,110,5,10);
				}
			} else if (this.letters.indexOf(String.fromCharCode(e.keyCode)) != -1) {
				//letter typed
				if (this.inCombat) {
					if (!this.currentlyTalking) {
						if (this.typeWord) {
							this.recordedMessages[29].volume = 0;
							this.typingDelay = false;
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
										if (this.combatMode == 'attack') {
											this.onceConnect(this.recordedMessages[7],'ended',this,'monsterTurn');
											this.recordedMessages[7].play();
										} else {
											this.onceConnect(this.recordedMessages[23],'ended',this,'monsterTurn');
											this.recordedMessages[23].play();
										}
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
									if (this.power > 100) {
										this.power = 100;
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
							//see if you can cast a spell
							this.recordedMessages[22].volume = 0;
							combatDelay = false;
							this.recordedLetters[e.keyCode - 65].volume = 0.5;
							this.recordedLetters[e.keyCode - 65].play();
							this.typedLetters.push(String.fromCharCode(e.keyCode));
							var match = false;
							if (this.possibleSpells.length == 0) {
								for (i = 0; i < this.knownSpells.length; i++) {
									if (this.typedLetters[this.typedLetters.length-1] != this.knownSpells[i].charAt(this.typedLetters.length-1)) {
										
									/*} else if (this.typedLetters.length == this.knownSpells[i].length) {
										//console.log(this.knownSpells[i]);
										//this.typedLetters = [];
										//i = this.knownSpells.length;
									*/
									} else {
										if (!match) {
											match = true;
											var ctx = canvas.getContext("2d");
											ctx.fillStyle = "#000";
											ctx.font = "25px Courier";
											ctx.fillText(this.typedLetters[this.typedLetters.length-1],10+20*(this.typedLetters.length-1),180);
										}
										this.possibleSpells.push(this.knownSpells[i]);
									}
								}
							} else {
								var match = false;
								for (i = 0; i < this.possibleSpells.length; i++) {
									if (this.typedLetters[this.typedLetters.length-1] != this.possibleSpells[i].charAt(this.typedLetters.length-1)) {
										this.possibleSpells.splice(i,1);
									} else if (this.typedLetters.length == this.possibleSpells[i].length) {
										if (!match) {
											var ctx = canvas.getContext("2d");
											ctx.fillStyle = "#000";
											ctx.font = "25px Courier";
											ctx.fillText(this.typedLetters[this.typedLetters.length-1],10+20*(this.typedLetters.length-1),180);
										}
										//Spell typing success
										this.typedLetters = [];
										if (this.possibleSpells[i] == 'LIST') {
											this.possibleSpells = [];
											this.audioQueue = [];
											this.audioQueue.push(this.recordedMessages[25]);
											for (var j = 1; j < this.knownSpells.length; j++) {
												this.audioQueue.push(this.recordedSpells[j-1]);
											}
											this.onceConnect(this.recordedMessages[25],'ended',this,'drawCombat');
											this.soundEnded();
										} else if (this.possibleSpells[i] == 'DART') {
											//say casting magic dart
											if (this.currentMana >= 20) {
												this.currentMana -= 20;
												this.combatMode = ('dart');
												this.currentlyTalking = true;
												this.possibleSpells = [];
												this.onceConnect(this.recordedSpells[this.totalSpells], 'ended', this, 'sayWord');
												this.recordedSpells[this.totalSpells].play();
											} else {
												//say not enough mana
												this.possibleSpells = [];
												this.onceConnect(this.recordedMessages[24], 'ended', this, 'drawCombat');
												this.recordedMessages[24].play();
											}
										}
									} else {
										if (!match) {
											match = true;
											var ctx = canvas.getContext("2d");
											ctx.fillStyle = "#000";
											ctx.font = "25px Courier";
											ctx.fillText(this.typedLetters[this.typedLetters.length-1],10+20*(this.typedLetters.length-1),180);
										}
									}
								}
							}
							if (this.possibleSpells.length == 0 && this.typedLetters.length > 0) {
								//Spell typing failure
								this.drawCombat();
								for (i = 0; i < this.knownSpells.length; i++) {
									if (this.typedLetters[this.typedLetters.length-1] == this.knownSpells[i].charAt(0)) {
										this.typedLetters = [];
										this.typedLetters.push(String.fromCharCode(e.keyCode));
										var ctx = canvas.getContext("2d");
										ctx.fillStyle = "#000";
										ctx.font = "25px Courier";
										ctx.fillText(this.typedLetters[this.typedLetters.length-1],10+20*(this.typedLetters.length-1),180);
										this.possibleSpells.push(this.knownSpells[i]);
									}
								}
								if (this.possibleSpells.length == 0) {
									this.typedLetters = [];
								}
							}
						}
					}
				} else if (this.area == 'town') {
					if (String.fromCharCode(e.keyCode) == 'Q') {
						this.tutorialMessages[4].volume = 0;
						this.tutorialMessages[5].volume = 0;
						this.audioQueue = [];
						this.playQuest();
					} else if (String.fromCharCode(e.keyCode) == 'T') {
						this.tutorialMessages[4].volume = 0;
						this.enterTraining();
						this.area = 'training';
						this.tutorialMessages[5].volume = 1;
						this.tutorialMessages[5].play();
					} else {
						this.recordedLetters[e.keyCode - 65].volume = 0.5;
						this.recordedLetters[e.keyCode - 65].play();
					}
				} else if (this.area == 'training') {
					if (String.fromCharCode(e.keyCode) == 'Q') {
						this.tutorialMessages[4].volume = 0;
						this.tutorialMessages[5].volume = 0;
						this.audioQueue = [];
						this.playQuest();
					} else if (String.fromCharCode(e.keyCode) == 'T') {
						this.tutorialMessages[5].volume = 0;
						this.tutorialMessages[7].volume = 0;
						this.audioQueue = [];
						this.audioQueue.push(this.tutorialMessages[6]);
						this.readNumber(this.trainingGold);
						this.audioQueue.push(this.recordedMessages[20]);
						if (this.gold < this.trainingGold) {
							this.audioQueue.push(this.recordedMessages[27]);
						}
						this.soundEnded();
					} else if (String.fromCharCode(e.keyCode) == 'B') {
						this.area = 'town';
						this.audioQueue = [];
						this.tutorialMessages[5].volume = 0;
						this.tutorialMessages[7].volume = 0;
						this.enterTown();
					} else {
						this.recordedLetters[e.keyCode - 65].volume = 0.5;
						this.recordedLetters[e.keyCode - 65].play();
					}
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
			this.audioQueue[0].volume = 1;
			this.audioQueue[0].play();
			//remove the first element of audioQueue
			this.audioQueue.shift();
			if (this.audioQueue.length == 0) {
				this.currentlyTalking = false;
				if (this.spelling) {
					setTimeout(dojo.hitch(this,function(){
						this.playDing();
					}),500);
					this.spelling = false;
				}
			}
		}
	},
	playQuest: function(e) {
		if (!this.acceptedQuest) {
			if (this.questLevel < this.numQuests) {
				this.currentlyTalking = true;
				this.onceConnect(this.questMessages[this.questLevel],'ended',this,'acceptQuest');
				this.questMessages[this.questLevel].play();
				if (this.questLevel == 0) {
					this.itemsNeeded = 3;
					this.knownAreas.push(this.allAreas[this.questLevel+2]);
				}
				this.questLevel++;
			} else {
				this.recordedMessages[30].volume = 1;
				this.recordedMessages[30].play();
			}
		} else {
			//say what your current quest is
		}
	},
	acceptQuest: function(page) {
		this.acceptedQuest = true;
		//say press the space bar to leave town and go fight monsters
		if (this.area == 'town') {
			this.recordedMessages[31].volume = 1;
			this.recordedMessages[31].play();
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
	combat: function(givenArea,monAttack,monHealth,monExp,monGold) {
		this.audioQueue = [];
		this.currentlyTalking = true;
		this.inCombat = true;
		this.monsterMaxHealth = monHealth;
		this.monsterAttack = monAttack;
		this.monsterHealth = this.monsterMaxHealth;
		this.monsterExperience = monExp;
		this.monsterGold = monGold;
		this.currentArea = {
			name: 'The Unknown',
			monsters: []
		};
		for (i = 0; i < this.allAreas.length; i++) {
			if (this.allAreas[i].name.split(' ').join('').toLowerCase() == givenArea.split(' ').join('').toLowerCase()) {
				this.currentArea = this.allAreas[i];
				i = this.allAreas.length;
			}
		}
		console.log("Area: " + this.currentArea.name);
		if (this.currentArea.monsters.length == 0) {
			this.monsterName = "Random Monster";
		} else if (this.currentArea.monsters.length == 1) {
			this.monsterName = this.currentArea.monsters[0].name;
			this.currentWords = this.currentArea.monsters[0].words;
		} else {
			//select which monster to fight
			i = Math.floor(Math.random()*this.currentArea.monsters.length);
			this.monsterName = this.currentArea.monsters[i].name;
			this.currentWords = this.currentArea.monsters[i].words;
		}
		this.drawCombat();
		/*for (i = 0; i < this.currentArea.monsters.length; i++) {
			if (this.currentArea.monsters[i].name.toLowerCase() == this.monsterName.split(' ').join('').toLowerCase()) {
				this.currentWords = this.currentArea.monsters[i].words;
				this.monsterIndex = i;
				i = this.currentArea.monsters.length;
			}
		}*/
		if (this.currentWords.length == 0) {
			this.currentWords.push('undefined');
		}
		if (this.currentWords.length == 1) {
			this.currentWords.push(this.currentWords[0]);
		}
		this.soundEffects[2].volume = 0.5;
		this.onceConnect(this.soundEffects[2], 'ended', this, 'readMonster');
		this.soundEffects[2].play();
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
		//this.onceConnect(this.monsterMessages[this.monsterIndex], 'ended', this, 'combatLoop');
		
		var tempMonster = dojo.doc.createElement('audio');
		tempMonster.setAttribute('src', 'sounds/monsters/' + this.monsterName.split(' ').join('').toLowerCase() + this._ext);
		console.log("Monster: " + this.monsterName);
		this.onceConnect(tempMonster,'ended',this, 'combatLoop');
		this.onceConnect(tempMonster,'error',this,'testFunc');
		
		//setTimeout(dojo.hitch(this,function(){this.monsterMessages[this.monsterIndex].play();}),500);
		setTimeout(dojo.hitch(this,function(){tempMonster.play();}),500);
	},
	testFunc: function(e) {
		console.log('test audio');
		this.combatLoop();
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
		this.typedLetters = [];
		this.drawCombat();
		this.combatMode = 'attack';
		this.currentlyTalking = false;
		this.stopTimer = true;
		delay = 1500;
		combatDelay = true;
		setTimeout(dojo.hitch(this,function(){
			if (combatDelay && !this.typeWord) {
				//remind the player what to do if idle
				this.recordedMessages[22].volume = 1;
				this.recordedMessages[22].play();
			}
		}),delay);
	},
	hitMonster: function(e) {
		this.currentlyTalking = true;
		this.possibleSpells = [];
		this.damage = 0;
		if (this.combatMode == 'attack') {
			this.damage = Math.round(((6/(this.difficulty+4))*(this.combatLevel + 10)*(this.power/75 + 1)));
			this.onceConnect(this.soundEffects[3], 'ended', this, 'readDamage');
			this.soundEffects[3].play();
		} else if (this.combatMode == 'dart') {
			this.damage = Math.round(((6/(this.difficulty+4))*(this.magicLevel + 5)*(this.power/40 + 1)));
			this.onceConnect(this.recordedSpells[this.totalSpells+1], 'ended', this, 'readDamage');
			this.recordedSpells[this.totalSpells+1].play();
		} else {
			console.log('error in hitMonster.  No attack or spell selected');
			this.currentlyTalking = false;
		}
		this.monsterHealth -= this.damage;
		if (this.monsterHealth < 0) {
			this.monsterHealth = 0;
		}
	},
	readDamage: function(e) {
		this.drawCombat();
		this.currentlyTalking = true;
		this.audioQueue = [];
		this.readNumber(this.damage);
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
		this.damage = Math.round(((this.difficulty+4)/6)*this.monsterAttack*((100-this.power/1.5)/100));
		this.currentHealth -= this.damage;
		if (this.currentHealth <= 0) {
			this.currentHealth = 0;
			this.drawCombat();
			this.onceConnect(this.soundEffects[5], 'ended', this, 'loseBattle');
			this.soundEffects[5].play();
		} else {
			this.audioQueue = [];
			this.audioQueue.push(this.recordedMessages[13]);
			this.readNumber(this.damage);
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
			ctx.fillText("Press space to return to the main menu.",10,60);
			if (this.difficulty > 1) {
				ctx.fillText("(Consider choosing a lower difficulty level)",10,90);
			}
			this.justLostBattle = true;
			this.recordedMessages[26].volume = 1;
			this.recordedMessages[26].play();
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
		this.enterTown();
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
		this.typedLetters = [];
		this.drawCombat();
		if (this.saidWords.length == this.currentWords.length) {
			//assert: currentWords.length > 1
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
		this.onceConnect(this.recordedWords[rand],'error',this,'spellWord');
		this.recordedWords[rand].load();
		this.recordedWords[rand].play();
		this.currentWord = this.currentWords[rand];
		this.typeWord = true;
	},
	repeatWord: function(e) {
		this.recordedWords = [];
		this.stopTimer = true;
		this.recordedMessages[29].volume = 0;
		this.typingDelay = false;
		for (i = 0; i < this.currentWords.length; i++) {
			var wordi = dojo.doc.createElement('audio');
			wordi.setAttribute('src', 'sounds/monsterwords/' + this.currentWords[i] + this._ext);
			this.recordedWords.push(wordi);
		}
		for (i = 0; i < this.currentWords.length; i++) {
			if (this.currentWord == this.currentWords[i]) {
				this.onceConnect(this.recordedWords[i],'ended',this, 'playDing');
				this.onceConnect(this.recordedWords[i],'error',this,'spellWord');
				this.recordedWords[i].load();
				this.recordedWords[i].play();
				i = this.currentWords.length;
			}
		}
	},
	spellWord: function(e) {
		this.stopTimer = true;
		this.recordedMessages[29].volume = 0;
		this.typingDelay = false;
		this.typedLetters = [];
		this.drawCombat();
		for (i = 0; i < this.currentWord.length; i++) {
			this.audioQueue.push(this.recordedLetters[this.currentWord.toUpperCase().charCodeAt(i) - 65]);
		}
		this.spelling = true;
		//this.onceConnect(this.recordedLetters[this.currentWord.toUpperCase().charCodeAt(this.currentWord.length - 1) - 65],'ended',this,'playDing');
		this.soundEnded();
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
			this.typingDelay = true;
			setTimeout(dojo.hitch(this,function(){
				if (this.typingDelay && !this.currentlyTalking) {
					this.recordedMessages[29].volume = 1;
					this.recordedMessages[29].play();
				}
			}),2000);
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
						if (this.power > 0) {
							ctx.fillRect(100,300,this.power/100 * HEALTHBAR_WIDTH,HEALTHBAR_HEIGHT);
						}
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
		if (this.questLevel == 0) {
			this.tutorialMessages[4].volume = 1;
			this.tutorialMessages[4].play();
		}
	},
	enterTraining: function(e) {
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
		ctx.fillText("Training Ground.",10,30);
	},
	leaveTown: function(e) {
		this.area = 'outside';
		this.currentArea = this.knownAreas[this.knownAreas.length-1];
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
		ctx.fillText("Outside of Town",10,30);
		this.onceConnect(this.recordedMessages[32],'ended',this,'chooseArea');
		this.recordedMessages[31].volume = 0;
		this.recordedMessages[32].volume = 1;
		this.recordedMessages[32].play();
	},
	chooseArea: function(e) {
		if (!this.inCombat) {
			this.areaMessages[0].volume = 1;
			this.areaMessages[0].play();
		}
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
		this.questMessages = [];
		this.areaMessages = [];
		this.recordedSpells = [];
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
		//(3) Say "New Difficult Game"
		var difficult = dojo.doc.createElement('audio');
		difficult.setAttribute('src', 'sounds/intro/NewDifficultGame' + this._ext);
		this.recordedMessages.push(difficult);
		//(4) Say "New Insane Game"
		var insane = dojo.doc.createElement('audio');
		insane.setAttribute('src', 'sounds/intro/NewInsaneGame' + this._ext);
		this.recordedMessages.push(insane);
		// (5) Say "Load Game"
		var load = dojo.doc.createElement('audio');
		load.setAttribute('src', 'sounds/intro/LoadGame' + this._ext);
		this.recordedMessages.push(load);
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
		// (22) Say "Press up to attack or down to cast a spell"
		var updown = dojo.doc.createElement('audio');
		updown.setAttribute('src', 'sounds/combat/PressUpToAttack' + this._ext);
		this.recordedMessages.push(updown);
		// (23) Say "Spell Failed"
		var spellfail = dojo.doc.createElement('audio');
		spellfail.setAttribute('src', 'sounds/combat/SpellFailed' + this._ext);
		this.recordedMessages.push(spellfail);
		// (24) Say "Not enough mana"
		var nomana = dojo.doc.createElement('audio');
		nomana.setAttribute('src', 'sounds/combat/NotEnoughMana' + this._ext);
		this.recordedMessages.push(nomana);
		// (25) Say "You know the spells..."
		var youknow = dojo.doc.createElement('audio');
		youknow.setAttribute('src', 'sounds/combat/YouKnow' + this._ext);
		this.recordedMessages.push(youknow);
		// (26) Say "You were defeated by the tutorial monster.  Press space to go back to the main menu."
		var pwned = dojo.doc.createElement('audio');
		pwned.setAttribute('src', 'sounds/intro/TutorialDefeat' + this._ext);
		this.recordedMessages.push(pwned);
		// (27) Say "You can't afford that"
		var cantafford = dojo.doc.createElement('audio');
		cantafford.setAttribute('src', 'sounds/general/NotEnoughGold' + this._ext);
		this.recordedMessages.push(cantafford);
		// (28) Say "That is spelled"
		var spelled = dojo.doc.createElement('audio');
		spelled.setAttribute('src', 'sounds/combat/ThatIsSpelled' + this._ext);
		this.recordedMessages.push(spelled);
		// (29) Say "Press space to repeat the word or press shift to spell the word
		var press = dojo.doc.createElement('audio');
		press.setAttribute('src', 'sounds/combat/PressSpaceToRepeat' + this._ext);
		this.recordedMessages.push(press);
		// (30) Say "Press space to repeat the word or press shift to spell the word
		var noquests = dojo.doc.createElement('audio');
		noquests.setAttribute('src', 'sounds/quests/NoAvailableQuests' + this._ext);
		this.recordedMessages.push(noquests);
		// (31) Say "Press space to leave town and go fight monsters
		var leavetown = dojo.doc.createElement('audio');
		leavetown.setAttribute('src', 'sounds/general/PressSpaceToLeaveTown' + this._ext);
		this.recordedMessages.push(leavetown);
		// (32) Say "You are outside of town
		var outside = dojo.doc.createElement('audio');
		outside.setAttribute('src', 'sounds/areas/OutsideOfTown' + this._ext);
		this.recordedMessages.push(outside);
		
		//Sound effects
		//(0) "Ding" sound for player attack
		//(1) "Ding" sound for monster attack
		//(2) Battle intro clip
		//(3) Hit sound
		//(4) Congratulatory sound
		//(5) Defeat sound
		for (var i = 0; i <= 5; i++) {
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
		for (var i = 0; i <= 1; i++) {
			var monsteri = dojo.doc.createElement('audio');
			monsteri.setAttribute('src', 'sounds/monsters/monster' + i + this._ext);
			this.monsterMessages.push(monsteri);
		}
		
		//Quest messages
		//(0) You walk around town, asking the townspeople if they have any quests available.  Eventually, you find one.
		// I know that rabbit feet make me lucky, but I want to be super lucky!  Three times as lucky as normal, in fact.
		// Bring me three rabbit feet, and I will reward you.  Rabbits like to hang out in the wheat field just outside of town.
		for (var i = 0; i <= this.numQuests-1; i++) {
			var questi = dojo.doc.createElement('audio');
			questi.setAttribute('src', 'sounds/quests/quest' + i + this._ext);
			this.questMessages.push(questi);
		}
		
		//Area messages
		//(0) Wheat Fields
		for (var i = 0; i <= 0; i++) {
			var areai = dojo.doc.createElement('audio');
			areai.setAttribute('src', 'sounds/areas/area' + i + this._ext);
			this.areaMessages.push(areai);
		}
		
		//Spells
		//(0) Casting magic dart
		//(1) Magic dart sound effect
		for (var i = 0; i <= this.totalSpells-1; i++) {
			var spelli = dojo.doc.createElement('audio');
			spelli.setAttribute('src', 'sounds/spells/spell' + i + this._ext);
			this.recordedSpells.push(spelli);
		}
		var spells = dojo.doc.createElement('audio');
		spells.setAttribute('src','sounds/spells/dart' + this._ext);
		this.recordedSpells.push(spells);
		var test = dojo.doc.createElement('audio');
		test.setAttribute('src','sounds/spells/darteffect' + this._ext);
		this.recordedSpells.push(test);
		
		//Tutorial recordings
		/*(0) Say "Monster quest is a game about slaying monsters.  You battle monsters with the space bar.  When you hear a 'ding', press
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
		*/
		//(0) Say "To attack a monster, press the space bar.  You will then hear a word, followed by a ding.  Once that sound plays, type the word as quickly as possible.  The faster you type it, the more damage you will do.  If you type a wrong letter, you will miss the attack.  Press space to continue or up to repeat this.  Press shift to skip the tutorial."
		//(1) Say "When it is the monster's turn to fight back, you will hear another word followed by a ding.  The more quickly you type the word, the less damage you will take.  If you type a wrong letter, you will take full damage from the attack.  Press space to continue or up to repeat this."
		//(2) Say "Each turn, you can cast a spell instead of pressing the space bar.  Spells are more powerful than attacks but will use up mana points.  Right now, you know the magic dart spell that you can cast by typing D A R T.  You will then be given a word to type as quickly as possible just like in attacking.  Press space to continue or up to repeat this."
		//(3) Say "Now, using what you have learned, try to defeat the tutorial monster.  Remember that on your turn you can either attack with the space bar or cast magic dart by typing D A R T.  You can also press shift to spell out the word.  Press space to begin the battle or up to repeat this."
		//(4) Say "You enter the town of quest-ion in search of fame and fortune.  Press Q to look around town for available quests.  You can also press T to visit the training grounds.  Press up to repeat this."
		//(5) Say "The training grounds has an assortment of practice dummies, as well as a personal trainer.  Press T to talk to the trainer or press space to beat up one of the dummies.  Press shift to go back to town."
		//(6) Say "The personal trainer says that he will make you stronger for the cost of"
		//(7) Say "Press space to beat the stuffing out of another practice dummy, or press B to go back to town"
		for (var i = 0; i <= 7; i++) {
			var tutoriali = dojo.doc.createElement('audio');
			tutoriali.setAttribute('src', 'sounds/intro/tutorial' + i + this._ext);
			this.tutorialMessages.push(tutoriali);
		}
		
		this.recordedMessages[0].play();
		this.drawIntroPage();
	},
});