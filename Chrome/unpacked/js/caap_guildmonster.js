/////////////////////////////////////////////////////////////////////
//                          GUILD MONSTERS
/////////////////////////////////////////////////////////////////////

/* This section is formatted to allow Advanced Optimisation by the Closure Compiler */
/*jslint sub: true */
/*-------------------------------------------------------------------------------------\
GuildMonsterReview is a primary action subroutine to mange the guild monster on the dashboard
\-------------------------------------------------------------------------------------*/
caap.guildMonsterReview = function() {
	try {
		/*-------------------------------------------------------------------------------------\
		 We do guild monster review once an hour.  Some routines may reset this timer to drive
		 GuildMonsterReview immediately.
		 \-------------------------------------------------------------------------------------*/
		if(!schedule.check("guildMonsterReview") || config.getItem('WhenGuildMonster', 'Never') === 'Never') {
			return false;
		}

		if(!caap.stats['guild']['id']) {
			con.log(2, "Going to guild to get Guild Id");
			if(caap.navigateTo('guild')) {
				return true;
			}
		}

		var record = {}, url = '', objective = '';

		if(state.getItem('guildMonsterBattlesRefresh', true)) {
			if(guild_monster.navigate_to_battles_refresh()) {
				return true;
			}
		}

		if(!state.getItem('guildMonsterBattlesReview', false)) {
			if(guild_monster.navigate_to_battles()) {
				return true;
			}

			state.setItem('guildMonsterBattlesReview', true);
		}
		record = guild_monster.getReview();
		if(record && $j.isPlainObject(record) && !$j.isEmptyObject(record)) {
			con.log(1, "Reviewing Slot (" + record['slot'] + ") Name: " + record['name']);
			if(caap.stats['staminaT']['num'] > 0 && config.getItem("doGuildMonsterSiege", true)) {
				objective = "&action=doObjective";
			}
			url = "guild_battle_monster.php?twt2=" + guild_monster.info[record['name']].twt2 + "&guild_id=" + record['guildId'] + objective + "&slot=" + record['slot'] + "&ref=nf";
			state.setItem('guildMonsterReviewSlot', record['slot']);
			caap.clickAjaxLinkSend(url);
			return true;
		}

		schedule.setItem("guildMonsterReview", ( gm ? gm.getItem('guildMonsterReviewMins', 60, hiddenVar) : 60) * 60, 300);
		state.setItem('guildMonsterBattlesRefresh', true);
		state.setItem('guildMonsterBattlesReview', false);
		state.setItem('guildMonsterReviewSlot', 0);
		guild_monster.select(true);
		con.log(1, 'Done with guild monster review.');
		return false;
	} catch (err) {
		con.error("ERROR in guildMonsterReview: " + err);
		return false;
	}
};
/*jslint sub: false */

