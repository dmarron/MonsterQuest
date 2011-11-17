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
		this.townMessages = [];
		this.soundEffects = [];
		this.music = [];
		//this.monsterMessages = [];
		this.questMessages = [];
		this.areaMessages = [];
		this.levelUpMessages = [];
		this.recordedSpells = [];
		this.spellNameSounds = [];
		this.spellList = [];
		this.spellSelected = 0;
		this.monsterSelected = 0;
		this.areaSelected = 0;
		this.hintSelected = 0;
		this.hintMessages = [];
		this.recordedWords = [];
		this.duplicateWords = [];
		this.saidWords = [];
		this._ext = '.ogg';
		this.audioQueue = [];
		this.audioQueueTwo = [];
		this.audioQueueThree = [];
		this.audioQueueFour = [];
		this.audioQueueCount = 0;
		this.disconnectQueue = [];
		this.currentAudio = null;
		this.currentlyTalking = false;
		this.repeating = false;
		this.defRepeat = false;
		this.currentMessage = '';
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
		this.resetIdleTimer = false;
		this.noDisable = false;
		this.tutorialPage = 0;
		this.currentRow = 2;
		this.area = 'loading';
		this.difficulty = 2;
		this.visitedAreas = [];
		this.typedLetters = [];
		this.inCombat = false;
		this.justWonBattle = false;
		this.justLostBattle = false;
		this.combatMode = 'attack';
		this.combatDelay = false;
		this.typingDelay = false;
		this.falseStart = false;
		this.skippedSound = 0;
		this.pressedShift = false;
		this.level = 0;
		this.minCombatLevel = 10;
		this.combatLevel = 10;
		this.minMagicLevel = 10;
		this.magicLevel = 10;
		this.freePoints = 0;
		this.maxHealth = 80 + 2*this.combatLevel;
		this.currentHealth = 80 + 2*this.combatLevel;
		this.maxMana = 80 + 2*this.magicLevel;
		this.currentMana = 80 + 2*this.magicLevel;
		this.power = 100;
		this.missed = 0;
		this.monsterName = '';
		this.previousMonsterName = '';
		this.monsterIndex = 0;
		this.monsterMaxHealth = 0;
		this.monsterHealth = 0;
		this.monsterAttack = 0;
		this.monsterExperience = 0;
		this.monsterGold = 0;
		this.onFire = 0;
		this.frozen = 0;
		this.foughtMonsters = [];
		this.bestiary = [];
		this.damage = 0;
		this.experience = 0;
		this.gold = 0;
		this.trainingGold = 100;
		this.levelUpInTown = false;
		this.questLevel = 0;
		this.questNeeded = 0;
		this.questCount = 0;
		this.questMonster = '';
		this.bossComplete = false;
		this.numQuests = 8;
		this.acceptedQuest = false;
		this.knownSpells = ['LIST','DART'];
		this.knownAreas = [];
		this.allAreas = [];
		this.totalSpells = 4;
		this.possibleSpells = [];
		this.currentWords = [];
		this.currentWord = 'undefined';
		this.currentArea = {
			name: 'The Unknown',
			monsters: [],
			boss: []
		};
		//currentMonster is used only for loading monster words
		this.currentMonster = {
			name: "Undefined",
			words: new Array()
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
					monsters: [],
					boss: []
				}
				area.name = dataSplit[i].split("{")[0];
				if (area.name.length == 0 || area.name == ' ') {
					area.name = "The Unknown";
				}
				this.currentArea = area;
				this.allAreas.push(area);
				this.currentMonster = {
					name: "Undefined",
					words: new Array()
				};
			} else if (dataSplit[i].indexOf("}") != -1) {
				this.currentArea = {
					name: 'The Unknown',
					monsters: [],
					boss: []
				};
				this.currentMonster = {
					name: "Undefined",
					words: new Array()
				};
			} else {
				//make a new monster because the area was just created
				if (this.currentMonster.name == "Undefined") {
					var monster = {
						name: "Undefined",
						words: new Array()
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
					this.currentMonster = monster;
					this.currentMonster.words[0] = new Array();
					this.currentMonster.words[1] = new Array();
					this.currentMonster.words[2] = new Array();
					this.currentMonster.words[3] = new Array();
				} else {
					//if there is a ':', make a new monster
					if (dataSplit[i].indexOf(':') != -1) {
						var monster = {
							name: "Undefined",
							words: new Array()
						}
						monster.name = dataSplit[i].split(':')[0];
						if (monster.name.length == 0 || monster.name == ' ') {
							monster.name = "Random Monster";
						}
						this.currentMonster = monster;
						this.currentMonster.words[0] = new Array();
						this.currentMonster.words[1] = new Array();
						this.currentMonster.words[2] = new Array();
						this.currentMonster.words[3] = new Array();
					}
				}
				//there is now an existing monster, so remove all whitespace
				dataSplit[i] = dataSplit[i].split(' ').join('');
				dataSplit[i] = dataSplit[i].replace(/[\r\n]+/g, "");
				if (dataSplit[i].indexOf(':') != -1) {
					dataSplit[i] = dataSplit[i].split(':')[1];
				}
				var foundDiff = false;
				if (dataSplit[i].toLowerCase().indexOf('easy(') != -1) {
					foundDiff = true;
					dataSplit[i] = dataSplit[i].split('easy(')[1];
					if (dataSplit[i].toLowerCase().indexOf(')') != -1) {
						dataSplit[i] = dataSplit[i].split(')')[0];
					}
					if (this.currentMonster.words[0].length == 0) {
						this.currentMonster.words[0] = dataSplit[i].split(',');
					} else {
						var tempWords = dataSplit[i].split(',');
						for (var t = 0; t < tempWords.length; t++) {
							this.currentMonster.words[0].push(tempWords[t]);
						}
					}
				}
				if (dataSplit[i].toLowerCase().indexOf('normal(') != -1) {
					foundDiff = true;
					dataSplit[i] = dataSplit[i].split('normal(')[1];
					if (dataSplit[i].toLowerCase().indexOf(')') != -1) {
						dataSplit[i] = dataSplit[i].split(')')[0];
					}
					if (this.currentMonster.words[1].length == 0) {
						this.currentMonster.words[1] = dataSplit[i].split(',');
					} else {
						var tempWords = dataSplit[i].split(',');
						for (var t = 0; t < tempWords.length; t++) {
							this.currentMonster.words[1].push(tempWords[t]);
						}
					}
				}
				if (dataSplit[i].toLowerCase().indexOf('difficult(') != -1) {
					foundDiff = true;
					dataSplit[i] = dataSplit[i].split('difficult(')[1];
					if (dataSplit[i].toLowerCase().indexOf(')') != -1) {
						dataSplit[i] = dataSplit[i].split(')')[0];
					}
					if (this.currentMonster.words[2].length == 0) {
						this.currentMonster.words[2] = dataSplit[i].split(',');
					} else {
						var tempWords = dataSplit[i].split(',');
						for (var t = 0; t < tempWords.length; t++) {
							this.currentMonster.words[2].push(tempWords[t]);
						}
					}
				}
				if (dataSplit[i].toLowerCase().indexOf('insane(') != -1) {
					foundDiff = true;
					dataSplit[i] = dataSplit[i].split('insane(')[1];
					if (dataSplit[i].toLowerCase().indexOf(')') != -1) {
						dataSplit[i] = dataSplit[i].split(')')[0];
					}
					if (this.currentMonster.words[3].length == 0) {
						this.currentMonster.words[3] = dataSplit[i].split(',');
					} else {
						var tempWords = dataSplit[i].split(',');
						for (var t = 0; t < tempWords.length; t++) {
							this.currentMonster.words[3].push(tempWords[t]);
						}
					}
				}
				if (foundDiff == false) {
					//add words to all difficulty levels
					var tempWords = dataSplit[i].split(',');
					for (var t = 0; t < tempWords.length; t++) {
						//tempWords[t] = tempWords[t].replaceAll("[^A-Za-z]", "");
						if (tempWords[t] != "") {
							this.currentMonster.words[0].push(tempWords[t]);
							this.currentMonster.words[1].push(tempWords[t]);
							this.currentMonster.words[2].push(tempWords[t]);
							this.currentMonster.words[3].push(tempWords[t]);
						}
					}
				}
				/*for (var v = 0; v < this.currentMonster.words[0].length; v++) {
					console.log(i + " " + this.currentMonster.name + " " + this.currentMonster.words[0][v]);
				}*/
				if (this.currentMonster.name.indexOf("Boss(") == -1) {
					this.currentArea.monsters.push(this.currentMonster);
				} else {
					/*this.currentMonster.name = this.currentMonster.name.split("Boss(")[1];
					if (this.currentMonster.name.indexOf(")") != -1) {
						this.currentMonster.name = this.currentMonster.name.split(")")[0];
					}*/
					this.currentArea.boss.push(this.currentMonster);
				}
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
						if (this.area == 'tutorial') {
							combatDelay = false;
							this.currentlyTalking = true;
							if (!this.typeWord) {
								//only play tutorial messages if not repeating a word
								if (this.tutorialPage == 0) {
									this.tutorialMessages[0].volume = 0;
									this.recordedMessages[34].volume = 0;
									this.currentAudio = this.tutorialMessages[1];
									if (this.mute) {
										this.tutorialMessages[1].volume = 0;
									}
									this.tutorialMessages[1].play();
									if (!this.mute) {
										this.currentMessage = "To attack, type the word you are given as quickly as possible.<br>The faster you type, the more damage you will do.  Do not<br>start typing before you hear a *ding* at the end of the word.<br>(Press shift at any time to skip talking and continue)";
									} else {
										this.currentMessage = "To attack, type the word you are given as quickly as possible.<br>The faster you type, the more damage you will do.<br>(Press shift to continue)";
									}
									this.drawCombat();
									this.onceConnect(this.tutorialMessages[1], 'ended', this, 'tutorialAttackPrompt');
								} else if (this.tutorialPage == 1) {
									this.tutorialPage++;
									this.tutorialMessages[5].volume = 0;
									this.recordedMessages[34].volume = 0;
									this.currentAudio = this.tutorialMessages[6];
									if (this.mute) {
										this.tutorialMessages[6].volume = 0;
									}
									this.tutorialMessages[6].play();
									this.currentMessage = "If you type a wrong letter during an attack, you will be given<br>one more chance to try again.  This extra chance will not do<br>any bonus damage if you type it fast, so take your time.<br>If you type wrongly again, the attack will do no damage.";
									if (this.mute) {
										this.currentMessage += "<br>(Press shift to continue)";
									}
									this.drawCombat();
									this.onceConnect(this.tutorialMessages[6], 'ended', this, 'tutorialAttackPrompt');
								} else if (this.tutorialPage == 4) {									
									this.drawCombat();
									this.recordedMessages[22].volume = 0;
									this.recordedMessages[34].volume = 0;
									if (!this.mute) {
										this.recordedMessages[6].play();
									} else {
										this.sayWord();
									}
									this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
								} else {
									this.recordedMessages[22].volume = 0;
									this.recordedMessages[34].volume = 0;
									if (!this.mute) {
										this.recordedMessages[6].play();
									} else {
										this.sayWord();
									}
									this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
								}
							} else {
								if (!this.mute) {
									this.recordedMessages[6].play();
									this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
									this.typedLetters = [];
								}
								this.drawCombat();
							}
						} else {
							this.recordedMessages[34].volume = 0;
							this.recordedMessages[22].volume = 0;
							combatDelay = false;
							this.currentlyTalking = true;
							if (!this.mute) {
								this.recordedMessages[6].play();
								if (!this.typeWord) {
									this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
								} else {
									this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
									this.typedLetters = [];
									this.drawCombat();
								}
							} else {
								if (!this.typeWord) {
									this.sayWord();
								} else {
									this.typedLetters = [];
									this.repeatWord();
								}
							}
						}
					}
				} else if (this.justWonBattle) {
					this.justWonBattle = false;
					this.disconnectAudio();
					this.recordedMessages[21].volume = 0;
					this.currentlyTalking = false;
					this.currentHealth = this.maxHealth;
					this.currentMana = this.maxMana;
					if (this.experience >= this.level*25) {
						this.experience -= this.level*25;
						if (this.area == 'town' || this.area == 'training') {
							this.levelUp(true);
						} else {
							this.levelUp(false);
						}
					} else if (this.area == 'town') {
						this.enterTown();
					} else if (this.area == 'training') {
						this.enterTraining();
						if (!this.mute) {
							this.townMessages[3].volume = 1;
							this.townMessages[3].play();
						}
					} else {
						//say "press space to adventure again"
						this.leaveTown();
					}
				} else if (this.area == 'town' || this.area == 'quest' || this.area == 'options') {
					//leave town and go fight monsters
					console.log(this.questLevel);
					if (this.questLevel > 0) {
						this.disconnectAudio();
						this.currentlyTalking = false;
						this.recordedMessages[31].volume = 0;
						this.questMessages[this.questLevel-1].volume = 0;
						this.leaveTown();
					} else {
						this.disconnectAudio();
						this.enterTown();
					}
				} else if (this.area == 'difficulty' || this.area == 'attributes' || this.area == 'defeat') {
					this.disconnectAudio();
					this.recordedMessages[42].volume = 0;
					this.area = 'town';
					this.enterTown();
				} else if (this.area == 'reset') {
					this.disconnectAudio();
					this.townMessages[17].volume = 0;
					if (this.freePoints == 0) {
						this.area = 'town';
						this.enterTown();
					} else {
						//randomly spend free points
						while(this.freePoints > 0) {
							if (Math.random() <= 0.5) {
								this.combatLevel++;
							} else {
								this.magicLevel++;
							}
							this.freePoints--;
						}
						this.area = 'town';
						this.enterTown();
					}
				} else if (this.area == 'completedquest') {
					this.disconnectAudio();
					if (this.experience >= this.level*25) {
						this.experience -= this.level*25;
						this.levelUp(true);
					} else {
						this.area = 'town';
						this.enterTown();
					}
				} else if (this.area == 'levelup') {
					if (Math.random() <= 0.5) {
						this.combatLevel++;
					} else {
						this.magicLevel++;
					}
					this.updateStats();
					this.levelUpMessages[0].volume = 0;
					this.levelUpMessages[1].volume = 0;
					this.levelUpMessages[2].volume = 0;
					this.levelUpMessages[3].volume = 0;
					this.disconnectAudio();
					if (this.levelUpInTown) {
						this.area = 'town';
						this.enterTown();
					} else {
						this.leaveTown();
					}
				} else if (this.area == 'trainer') {
					if (this.gold < this.trainingGold) {
						this.disconnectAudio();
						this.enterTown();
					} else {
						this.trainCombat();
					}
				} else if (this.area == 'difficulty') {
					this.area = 'town';
					this.enterTown();
				} else if (this.area == 'bestiary') {
					this.disconnectAudio();
					var monNameDesc = dojo.doc.createElement('audio');
					monNameDesc.setAttribute('src', 'sounds/monsters/' + this.bestiary[this.monsterSelected].split(' ').join('').toLowerCase() + 'desc' + this._ext);
					this.audioQueue.push(monNameDesc);
					this.soundEnded();
				} else if (this.area == 'intro') {
					this.recordedMessages[0].volume = 0;
					this.recordedMessages[1].volume = 0;
					this.recordedMessages[2].volume = 0;
					this.recordedMessages[3].volume = 0;
					this.recordedMessages[4].volume = 0;
					this.recordedMessages[5].volume = 0;
					if (this.currentRow == 1) {
						//easy difficulty
						this.difficulty = this.currentRow;
						this.area = 'tutorial';
						this.tutorial(0);
					} else if (this.currentRow == 2) {	
						//normal difficulty
						this.difficulty = this.currentRow;
						this.area = 'tutorial';
						this.tutorial(0);
					} else if (this.currentRow == 3) {
						//"difficult" difficulty is like normal but with harder words
						this.difficulty = 2.5;
						this.area = 'tutorial';
						this.tutorial(0);
					} else if (this.currentRow == 4) {
						//harder words and faster timer
						this.difficulty = this.currentRow-1;
						this.area = 'tutorial';
						this.tutorial(0);
					} else if (this.currentRow == 5) {
						//hardest words, fastest timer
						this.difficulty = this.currentRow-1;
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
						if (!this.mute) {
							this.recordedMessages[0].volume = 1;
							this.recordedMessages[0].play();
						}
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
						this.recordedMessages[5].volume = 0;
						this.tutorialPage ++;
						if (this.tutorialPage == 1) {
							this.tutorialPage ++;
						}
						if (this.tutorialPage == 4) {
							//this.combat('Tutorial',33,110,5,10);
							this.tutorial(this.tutorialPage);
						} else {
							this.tutorial(this.tutorialPage);
						}
					}
				} else if (this.area == 'training') {
					this.townMessages[1].volume = 0;
					this.townMessages[3].volume = 0;
					this.currentArea = this.allAreas[1];
					this.combat(this.currentArea.name,5,75,5,0);
				} else if (this.area == 'outside') {
					console.log("selected: " + this.areaSelected);
					if (this.areaSelected == 0) {
						this.combat(this.currentArea.name,45,125,10,20);
					} else if (this.areaSelected == 1) {
						this.combat(this.currentArea.name,50,300,30,50);
					} else if (this.areaSelected == 2) {
						this.combat(this.currentArea.name,75,350,50,80);
					} else if (this.areaSelected == 3) {
						this.combat(this.currentArea.name,100,500,100,100);
					} else {
						this.combat(this.currentArea.name,45+this.level*5,100+this.level*40,100,100);
					}
				}
			} else if (e.keyCode == 37) {
				//left arrow pressed - player health & mana information
				if (this.inCombat && !this.currentlyTalking && !this.typeWord) {
					//say health and mana
					if (this.area == 'tutorial') {
						this.tutorialMessages[0].volume = 0;
						this.tutorialMessages[5].volume = 0;
					}
					this.recordedMessages[22].volume = 0;
					combatDelay = false;
					this.resetIdleTimer = true;
					this.readHealthAndMana();
				} else if (this.typeWord) {
					if (!this.mute) {
						this.recordedMessages[6].play();
						this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
						this.typedLetters = [];
					}
					this.drawCombat();
				} else if (this.area == 'outside') {
					//change current area
					if (this.knownAreas.length > 1) {
						this.foughtMonsters = [];
						if (this.areaSelected > 0) {
							this.areaSelected --;
						} else {
							this.areaSelected = this.knownAreas.length-1;
						}
						this.disconnectAudio();
						this.chooseArea();
					}
				} else if (this.area == 'spells') {
					if (this.spellSelected > 0) {
						this.spellSelected --;
					} else {
						this.spellSelected = this.knownSpells.length-2;
					}
					this.disconnectAudio();
					this.townMessages[5].volume = 0;
					if (!this.mute) {
						this.saySpell();
					}
				} else if (this.area == 'bestiary') {
					if (this.monsterSelected > 0) {
						this.monsterSelected --;
					} else {
						this.monsterSelected = this.bestiary.length-1;
					}
					this.disconnectAudio();
					this.townMessages[7].volume = 0;
					if (!this.mute) {
						this.sayMonster();
					}
				}
			} else if (e.keyCode == 38) {
				//up arrow pressed - repeat message
				if (this.inCombat) {
					if (this.area == 'tutorial') {
						if (this.currentAudio != null) {
							if (this.currentAudio.currentTime < this.currentAudio.duration) {
								//repeat currently playing message
								this.currentAudio.currentTime = 0;
							} else {
								//repeat a previously played message
								this.currentlyTalking = true;
								this.repeating = true;
								this.recordedMessages[6].volume = 0;
								this.recordedMessages[12].volume = 0;
								if (this.spelling) {
									this.disconnectAudio();
									this.spelling = false;
								}
								this.onceConnect(this.currentAudio, 'ended', this, 'endTutorialRepeat');
								if (!this.mute) {
									this.currentAudio.play();
								}
							}
						}
					} else if (!this.currentlyTalking) {
						/*this.recordedMessages[22].volume = 0;
						combatDelay = false;
						this.currentlyTalking = true;
						this.recordedMessages[6].play();
						if (!this.typeWord) {
							this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
						} else {*/
						if (this.typeWord) {
							if (!this.mute) {
								this.recordedMessages[6].play();
								this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
								this.typedLetters = [];
							}
							this.drawCombat();
						} else {
							combatDelay = false;
							this.recordedMessages[22].volume = 1;
							if (!this.mute) {
								this.recordedMessages[22].play();
							}
						}
					}
				} else if (this.area == 'levelup') {
					this.combatLevel++;
					this.updateStats();
					this.levelUpMessages[0].volume = 0;
					this.levelUpMessages[1].volume = 0;
					this.levelUpMessages[2].volume = 0;
					this.levelUpMessages[3].volume = 0;
					this.disconnectAudio();
					if (this.levelUpInTown) {
						this.area = 'town';
						this.enterTown();
					} else {
						this.leaveTown();
					}
				} else if (this.area == 'reset') {
					if (this.freePoints > 0) {
						this.freePoints --;
						this.combatLevel++;
						this.updateStats();
						this.disconnectAudio();
						this.readNumber(this.combatLevel);
						if (this.freePoints == 0) {
							this.audioQueue.push(this.townMessages[16]);
						}
						this.soundEnded();
						this.resetAttributes(false);
					} else {
						this.townMessages[16].volume = 1;
						if (!this.mute) {
							this.townMessages[16].play();
						}
					}
				} else if (this.area == 'difficulty') {
					//increase difficulty
					if (this.difficulty == 2.5) {
						this.difficulty = 3;
					} else if (this.difficulty == 2) {
						this.difficulty = 2.5;
					} else if (this.difficulty < 4) {
						this.difficulty++;
					} else {
						this.difficulty = 1;
					}
					this.townMessages[8].volume = 0;
					this.disconnectAudio();
					this.changeDifficulty(false);
				} else if (this.area == 'quest') {
					this.questLevel--;
					this.acceptedQuest = false;
					this.playQuest();
				} else if (this.area == "intro") {
					this.currentRow --;
					if (this.currentRow < 1) {
						this.currentRow = 6;
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[37].volume = 1;
						if (!this.mute) {
							this.recordedMessages[37].play();
						}
					} else if (this.currentRow == 1) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[37].volume = 0;
						this.recordedMessages[1].volume = 1;
						if (!this.mute) {
							this.recordedMessages[1].play();
						}
					} else if (this.currentRow == 2) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[37].volume = 0;
						this.recordedMessages[2].volume = 1;
						if (!this.mute) {
							this.recordedMessages[2].play();
						}
					} else if (this.currentRow == 3) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[37].volume = 0;
						this.recordedMessages[3].volume = 1;
						if (!this.mute) {
							this.recordedMessages[3].play();
						}
					} else if (this.currentRow == 4) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[37].volume = 0;
						this.recordedMessages[4].volume = 1;
						if (!this.mute) {
							this.recordedMessages[4].play();
						}
					} else if (this.currentRow == 5) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[37].volume = 0;
						this.recordedMessages[5].volume = 1;
						if (!this.mute) {
							this.recordedMessages[5].play();
						}
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
					this.townMessages[1].volume = 1;
					if (!this.mute) {
						this.townMessages[1].play();
					}
				}
				this.soundEnded();
			} else if (e.keyCode == 39) {
				//right arrow pressed - enemy health information
				if (this.inCombat && !this.currentlyTalking && !this.typeWord) {
					this.recordedMessages[22].volume = 0;
					combatDelay = false;
					//say: the monster has ... percent of its health left
					this.disconnectAudio();
					this.audioQueue.push(this.recordedMessages[15]);
					this.readNumber(Math.round(this.monsterHealth/this.monsterMaxHealth*100));
					this.audioQueue.push(this.recordedMessages[16]);
					this.resetIdleTimer = true;
					this.soundEnded();
					this.currentMessage = "The monster has " + Math.round(this.monsterHealth/this.monsterMaxHealth*100) + " percent of its health left";
					this.drawCombat();
				} else if (this.typeWord) {
					if (!this.mute) {
						this.recordedMessages[6].play();
						this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
						this.typedLetters = [];
					}
					this.drawCombat();
				} else if (this.area == 'outside') {
					//change current area
					if (this.knownAreas.length > 1) {
						this.foughtMonsters = [];
						if (this.areaSelected < this.knownAreas.length-1) {
							this.areaSelected ++;
						} else {
							this.areaSelected = 0;
						}
						this.disconnectAudio();
						this.chooseArea();
					}
				} else if (this.area == 'spells') {
					if (this.spellSelected < this.knownSpells.length-2) {
						this.spellSelected ++;
					} else {
						this.spellSelected = 0;
					}
					this.disconnectAudio();
					this.townMessages[5].volume = 0;
					if (!this.mute) {
						this.saySpell();
					}
				} else if (this.area == 'bestiary') {
					if (this.monsterSelected < this.bestiary.length-1) {
						this.monsterSelected ++;
					} else {
						this.monsterSelected = 0;
					}
					this.disconnectAudio();
					this.townMessages[7].volume = 0;
					if (!this.mute) {
						this.sayMonster();
					}
				}
			} else if (e.keyCode == 40) {
				//down arrow pressed - currently has no function in combat
				if (this.inCombat) {
					if (!this.currentlyTalking) {
						if (this.typeWord) {
							if (!this.mute) {
								this.recordedMessages[6].play();
								this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
								this.typedLetters = [];
							}
							this.drawCombat();
						}
					}
				} else if (this.area == 'levelup') {
					this.magicLevel++;
					this.updateStats();
					this.levelUpMessages[0].volume = 0;
					this.levelUpMessages[1].volume = 0;
					this.levelUpMessages[2].volume = 0;
					this.levelUpMessages[3].volume = 0;
					this.disconnectAudio();
					if (this.levelUpInTown) {
						this.area = 'town';
						this.enterTown();
					} else {
						this.leaveTown();
					}
				} else if (this.area == 'reset') {
					if (this.freePoints > 0) {
						this.freePoints --;
						this.magicLevel++;
						this.updateStats();
						this.disconnectAudio();
						this.readNumber(this.magicLevel);
						if (this.freePoints == 0) {
							this.audioQueue.push(this.townMessages[16]);
						}
						this.soundEnded();
						this.resetAttributes(false);
					} else {
						this.townMessages[16].volume = 1;
						if (!this.mute) {
							this.townMessages[16].play();
						}
					}
				} else if (this.area == 'difficulty') {
					//decrease difficulty
					if (this.difficulty == 2.5) {
						this.difficulty = 2;
					} else if (this.difficulty == 3) {
						this.difficulty = 2.5
					} else if (this.difficulty > 1) {
						this.difficulty--;
					} else {
						this.difficulty = 4;
					}
					this.townMessages[8].volume = 0;
					this.disconnectAudio();
					this.changeDifficulty(false);
				} else if (this.area == "intro") {
					this.currentRow ++;
					if (this.currentRow > 6) {
						this.currentRow = 1;
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[37].volume = 0;
						this.recordedMessages[1].volume = 1;
						if (!this.mute) {
							this.recordedMessages[1].play();
						}
					} else if (this.currentRow == 2) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[37].volume = 0;
						this.recordedMessages[2].volume = 1;
						if (!this.mute) {
							this.recordedMessages[2].play();
						}
					} else if (this.currentRow == 3) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[37].volume = 0;
						this.recordedMessages[3].volume = 1;
						if (!this.mute) {
							this.recordedMessages[3].play();
						}
					} else if (this.currentRow == 4) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[37].volume = 0;
						this.recordedMessages[4].volume = 1;
						if (!this.mute) {
							this.recordedMessages[4].play();
						}
					} else if (this.currentRow == 5) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[37].volume = 0;
						this.recordedMessages[5].volume = 1;
						if (!this.mute) {
							this.recordedMessages[5].play();
						}
					}
					 else if (this.currentRow == 6) {
						this.recordedMessages[0].volume = 0;
						this.recordedMessages[1].volume = 0;
						this.recordedMessages[2].volume = 0;
						this.recordedMessages[3].volume = 0;
						this.recordedMessages[4].volume = 0;
						this.recordedMessages[5].volume = 0;
						this.recordedMessages[37].volume = 1;
						if (!this.mute) {
							this.recordedMessages[37].play();
						}
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
				//shift pressed - skip current dialogue
				if (this.currentAudio != null) {
					if (this.currentAudio.currentTime < this.currentAudio.duration) {
						this.currentAudio.currentTime = this.currentAudio.duration;
					}
				}
				//shift pressed - spell out a word
				if (this.inCombat) {
					if (this.typeWord && !this.currentlyTalking && !this.mute) {
						this.currentlyTalking = true;
						this.disconnectAudio();
						this.stopTimer = true;
						this.recordedMessages[29].volume = 0;
						if (this.recordedMessages[29].currentTime < this.recordedMessages[29].duration) {
							this.recordedMessages[29].currentTime = this.recordedMessages[29].duration;
						}
						this.typingDelay = false;
						this.onceConnect(this.recordedMessages[28],'ended',this,'spellWord');
						this.currentMessage = "That is spelled: " + this.currentWord.toUpperCase();
						this.recordedMessages[28].play();
					} else {
						if (this.area == 'tutorial' && !this.currentlyTalking) {
							if (this.tutorialPage == 0) {
								this.tutorialMessages[0].volume = 0;
								this.winBattle();
							}
						}
					}
				} else if (this.area == 'tutorial' && !this.justLostBattle && this.tutorialPage == 0) {
					//skip tutorial
					/*this.tutorialMessages[0].volume = 0;
					this.tutorialMessages[1].volume = 0;
					this.tutorialMessages[2].volume = 0;
					this.tutorialMessages[3].volume = 0;
					this.combat('Tutorial',33,110,5,10);*/
				}
			} else if (this.letters.indexOf(String.fromCharCode(e.keyCode)) != -1) {
				//letter typed
				if (this.inCombat) {
					if (!this.currentlyTalking && (this.recordedMessages[38].currentTime <= 0 || this.recordedMessages[38].currentTime >= this.recordedMessages[38].duration)) {
						if (this.typeWord) {
							this.recordedMessages[29].volume = 0;
							this.typingDelay = false;
							if (this.readWord && !this.startedTimer) {
								this.stopTimer = false;
								this.startPowerTimer();
							}
							this.recordedLetters[e.keyCode - 65].volume = 0.3;
							if (!this.mute) {
								this.recordedLetters[e.keyCode - 65].play();
							}
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
								if (this.typedLetters.length <= 1) {
									//don't "miss" if it was the first letter of the word that was wrong
									//say "try again"
									this.typeWord = false;
									this.currentlyTalking = true;
									this.onceConnect(this.recordedMessages[33],'ended',this,'tryAgain');
									if (!this.mute) {
										this.recordedMessages[33].play();
									} else {
										this.tryAgain();
									}
								} else if (this.missed == 1 || this.combatMode == 'defend') {
									setTimeout(dojo.hitch(this,function(){
										//miss
										this.stopTimer = true;
										if (this.combatMode == 'defend') {
											this.power = 0;
											this.takeDamage();
										} else {
											if (this.combatMode == 'attack') {
												this.onceConnect(this.recordedMessages[7],'ended',this,'monsterTurn');
												if (!this.mute) {
													this.recordedMessages[7].play();
												} else {
													this.monsterTurn();
												}
											} else {
												this.onceConnect(this.recordedMessages[23],'ended',this,'monsterTurn');
												if (!this.mute) {
													this.recordedMessages[23].play();
												} else {
													this.monsterTurn();
												}
											}
										}
									}),50);
									this.typeWord = false;
									this.typedLetters = [];
								} else {
									if (this.typedLetters.length > 1) {
										this.missed = 1;
									}
									//say "try again"
									this.typeWord = false;
									this.currentlyTalking = true;
									this.onceConnect(this.recordedMessages[33],'ended',this,'tryAgain');
									if (!this.mute) {
										this.recordedMessages[33].play();
									} else {
										this.tryAgain();
									}
								}
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
							this.recordedLetters[e.keyCode - 65].volume = 0.3;
							if (!this.mute) {
								this.recordedLetters[e.keyCode - 65].play();
							}
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
											this.disconnectAudio();
											this.audioQueue.push(this.recordedMessages[25]);
											var spellStringCount = 0;
											this.currentMessage = "You know the spells: ";
											for (var j = 1; j < this.knownSpells.length; j++) {
												this.audioQueue.push(this.spellNameSounds[j-1]);
												if (j <= this.spellList.length) {
													if (spellStringCount % 3 == 0 && spellStringCount != 0) {
														this.currentMessage += "<br>"
													}
													this.currentMessage += this.spellList[j-1];
													if (j < this.knownSpells.length - 1) {
														this.currentMessage += ", "
													}
													spellStringCount++;
												}
											}
											this.drawCombat();
											this.onceConnect(this.recordedMessages[25],'ended',this,'drawCombat');
											this.soundEnded();
										} else if (this.possibleSpells[i] == 'DART') {
											//say casting magic dart
											if (this.currentMana >= 15) {
												this.currentMana -= 15;
												this.combatMode = ('dart');
												this.currentlyTalking = true;
												this.possibleSpells = [];
												this.onceConnect(this.recordedSpells[0], 'ended', this, 'sayWord');
												this.currentMessage = "Casting Magic Dart";
												this.drawCombat();
												if (!this.mute) {
													this.recordedSpells[0].play();
												} else {
													this.sayWord();
												}
											} else {
												//say not enough mana
												this.possibleSpells = [];
												this.onceConnect(this.recordedMessages[24], 'ended', this, 'drawCombat');
												this.currentMessage = "Not enough mana";
												this.drawCombat();
												if (!this.mute) {
													this.recordedMessages[24].play();
												}
											}
										} else if (this.possibleSpells[i] == 'HEAL') {
											//say casting heal
											if (this.currentMana >= 40) {
												this.currentMana -= 40;
												this.combatMode = ('heal');
												this.currentlyTalking = true;
												this.possibleSpells = [];
												this.onceConnect(this.recordedSpells[2], 'ended', this, 'sayWord');
												this.currentMessage = "Casting Heal";
												this.drawCombat();
												if (!this.mute) {
													this.recordedSpells[2].play();
												} else {
													this.sayWord();
												}
											} else {
												//say not enough mana
												this.possibleSpells = [];
												this.onceConnect(this.recordedMessages[24], 'ended', this, 'drawCombat');
												this.currentMessage = "Not enough mana";
												this.drawCombat();
												if (!this.mute) {
													this.recordedMessages[24].play();
												}
											}
										} else if (this.possibleSpells[i] == 'FIRE') {
											//say casting fireball
											if (this.currentMana >= 30) {
												this.currentMana -= 30;
												this.combatMode = ('fire');
												this.currentlyTalking = true;
												this.possibleSpells = [];
												this.onceConnect(this.recordedSpells[4], 'ended', this, 'sayWord');
												this.currentMessage = "Casting Fireball";
												this.drawCombat();
												if (!this.mute) {
													this.recordedSpells[4].play();
												} else {
													this.sayWord();
												}
											} else {
												//say not enough mana
												this.possibleSpells = [];
												this.onceConnect(this.recordedMessages[24], 'ended', this, 'drawCombat');
												this.currentMessage = "Not enough mana";
												this.drawCombat();
												if (!this.mute) {
													this.recordedMessages[24].play();
												}
											}
										} else if (this.possibleSpells[i] == 'COLD') {
											//say casting cold blast
											if (this.currentMana >= 30) {
												this.currentMana -= 30;
												this.combatMode = ('cold');
												this.currentlyTalking = true;
												this.possibleSpells = [];
												this.onceConnect(this.recordedSpells[6], 'ended', this, 'sayWord');
												this.currentMessage = "Casting Cold Blast";
												this.drawCombat();
												if (!this.mute) {
													this.recordedSpells[6].play();
												} else {
													this.sayWord();
												}
											} else {
												//say not enough mana
												this.possibleSpells = [];
												this.onceConnect(this.recordedMessages[24], 'ended', this, 'drawCombat');
												this.currentMessage = "Not enough mana";
												this.drawCombat();
												if (!this.mute) {
													this.recordedMessages[24].play();
												}
											}
										} else if (this.possibleSpells[i] == 'BEAM') {
											//say casting magic beam
											if (this.currentMana >= 75) {
												this.currentMana -= 75;
												this.combatMode = ('beam');
												this.currentlyTalking = true;
												this.possibleSpells = [];
												this.onceConnect(this.recordedSpells[0], 'ended', this, 'sayWord');
												this.currentMessage = "Casting Magic Beam";
												this.drawCombat();
												if (!this.mute) {
													this.recordedSpells[0].play();
												} else {
													this.sayWord();
												}
											} else {
												//say not enough mana
												this.possibleSpells = [];
												this.onceConnect(this.recordedMessages[24], 'ended', this, 'drawCombat');
												this.currentMessage = "Not enough mana";
												this.drawCombat();
												if (!this.mute) {
													this.recordedMessages[24].play();
												}
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
					} else {
						if (this.typeWord || this.spelling) {
							if (!this.falseStart && !this.mute) {
								console.log("typed while talking");
								this.currentlyTalking = true;
								this.falseStart = true;
								this.disconnectAudio();
								this.currentAudio = this.recordedMessages[38];
								this.recordedMessages[38].volume = 1;
								this.onceConnect(this.recordedMessages[38], 'ended', this, 'repeatWord');
								this.recordedMessages[38].play();
								this.typedLetters = [];
								this.currentMessage = "Don't start typing until you hear the *ding*"
								this.drawCombat();
							}
						}
					}
				} else if (this.area == 'town' || this.area == 'training' || this.area == 'options' || this.area == 'difficulty' || this.area == 'quest' || this.area == 'trainer' || this.area == 'bestiary' || this.area == 'attributes' || this.area == 'spells') {
					if (String.fromCharCode(e.keyCode) == 'Q') {
						if (this.area != 'quest') {
							//search for quest
							this.townMessages[0].volume = 0;
							this.townMessages[1].volume = 0;
							this.townMessages[3].volume = 0;
							this.townMessages[4].volume = 0;
							this.townMessages[5].volume = 0;
							this.townMessages[6].volume = 0;
							this.townMessages[7].volume = 0;
							this.townMessages[13].volume = 0;
							this.townMessages[14].volume = 0;
							this.townMessages[15].volume = 0;
							this.disconnectAudio();
							this.playQuest();
						} else {
							this.recordedLetters[e.keyCode - 65].volume = 0.3;
							if (!this.mute) {
								this.recordedLetters[e.keyCode - 65].play();
							}
						}
					} else if (String.fromCharCode(e.keyCode) == 'T') {
						if (this.area != 'training' && this.area != 'trainer') {
							//go to training grounds
							this.townMessages[0].volume = 0;
							this.townMessages[4].volume = 0;
							this.townMessages[5].volume = 0;
							this.townMessages[6].volume = 0;
							this.townMessages[7].volume = 0;
							this.townMessages[13].volume = 0;
							this.townMessages[14].volume = 0;
							this.townMessages[15].volume = 0;
							this.disconnectAudio();
							this.enterTraining();
							this.area = 'training';
							if (!this.mute) {
								this.townMessages[1].volume = 1;
								this.townMessages[1].play();
							}
						} else {
							if (this.area != 'trainer') {
								this.area = 'trainer';
								//talk to trainer
								this.showTrainer();
							} else {
								this.recordedLetters[e.keyCode - 65].volume = 0.3;
								if (!this.mute) {
									this.recordedLetters[e.keyCode - 65].play();
								}
							}
						}
					} else if (String.fromCharCode(e.keyCode) == 'O') {
						//more options
						this.disconnectAudio();
						this.townMessages[0].volume = 0;
						this.townMessages[1].volume = 0;
						this.townMessages[3].volume = 0;
						this.townMessages[5].volume = 0;
						this.townMessages[6].volume = 0;
						this.townMessages[7].volume = 0;
						this.townMessages[13].volume = 0;
						this.townMessages[14].volume = 0;
						this.townMessages[15].volume = 0;
						this.area = 'options';
						if (!this.mute) {
							this.townMessages[4].volume = 1;
							this.townMessages[4].play();
						}
						this.showOptions();
					} else if (String.fromCharCode(e.keyCode) == 'D') {
						//change difficulty
						this.area = 'difficulty';
						this.disconnectAudio();
						this.townMessages[0].volume = 0;
						this.townMessages[1].volume = 0;
						this.townMessages[3].volume = 0;
						this.townMessages[4].volume = 0;
						this.townMessages[5].volume = 0;
						this.townMessages[6].volume = 0;
						this.townMessages[7].volume = 0;
						this.townMessages[13].volume = 0;
						this.townMessages[14].volume = 0;
						this.townMessages[15].volume = 0;
						this.changeDifficulty(true);
					} else if (String.fromCharCode(e.keyCode) == 'B') {
						if (this.area != 'town') {
							//go back to the main town screen
							this.area = 'town';
							this.disconnectAudio();
							this.townMessages[1].volume = 0;
							this.townMessages[3].volume = 0;
							this.townMessages[4].volume = 0;
							this.townMessages[5].volume = 0;
							this.townMessages[6].volume = 0;
							this.townMessages[7].volume = 0;
							this.townMessages[13].volume = 0;
							this.townMessages[14].volume = 0;
							this.townMessages[15].volume = 0;
							this.enterTown();
						} else {
							this.recordedLetters[e.keyCode - 65].volume = 0.3;
							if (!this.mute) {
								this.recordedLetters[e.keyCode - 65].play();
							}
						}
					} else if (String.fromCharCode(e.keyCode) == 'M') {
						if (this.area != 'bestiary') {
							//bestiary: see descriptions of the monsters you have fought
							this.area = 'bestiary';
							this.disconnectAudio();
							this.townMessages[0].volume = 0;
							this.townMessages[1].volume = 0;
							this.townMessages[3].volume = 0;
							this.townMessages[4].volume = 0;
							this.townMessages[5].volume = 0;
							this.townMessages[6].volume = 0;
							this.townMessages[13].volume = 0;
							this.townMessages[14].volume = 0;
							this.townMessages[15].volume = 0;
							this.showBestiary();
						} else {
							this.recordedLetters[e.keyCode - 65].volume = 0.3;
							if (!this.mute) {
								this.recordedLetters[e.keyCode - 65].play();
							}
						}
					} else if (String.fromCharCode(e.keyCode) == 'S') {
						if (this.area != 'spells') {
							//see descriptions of the spells you know
							this.area = 'spells';
							this.disconnectAudio();
							this.townMessages[0].volume = 0;
							this.townMessages[1].volume = 0;
							this.townMessages[3].volume = 0;
							this.townMessages[4].volume = 0;
							this.townMessages[6].volume = 0;
							this.townMessages[7].volume = 0;
							this.townMessages[13].volume = 0;
							this.townMessages[14].volume = 0;
							this.townMessages[15].volume = 0;
							this.showSpells();
						} else {
							this.recordedLetters[e.keyCode - 65].volume = 0.3;
							if (!this.mute) {
								this.recordedLetters[e.keyCode - 65].play();
							}
						}
					} else if (String.fromCharCode(e.keyCode) == 'A') {
						if (this.area != 'attributes') {
							//see descriptions of the spells you know
							this.area = 'attributes';
							this.disconnectAudio();
							this.townMessages[0].volume = 0;
							this.townMessages[1].volume = 0;
							this.townMessages[3].volume = 0;
							this.townMessages[4].volume = 0;
							this.townMessages[5].volume = 0;
							this.townMessages[6].volume = 0;
							this.townMessages[7].volume = 0;
							this.showAttributes();
						} else {
							this.recordedLetters[e.keyCode - 65].volume = 0.3;
							if (!this.mute) {
								this.recordedLetters[e.keyCode - 65].play();
							}
						}
					} else if (String.fromCharCode(e.keyCode) == 'R') {
						if (this.area == 'attributes') {
							//reset combat and magic level
							this.area = 'reset';
							this.disconnectAudio();
							this.townMessages[13].volume = 0;
							this.townMessages[14].volume = 0;
							this.townMessages[15].volume = 0;
							this.resetAttributes(true);
						} else {
							this.recordedLetters[e.keyCode - 65].volume = 0.3;
							if (!this.mute) {
								this.recordedLetters[e.keyCode - 65].play();
							}
						}
					} else if (String.fromCharCode(e.keyCode) == 'F') {
						//secret - fight a difficult monster
						this.townMessages[0].volume = 0;
						this.townMessages[1].volume = 0;
						this.townMessages[3].volume = 0;
						this.townMessages[4].volume = 0;
						this.townMessages[6].volume = 0;
						this.townMessages[7].volume = 0;
						this.townMessages[13].volume = 0;
						this.townMessages[14].volume = 0;
						this.townMessages[15].volume = 0;
						this.currentArea = this.allAreas[this.allAreas.length-1];
						this.combat(this.currentArea.name,50,100+50*this.level,100,200);
					} else {
						//no option available for this letter
						this.recordedLetters[e.keyCode - 65].volume = 0.3;
						if (!this.mute) {
							this.recordedLetters[e.keyCode - 65].play();
						}
					}
				} else if (this.area == 'reset') {
					if (String.fromCharCode(e.keyCode) == 'B') {
						this.townMessages[17].volume = 0;
						this.disconnectAudio();
						if (this.freePoints == 0) {
							this.area = 'town';
							this.enterTown();
						} else {
							//randomly spend free points
							while(this.freePoints > 0) {
								if (Math.random() <= 0.5) {
									this.combatLevel++;
								} else {
									this.magicLevel++;
								}
								this.freePoints--;
							}
							this.area = 'town';
							this.enterTown();
						}
					} else {
						this.recordedLetters[e.keyCode - 65].volume = 0.3;
						if (!this.mute) {
							this.recordedLetters[e.keyCode - 65].play();
						}
					}
				} else if (this.area == 'outside') {
					if (String.fromCharCode(e.keyCode) == 'B') {
						this.recordedMessages[32].volume = 0;
						this.areaMessages[0].volume = 0;
						this.disconnectAudio();
						this.area = 'town';
						this.enterTown();
					} else {
						this.recordedLetters[e.keyCode - 65].volume = 0.3;
						if (!this.mute) {
							this.recordedLetters[e.keyCode - 65].play();
						}
					}
				} else if (this.area == 'intro') {
					if (String.fromCharCode(e.keyCode) == 'M') {
						if (!this.mute) {
							this.mute = true;
							this.recordedMessages[0].volume = 0;
						} else {
							this.mute = false;
							this.recordedMessages[0].volume = 1;
						}
						this.drawIntroPage();
					}
				} else {
					this.recordedLetters[e.keyCode - 65].volume = 0.3;
					if (!this.mute) {
						this.recordedLetters[e.keyCode - 65].play();
					}
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
		if (this.audioQueueCount == 0) {
			console.log("audio queue 1");
			this.audioQueueCount = 1;
			if (!this.mute) {
				if (this.audioQueue.length > 0) {
					this.playAudioQueue();
				}
			}
		} else if (this.audioQueueCount == 1) {
			console.log("audio queue 2");
			this.audioQueueCount = 2;
			this.audioQueueTwo = [];
			for (var a = 0; a < this.audioQueue.length; a++) {
				this.audioQueueTwo.push(this.audioQueue[a]);
			}
			this.audioQueue = [];
			if (!this.mute) {
				if (this.audioQueueTwo.length > 0) {
					this.playAudioQueueTwo();
				}
			}
		} else if (this.audioQueueCount == 2) {
			console.log("audio queue 3");
			this.audioQueueCount = 3;
			this.audioQueueThree = [];
			for (var a = 0; a < this.audioQueue.length; a++) {
				this.audioQueueThree.push(this.audioQueue[a]);
			}
			this.audioQueue = [];
			if (!this.mute) {
				if (this.audioQueueThree.length > 0) {
					this.playAudioQueueThree();
				}
			}
		} else if (this.audioQueueCount == 3) {
			console.log("audio queue 4");
			this.audioQueueCount = 0;
			this.audioQueueFour = [];
			for (var a = 0; a < this.audioQueue.length; a++) {
				this.audioQueueFour.push(this.audioQueue[a]);
			}
			this.audioQueue = [];
			if (!this.mute) {
				if (this.audioQueueFour.length > 0) {
					this.playAudioQueueFour();
				}
			}
		}
	},
	audioSoundEnded: function(value) {
		if (this.audioQueue.length > 0) {
			this.playAudioQueue();
		}
	},
	audioSoundEndedTwo: function(value) {
		if (this.audioQueueTwo.length > 0) {
			this.playAudioQueueTwo();
		}
	},
	audioSoundEndedThree: function(value) {
		if (this.audioQueueThree.length > 0) {
			this.playAudioQueueThree();
		}
	},
	audioSoundEndedFour: function(value) {
		if (this.audioQueueFour.length > 0) {
			this.playAudioQueueFour();
		}
	},
	playAudioQueue: function(value) {
		if (this.audioQueue.length > 0) {
			this.currentlyTalking = true;
			this.onceConnect(this.audioQueue[0], 'ended', this, 'audioSoundEnded');
			this.onceConnect(this.audioQueue[0], 'error', this, 'audioSoundEnded');
			this.audioQueue[0].load();
			this.audioQueue[0].volume = 1;
			this.audioQueue[0].play();
			//remove the first element of audioQueue
			this.disconnectQueue = [];
			this.disconnectQueue.push(this.audioQueue[0]);
			this.audioQueue.shift();
			if (this.audioQueue.length == 0) {
				this.currentlyTalking = false;
				if (this.spelling) {
					setTimeout(dojo.hitch(this,function(){
						this.playDing();
					}),500);
					this.spelling = false;
				}
				if (this.resetIdleTimer) {
					this.resetIdleTimer = false;
					this.startIdleTimer();
				}
			}
		}
	},
	playAudioQueueTwo: function(value) {
		if (this.audioQueueTwo.length > 0) {
			this.currentlyTalking = true;
			this.onceConnect(this.audioQueueTwo[0], 'ended', this, 'audioSoundEndedTwo');
			this.onceConnect(this.audioQueueTwo[0], 'error', this, 'audioSoundEndedTwo');
			this.audioQueueTwo[0].load();
			this.audioQueueTwo[0].volume = 1;
			this.audioQueueTwo[0].play();
			//remove the first element of audioQueue
			this.disconnectQueue = [];
			this.disconnectQueue.push(this.audioQueueTwo[0]);
			this.audioQueueTwo.shift();
			if (this.audioQueueTwo.length == 0) {
				this.currentlyTalking = false;
				if (this.spelling) {
					setTimeout(dojo.hitch(this,function(){
						this.playDing();
					}),500);
					this.spelling = false;
				}
				if (this.resetIdleTimer) {
					this.resetIdleTimer = false;
					this.startIdleTimer();
				}
			}
		}
	},
	playAudioQueueThree: function(value) {
		if (this.audioQueueThree.length > 0) {
			this.currentlyTalking = true;
			this.onceConnect(this.audioQueueThree[0], 'ended', this, 'audioSoundEndedThree');
			this.onceConnect(this.audioQueueThree[0], 'error', this, 'audioSoundEndedThree');
			this.audioQueueThree[0].load();
			this.audioQueueThree[0].volume = 1;
			this.audioQueueThree[0].play();
			//remove the first element of audioQueue
			this.disconnectQueue = [];
			this.disconnectQueue.push(this.audioQueueThree[0]);
			this.audioQueueThree.shift();
			if (this.audioQueueThree.length == 0) {
				this.currentlyTalking = false;
				if (this.spelling) {
					setTimeout(dojo.hitch(this,function(){
						this.playDing();
					}),500);
					this.spelling = false;
				}
				if (this.resetIdleTimer) {
					this.resetIdleTimer = false;
					this.startIdleTimer();
				}
			}
		}
	},
	playAudioQueueFour: function(value) {
		if (this.audioQueueFour.length > 0) {
			this.currentlyTalking = true;
			this.onceConnect(this.audioQueueFour[0], 'ended', this, 'audioSoundEndedFour');
			this.onceConnect(this.audioQueueFour[0], 'error', this, 'audioSoundEndedFour');
			this.audioQueueFour[0].load();
			this.audioQueueFour[0].volume = 1;
			this.audioQueueFour[0].play();
			//remove the first element of audioQueue
			this.disconnectQueue = [];
			this.disconnectQueue.push(this.audioQueueFour[0]);
			this.audioQueueFour.shift();
			if (this.audioQueueFour.length == 0) {
				this.currentlyTalking = false;
				if (this.spelling) {
					setTimeout(dojo.hitch(this,function(){
						this.playDing();
					}),500);
					this.spelling = false;
				}
				if (this.resetIdleTimer) {
					this.resetIdleTimer = false;
					this.startIdleTimer();
				}
			}
		}
	},
	disconnectAudio: function() {
		this.audioQueue = [];
		this.audioQueueTwo = [];
		this.audioQueueThree = [];
		this.audioQueueFour = [];
		if (this.disconnectQueue.length > 0) {
			for (var d = 0; d < this.disconnectQueue.length; d++) {
				this.disconnectQueue[d].volume = 0;
				this.onceConnect(this.disconnectQueue[d], 'ended', this, 'disconnectSound');
				this.onceConnect(this.disconnectQueue[d], 'error', this, 'disconnectSound');
			}
		}
		this.disconnectQueue = [];
	},
	disconnectSound: function() {
	},
	playQuest: function(e) {
		if (!this.acceptedQuest) {
			this.area = 'quest';
			if (this.questLevel < this.numQuests) {
				this.currentlyTalking = true;
				this.acceptedQuest = true;
				this.bossComplete = false;
				//this.onceConnect(this.questMessages[this.questLevel],'ended',this,'acceptQuest');
				//this.questMessages[this.questLevel].play();
				this.disconnectAudio();
				this.audioQueue.push(this.recordedMessages[39]);
				this.audioQueue.push(this.questMessages[this.questLevel]);
				//this.acceptedQuest = true;
				//say press the space bar to leave town and go fight monsters
				this.audioQueue.push(this.recordedMessages[31]);
				this.soundEnded();
				var ctx = canvas.getContext("2d");
				ctx.fillStyle = "#fff";
				ctx.fillRect(0,0,canvas.width,canvas.height);
				ctx.fillStyle = "#000";
				ctx.font = "20pt Bookman Old Style";
				if (this.questLevel == 0) {
					this.questNeeded = 3;
					this.questCount = 0;
					this.questMonster = 'Cute Rabbit';
					ctx.fillText('Quest!',10,30);
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You go to the nearby inn, since where else would you",10,60);
					ctx.fillText("look for quests?  You find an old crone sitting at",10,90);
					ctx.fillText("one of the tables.  \"Mighty hero\", she says, \"I have a",10,120);
					ctx.fillText("quest of great importance for you!  I've heard that",10,150);
					ctx.fillText("rabbit tails make one lucky, and I wish to become",10,180);
					ctx.fillText("very lucky.  Three times as lucky as normal, in fact!",10,210);
					ctx.fillText("Get me three rabbit tails by any means necessary and",10,240);
					ctx.fillText("I will reward you.  You can find rabbits in the Wheat",10,270);
					ctx.fillText("Fields just outside of town.\"",10,300);
					ctx.fillText("TL;DR: Your quest is to collect 3 rabbit tails.",10,360);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to leave town and go fight monsters.",10,390);
					if (this.knownAreas.length == Math.floor(this.questLevel/2)) {
						this.knownAreas.push(this.allAreas[Math.floor(this.questLevel/2)+2]);
					}
				} else if (this.questLevel == 1) {
					this.questNeeded = 1;
					this.questCount = 0;
					this.questMonster = 'Combine Harvester';
					ctx.fillText('Quest!',10,30);
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("As you are walking through the town square, a panicked",10,60);
					ctx.fillText("looking farmer runs up to you.  \"Hero, you have to help",10,90);
					ctx.fillText("me!\" he gasps, \"One of the combine harvester machines in",10,120);
					ctx.fillText("the Wheat Fields has run rampant, and it is harvesting",10,150);
					ctx.fillText("everything in sight.  You must stop it before it reaches",10,180);
					ctx.fillText("the town, or it will grind all the inhabitants to dust!\"",10,210);
					ctx.fillText("TL;DR: Destroy the combine harvester!",10,270);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to leave town.",10,300);
				} else if (this.questLevel == 2) {
					this.questNeeded = 6;
					this.questCount = 0;
					this.questMonster = 'Goblin';
					ctx.fillText('Quest!',10,30);
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You enter the inn again, and the innkeeper greets you.",10,60);
					ctx.fillText("\"Perhaps you can help me out with a problem I have,",10,90);
					ctx.fillText("mighty hero.  You see, I am running low on ingredients",10,120);
					ctx.fillText("for my most popular dish, goblin finger soup.  I'll",10,150);
					ctx.fillText("need 6 goblin fingers to keep my supply up, but I'm not",10,180);
					ctx.fillText("strong enough to... borrow the fingers myself.  This",10,210);
					ctx.fillText("may seem like an easy task because goblins each have",10,240);
					ctx.fillText("ten fingers, but I only want fingers of the highest",10,270);
					ctx.fillText("quality!  You can find a lot of those filthy goblins",10,300);
					ctx.fillText("lounging around the Creepy Cave outside of town.",10,330);
					ctx.fillText("TL;DR: Your quest is to get 6 goblin fingers.",10,390);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to leave town.",10,420);
					if (this.knownAreas.length == Math.floor(this.questLevel/2)) {
						this.knownAreas.push(this.allAreas[Math.floor(this.questLevel/2)+2]);
						this.areaSelected = this.knownAreas.length-1;
					}
				} else if (this.questLevel == 3) {
					this.questNeeded = 1;
					this.questCount = 0;
					this.questMonster = 'Cave In';
					ctx.fillText('Quest!',10,30);
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You see a man in a mining helmet running towards you.",10,60);
					ctx.fillText("\"He looks frantic,\" you think, \"It looks like it's",10,90);
					ctx.fillText("quest time.\" Sure enough, the miner stops in front",10,120);
					ctx.fillText("of you and gasps, \"You must help me, hero!  A group",10,150);
					ctx.fillText("of us were trying to mine valuable magiconium ore",10,180);
					ctx.fillText("from the Creepy Cave when the ceiling caved in and",10,210);
					ctx.fillText("trapped everyone except me.  Please rescue my friends",10,240);
					ctx.fillText("from the cave in before they run out of air!",10,270);
					ctx.fillText("TL;DR: Rescue the miners from the cave in.",10,330);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to leave town.",10,360);
				} else if (this.questLevel == 4) {
					this.questNeeded = 3;
					this.questCount = 0;
					this.questMonster = 'Shark';
					ctx.fillText('Quest!',10,30);
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("As you walk through the town's training grounds, you",10,60);
					ctx.fillText("see a group of three soaking wet people with hoses in",10,90);
					ctx.fillText("their mouths.  As you look at them curiously, one of",10,120);
					ctx.fillText("them approaches you and says, \"We have been swimming",10,150);
					ctx.fillText("in the ocean in an attempt to get some fish for dinner,",10,180);
					ctx.fillText("but we keep catching hypothermia before we can catch",10,210);
					ctx.fillText("any fish.  If only we had nice, warm wetsuits made from",10,240);
					ctx.fillText("the skin of sharks, we could finally stop going hungry.",10,270);
					ctx.fillText("Great hero, would you consider getting us three shark",10,300);
					ctx.fillText("skins?  We would be very grateful.  All you would have",10,330);
					ctx.fillText("to do is go for a swim in the Endless Ocean just west",10,360);
					ctx.fillText("of town and you will find a lot of sharks.  Be careful,",10,390);
					ctx.fillText("though.  There used to be four of us, but one of the",10,420);
					ctx.fillText("sharks ate Larry when we tried to get some skin for",10,450);
					ctx.fillText("ourselves.  May he rest in pieces.\"",10,480);
					ctx.fillText("TL;DR: Get 3 shark skins",10,540);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to leave town.",10,570);
					if (this.knownAreas.length == Math.floor(this.questLevel/2)) {
						this.knownAreas.push(this.allAreas[Math.floor(this.questLevel/2)+2]);
						this.areaSelected = this.knownAreas.length-1;
					}
				} else if (this.questLevel == 5) {
					this.questNeeded = 1;
					this.questCount = 0;
					this.questMonster = 'Battleship';
					ctx.fillText('Quest!',10,30);
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You are relaxing on a bench near the inn, when suddenly",10,60);
					ctx.fillText("you see the town hall explode in front of you.  The",10,90);
					ctx.fillText("entire town starts shaking as it is hit with a barrage",10,120);
					ctx.fillText("of explosions.  You look over towards the ocean and see",10,150);
					ctx.fillText("a massive battleship firing at the town.  You decide that",10,180);
					ctx.fillText("you had better go to the Endless Ocean and sink it before",10,210);
					ctx.fillText("it destroys all of Question.",10,240);
					ctx.fillText("TL;DR: Sink the battleship!",10,300);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to leave town.",10,330);
				} else if (this.questLevel == 6) {
					this.questNeeded = 3;
					this.questCount = 0;
					this.questMonster = 'Genetically Engineered Human';
					ctx.fillText('Quest!',10,30);
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("As you enter the inn, you see a wizard waiting by the",10,60);
					ctx.fillText("entrance.  \"You have been making quite a name for",10,90);
					ctx.fillText("yourself, hero,\" he says, \"But what I am about to",10,120);
					ctx.fillText("show you will be far beyond anything you have seen",10,150);
					ctx.fillText("before.  Using advanced magiscience, I have managed",10,180);
					ctx.fillText("to open a rip in space-time, which will allow you to",10,210);
					ctx.fillText("travel to Question in the future!  However, things",10,240);
					ctx.fillText("are quite grim there.  All of mankind have genetically",10,270);
					ctx.fillText("engineered themselves to have both superhuman strength",10,300);
					ctx.fillText("and live forever, which was actually quite pointless",10,330);
					ctx.fillText("because they spend all their time on this thing called",10,360);
					ctx.fillText("'The Internet' which they can 'navigate' using implants",10,390);
					ctx.fillText("in their brains.  I wish to further study this 'Internet'",10,420);
					ctx.fillText("phenomenon, so I would like you travel through the time",10,450);
					ctx.fillText("rip and collect three of these future brains.  Future man",10,480);
					ctx.fillText("isn't really using them, so it shouldn't be a problem.",10,510);
					ctx.fillText("TL;DR: Acquire 3 brains from genetically engineered humans",10,570);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to leave town.",10,610);
					if (this.knownAreas.length == Math.floor(this.questLevel/2)) {
						this.knownAreas.push(this.allAreas[Math.floor(this.questLevel/2)+2]);
						this.areaSelected = this.knownAreas.length-1;
					}
				} else if (this.questLevel == 7) {
					this.questNeeded = 1;
					this.questCount = 0;
					this.questMonster = 'Robotron 3000';
					ctx.fillText('Quest!',10,30);
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("As you are standing in the middle of town, a partially",10,60);
					ctx.fillText("transparent yet strangely familiar person appears in",10,90);
					ctx.fillText("front of you.  The person's entire body seems to be",10,120);
					ctx.fillText("rapidly fading away as they desperately try to talk to",10,150);
					ctx.fillText("you, \"I am you, but from the future!  The evil Robotron",10,180);
					ctx.fillText("3000 killing machine that we will save Question from",10,210);
					ctx.fillText("in the future has travelled back in time to MY past and",10,240);
					ctx.fillText("destroyed my past self before I was able to travel back",10,270);
					ctx.fillText("in time to ask for your help, which is why I am fading",10,300);
					ctx.fillText("out of existence!  I remember a wizard showing us a time",10,330);
					ctx.fillText("rip back in YOUR time, so the only way to prevent our",10,360);
					ctx.fillText("death is for you to travel to Future Question and destroy",10,390);
					ctx.fillText("the Robotron 3000!\"  Your future self vanishes completely",10,420);
					ctx.fillText("after saying this.  You decide that the properly heroic",10,450);
					ctx.fillText("thing to do would be to go destroy that Robotron thing.",10,480);
					ctx.fillText("Otherwise time could collapse upon itself or something.",10,510);
					ctx.fillText("TL;DR: Kill the Robotron 3000!",10,570);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to leave town.",10,600);
				}
				this.questLevel++;
			} else {
				this.audioQueue.push(this.recordedMessages[30]);
				this.audioQueue.push(this.recordedMessages[31]);
				this.audioQueue.push(this.townMessages[6]);
				this.soundEnded();
				var ctx = canvas.getContext("2d");
				ctx.fillStyle = "#fff";
				ctx.fillRect(0,0,canvas.width,canvas.height);
				ctx.fillStyle = "#000";
				ctx.font = "20pt Bookman Old Style";
				ctx.fillText("There are no more quests available.",10,30);
				ctx.fillText("Press space to leave town and go fight monsters.",10,60);
				ctx.fillText("Press B to go back to town.",10,90);
			}
		} else {
			//say what your current quest is
			var ctx = canvas.getContext("2d");
			ctx.fillStyle = "#fff";
			ctx.fillRect(0,0,canvas.width,canvas.height);
			ctx.fillStyle = "#000";
			ctx.font = "20pt Bookman Old Style";
			ctx.fillText("Current Quest",10,30);
			if (this.questLevel == 1) {
				ctx.fillText("Your quest is to collect 3 rabbit tails from the Wheat Fields.",10,60);
				ctx.fillText("Press space to leave town and go fight monsters.",10,90);
			} else if (this.questLevel == 2) {
				ctx.fillText("Your quest is to kill the Combine Harvester",10,60);
				ctx.fillText("in the Wheat Fields.",10,90);
				ctx.fillText("Press space to leave town and go fight monsters.",10,120);
			} else if (this.questLevel == 3) {
				ctx.fillText("Your quest is to collect 6 goblin fingers",10,60);
				ctx.fillText("from the Creepy Cave.",10,90);
				ctx.fillText("Press space to leave town and go fight monsters.",10,120);
			} else if (this.questLevel == 4) {
				ctx.fillText("Your quest is to rescue the miners from the cave in",10,60);
				ctx.fillText("in the Creepy Cave.",10,90);
				ctx.fillText("Press space to leave town and go fight monsters.",10,120);
			} else if (this.questLevel == 5) {
				ctx.fillText("Your quest is to get 3 shark skins from the Endless Ocean.",10,60);
				ctx.fillText("Press space to leave town and go fight monsters.",10,90);
			} else if (this.questLevel == 6) {
				ctx.fillText("Your quest is to destroy the Battleship",10,60);
				ctx.fillText("in the Endless Ocean.",10,90);
				ctx.fillText("Press space to leave town and go fight monsters.",10,120);
			} else if (this.questLevel == 7) {
				ctx.fillText("Your quest is acquire 3 brains from genetically",10,60);
				ctx.fillText("engineered humans in Future Question.",10,90);
				ctx.fillText("Press space to leave town and go fight monsters.",10,120);
			} else if (this.questLevel == 8) {
				ctx.fillText("Your quest is to demolish Robotron 3000",10,60);
				ctx.fillText("in Future Question.",10,90);
				ctx.fillText("Press space to leave town and go fight monsters.",10,120);
			} else {
				ctx.fillText("Press space to leave town and go fight monsters.",10,60);
			}
			this.disconnectAudio();
			var questAltSound = dojo.doc.createElement('audio');
			questAltSound.setAttribute('src', 'sounds/quests/quest' + (this.questLevel-1) + 'alt' + this._ext);
			this.audioQueue.push(questAltSound);
			this.audioQueue.push(this.recordedMessages[31]);
			this.soundEnded();
		}
	},
	acceptQuest: function(page) {

	},
	endTutorialRepeat: function() {
		this.currentlyTalking = false;
		this.repeating = false;
		this.spelling = false;
		this.recordedMessages[6].volume = 1;
		this.recordedMessages[12].volume = 1;
		if (this.defRepeat) {
			this.defRepeat = false;
			this.tutorialDefendPromptTwo();
		} else if (this.typeWord) {
			if (!this.mute) {
				this.recordedMessages[6].play();
			}
			this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
		}
	},
	tutorial: function(page) {
		/*dojo.empty(this.generateDiv);
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
		this.tutorialMessages[page].play();*/
		if (this.difficulty <= 2) {
			this.combat('Tutorial',25,140,5,10);
		} else if (this.difficulty <= 3) {
			this.combat('Tutorial',33,140,5,10);
		} else {
			this.combat('Tutorial',40,140,5,10);
		}
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
		}
		this.currentlyTalking = false;
		*/
	},
	tutorialAttackPrompt: function() {
		if (!this.mute) {
			this.recordedMessages[6].play();
			this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
		} else {
			this.sayWord();
		}
	},
	tutorialDefendPrompt: function() {
		if (this.tutorialPage == 0) {
			this.onceConnect(this.recordedMessages[12], 'ended', this, 'tutorialDefendPromptTwo');
		} else {
			this.onceConnect(this.recordedMessages[12], 'ended', this, 'defend');
		}
		if (this.mute) {
			this.recordedMessages[12].setAttribute('src', 'sounds/combat/MonstersTurn' + this._ext);
			this.recordedMessages[12].volume = 0;
		} else {
			this.recordedMessages[12].volume = 1;
		}
		this.recordedMessages[12].play();
		this.currentMessage = "Monster's Turn.  Defend yourself!";
		this.drawCombat();
	},
	tutorialDefendPromptTwo: function() {
		if (!this.repeating) {
			if (this.tutorialPage == 0) {
				this.tutorialPage++;
				this.onceConnect(this.tutorialMessages[3], 'ended', this, 'defend');
				this.currentAudio = this.tutorialMessages[3];
				if (this.mute) {
					this.tutorialMessages[3].volume = 0;
				} else {
					this.tutorialMessages[3].volume = 1;
				}
				this.tutorialMessages[3].play();
				if (!this.mute) {
					this.currentMessage = "When defending yourself, the faster you type the word,<br>the less damage you will take.<br>You will always take some damage.<br>(Press shift at any time to skip talking and continue)";
				} else {
					this.currentMessage = "When defending yourself, the faster you type the word,<br>the less damage you will take.<br>You will always take some damage.<br>(Press shift to continue)";
				}
				this.drawCombat();
			} else if (this.tutorialPage == 2) {
				this.tutorialPage++;
				this.onceConnect(this.tutorialMessages[7], 'ended', this, 'defend');
				this.currentAudio = this.tutorialMessages[7];
				if (this.mute) {
					this.tutorialMessages[7].volume = 0;
				} else {
					this.tutorialMessages[7].volume = 1;
				}
				this.tutorialMessages[7].play();
				if (!this.mute) {
					this.currentMessage = "If you type a wrong letter while defending, you will not be able<br>to try the word again and you will take full damage from the monster's attack.";
				} else {
					this.currentMessage = "If you type a wrong letter while defending, you will not be able<br>to try the word again and you will take full damage from the monster's attack.<br>(Press shift to continue)";
				}
				this.drawCombat();
			}
		} else {
			this.defRepeat = true;
		}
	},
	tutorialHealthPrompt: function() {
		this.onceConnect(this.tutorialMessages[4], 'ended', this, 'combatLoop');
		this.currentAudio = this.tutorialMessages[4];
		this.currentlyTalking = true;
		if (!this.mute) {
			this.tutorialMessages[4].play();
			this.currentMessage = "Now that the monster's turn is over, you will regenerate health and mana.<br>If you want to know how much health and mana you have, press the left arrow.<br>If you want to know how much health the monster has left, press the right arrow.<br>(Press shift at any time to skip talking and continue)";
		} else {
			this.currentMessage = "Now that the monster's turn is over, you will regenerate health and mana.";
			this.combatLoop();
		}
		this.drawCombat();
	},
	tutorialMagicPrompt: function() {
		this.onceConnect(this.tutorialMessages[8], 'ended', this, 'combatLoop');
		this.currentAudio = this.tutorialMessages[8];
		this.currentlyTalking = true;
		if (!this.mute) {
			this.tutorialMessages[8].play();
			this.currentMessage = "Each turn, you can cast a spell instead of pressing the space bar<br>Right now, you know the magic dart spell<br>that you can cast by typing D A R T<br>(Press shift at any time to skip talking and continue)";
		} else {
			this.currentMessage = "Each turn, you can cast a spell instead of pressing the space bar<br>Right now, you know the magic dart spell<br>that you can cast by typing D A R T";
			this.combatLoop();
		}
		this.drawCombat();
	},
	tryAgain: function() {
		this.typedLetters = [];
		this.currentlyTalking = true;
		this.currentMessage = "Try again.";
		this.drawCombat();
		if (!this.mute) {
			this.recordedMessages[6].play();
			this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
		} else {
			this.recordedMessages[6].volume = 0;
			this.recordedMessages[6].play();
			this.onceConnect(this.recordedMessages[6], 'ended', this, 'repeatWord');
		}
	},
	combat: function(givenArea,monAttack,monHealth,monExp,monGold) {
		this.disconnectAudio();
		this.currentlyTalking = true;
		this.inCombat = true;
		this.monsterMaxHealth = monHealth;
		this.monsterAttack = monAttack;
		this.monsterHealth = this.monsterMaxHealth;
		this.monsterExperience = monExp;
		this.monsterGold = monGold;
		this.currentArea = {
			name: 'The Unknown',
			monsters: [],
			boss: []
		};
		var haveQuest = false;
		var haveBoss = false;
		for (i = 0; i < this.allAreas.length; i++) {
			if (this.allAreas[i].name.split(' ').join('').toLowerCase() == givenArea.split(' ').join('').toLowerCase()) {
				this.currentArea = this.allAreas[i];
				//the first 2 areas are tutorial and training, every area after that has a monster quest and a boss quest
				//questLevel 1 and 2 = wheat fields, 3 and 4 = next area, etc
				if (Math.round(this.questLevel/2)+1 == i) {
					haveQuest = true;
					if (Math.floor(this.questLevel/2) == Math.round(this.questLevel/2)) {
						haveBoss = true;
					}
				}
				//end for loop
				i = this.allAreas.length;
			}
		}
		console.log("Area: " + this.currentArea.name);
		if (this.currentArea.monsters.length == 0) {
			this.monsterName = "Random Monster";
			if (this.area == 'tutorial') {
				this.monsterName = "Error: Please refresh the page";
			}
		} else if (this.currentArea.monsters.length == 1) {
			this.monsterName = this.currentArea.monsters[0].name;
			this.currentWords = this.currentArea.monsters[0].words[Math.round(this.difficulty-1)];
			var inBestiary = false;
			for (var m = 0; m < this.bestiary.length; m++) {
				if (this.monsterName == this.bestiary[m]) {
					inBestiary = true;
					m = this.bestiary.length;
				}
			}
			if (!inBestiary) {
				this.bestiary.push(this.monsterName);
			}
		} else {
			//select which monster to fight
			var i = Math.floor(Math.random()*this.currentArea.monsters.length);
			if (!haveQuest || this.previousMonsterName == this.questMonster) {
				//if there is no quest in that area, select randomly
				//don't repeat monsters until all have been fought
				var infCount = 0;
				var alreadyFought = true;
				if (this.foughtMonsters.length > 0) {
					while(alreadyFought && infCount < 1000) {
						alreadyFought = false;
						i = Math.floor(Math.random()*this.currentArea.monsters.length);
						for (var m = 0; m < this.foughtMonsters.length; m++) {
							if (this.foughtMonsters[m] == this.currentArea.monsters[i].name) {
								alreadyFought = true;
							}
						}
						infCount++;
					}
				}				
			} else {
				//Do the quest monster, then one of the others, then quest again, then a different of the others, then quest
				for (var m = 0; m < this.currentArea.monsters.length; m++) {
					if (this.currentArea.monsters[m].name == this.questMonster) {
						i = m;
						m = this.currentArea.monsters.length;
					}
				}
			}
			this.monsterName = this.currentArea.monsters[i].name;
			this.previousMonsterName = this.monsterName;
			this.foughtMonsters.push(this.monsterName);
			var inBestiary = false;
			for (var m = 0; m < this.bestiary.length; m++) {
				if (this.monsterName == this.bestiary[m]) {
					inBestiary = true;
					m = this.bestiary.length;
				}
			}
			if (!inBestiary) {
				this.bestiary.push(this.monsterName);
			}
			var foughtAll = true;
			var found = false;
			for (var m = 0; m < this.currentArea.monsters.length; m++) {
				found = false;
				for (var f = 0; f < this.foughtMonsters.length; f++) {
					if (this.foughtMonsters[f] == this.currentArea.monsters[m].name) {
						found = true;
					}
				}
				if (!found) {
					foughtAll = false;
					m = this.currentArea.monsters.length;
				}
			}
			if (foughtAll) {
				this.foughtMonsters = [];
			}
			this.currentWords = this.currentArea.monsters[i].words[Math.round(this.difficulty-1)];
			if (haveBoss && this.currentArea.boss.length > 0 && this.bossComplete == false) {
				//fight the boss monster of the area (if you have the quest for it)
				this.monsterName = this.currentArea.boss[0].name;
				if (this.monsterName.indexOf("Boss(") != -1) {
					this.monsterName = this.monsterName.split("Boss(")[1];
				}
				if (this.monsterName.indexOf(")") != -1) {
					this.monsterName = this.monsterName.split(")")[0];
				}
				console.log("fight boss");
				this.currentWords = this.currentArea.boss[0].words[Math.round(this.difficulty-1)];
				//make boss more powerful than normal monsters in the area
				this.monsterAttack = Math.round(this.monsterAttack * 1.1);
				this.monsterMaxHealth = Math.round(this.monsterMaxHealth*1.5);
				this.monsterHealth = this.monsterMaxHealth;
				this.monsterExperience = this.monsterExperience * 3;
				this.monsterGold = this.monsterGold * 3;
				var inBestiary = false;
				for (var m = 0; m < this.bestiary.length; m++) {
					if (this.monsterName == this.bestiary[m]) {
						inBestiary = true;
						m = this.bestiary.length;
					}
				}
				if (!inBestiary) {
					this.bestiary.push(this.monsterName);
				}
			}
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
		this.currentMessage = "";
		this.soundEffects[2].volume = 0.5;
		if (!this.mute) {
			this.onceConnect(this.soundEffects[2], 'ended', this, 'readMonster');
			this.soundEffects[2].play();
		} else {
			this.combatLoop();
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
		//this.onceConnect(this.monsterMessages[this.monsterIndex], 'ended', this, 'combatLoop');
		
		var tempMonster = dojo.doc.createElement('audio');
		tempMonster.setAttribute('src', 'sounds/monsters/' + this.monsterName.split(' ').join('').toLowerCase() + this._ext);
		console.log("Monster: " + this.monsterName);
		this.currentMessage = "";
		this.power = 100;
		this.onceConnect(tempMonster,'ended',this, 'combatLoop');
		this.onceConnect(tempMonster,'error',this,'testFunc');
		
		//setTimeout(dojo.hitch(this,function(){this.monsterMessages[this.monsterIndex].play();}),500);
		setTimeout(dojo.hitch(this,function(){tempMonster.play();}),500);
	},
	testFunc: function(e) {
		console.log('Monster audio file not found');
		this.combatLoop();
	},
	combatLoop: function(e) {
		//regenerate health and mana
		this.currentHealth += Math.round((this.combatLevel/5)*(0.8+this.level/5));
		this.currentMana += Math.round((this.magicLevel/5)*(0.8+this.level/5));
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
		//delay = 1500;
		this.startIdleTimer();
	},
	startIdleTimer: function(e) {
		//special tutorial triggers
		if (this.area == 'tutorial') {
			if (this.tutorialPage == 0) {
				delay = 500;
			} else if (this.tutorialPage == 1) {
				delay = 1000;
			} else {
				delay = 500;
			}
		} else {
			delay = 1500;
		}
		combatDelay = true;
		setTimeout(dojo.hitch(this,function(){
			if (combatDelay && !this.typeWord && this.inCombat) {
				//remind the player what to do if idle
				if (this.area == 'tutorial') {
					if (this.tutorialPage == 0) {
						this.tutorialMessages[0].volume = 1;
						this.currentAudio = this.tutorialMessages[0];
						if (!this.mute) {
							this.tutorialMessages[0].play();
							this.currentMessage = "Press the spacebar to attack or press shift to skip this tutorial.<br>Press the up arrow to repeat any tutorial message.";
						} else {
							this.currentMessage = "Press the spacebar to attack or press shift to skip this tutorial.<br>(Game is muted)";
						}
						this.drawCombat();
					} else if (this.tutorialPage == 1) {
						this.tutorialMessages[5].volume = 1;
						if (!this.mute) {
							this.tutorialMessages[5].play();
						}
						this.currentMessage = "Press the spacebar to attack the monster.";
						this.drawCombat();
					} else {
						this.recordedMessages[22].volume = 1;
						if (!this.mute) {
							this.recordedMessages[22].play();
						}
						this.currentMessage = "Press space to attack or type to cast a spell.<br>Type L I S T to list the spells you know.";
						this.drawCombat();
					}
				} else {
					this.recordedMessages[22].volume = 1;
					if (!this.mute) {
						this.recordedMessages[22].play();
					}
					this.currentMessage = "Press space to attack or type to cast a spell.<br>Type L I S T to list the spells you know.";
					this.drawCombat();
				}
			}
		}),delay);
	},
	hitMonster: function(e) {
		this.currentlyTalking = true;
		this.possibleSpells = [];
		this.damage = 0;
		if (this.missed == 1) {
			this.power = 0;
		}
		if (this.combatMode == 'attack') {
			this.damage = Math.round(((6/(/*this.difficulty*/2+4))*(this.combatLevel*1.5 + 5)*(this.power/75 + 1)));
			this.onceConnect(this.soundEffects[3], 'ended', this, 'readDamage');
			if (!this.mute) {
				this.soundEffects[3].play();
			}
		} else if (this.combatMode == 'dart') {
			this.damage = Math.round(((6/(/*this.difficulty*/2+4))*(this.magicLevel + 5)*(this.power/40 + 1)));
			//dart swoosh sound
			this.onceConnect(this.recordedSpells[1], 'ended', this, 'readDamage');
			if (!this.mute) {
				this.recordedSpells[1].play();
			}
		} else if (this.combatMode == 'beam') {
			this.damage = Math.round(((6/(/*this.difficulty*/2+4))*(this.magicLevel*1.5 + 40)*(this.power/40 + 1)));
			//dart swoosh sound
			this.onceConnect(this.recordedSpells[1], 'ended', this, 'readDamage');
			if (!this.mute) {
				this.recordedSpells[1].play();
			}
		} else if (this.combatMode == 'fire') {
			this.damage = Math.round(((6/(/*this.difficulty*/2+4))*(this.magicLevel*1.5)*(this.power/75 + 1)));
			//fireball blast sound
			if (this.power >= 40) {
				this.onFire = 4;
			}
			this.onceConnect(this.recordedSpells[5], 'ended', this, 'readDamage');
			if (!this.mute) {
				this.recordedSpells[5].play();
			}
		} else if (this.combatMode == 'cold') {
			this.damage = Math.round(((6/(/*this.difficulty*/2+4))*(this.magicLevel*1.5)*(this.power/75 + 1)));
			//cold blast sound
			if (this.power >= 40) {
				this.frozen = 2;
				if (this.onFire > 1) {
					//if you freeze a monster, it is no longer on fire
					this.onFire = 1;
				}
			}
			this.onceConnect(this.recordedSpells[7], 'ended', this, 'readDamage');
			if (!this.mute) {
				this.recordedSpells[7].play();
			}
		} else if (this.combatMode == 'heal') {
			this.damage = -1 * Math.round(this.maxHealth/4 + (this.combatLevel/4 + this.magicLevel/4 + 5)*(this.power/75 + 1));
			//heal sound
			this.onceConnect(this.recordedSpells[3], 'ended', this, 'readDamage');
			if (!this.mute) {
				this.recordedSpells[3].play();
			}
		} else {
			console.log('error in hitMonster.  No attack or spell selected');
			this.currentlyTalking = false;
		}
		if (this.damage >= 0) {
			this.monsterHealth -= this.damage;
		} else {
			//damage < 0, so a non-damage spell is used
			if (this.combatMode == 'heal') {
				this.currentHealth -= this.damage;
				if (this.currentHealth > this.maxHealth) {
					this.currentHealth = this.maxHealth;
				}
			}
		}
		if (this.onFire > 1) {
			this.onFire --;
			this.monsterHealth -= Math.round((this.monsterMaxHealth/8)*(this.onFire/3));
		}
		if (this.monsterHealth < 0) {
			this.monsterHealth = 0;
		}
		if (this.mute) {
			this.readDamage();
		}
	},
	readDamage: function(e) {
		if (this.damage > 0) {
			this.currentMessage = "Hit for " + this.damage + " damage";
		} else {
			if (this.combatMode = 'heal') {
				this.damage *= -1;
				this.currentMessage = "Healed for " + this.damage;
			}
		}
		if (this.frozen == 2) {
			this.currentMessage += "<br>The monster is frozen by cold blast";
		}
		if (this.onFire >= 1) {
			if (this.onFire == 3) {
				this.currentMessage += "<br>The monster catches on fire!";
			}
			if (this.frozen == 0) {
				this.currentMessage += "<br>Monster burned for " + Math.round(this.monsterMaxHealth/9*(this.onFire/3)) + " damage";
			}
			if (this.frozen > 0 && this.onFire != 1) {
				//if you set a monster on fire, it is no longer frozen
				this.frozen = 0;
				this.currentMessage += "<br>The monster is no longer frozen";
			}
			if (this.onFire == 1) {
				this.currentMessage += "<br>The monster is no longer on fire.";
				this.onFire = 0;
			}
		}
		this.drawCombat();
		this.currentlyTalking = true;
		this.disconnectAudio();
		this.readNumber(this.damage);
		this.audioQueue.push(this.recordedMessages[11]);
		if (this.monsterHealth > 0) {
			this.onceConnect(this.recordedMessages[11], 'ended', this, 'monsterTurn');
			if (this.mute) {
				this.monsterTurn();
			}
		} else {
			this.onceConnect(this.recordedMessages[11], 'ended', this, 'winBattle');
			if (this.mute) {
				this.winBattle();
			}
		}
		this.soundEnded();
	},
	monsterTurn: function(e) {
		this.currentlyTalking = true;
		this.stopTimer = true;
		if (this.area == 'tutorial') {
			if (this.tutorialPage == 0) {
				this.onceConnect(this.tutorialMessages[2], 'ended', this, 'tutorialDefendPrompt');
				this.currentAudio = this.tutorialMessages[2];
				if (this.mute) {
					this.tutorialMessages[2].volume = 0;
				}
				this.tutorialMessages[2].play();
				if (!this.mute) {
					this.currentMessage = "Good.  If you ever need the game to repeat a word, press space.<br>If you want the game to spell out a word letter by letter, press shift.<br>There is no penalty for doing this.<br>(Press shift at any time to skip talking and continue)";
				} else {
					this.currentMessage = "Good.  Now it is the monster's turn to attack you.<br>(Press shift to continue)";
				}
				this.drawCombat();
			} else if (this.tutorialPage == 2) {
				this.onceConnect(this.recordedMessages[12], 'ended', this, 'tutorialDefendPromptTwo');
				if (this.mute) {
					this.recordedMessages[12].volume = 0;
				}
				this.recordedMessages[12].play();
				this.currentMessage = "Monster's Turn.  Defend yourself!";
				this.drawCombat();
			} else if (this.tutorialPage == 4) {
				this.tutorialPage++;
				this.onceConnect(this.tutorialMessages[9], 'ended', this, 'tutorialDefendPrompt');
				this.currentAudio = this.tutorialMessages[9];
				if (this.mute) {
					this.tutorialMessages[9].volume = 0;
				}
				this.tutorialMessages[9].play();
				if (!this.mute) {
					this.currentMessage = "Casting spells uses up mana, but it can often be<br>more powerful than normal attacks.  If you<br>run out of mana you cannot cast any more spells."
				} else {
					this.currentMessage = "Casting spells uses up mana, but it can often be<br>more powerful than normal attacks.  If you<br>run out of mana you cannot cast any more spells.<br>(Press shift to continue)"
				}
				this.drawCombat();
			} else {
				this.onceConnect(this.recordedMessages[12], 'ended', this, 'defend');
				if (this.mute) {
					this.recordedMessages[12].volume = 0;
				}
				this.recordedMessages[12].play();
				this.currentMessage = "Monster's Turn.  Defend yourself!";
				this.drawCombat();
			}
		} else {
			this.onceConnect(this.recordedMessages[12], 'ended', this, 'defend');
			this.currentAudio = this.recordedMessages[12];
			if (this.mute) {
				this.recordedMessages[12].volume = 0;
			}
			this.recordedMessages[12].play();
			this.currentMessage = "Monster's Turn.  Defend yourself!";
			this.drawCombat();
		}
	},
	defend: function(e) {
		if (!this.repeating) {
			this.combatMode = 'defend';
			setTimeout(dojo.hitch(this,function(){
				if (!this.repeating) {
					this.onceConnect(this.recordedMessages[6], 'ended', this, 'sayWord');
					if (!this.mute) {
						this.recordedMessages[6].play();
					} else {
						this.sayWord();
					}
				} else {
					this.typeWord = true;
				}
			}),500);
		} else {
			this.combatMode = 'defend';
			this.typeWord = true;
		}
	},
	takeDamage: function(e) {
		this.damage = Math.round(((this.difficulty+4)/6)*this.monsterAttack*((100-this.power/1.4)/100));
		if (this.frozen >= 1) {
			if (this.frozen == 2) {
				this.damage = Math.ceil(this.damage*0.2);
			} else if (this.frozen == 1) {
				this.damage = Math.ceil(this.damage*0.5);
			}
		}
		this.currentMessage = "Lost " + this.damage + " health";
		if (this.frozen >= 1) {
			this.frozen --;
			if (this.frozen == 0) {
				this.currentMessage += "<br>The monster is no longer frozen";
			} else {
				this.currentMessage += "<br>The monster is still frozen";
			}
		}
		this.drawCombat();
		this.currentHealth -= this.damage;
		if (this.currentHealth <= 0) {
			this.currentHealth = 0;
			this.drawCombat();
			this.onceConnect(this.soundEffects[5], 'ended', this, 'loseBattle');
			if (this.mute) {
				this.soundEffects[5].volume = 0;
			}
			this.soundEffects[5].play();
		} else {
			this.disconnectAudio();
			this.audioQueue.push(this.recordedMessages[13]);
			this.readNumber(this.damage);
			this.audioQueue.push(this.recordedMessages[14]);
			if (this.area == 'tutorial') {
				if (this.tutorialPage == 1) {
					this.onceConnect(this.recordedMessages[14], 'ended', this, 'tutorialHealthPrompt');
					if (this.mute) {
						this.combatLoop();
					}
				} else if (this.tutorialPage == 3) {
					this.tutorialPage ++;
					this.onceConnect(this.recordedMessages[14], 'ended', this, 'tutorialMagicPrompt');
					if (this.mute) {
						this.combatLoop();
					}
				} else {
					this.onceConnect(this.recordedMessages[14], 'ended', this, 'combatLoop');
					if (this.mute) {
						this.combatLoop();
					}
				}
			} else {
				if (!this.mute) {
					if (this.currentHealth <= Math.round(((this.difficulty+4)/6)*this.monsterAttack) && this.currentHealth <= this.maxHealth/4) {
						this.onceConnect(this.recordedMessages[14], 'ended', this, 'lowHealthPrompt');
					} else {
						this.onceConnect(this.recordedMessages[14], 'ended', this, 'combatLoop');
					}
				} else {
					this.combatLoop();
				}
			}
			this.soundEnded();
			this.drawCombat();
		}
	},
	lowHealthPrompt: function(e) {
		//player is in danger of dying from the next monster attack
		this.currentlyTalking = true;
		this.recordedMessages[34].volume = 1;
		this.onceConnect(this.recordedMessages[34], 'ended', this, 'lowHealthEnd');
		this.currentMessage = "Your health is low!";
		this.drawCombat();
		this.currentAudio = this.recordedMessages[34];
		if (!this.mute) {
			this.recordedMessages[34].play();
		}
	},
	lowHealthEnd: function(e) {
		this.recordedMessages[34].setAttribute('src', 'sounds/combat/LowHealth' + this._ext);
		this.combatLoop();
	},
	winBattle: function(e) {
		if (this.area == 'tutorial') {
			this.repeating = false;
			this.area = 'town';
		}
		this.inCombat = false;
		this.justWonBattle = true;
		this.experience += this.monsterExperience;
		this.gold += this.monsterGold;
		this.music[0].volume = 0;
		this.currentMessage = "";
		this.saidWords = [];
		this.power = 100;
		this.onFire = 0;
		this.frozen = 0;
		this.onceConnect(this.soundEffects[4],'ended',this,'readExpGold');
		if (!this.mute) {
			this.soundEffects[4].play();
		} else {
			this.readExpGold();
		}
	},
	loseBattle:function(e) {
		this.inCombat = false;
		this.music[0].volume = 0;
		this.saidWords = [];
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
			this.tutorialPage = 0;
			if (this.difficulty > 1) {
				ctx.fillText("(Consider choosing a lower difficulty level)",10,90);
			}
			this.justLostBattle = true;
			this.recordedMessages[26].volume = 1;
			if (!this.mute) {
				this.recordedMessages[26].play();
			}
			//say, the tutorial monster defeated you.  Perhaps you should try a lower difficulty level.
		} else {
			var ctx = canvas.getContext("2d");
			ctx.lineWidth = 1;
			ctx.fillStyle = "#fff";
			ctx.fillRect(0,0,canvas.width,canvas.height);
			ctx.fillStyle = "#000";
			ctx.font = "20pt Bookman Old Style";
			ctx.fillText("Defeat",10,0);
			ctx.fillText("You were defeated!  Press space to return to town.",10,30);
			if (this.gold >= this.trainingGold) {
				ctx.fillText("Hint: You can visit the personal trainer in town by",10,60);
				ctx.fillText("pressing T if you want to become stronger.",10,90);
			}
			this.recordedMessages[42].volume = 1;
			if (!this.mute) {
				this.recordedMessages[42].play();
			}
			this.area = 'defeat';
			this.currentHealth = this.maxHealth;
			this.currentMana = this.maxMana;
			this.power = 100;
			this.onFire = 0;
			this.frozen = 0;
			if (this.monsterName.toLowerCase() == this.questMonster.toLowerCase()) {
				//give another chance to fight the quest monster
				this.previousMonsterName = "";
			} else {
				this.previousMonsterName = this.questMonster;
				//fight another nonquest monster if you have died on a nonquest monster
			}
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
		console.log(this.monsterName);
		this.disconnectAudio();
		this.audioQueue.push(this.recordedMessages[17]);
		this.readNumber(this.monsterExperience);
		this.audioQueue.push(this.recordedMessages[18]);
		this.audioQueue.push(this.recordedMessages[19]);
		this.readNumber(this.monsterGold);
		this.audioQueue.push(this.recordedMessages[20]);
		if (this.monsterName.toLowerCase() == this.questMonster.toLowerCase()) {
			this.questCount++;
			if (this.questLevel == 1) {
				ctx.fillText("You harvested a rabbit tail!",10,120);
			} else if (this.questLevel == 2) {
				ctx.fillText("You have slain the mighty Combine Harvester!",10,120);
				this.bossComplete = true;
			} else if (this.questLevel == 3) {
				//get 2 items
				this.questCount++;
				ctx.fillText("You gathered two goblin fingers!",10,120);
			} else if (this.questLevel == 4) {
				ctx.fillText("You have slain the mighty Cave In!",10,120);
				this.bossComplete = true;
			} else if (this.questLevel == 5) {
				ctx.fillText("You found a shark skin!",10,120);
			} else if (this.questLevel == 6) {
				ctx.fillText("You have sunk the mighty Battleship!",10,120);
				this.bossComplete = true;
			} else if (this.questLevel == 7) {
				ctx.fillText("You gained a brain!",10,120);
			} else if (this.questLevel == 8) {
				ctx.fillText("You have demolished the mighty Robotron 3000!",10,120);
				this.bossComplete = true;
			}
			var questItemSound = dojo.doc.createElement('audio');
			questItemSound.setAttribute('src', 'sounds/quests/quest' + (this.questLevel-1) + 'item' + this._ext);
			this.audioQueue.push(questItemSound);
			if (this.questCount >= this.questNeeded) {
				//complete quest
				ctx.fillText("Return to town to complete your quest.",10,150);
				this.audioQueue.push(this.recordedMessages[35]);
				ctx.fillText("Press space to continue.",10,180);
			} else {
				ctx.fillText("Press space to continue.",10,150);
			}
		} else {
			ctx.fillText("Press space to continue.",10,120);
		}
		this.audioQueue.push(this.recordedMessages[21]);
		this.soundEnded();
	},
	levelUp: function(inTown) {
		this.levelUpInTown = inTown;
		this.area = 'levelup';
		this.level++;
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "20pt Bookman Old Style";
		ctx.fillText("Level up!  You are now level " + this.level,10,30);
		ctx.fillText("Press up to increase your combat skill",10,60);
		ctx.fillText("Your combat skill level is: " + this.combatLevel,10,90);
		ctx.fillText("Press down to increase your magic skill",10,120);
		ctx.fillText("Your magic skill level is: " + this.magicLevel,10,150);
		ctx.fillText("Press space to increase your skill randomly",10,180);
		this.disconnectAudio();
		this.audioQueue.push(this.levelUpMessages[0]);
		this.readNumber(this.level);
		this.audioQueue.push(this.levelUpMessages[1]);
		this.readNumber(this.combatLevel);
		this.audioQueue.push(this.levelUpMessages[2]);
		this.readNumber(this.magicLevel);
		if (this.level == 1) {
			//first level up
			//change Monster's turn defend yourself to just Monster's turn to save time
			this.recordedMessages[12].setAttribute('src', 'sounds/combat/MonstersTurn' + this._ext);
			ctx.fillText("Combat skill affects maximum health, health regeneration,",10,210);
			ctx.fillText("and normal attack damage.",10,240);
			ctx.fillText("Magic skill affects maximum mana, mana regeneration,",10,270);
			ctx.fillText("spell damage, and spell effectiveness.",10,300);
			this.audioQueue.push(this.levelUpMessages[4]);
		}
		this.audioQueue.push(this.levelUpMessages[3]);
		this.soundEnded();
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
		ctx.fillText("Mana:",12,270);
		ctx.fillText("Power:",12,300);
		if (this.currentMessage != "") {
			var brSplit = this.currentMessage.split("<br>");
			if (brSplit.length == 1) {
				ctx.fillText(this.currentMessage,12,330);
			} else {
				var currentY = 330;
				for (i = 0; i < brSplit.length; i++) {
					ctx.fillText(brSplit[i],12,currentY);
					currentY += 30;
				}
			}
		} else {
			ctx.fillText("You are fighting a " + this.monsterName,12,330);
		}
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
		this.currentlyTalking = true;
		this.falseStart = false;
		if (!this.repeating) {
			this.typedLetters = [];
			this.missed = 0;
			this.drawCombat();
			if (this.currentWords.length == 1) {
				this.currentWords.push(this.currentWords[0]);
			}
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
			var infCount = 0;
			while (alreadySaid || infCount > 1000) {
				rand = Math.floor(Math.random()*this.currentWords.length);
				alreadySaid = false;
				for (i = 0; i < this.saidWords.length; i++) {
					if (this.saidWords[i] == rand) {
						alreadySaid = true;
						i = this.saidWords.length;
					}
				}
				infCount++;
			}
			if (this.area == 'tutorial') {
				if (this.tutorialPage < 5) {
					rand = this.tutorialPage;
				}
			}
			this.saidWords.push(rand);
			this.stopTimer = true;
			this.onceConnect(this.recordedWords[rand],'ended',this, 'playDing');
			this.onceConnect(this.recordedWords[rand],'error',this,'spellWord');
			this.recordedWords[rand].load();
			if (!this.mute) {
				this.recordedWords[rand].play();
			}
			this.currentWord = this.currentWords[rand];
			this.typeWord = true;
			this.resetIdleTimer = false;
			if (this.mute) {
				this.playDing();
			}
		} else {
			this.typeWord = true;
		}
	},
	repeatWord: function(e) {
		this.falseStart = false;
		this.recordedWords = [];
		this.stopTimer = true;
		this.recordedMessages[29].volume = 0;
		if (this.recordedMessages[29].currentTime < this.recordedMessages[29].duration) {
			this.recordedMessages[29].currentTime = this.recordedMessages[29].duration;
		}
		this.typingDelay = false;
		this.typeWord = true;
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
				if (!this.mute) {
					this.recordedWords[i].play();
				} else {
					this.playDing();
				}
				i = this.currentWords.length;
			}
		}
	},
	spellWord: function(e) {
		this.currentlyTalking = true;
		this.falseStart = false;
		if (!this.repeating) {
			this.stopTimer = true;
			this.recordedMessages[29].volume = 0;
			if (this.recordedMessages[29].currentTime < this.recordedMessages[29].duration) {
				this.recordedMessages[29].currentTime = this.recordedMessages[29].duration;
			}
			this.typingDelay = false;
			this.typedLetters = [];
			this.drawCombat();
			for (i = 0; i < this.currentWord.length; i++) {
				this.audioQueue.push(this.recordedLetters[this.currentWord.toUpperCase().charCodeAt(i) - 65]);
			}
			this.spelling = true;
			//this.onceConnect(this.recordedLetters[this.currentWord.toUpperCase().charCodeAt(this.currentWord.length - 1) - 65],'ended',this,'playDing');
			this.soundEnded();
		} else {
			this.typeWord = true;
		}
	},
	playDing: function(e) {
		if (/*!this.falseStart*/true) {
			this.startedTimer = false;
			this.stopTimer = true;
			this.readWord = true;
			this.currentlyTalking = false;
			this.timerCounter = 0;
			this.power = 100;
			delay = 50;
			if (this.mute) {
				this.currentMessage = "Your word is: " + this.currentWord.toUpperCase();
				this.drawCombat();
			}
			setTimeout(dojo.hitch(this,function(){
				this.currentlyTalking = false;
				if (!this.mute) {
					this.soundEffects[0].play();
				}
				this.startedTimer = true;
				this.stopTimer = false;
				this.startPowerTimer();
				this.typingDelay = true;
				setTimeout(dojo.hitch(this,function(){
					if (this.typingDelay && !this.currentlyTalking && !this.falseStart) {
						if (!this.mute) {
							this.recordedMessages[29].volume = 1;
							this.recordedMessages[29].play();
							this.currentMessage = "Press space to repeat the word or press shift to spell the word.<br>If you did not understand the word, press shift.";
							this.drawCombat();
						}
					}
				}),2000);
			}),delay);
		} else {
			this.falseStart = false;
		}
	},
	startPowerTimer: function(e) {
		var t = new dojox.timing.Timer();
		t.setInterval(14-this.difficulty);
		t.onTick = dojo.hitch(this,function() {
			if (this.stopTimer) {
				t.stop();
			} else {
				if (!this.currentlyTalking) {
					if (this.typedLetters.length == 0) {
						//this.power -= 0.05*2;
						//this.timerCounter += 100;
					} else {
						if (this.power > 90) {
							//this.power -= (0.15+0.025*this.difficulty)*2;
							this.power -= (0.1+0.075*this.difficulty)*2;
							this.timerCounter += 200;
						} else if (this.power > 75) {
							//this.power -= (0.125+0.025*this.difficulty)*2;
							this.power -= (0.12+0.075*this.difficulty)*2;
							this.timerCounter += 175;
						} else if (this.power > 50) {
							//this.power -= (0.1+0.025*this.difficulty)*2;
							this.power -= (0.05+0.075*this.difficulty)*2;
							this.timerCounter += 150;
						} else if (this.power > 25) {
							//this.power -= (0.075+0.025*this.difficulty)*2;
							this.power -= (0.025+0.075*this.difficulty)*2;
							this.timerCounter += 125;
						} else if (this.power > 10) {
							//this.power -= (0.05+0.025*this.difficulty)*2;
							this.power -= (0+0.075*this.difficulty)*2;
							//this.timerCounter += 100;
							this.timerCounter += 125;
						} else {
							//this.power -= (0+0.025*this.difficulty)*2;
							this.power -= (0.025+0.075*(this.difficulty-1))*2;
							//this.timerCounter += 50;
							this.timerCounter += 100;
						}
						if (this.difficulty == 4) {
							//make insane difficulty extra hard
							this.power -= 0.025*2;
						} else if (this.difficulty == 3) {
							this.power -= 0.025*2;
						} else if (this.difficulty <= 2) {
							//make easy and normal slightly easier
							//at the start of the game
							if (this.level < 5) {
								this.power += (0.015*this.difficulty)*2;
							} else if (this.level < 10) {
								this.power += (0.01*this.difficulty)*2;
							} else if (this.level < 15) {
								this.power += (0.005*this.difficulty)*2;
							}
						}
					}
					if (this.timerCounter >= 250) {
						this.timerCounter = 0;
						var ctx = canvas.getContext("2d");
						ctx.fillStyle = "rgb(255,255,255)";
						ctx.fillRect(90,290,HEALTHBAR_WIDTH+20,HEALTHBAR_HEIGHT+20);
						ctx.fillStyle = "rgb(0,255,0)";
						if (this.missed == 1) {
							this.power = 0;
						}
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
		if (this.questLevel == 0) {
			ctx.fillText("The town of Question",10,30);
		} else {
			ctx.fillText("You are in town.",10,30);
		}
		ctx.fillText("Press Q to look for quests.",10,60);
		ctx.fillText("Press O for more options.",10,120);
		//ctx.fillText("Press F to fight a difficult monster.",10,150);
		if (this.hintSelected == 0) {
			ctx.fillText("Hint: Press D while in town to change the difficulty level",10,180);
		} else if (this.hintSelected == 1) {
			ctx.fillText("Hint: Press M while in town to hear funny descriptions of",10,180);
			ctx.fillText("the monsters you have encountered",10,210);
		} else if (this.hintSelected == 2) {
			ctx.fillText("Hint: Press T while in town to visit the personal trainer",10,180);
			ctx.fillText("and spend gold to raise your skills",10,210);
		} else if (this.hintSelected == 3) {
			ctx.fillText("Hint: Press A while in town if you want to redistribute",10,180);
			ctx.fillText("your combat and magic skills",10,210);
		} else if (this.hintSelected == 4) {
			ctx.fillText("Hint: Press S while in town to hear detailed explanations",10,180);
			ctx.fillText("of each spell",10,210);
			this.hintSelected = -1;
		}
		this.hintSelected++;
		if (this.questLevel == 0) {
			//this.townMessages[0].volume = 1;
			//this.townMessages[0].play();
			this.disconnectAudio();
			this.audioQueue.push(this.townMessages[0]);
			this.soundEnded();
			this.townMessages[0] = this.townMessages[23];
		} else {
			ctx.fillText("Press space to leave town and go fight monsters.",10,90);
			//check to see if the current quest is completed
			if (this.acceptedQuest && this.questCount >= this.questNeeded) {
				this.acceptedQuest = false;
				this.area = 'completedquest';
				this.recordedMessages[36].volume = 0;
				this.disconnectAudio();
				this.audioQueue.push(this.recordedMessages[40]);
				ctx.fillStyle = "#fff";
				ctx.fillRect(0,0,canvas.width,canvas.height);
				ctx.fillStyle = "#000";
				ctx.font = "20pt Bookman Old Style";
				var questExp = 0;
				var questGold = 0;
				if (this.questLevel == 1) {
					ctx.fillText("Quest completed!",10,30);
					questExp = 50;
					questGold = 125;
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You hand the crone the rabbit tails and she immediately",10,60);
					ctx.fillText("eats them.  \"I feel luckier already!\" she exclaims, \"And",10,90);
					ctx.fillText("these are quite delicious.  Here is your reward.\"  She hands",10,120);
					ctx.fillText("you a pouch of gold coins.  \"As an additional reward, I will",10,150);
					ctx.fillText("teach you this spell I use whenever I get tooth decay.\"  You",10,180);
					ctx.fillText("have learned the spell heal!  Cast it by typing H E A L",10,210);
					ctx.fillText("You have gained " + questExp + " experience.",10,240);
					ctx.fillText("You have gained " + questGold + " gold.",10,270);
					this.knownSpells.push('HEAL');
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to continue",10,300);
					this.experience += questExp;
					this.gold += questGold;
				} else if (this.questLevel == 2) {
					ctx.fillText("Quest completed!",10,30);
					questExp = 75;
					questGold = 150;
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You triumphantly return to town after smashing the combine",10,60);
					ctx.fillText("harvester into thousands of pieces.  The farmer congratulates",10,90);
					ctx.fillText("you.  \"It turns out that the gas pedal was just stuck down on",10,120);
					ctx.fillText("that machine, but good job anyway.\"  He hands you a large pile",10,150);
					ctx.fillText("of gold coins.  \"To show my gratitude, I will also teach you",10,180);
					ctx.fillText("this handy spell that I use to get rid of weeds.\"  You have",10,210);
					ctx.fillText("learned the spell fireball!  Cast it by typing F I R E.",10,240);
					ctx.fillText("You have gained " + questExp + " experience.",10,270);
					ctx.fillText("You have gained " + questGold + " gold.",10,300);
					this.knownSpells.push('FIRE');
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to continue",10,330);
					this.experience += questExp;
					this.gold += questGold;
				} else if (this.questLevel == 3) {
					ctx.fillText("Quest completed!",10,30);
					questExp = 100;
					questGold = 180;
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You go back to the inn and show the innkeeper your hard-won",10,60);
					ctx.fillText("goblin fingers.  \"These are extremely high quality fingers,\"",10,90);
					ctx.fillText("he says, fingering them speculatively.  \"You deserve to be",10,120);
					ctx.fillText("richly rewarded.\"  He hands over a sack of gold coins.  \"I",10,150);
					ctx.fillText("will also teach you a spell I use to preserve meat since",10,180);
					ctx.fillText("refrigeration hasn't been invented in this game.\"  You have",10,210);
					ctx.fillText("learned the spell cold blast!  Cast it by typing C O L D.",10,240);
					ctx.fillText("You have gained " + questExp + " experience.",10,270);
					ctx.fillText("You have gained " + questGold + " gold.",10,300);
					this.knownSpells.push('COLD');
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to continue",10,330);
					this.experience += questExp;
					this.gold += questGold;
				} else if (this.questLevel == 4) {
					ctx.fillText("Quest completed!",10,30);
					questExp = 125;
					questGold = 300;
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You return to town with the bedraggled group of miners and",10,60);
					ctx.fillText("they proceed to have a wild party at the inn while telling",10,90);
					ctx.fillText("stories about how you warded off falling rocks and debris",10,120);
					ctx.fillText("in your valiant rescue.  Not only do they reward you with a",10,150);
					ctx.fillText("generous amount of gold coins, they also buy you a free meal",10,180);
					ctx.fillText("of questionable looking soup.",10,210);
					ctx.fillText("You have gained " + questExp + " experience.",10,240);
					ctx.fillText("You have gained " + questGold + " gold.",10,270);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to continue",10,300);
					this.experience += questExp;
					this.gold += questGold;
				} else if (this.questLevel == 5) {
					ctx.fillText("Quest completed!",10,30);
					questExp = 150;
					questGold = 450;
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You return to town and give the shark skins to the three",10,60);
					ctx.fillText("swimmers.  \"This is great!\" they say, \"We will never go",10,90);
					ctx.fillText("hungry again!\"  They pay you handsomely for the skins, and",10,120);
					ctx.fillText("you wonder why they can't just use all the gold they seem to",10,150);
					ctx.fillText("have to buy some food for themselves.  As you watch them",10,180);
					ctx.fillText("struggle clumsily into their newly created shark suits, you",10,210);
					ctx.fillText("conclude that it's just because they aren't very smart.",10,240);
					ctx.fillText("You have gained " + questExp + " experience.",10,270);
					ctx.fillText("You have gained " + questGold + " gold.",10,300);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to continue",10,330);
					this.experience += questExp;
					this.gold += questGold;
				} else if (this.questLevel == 6) {
					ctx.fillText("Quest completed!",10,30);
					questExp = 175;
					questGold = 1000;
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You return to town, soaking wet and half-drowed from",10,60);
					ctx.fillText("your arduous fight with the battleship.  You see the",10,90);
					ctx.fillText("mayor of the town waiting for you at the gates.  \"You",10,120);
					ctx.fillText("are a mighty hero indeed, for having saved the town",10,150);
					ctx.fillText("twice now!  First from the deadly combine harvester,",10,180);
					ctx.fillText("and now from that nefarious battleship.  You will",10,210);
					ctx.fillText("forever be a hero to Question.  We will even name a",10,240);
					ctx.fillText("holiday after you!\"  He gives you a shiny medal as",10,270);
					ctx.fillText("well as a large sum of gold from the town's coffers.",10,300);
					ctx.fillText("You have gained " + questExp + " experience.",10,330);
					ctx.fillText("You have gained " + questGold + " gold.",10,360);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to continue",10,390);
					this.experience += questExp;
					this.gold += questGold;
				} else if (this.questLevel == 7) {
					ctx.fillText("Quest completed!",10,30);
					questExp = 300;
					questGold = 1500;
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("You return through the time rip to present Question and",10,60);
					ctx.fillText("give the brains to the wizard.  \"Excellent,\" he says,",10,90);
					ctx.fillText("as he puts them in jars of pickling solution, \"Perhaps",10,120);
					ctx.fillText("these will help me save the future from such a terrible",10,150);
					ctx.fillText("fate.  The thought of all future humans wasting their",10,180);
					ctx.fillText("time trapped in some fictional virtual construction",10,210);
					ctx.fillText("just makes me shudder.\"  He performs some alchemy on",10,240);
					ctx.fillText("several large metal bars and gives you the resulting",10,270);
					ctx.fillText("gold.  \"I will also teach you a spell I use to vaporize",10,300);
					ctx.fillText("my enemies,\" he tells you.  You have learned the spell",10,330);
					ctx.fillText("magic beam.  Cast it by typing B E A M",10,360);
					ctx.fillText("You have gained " + questExp + " experience.",10,390);
					ctx.fillText("You have gained " + questGold + " gold.",10,420);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to continue",10,450);
					this.experience += questExp;
					this.gold += questGold;
				} else if (this.questLevel == 8) {
					ctx.fillText("Quest completed!",10,30);
					questExp = 500;
					questGold = 10000;
					ctx.font = "19pt Bookman Old Style";
					ctx.fillText("As you step back through the time rip to present Question,",10,60);
					ctx.fillText("you see your future self again, now fully visible.  \"Thank",10,90);
					ctx.fillText("you, past self, for saving me in the future.  Now that the",10,120);
					ctx.fillText("Robotron 3000 robot is destroyed, my death in the future has",10,150);
					ctx.fillText("been prevented and I can reward you.  In the future, this",10,180);
					ctx.fillText("large chest of gold that I am giving you is almost worthless",10,210);
					ctx.fillText("because of inflation, but in this time period, you can use it",10,240);
					ctx.fillText("to live like a King!\"  As you take the large chest that is",10,270);
					ctx.fillText("filled to the brim with gold, you see your future self start",10,300);
					ctx.fillText("to fade away again.  \"Oh no!\",your future self exclaims,",10,330);
					ctx.fillText("\"Giving you that huge chest full of money has caused your",10,360);
					ctx.fillText("timeline to change, meaning that I am obselete and I will no",10,390);
					ctx.fillText("longer exist!\"  Fortunately, the chest full of gold remains",10,420);
					ctx.fillText("intact even after your future self fades out of existence",10,450);
					ctx.fillText("You have gained " + questExp + " experience.",10,480);
					ctx.fillText("You have gained " + questGold + " gold.",10,510);
					ctx.font = "20pt Bookman Old Style";
					ctx.fillText("Press space to continue",10,540);
					this.experience += questExp;
					this.gold += questGold;
				}
				var questCompleteSound = dojo.doc.createElement('audio');
				questCompleteSound.setAttribute('src', 'sounds/quests/quest' + (this.questLevel-1) + 'complete' + this._ext);
				this.audioQueue.push(questCompleteSound);
				this.audioQueue.push(this.recordedMessages[17]);
				this.readNumber(questExp);
				this.audioQueue.push(this.recordedMessages[18]);
				this.audioQueue.push(this.recordedMessages[19]);
				this.readNumber(questGold);
				this.audioQueue.push(this.recordedMessages[20]);
				this.audioQueue.push(this.recordedMessages[21]);
				this.soundEnded();
			} else {
				//play an enter town message
				this.disconnectAudio();
				if (this.acceptedQuest) {
					this.audioQueue.push(this.townMessages[22]);
				} else {
					this.audioQueue.push(this.townMessages[21]);
				}
				this.audioQueue.push(this.recordedMessages[31]);
				this.soundEnded();
			}
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
		ctx.fillText("Press T to talk to the personal trainer.",10,60);
		ctx.fillText("Press space to fight a training dummy.",10,90);
		ctx.fillText("Press B to go back to town.",10,120);
	},
	showTrainer: function(e) {
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
		ctx.fillText("The personal trainer says that he will make you stronger",10,30);
		ctx.fillText("for a cost of " + this.trainingGold + " gold.",10,60);
		if (this.gold < this.trainingGold) {
			ctx.fillText("You can't afford that.",10,90);
			ctx.fillText("Press B to go back to town.",10,120);
		} else {
			ctx.fillText("You have " + this.gold + " gold.",10,90);
			ctx.fillText("Press space to pay the trainer.",10,120);
			ctx.fillText("Press B to go back to town.",10,150);
		}
		this.townMessages[1].volume = 0;
		this.townMessages[3].volume = 0;
		this.disconnectAudio();
		this.audioQueue.push(this.townMessages[2]);
		this.readNumber(this.trainingGold);
		this.audioQueue.push(this.recordedMessages[20]);
		if (this.gold < this.trainingGold) {
			this.audioQueue.push(this.recordedMessages[27]);
		} else {
			this.audioQueue.push(this.recordedMessages[41]);
			this.readNumber(this.gold);
			this.audioQueue.push(this.recordedMessages[20]);
			this.audioQueue.push(this.townMessages[24]);
		}
		this.audioQueue.push(this.townMessages[6]);
		this.soundEnded();		
	},
	trainCombat: function(e) {
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "20pt Bookman Old Style";
		this.area = 'difficulty';
		this.gold -= this.trainingGold;
		this.trainingGold += 100;
		this.minCombatLevel ++;
		this.combatLevel ++;
		ctx.fillText("The trainer takes your gold and helps you",10,30);
		ctx.fillText("raise your combat skill level to " + this.combatLevel,10,60);
		ctx.fillText("Press space to continue",10,90);
		this.disconnectAudio();
		this.audioQueue.push(this.townMessages[25]);
		this.readNumber(this.combatLevel);
		this.audioQueue.push(this.recordedMessages[21]);
		this.soundEnded();
	},
	showOptions: function(e) {
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
		ctx.fillText("Options",10,30);
		ctx.fillText("Press D to change the difficulty level.",10,60);
		ctx.fillText("Press S to look at your spells.",10,90);
		ctx.fillText("Press A to look at your attributes.",10,120);
		ctx.fillText("Press M to look at the monsters you have fought.",10,150);
		ctx.fillText("Press T to go to the training grounds.",10,180);
		ctx.fillText("Press B to go back to town.",10,210);
	},
	showSpells: function(e) {
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "20pt Bookman Old Style";
		ctx.fillText("Spells",10,30);
		ctx.fillText("Press left and right to select a spell you know",10,60);
		ctx.fillText("and press space to hear a description",10,90);
		this.audioQueue.push(this.townMessages[5]);
		this.audioQueue.push(this.spellNameSounds[this.spellSelected]);
		this.audioQueue.push(this.townMessages[6]);
		this.soundEnded();
		/*this.townMessages[5].volume = 1;
		this.onceConnect(this.townMessages[5], 'ended', this, 'saySpell');
		this.townMessages[5].play();*/
		var spellString = [];
		var spellStringCount = 0;
		for (var j = 1; j < this.knownSpells.length; j++) {
			//this.audioQueue.push(this.spellNameSounds[j]);
			if (j <= this.spellList.length) {
				if (spellStringCount % 3 == 0) {
					spellString[Math.floor(spellStringCount/3)] = "";
				}
				spellString[Math.floor(spellStringCount/3)] += this.spellList[j-1];
				if (j < this.knownSpells.length - 1) {
					spellString[Math.floor(spellStringCount/3)] += ", ";
				}
				spellStringCount++;
			}
		}
		var spellY = 150;
		for (var j = 0; j < spellString.length; j++) {
			ctx.fillText(spellString[j],10,spellY);
			spellY += 30;
		}
		ctx.fillText("Press B to go back to town",10,spellY+30);
	},
	saySpell: function(e) {
		if (this.area == "spells") {
			this.spellNameSounds[this.spellSelected].volume = 1;
			this.spellNameSounds[this.spellSelected].play();
		}
	},
	sayMonster: function(e) {
		if (this.area == "bestiary") {
			var monNameSound = dojo.doc.createElement('audio');
			monNameSound.setAttribute('src', 'sounds/monsters/' + this.bestiary[this.monsterSelected].split(' ').join('').toLowerCase() + 'name' + this._ext);
			monNameSound.play();
		}
	},
	showAttributes: function(e) {
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "20pt Bookman Old Style";
		ctx.fillText("Attributes",10,30);
		ctx.fillText("Your level is: " + this.level,10,60);
		ctx.fillText("Your experience is: " + this.experience + "/" + this.level*25,10,90);
		ctx.fillText("Your gold is: " + this.gold,10,120);
		ctx.fillText("Your combat skill level is: " + this.combatLevel,10,150);
		ctx.fillText("Your magic skill level is: " + this.magicLevel,10,180);
		ctx.fillText("Press R to redistribute points in combat and magic",10,210);
		ctx.fillText("Press B to go back to town",10,240);
		ctx.fillText("Combat Stats",10,300);
		ctx.fillText("Max Health: " + this.maxHealth,10,330);
		ctx.fillText("Health Regeneration: " + Math.round((this.combatLevel/5)*(0.8+this.level/5)),10,360);
		ctx.fillText("Normal Attack Damage: " + Math.round(this.combatLevel*1.5 + 5) + "-" + Math.round((this.combatLevel*1.5 + 5)*(100/75 + 1)),10,390);
		ctx.fillText("Magic Stats",10,420);
		ctx.fillText("Max Mana: " + this.maxMana,10,450);
		ctx.fillText("Mana Regeneration: " + Math.round((this.magicLevel/5)*(0.8+this.level/5)),10,480);
		ctx.fillText("Magic Dart Damage: " + Math.round(this.magicLevel + 5) + "-" + Math.round((this.magicLevel + 5)*(100/40 + 1)),10,510);
		if (this.knownSpells.length > 2) {
			ctx.fillText("Heal health gain: " + Math.round(this.maxHealth/4 + (this.combatLevel/4 + this.magicLevel/4 + 5)) + "-" + Math.round(this.maxHealth/4 + (this.combatLevel/4 + this.magicLevel/4 + 5)*(100/75 + 1)),10,540);
		}
		if (this.knownSpells.length > 3) {
			ctx.fillText("Fireball Damage: " + Math.round(this.magicLevel*1.5) + "-" + Math.round((this.magicLevel*1.5)*(100/75 + 1)) + " + ~20% monster max health",10,570);
		}
		if (this.knownSpells.length > 4) {
			ctx.fillText("Cold Blast Damage: " + Math.round(this.magicLevel*1.5) + "-" + Math.round((this.magicLevel*1.5)*(100/75 + 1)) + " + monster damage reduction",10,600);
		}
		if (this.knownSpells.length > 5) {
			ctx.fillText("Magic Beam Damage: " + Math.round(this.magicLevel*1.5 + 40) + "-" + Math.round((this.magicLevel*1.5 + 40)*(100/40 + 1)),10,630);
		}
		this.audioQueue.push(this.townMessages[13]);
		this.readNumber(this.combatLevel);
		this.audioQueue.push(this.townMessages[14]);
		this.readNumber(this.magicLevel);
		this.audioQueue.push(this.townMessages[15]);
		this.soundEnded();
	},
	resetAttributes: function(firstTime) {
		if (firstTime) {
			if (this.freePoints > 0) {
				//if there is an error and free points aren't spent, don't lose them
				this.combatLevel += this.freePoints;
			}
			this.freePoints = this.combatLevel+this.magicLevel-this.minCombatLevel-this.minMagicLevel;
			this.combatLevel = this.minCombatLevel;
			this.magicLevel = this.minMagicLevel;
			this.updateStats();
			this.disconnectAudio();
			this.audioQueue.push(this.townMessages[17]);
			this.readNumber(this.freePoints);
			this.audioQueue.push(this.townMessages[18]);
			this.readNumber(this.combatLevel);
			this.audioQueue.push(this.townMessages[14]);
			this.readNumber(this.magicLevel);
			if (this.freePoints == 0) {
				//you have no points availble
				this.audioQueue.push(this.townMessages[16]);
			} else {
				//press space to randomly distribute
				this.audioQueue.push(this.townMessages[19]);
			}
			this.soundEnded();
		}
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "20pt Bookman Old Style";
		ctx.fillText("Reset Attributes",10,30);
		ctx.fillText("Press up to increase your combat skill level",10,60);
		ctx.fillText("and down to increase your magic skill level",10,90);
		if (this.freePoints != 1) {
			ctx.fillText("You have " + this.freePoints + " points to assign",10,120);
		} else {
			ctx.fillText("You have " + this.freePoints + " point to assign",10,120);
		}
		ctx.fillText("Your combat skill level is: " + this.combatLevel,10,150);
		ctx.fillText("Your magic skill level is: " + this.magicLevel,10,180);
		ctx.fillText("Press space to randomly distribute the remaining",10,210);
		ctx.fillText("points and to go back to town",10,240);
		ctx.fillText("Combat Stats",10,300);
		ctx.fillText("Max Health: " + this.maxHealth,10,330);
		ctx.fillText("Health Regeneration: " + Math.round((this.combatLevel/5)*(0.8+this.level/5)),10,360);
		ctx.fillText("Normal Attack Damage: " + Math.round(this.combatLevel*1.5 + 5) + "-" + Math.round((this.combatLevel*1.5 + 5)*(100/75 + 1)),10,390);
		ctx.fillText("Magic Stats",10,420);
		ctx.fillText("Max Mana: " + this.maxMana,10,450);
		ctx.fillText("Mana Regeneration: " + Math.round((this.magicLevel/5)*(0.8+this.level/5)),10,480);
		ctx.fillText("Magic Dart Damage: " + Math.round(this.magicLevel + 5) + "-" + Math.round((this.magicLevel + 5)*(100/40 + 1)),10,510);
		if (this.knownSpells.length > 2) {
			ctx.fillText("Heal health gain: " + Math.round(this.maxHealth/4 + (this.combatLevel/4 + this.magicLevel/4 + 5)) + "-" + Math.round(this.maxHealth/4 + (this.combatLevel/4 + this.magicLevel/4 + 5)*(100/75 + 1)),10,540);
		}
		if (this.knownSpells.length > 3) {
			ctx.fillText("Fireball Damage: " + Math.round(this.magicLevel*1.5) + "-" + Math.round((this.magicLevel*1.5)*(100/75 + 1)) + " + ~20% monster max health",10,570);
		}
		if (this.knownSpells.length > 4) {
			ctx.fillText("Cold Blast Damage: " + Math.round(this.magicLevel*1.5) + "-" + Math.round((this.magicLevel*1.5)*(100/75 + 1)) + " + monster damage reduction",10,600);
		}
		if (this.knownSpells.length > 5) {
			ctx.fillText("Magic Beam Damage: " + Math.round(this.magicLevel*1.5 + 40) + "-" + Math.round((this.magicLevel*1.5 + 40)*(100/40 + 1)),10,630);
		}
	},
	showBestiary: function(e) {
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "20pt Bookman Old Style";
		if (this.bestiary.length == 0) {
			ctx.fillText("You haven't fought any monsters!",10,30);
			ctx.fillText("Press B to go back to town.",10,60);
		} else {
			ctx.fillText("Monster Encylopedia",10,30);
			ctx.fillText("Press left and right to select a monster",10,60);
			ctx.fillText("and press space to hear a description",10,90);
			this.audioQueue.push(this.townMessages[7]);
			var monNameSound = dojo.doc.createElement('audio');
			monNameSound.setAttribute('src', 'sounds/monsters/' + this.bestiary[this.monsterSelected].split(' ').join('').toLowerCase() + 'name' + this._ext);
			this.audioQueue.push(monNameSound);
			this.audioQueue.push(this.townMessages[6]);
			this.soundEnded();
			var monsterString = [];
			var monsterStringCount = 0;
			for (var m = 0; m < this.bestiary.length; m++) {
				if (this.bestiary[m] == 'Genetically Engineered Human') {
					this.monsterStringCount++;
				}
				if (monsterStringCount % 4 == 0) {
					monsterString[Math.floor(monsterStringCount/4)] = "";
				}
				monsterString[Math.floor(monsterStringCount/4)] += this.bestiary[m];
				if (m < this.bestiary.length - 1) {
					monsterString[Math.floor(monsterStringCount/4)] += ", ";
				}
				monsterStringCount++;
			}
			var monY = 150;
			ctx.font = "19pt Bookman Old Style";
			for (var m = 0; m < monsterString.length; m++) {
				ctx.fillText(monsterString[m],10,monY);
				monY += 30;
			}
			ctx.font = "20pt Bookman Old Style";
			ctx.fillText("Press B to go back to town",10,monY+30);
		}
	},
	changeDifficulty: function(sayAll) {
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
		if (sayAll) {
			this.audioQueue.push(this.townMessages[8]);
			if (this.difficulty == 2.5) {
				this.audioQueue.push(this.townMessages[20]);
			} else {
				this.audioQueue.push(this.townMessages[8+this.difficulty]);
			}
			this.audioQueue.push(this.townMessages[6]);
			this.soundEnded();
		} else {
			if (!this.mute) {
				if (this.difficulty == 2.5) {
					this.townMessages[20].play();
				} else {
					this.townMessages[8+this.difficulty].play();
				}
			}
		}
		ctx.fillText("Press up and down to change the difficulty.",10,30);
		if (this.difficulty == 1) {
			ctx.fillText("Your current difficulty is: easy",10,60);
		} else if (this.difficulty == 2) {
			ctx.fillText("Your current difficulty is: normal",10,60);
		} else if (this.difficulty == 2.5) {
			ctx.fillText("Your current difficulty is: difficult",10,60);
		} else if (this.difficulty == 3) {
			ctx.fillText("Your current difficulty is: intense",10,60);
		} else if (this.difficulty == 4) {
			ctx.fillText("Your current difficulty is: insane",10,60);
		} else {
			ctx.fillText("Your current difficulty is: " + this.difficulty,10,60);
		}
		ctx.fillText("Press B to go back to town.",10,90);
	},
	updateStats: function(e) {
		var mult = 1.8 + (this.level/5);
		this.maxHealth = 80 + Math.round(mult*this.combatLevel);
		this.currentHealth = this.maxHealth;
		this.maxMana = 80 + Math.round(mult*this.magicLevel);
		this.currentMana = this.maxMana;
	},
	leaveTown: function(e) {
		this.area = 'outside';
		this.currentArea = this.knownAreas[this.areaSelected];
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
		this.recordedMessages[31].volume = 0;
		if (this.acceptedQuest && this.questCount >= this.questNeeded) {
			ctx.fillText("You can now complete your quest.",10,60);
			ctx.fillText("Press B to go back to town.",10,90);
			ctx.fillText("Or press space to fight more monsters.",10,120);
			this.recordedMessages[36].volume = 1;
			if (!this.mute) {
				this.recordedMessages[36].play();
			}
		} else {
			var ctx = canvas.getContext("2d");
			ctx.lineWidth = 1;
			ctx.fillStyle = "#fff";
			ctx.fillRect(0,0,canvas.width,canvas.height);
			ctx.fillStyle = "#000";
			ctx.font = "20pt Bookman Old Style";
			ctx.fillText("Outside of Town",10,30);
			if (this.areaSelected == 0) {
				ctx.fillText("Press space to go to the Wheat Fields.",10,60);
			} else if (this.areaSelected == 1) {
				ctx.fillText("Press space to go to the Creepy Caves.",10,60);
			} else if (this.areaSelected == 2) {
				ctx.fillText("Press space to go to the Endless Ocean.",10,60);
			} else if (this.areaSelected == 3) {
				ctx.fillText("Press space to go to Future Question.",10,60);
			} else {
				ctx.fillText("Press space to fight a monster.",10,60);
			}
			if (this.knownAreas.length > 1) {
				ctx.fillText("Press left or right to go to a different area.",10,90);
				ctx.fillText("Press B to go back to town.",10,120);
			} else {
				ctx.fillText("Press B to go back to town.",10,90);
			}
			this.onceConnect(this.recordedMessages[32],'ended',this,'chooseArea');
			this.recordedMessages[32].volume = 1;
			if (!this.mute) {
				this.recordedMessages[32].play();
			}
		}
	},
	chooseArea: function(e) {
		if (!this.inCombat && this.area == 'outside') {
			this.currentArea = this.knownAreas[this.areaSelected];
			var ctx = canvas.getContext("2d");
			ctx.lineWidth = 1;
			ctx.fillStyle = "#fff";
			ctx.fillRect(0,0,canvas.width,canvas.height);
			ctx.fillStyle = "#000";
			ctx.font = "20pt Bookman Old Style";
			ctx.fillText("Outside of Town",10,30);
			if (this.areaSelected == 0) {
				ctx.fillText("Press space to go to the Wheat Fields.",10,60);
			} else if (this.areaSelected == 1) {
				ctx.fillText("Press space to go to the Creepy Caves.",10,60);
			} else if (this.areaSelected == 2) {
				ctx.fillText("Press space to go to the Endless Ocean.",10,60);
			} else if (this.areaSelected == 3) {
				ctx.fillText("Press space to go to Future Question.",10,60);
			} else {
				ctx.fillText("Press space to fight a monster.",10,60);
			}
			this.disconnectAudio();
			this.audioQueue.push(this.areaMessages[this.areaSelected]);
			if (this.knownAreas.length > 1) {
				ctx.fillText("Press left or right to go to a different area.",10,90);
				ctx.fillText("Press B to go back to town.",10,120);
				this.audioQueue.push(this.recordedMessages[43]);
			} else {
				ctx.fillText("Press B to go back to town.",10,90);
			}
			this.audioQueue.push(this.townMessages[6]);
			this.soundEnded();
		}
	},
	readHealthAndMana: function() {
		this.disconnectAudio();
		this.audioQueue.push(this.recordedMessages[8]);
		this.readNumber(Math.ceil(this.currentHealth));
		this.audioQueue.push(this.recordedMessages[10]);
		this.readNumber(this.maxHealth);
		this.audioQueue.push(this.recordedMessages[9]);
		this.readNumber(Math.ceil(this.currentMana));
		this.audioQueue.push(this.recordedMessages[10]);
		this.readNumber(this.maxMana);
		this.soundEnded();
		this.currentMessage = "Your health is: " + this.currentHealth + "/" + this.maxHealth;
		this.currentMessage += "<br>Your mana is: " + this.currentMana + "/" + this.maxMana;
		this.drawCombat();
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
		this.area = 'intro';
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
		ctx.fillText("New Intense Game",50,210);
		ctx.fillText("New Insane Game",50,240);
		ctx.fillText("Load Game",50,270);
		ctx.font = "12pt Bookman Old Style";
		ctx.fillText("Scroll through the choices with up and down and press the space bar to play.",10,300);
		if (!this.mute) {
			ctx.fillText("Press M to mute the game.",10,320);
		} else {
			ctx.fillText("Game Muted",10,320);
			ctx.fillText("Press M to unmute the game.",10,340);
		}
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
		//this.monsterMessages = [];
		
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
		//(4) Say "New Intense Game"
		var load = dojo.doc.createElement('audio');
		load.setAttribute('src', 'sounds/intro/NewIntenseGame' + this._ext);
		this.recordedMessages.push(load);
		//(5) Say "New Insane Game"
		var insane = dojo.doc.createElement('audio');
		insane.setAttribute('src', 'sounds/intro/NewInsaneGame' + this._ext);
		this.recordedMessages.push(insane);
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
		mturn.setAttribute('src', 'sounds/combat/MonstersTurnDefend' + this._ext);
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
		// (29) Say "Press space to repeat the word or press shift to spell the word"
		var press = dojo.doc.createElement('audio');
		press.setAttribute('src', 'sounds/combat/PressSpaceToRepeat' + this._ext);
		this.recordedMessages.push(press);
		// (30) Say "There are no available quests"
		var noquests = dojo.doc.createElement('audio');
		noquests.setAttribute('src', 'sounds/quests/NoAvailableQuests' + this._ext);
		this.recordedMessages.push(noquests);
		// (31) Say "Press space to leave town and go fight monsters"
		var leavetown = dojo.doc.createElement('audio');
		leavetown.setAttribute('src', 'sounds/general/PressSpaceToLeaveTown' + this._ext);
		this.recordedMessages.push(leavetown);
		// (32) Say "You are outside of town
		var outside = dojo.doc.createElement('audio');
		outside.setAttribute('src', 'sounds/areas/OutsideOfTown' + this._ext);
		this.recordedMessages.push(outside);
		// (33) Say "Try again"
		var tryagain = dojo.doc.createElement('audio');
		tryagain.setAttribute('src', 'sounds/combat/TryAgain' + this._ext);
		this.recordedMessages.push(tryagain);
		// (34) Say "Your health is low.  Press the left arrow to see how much health you have"
		var lowhealth = dojo.doc.createElement('audio');
		lowhealth.setAttribute('src', 'sounds/combat/LowHealthLeft' + this._ext);
		this.recordedMessages.push(lowhealth);
		// (35) Say "Return to town to complete your quest"
		var returnToTown = dojo.doc.createElement('audio');
		returnToTown.setAttribute('src', 'sounds/quests/ReturnToTown' + this._ext);
		this.recordedMessages.push(returnToTown);
		// (36) Say "You can now complete your quest.  Press B to return to town."
		var returnToTown = dojo.doc.createElement('audio');
		returnToTown.setAttribute('src', 'sounds/quests/CanCompleteQuest' + this._ext);
		this.recordedMessages.push(returnToTown);
		// (37) Say "Load Game"
		var load = dojo.doc.createElement('audio');
		load.setAttribute('src', 'sounds/intro/LoadGame' + this._ext);
		this.recordedMessages.push(load);
		// (38) Say "Don't start typing until you hear the *ding*
		var dont = dojo.doc.createElement('audio');
		dont.setAttribute('src', 'sounds/combat/DontStartTyping' + this._ext);
		this.recordedMessages.push(dont);
		// (39) Say "Quest Found"
		var qf = dojo.doc.createElement('audio');
		qf.setAttribute('src', 'sounds/quests/QuestFound' + this._ext);
		this.recordedMessages.push(qf);
		// (40) Say "Quest Completed"
		var qc = dojo.doc.createElement('audio');
		qc.setAttribute('src', 'sounds/quests/QuestCompleted' + this._ext);
		this.recordedMessages.push(qc);
		// (41) Say "You have"
		var youhave = dojo.doc.createElement('audio');
		youhave.setAttribute('src', 'sounds/general/YouHave' + this._ext);
		this.recordedMessages.push(youhave);
		// (42) Say "You were defeated.  Press space to return to town."
		var youwere = dojo.doc.createElement('audio');
		youwere.setAttribute('src', 'sounds/combat/YouWereDefeated' + this._ext);
		this.recordedMessages.push(youwere);
		// (43) Say "Press left or right to go to a different area."
		var pressl = dojo.doc.createElement('audio');
		pressl.setAttribute('src', 'sounds/areas/PressLeftOrRight' + this._ext);
		this.recordedMessages.push(pressl);
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
		//(1) You are fighting a Training Dummy
		/*for (var i = 0; i <= 1; i++) {
			var monsteri = dojo.doc.createElement('audio');
			monsteri.setAttribute('src', 'sounds/monsters/monster' + i + this._ext);
			this.monsterMessages.push(monsteri);
		}*/
		
		//Quest messages
		//(0) rabbit tails
		//(1) combine harvester
		//(2) goblin fingers
		//(3) cave in
		//(4) shark skins
		//(5) battleship
		//(6) brains
		//(7) robotron 3000
		for (var i = 0; i <= this.numQuests-1; i++) {
			var questi = dojo.doc.createElement('audio');
			questi.setAttribute('src', 'sounds/quests/quest' + i + this._ext);
			this.questMessages.push(questi);
		}
		
		//Area messages
		//(0) Wheat Fields
		//(1) Creepy Cave
		//(2) Endless Ocean
		//(3) Future Question
		for (var i = 0; i <= 3; i++) {
			var areai = dojo.doc.createElement('audio');
			areai.setAttribute('src', 'sounds/areas/area' + i + this._ext);
			this.areaMessages.push(areai);
		}
		
		//Spells
		//(0) Magic dart
		//(1) Heal
		//(2) Fireball
		//(3) Cold blast
		//(4) Spring of Life
		//(5) Magic beam
		for (var i = 0; i <= this.totalSpells-1; i++) {
			var spelli = dojo.doc.createElement('audio');
			spelli.setAttribute('src', 'sounds/spells/spell' + i + this._ext);
			this.spellNameSounds.push(spelli);
		}
		this.spellList.push("Magic Dart (D A R T)");
		this.spellList.push("Heal (H E A L)");
		this.spellList.push("Fireball (F I R E)");
		this.spellList.push("Cold Blast (C O L D)");
		this.spellList.push("Spring of Life (L I F E)");
		this.spellList.push("Magic Beam (B E A M)");
		var dart = dojo.doc.createElement('audio');
		//Spell sounds
		//(0) Casting magic dart
		//(1) Magic dart sound effect
		//(2) Casting heal
		//(2) Heal sound effect
		//(3) Casting fireball
		//(3) Fireball sound effect
		//(4) Casting cold blast
		//(4) Cold blast sound effect
		dart.setAttribute('src','sounds/spells/dart' + this._ext);
		this.recordedSpells.push(dart);
		var darte = dojo.doc.createElement('audio');
		darte.setAttribute('src','sounds/spells/darteffect' + this._ext);
		this.recordedSpells.push(darte);
		var heal = dojo.doc.createElement('audio');
		heal.setAttribute('src','sounds/spells/heal' + this._ext);
		this.recordedSpells.push(heal);
		var heale = dojo.doc.createElement('audio');
		heale.setAttribute('src','sounds/spells/healeffect' + this._ext);
		this.recordedSpells.push(heale);
		var fire = dojo.doc.createElement('audio');
		fire.setAttribute('src','sounds/spells/fire' + this._ext);
		//fire will burn the enemy, doing damage over time
		//if power > 40
		this.recordedSpells.push(fire);
		var firee = dojo.doc.createElement('audio');
		firee.setAttribute('src','sounds/spells/fireeffect' + this._ext);
		this.recordedSpells.push(firee);
		//cold will reduce the enemy's next attack by 75%
		//but will also end burning (if power > 40)
		var cold = dojo.doc.createElement('audio');
		cold.setAttribute('src','sounds/spells/cold' + this._ext);
		this.recordedSpells.push(cold);
		var colde = dojo.doc.createElement('audio');
		colde.setAttribute('src','sounds/spells/coldeffect' + this._ext);
		this.recordedSpells.push(colde);
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
		for (var i = 0; i <= 9; i++) {
			var tutoriali = dojo.doc.createElement('audio');
			tutoriali.setAttribute('src', 'sounds/intro/tutorial' + i + this._ext);
			this.tutorialMessages.push(tutoriali);
		}
		//Town messages
		//(0) You enter the town of question in search of fame and fortune
		//(1) Training ground
		//(2) Talk to trainer
		//(3) Just beat training dummy
		//(4) Options
		//(5) Spells
		//(6) Press B to go back to town
		//(7) Bestiary
		//(8) Press up and down to change the difficulty
		//(9) Easy
		//(10) Normal
		//(11) Intense
		//(12) Insane
		//(13) Atttributes
		//(14) Your magic skill level is
		//(15) Press R to reset attributes
		//(16) No more skill points
		//(17) Reset Attributes
		//(18) Points to assign
		//(19) Press space to randomly distribute
		//(20) Difficult
		//(21) You are in town.  Press Q
		//(22) You are in town.  Press O
		//(23) Press Q for available quests
		//(24) Press space to pay the trainer
		//(25) The trainer takes your gold
		for (var i = 0; i <= 25; i++) {
			var towni = dojo.doc.createElement('audio');
			towni.setAttribute('src', 'sounds/intro/town' + i + this._ext);
			this.townMessages.push(towni);
		}
		//Level up messages
		//(0) Level up
		//(1) Press up to increase your combat skill level
		//(2) Press down to increase your magic skill level
		//(3) Press space to increase your skill randomly
		//(4) Combat/magic skill info
		for (var i = 0; i <= 4; i++) {
			var levelupi = dojo.doc.createElement('audio');
			levelupi.setAttribute('src', 'sounds/general/levelup' + i + this._ext);
			this.levelUpMessages.push(levelupi);
		}
		//Hints
		for (var i = 0; i <= 5; i++) {
			var hinti = dojo.doc.createElement('audio');
			hinti.setAttribute('src', 'sounds/intro/hint' + i + this._ext);
			this.hintMessages.push(hinti);
		}
		//Say Monster Quest
		this.recordedMessages[0].play();
		this.drawIntroPage();
	},
});