<p align="center">
  <img width="128" src="https://cdn.discordapp.com/attachments/559049937560797219/803642916303142922/logo.png" />
</p>

A small, fast and scaleable discord bot for conducting UT99 pugs and query UT99 servers.

## Manual Setup 💻

1.  Create a discord application (bot) from [here](https://discord.com/developers)
2.  This bot uses mongoDB as it's primary database. Create a free cloud database instance from [here](https://www.mongodb.com/cloud/atlas)
3.  Install Docker from [here](https://www.docker.com/get-started)
4.  Create a file locally named `docker-compose.yml` and paste contents from [here](https://github.com/taranvohra/bBot/blob/master/docker-compose.yml)
5.  In the same folder create a file locally named `.env` and paste contents from [here](https://github.com/taranvohra/bBot/blob/master/.env.sample)
6.  Copy the **Discord Bot Token** from the bot created at Step 1 and paste it after `=` inside `.env` file
7.  Copy the **database URI** from the database created from Step 2 and paste it after `=` inside `.env` file
8.  On your terminal/cmd run `docker-compose up -d` 🎉

## Commands 📜

<u>_Before you continue_ 🧐</u>

> Commands denoted by 🐱‍👤 are `privileged` meaning the user must have a role named `bBot` to be able to use that command.

> Commands denoted by 😸 can be used by `everyone`.

### General

**register** 🐱‍👤<br/>
`Usage -> .register`

Registers your discord server with bBot. This is the `first` command you should be using after the bot is invited to your discord server.

**setpugchannel** 🐱‍👤<br/>
`Usage -> .setpugchannel`

Typing this command in a channel will mark that channel to be used for `pug` commands.

**setquerychannel** 🐱‍👤<br/>
`Usage -> .setquerychannel`

Typing this command in a channel will mark that channel to be used for `query` commands.

**ignorecommandgroup, igc** 🐱‍👤<br/>
`Usage -> .ignorecommandgroup group`

All ignorable commands are classified into 2 **groups**, namely, `pugs` and `queries`. If for instance you do not want query commands from the bot and only care about the rest of it then you can ignore the `queries` group.

**unignorecommandgroup, uigc** 🐱‍👤<br/>
`Usage -> .unignorecommandgroup group`

To unignore a command group which was previously ignored.

**warn** 🐱‍👤<br/>
`Usage -> .warn @mention#0000 reason`

Warns an user. Simultaneously, creates a log entry for auditing purposes.

**logs** 🐱‍👤<br/>
`Usage -> .logs @mention#0000`

Shows the `last 10` logs of the mentioned user.

**invite** 😸<br/>
`Usage -> .invite`

Generates an `invite` for your server with no expiry and unlimited uses. If such an invite already exists, it re-uses that.

### Pugs

**addgametype, agm** 🐱‍👤<br/>
`Usage -> .addgametype name totalPlayers totalTeams`

Creates a new gametype which can be now _pugged_.

Note that `totalTeams` must be less than 4 due to UT99 supporting 4 team colors only OR `mix` if it's a mix gamemode

**deletegametype, dgm** 🐱‍👤<br/>
`Usage -> .deletegametype name`

Deletes an already present gametype.

Note that if there is atleast `1 user` joined for the gametype then this command will not work until the list is cleared.

**defaultjoin** 😸<br/>
`Usage -> .defaultjoin gametype1 gametype2 etc`

Stores your default preference for joining pugs

**list, ls** 😸<br/>
`Usage -> .list gametype` or `.list`

There are 2 versions of this command, with gametype and without.

- If gametype is mentioned then it will show all the users who have currently joined the gametype
- If gametype is `not` mentioned then it will summarise all the gametypes with their names and a count of number of players joined / max players

**lsa** 😸<br/>
`Usage -> .lsa`

Shows the list of `all` gametypes with users who present.

**join, j** 😸<br/>
`Usage -> .join gametype` or `.j`

There are 2 versions of this command, with gametype and without.

- If gametype is mentioned then it will join that `particular` gametype.
- If gametype is `not` mentioned then it will join all gametypes saved in your default join preferences.

**leave, lv, l** 😸<br/>
`Usage -> .leave gametype`

Removes yourself from the gametype.

**lva** 😸<br/>
`Usage -> .lva`

Removes yourself from `all` gametypes that you've joined.

**promote, p** 😸<br/>
`Usage -> .promote gametype` or `.promote`

There are 2 versions of this command, with gametype and without.

- If gametype is mentioned then it will promote that `particular` gametype.
- If gametype is `not` mentioned then it will promote `all` gametypes with atleast 1 user joined _sorted_ by the least number of users required to fill that pug.

Since this command makes use discord's `@here` usage, then in order to counter `spam`, users can be given a **COOLDOWN** role which will prevent them from using the command once every `120 seconds`.

**captain, capt** 😸<br/>
`Usage -> .captain`

Adds you to the list of captains of the filled pug. Team color is RNG.

**picking** 😸<br/>
`Usage -> .picking`

Shows the `current picking` states of filled pug(s).

**pick, p** 😸<br/>
`Usage -> .pick index index2(?)`

Picks at the user at the mentioned index and add them to your team. `index2` **can** be specified if bot asks you to pick 2 players.

💲 **Bonus Usage** 💲
You can do a random pick by typing `random` instead of the index.

**tag** 😸<br/>
`Usage -> .tag info`

Adds meta information about yourself in all the pugs you've joined.

For example if you have no microphone then you can tag yourself `.tag nomic`. This will help the captains later while picking and making a decision.

**stats** 😸<br/>
`Usage -> .stats` or `.stats @mention#0000`

There are 2 versions of this command, with mentioned user and without.

- If user is mentioned, then it will show the stats of the mentioned user.
- If user is `not` mentioned, then it will show your own stats.

**last** 😸<br/>
`Usage -> .last gametype` or `.last`

There are 2 versions of this command, with gametype and without.

- If gametype is mentioned, then it will show the last pug played for that specific gametype.
- If gametype is `not` mentioned, then it will show the last pug played irrespective of any gametype.

💲 **Bonus Usage** 💲
You can go beyond _last_ by specifying a number after last like `last3` or add that many t characters like `.lasttt`

**top10played** 😸<br/>
`Usage -> .top10played gametype`

Generates an image of top 10 puggers for the gametype (sorted by most number of pugs played for the gametype).

**pugstats** 😸<br/>
`Usage -> .pugstats`

Outputs a summary of total number of pugs played, individual pug count(s) and a timestamp when the first pug was played

**addautoremove, aar** 😸<br/>
`Usage -> .addautoremove expiry`

Automatically removes the user from all the pugs they have joined after expiry.

⏲ _Expiry Parameters_ ⏲
`m` for minutes or `h` for hours or `d` for days.

For example `.autoremove 30m` will automatically remove the user from all the pugs after `30 minutes`.

**clearautoremove, car** 😸<br/>
`Usage -> .clearautoremove`

Clears your autoremoval request (if any).

**add** 🐱‍👤<br/>
`Usage -> .add @mention#0000 gametype1 gametype2 etc`

Adds the mentioned user to the list of specified gametypes.

**remove** 🐱‍👤<br/>
`Usage -> .remove @mention#0000 gametype1 gametype2 etc`

Removes the mentioned user from the list of specified gametypes.

**forcepick** 🐱‍👤<br/>
`Usage -> .forcepick @mention#0000 index`

Picks the player at the specified index for mentioned user's team.

**reset** 🐱‍👤<br/>
`Usage -> .reset pugname`

Resets the pug back into picking mode if it was filled.

**block** 🐱‍👤<br/>
`Usage -> .block @mention#0000 duration reason`

Blocks the mentioned user from joining pugs for a certain period of time.

⏲ _Duration Parameters_ ⏲
`m` for minutes or `h` for hours or `d` for days.
For example, `.block @mention#0000 1d xyz reason` will block the mentioned user for **1 day**.

**unblock** 🐱‍👤<br/>
`Usage -> .unblock @mention#0000`

Unblocks the mentioned user.

**showblocked** 🐱‍👤<br/>
`Usage -> .showblocked`

Shows the list of blocked users.

**enablecoinflip** 🐱‍👤<br/>
`Usage -> .enablecoinflip gametype`

Enables coin flip feature for the specified gametype (for mapvote purposes).

When the picking finishes, it will randomly decide which team won mapvote.

**disablecoinflip** 🐱‍👤<br/>
`Usage -> .disablecoinflip gametype`

Disabled coin flip feature for the specified gametype.

**teamemojis** 🐱‍👤<br/>
`Usage -> .teameojis emoji gametype`

Sets the preferred teamemoji for the gametype. `emoji` can be one of `agonies`, `cores` or `logos`.

Note that if `gametype` is omitted then the default is change it for **ALL** gametypes.

**setpickingorder** 🐱‍👤<br/>
`Usage -> .setpickingorder gametype pickingOrder`

Enforces a custom picking order for the gametype. An example of a picking order for a gametype with `2 teams` is `1 2 2 1 1 2 2 1`. It goes like `Red picks first, then blue picks 2 times then red picks 2 times then blue picks 2 times and finally last pick goes to red`

```
Red - 1
Blue - 2
Green - 3
Gold - 4
```

Note that this command does not work for `DUEL/MIX/DM` gametypes.

### Queries

**addqueryserver, aqs** 🐱‍👤<br/>
`Usage -> .addqueryserver address name`

Adds a query server to the list of query servers.

**deletequeryserver, dqs** 🐱‍👤<br/>
`Usage -> .deletequeryserver index`

Deletes the query server at the specified index from the list.

**editqueryserver, eqs** 🐱‍👤<br/>
`Usage -> .editqueryserver index attribute newValue`

Edits the query server at the specified index in the list.

📑 _Attributes_ 📑
`name` for editing name, `address` for editing address.

**servers, server** 😸<br/>
`Usage -> .servers`

Shows the list of query servers.

**query, q** 😸<br/>
`Usage -> .query index` or `.query customAddress`

There are 2 versions of this command, with index and with custom address.

- If index is specified, it will query the query server's address at the specified index.
- If custom address is specified, it will query that specific address.

**ip** 😸<br/>
`Usage -> .ip index`

Prints the address of the query server at the specified index in the list.