caap.checkResults_guild_current_monster_battles = function() {
	try {
		$j("input[src*='guild_battle_']", caap.globalContainer).unbind('click', caap.guildMonsterEngageListener).bind('click', caap.guildMonsterEngageListener);
		guild_monster.populate();

		return true;
	} catch (err) {
		con.error("ERROR in checkResults_guild_current_monster_battles: " + err);
		return false;
	}
};
caap.checkResults_guild_monster_summon_list = function() {
	try {
		if(config.getItem("enableSpider", true)) {
			guild_monster.enableSpider();
		}

		return true;
	} catch (err) {
		con.error("ERROR in checkResults_guild_current_monster_battles: " + err);
		return false;
	}
};
caap.checkResults_guild_battle_monster = function() {
	try {
		$j("input[src*='guild_duel_button']", caap.globalContainer).unbind('click', caap.guildMonsterEngageListener).bind('click', caap.guildMonsterEngageListener);
		guild_monster.onMonster();
		if(config.getItem("enableTitles", true)) {
			spreadsheet.doTitles();
		}

		return true;
	} catch (err) {
		con.error("ERROR in checkResults_guild_battle_monster: " + err);
		return false;
	}
};
/* This section is formatted to allow Advanced Optimisation by the Closure Compiler */
/*jslint sub: true */
caap.guildMonster = function() {
	try {
		var when = '', record = {}, minion = {}, form = $j(), key = $j(), url = '', attack = 0, stamina = 0, WhenBattle = '';
		when = config.getItem("WhenGuildMonster", 'Never');
		if(when === 'Never') {
			return false;
		}

		if(!caap.stats['guild']['id']) {
			con.log(2, "Going to guild to get Guild Id");
			if(caap.navigateTo('guild')) {
				return true;
			}
		}

		/*
		 if (!caap.stats['guild']['id']) {
		 con.log(2, "Going to keep to get Guild Id");
		 if (caap.navigateTo('keep')) {
		 return true;
		 }
		 }
		 */

		function doClassicFirst() {
			if(config.getItem('doClassicMonstersFirst', false) && config.getItem("WhenMonster", 'Never') !== 'Never') {
				if(state.getItem('targetFrombattle_monster', '') || state.getItem('targetFromraid', '')) {
					return true;
				}
				WhenBattle = config.getItem("WhenBattle", 'Never');
				if((WhenBattle === 'No Monster' || WhenBattle === 'Demi Points Only') && config.getItem("DemiPointsFirst", false) && !battle.selectedDemisDone()) {
					return true;
				}
			}

			return false;
		}

		if(caap.inLevelUpMode()) {
			if(caap.stats['staminaT']['num'] < 5) {
				caap.setDivContent('guild_monster_mess', 'Guild Monster stamina ' + caap.stats['staminaT']['num'] + '/' + 5);
				return false;
			}

			if(doClassicFirst()) {
				return false;
			}
		} else if(when === 'Stamina Available') {
			stamina = state.getItem('staminaGuildMonster', 0);
			if(caap.stats['staminaT']['num'] < stamina) {
				caap.setDivContent('guild_monster_mess', 'Guild Monster stamina ' + caap.stats['staminaT']['num'] + '/' + stamina);
				return false;
			}

			state.setItem('staminaGuildMonster', 0);
			record = state.getItem('targetGuildMonster', {});
			if(record && $j.isPlainObject(record) && !$j.isEmptyObject(record)) {
				minion = guild_monster.getTargetMinion(record);
				if(minion && $j.isPlainObject(minion) && !$j.isEmptyObject(minion)) {
					stamina = guild_monster.getStaminaValue(record, minion);
					state.setItem('staminaGuildMonster', stamina);
					if(caap.stats['staminaT']['num'] < stamina) {
						caap.setDivContent('guild_monster_mess', 'Guild Monster stamina ' + caap.stats['staminaT']['num'] + '/' + stamina);
						return false;
					}
				} else {
					return false;
				}
			} else {
				return false;
			}

			if(doClassicFirst()) {
				return false;
			}
		} else if(when === 'At X Stamina') {
			if(caap.stats['staminaT']['num'] >= config.getItem("MaxStaminaToGMonster", 20)) {
				state.setItem('guildMonsterBattlesBurn', true);
			}

			if(caap.stats['staminaT']['num'] <= config.getItem("MinStaminaToGMonster", 0) || caap.stats['staminaT']['num'] < 1) {
				state.setItem('guildMonsterBattlesBurn', false);
			}

			if(!state.getItem('guildMonsterBattlesBurn', false)) {
				caap.setDivContent('guild_monster_mess', 'Guild Monster stamina ' + caap.stats['staminaT']['num'] + '/' + config.getItem("MaxStaminaToGMonster", 20));
				return false;
			}

			if(doClassicFirst()) {
				return false;
			}
		} else if(when === 'At Max Stamina') {
			if(caap.stats['staminaT']['num'] < caap.stats['stamina']['max'] || caap.stats['staminaT']['num'] < 1) {
				caap.setDivContent('guild_monster_mess', 'Guild Monster stamina ' + caap.stats['staminaT']['num'] + '/' + caap.stats['stamina']['max']);
				return false;
			}

			if(doClassicFirst()) {
				return false;
			}
		}

		caap.setDivContent('guild_monster_mess', '');
		record = guild_monster.select();
		//record = guild_monster.select(true);
		//record = state.setItem('targetGuildMonster', {});
		//con.log(1, "record", record);
		if(record && $j.isPlainObject(record) && !$j.isEmptyObject(record)) {
			if(general.Select('GuildMonsterGeneral')) {
				return true;
			}

			if(!guild_monster.checkPage(record)) {
				con.log(2, "Fighting Slot (" + record['slot'] + ") Name: " + record['name']);
				caap.setDivContent('guild_monster_mess', "Fighting (" + record['slot'] + ") " + record['name']);
				url = "guild_battle_monster.php?twt2=" + guild_monster.info[record['name']].twt2 + "&guild_id=" + record['guildId'] + "&slot=" + record['slot'];
				caap.clickAjaxLinkSend(url);
				return true;
			}
			minion = guild_monster.getTargetMinion(record);
			if(minion && $j.isPlainObject(minion) && !$j.isEmptyObject(minion)) {
				con.log(2, "Fighting target_id (" + minion['target_id'] + ") Name: " + minion['name']);
				caap.setDivContent('guild_monster_mess', "Fighting (" + minion['target_id'] + ") " + minion['name']);
				key = $j("#" + caap.domain.id[caap.domain.which] + "attack_key_" + minion['target_id']);
				if(key && key.length) {
					attack = guild_monster.getAttackValue(record, minion);
					if(!attack) {
						return false;
					}

					key.attr("value", attack);
					form = key.parents("form").eq(0);
					if(form && form.length) {
						caap.click(form.find("input[src*='gb_btn_duel.gif'],input[src*='guild_duel_button2.gif'],input[src*='monster_duel_button.gif']"));
						return true;
					}
				}
			}
		}

		return false;
	} catch (err) {
		con.error("ERROR in guildMonster: " + err);
		return false;
	}
};
/*jslint sub: false */
