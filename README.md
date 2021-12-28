# Demeter Discord Bot

Demeter is a Discord bot that identifies and quantifies your members' commitment by assigning them reputation points.  
This is a project made in my free time, without any financial purpose, you can do what you want with it, but I will not be responsible for anything.  
This text is partially generated via an online translator, as I never had any English lessons, I won't be able to do better, but if you want to improve the writing, feel free.  

## Feature list

 - Reputation distribution via reaction/response Discord
 - Quadratic funding to redistribute reputation more evenly
 - DM-free captcha to protect your server and new members
 - Assign roles based on reputation
 - Move off-topic messages to another channel directly managed by trusted members of your community
 - Poll your community via reputation-weighted proposals
 - Reward directly or via proposal your most active members
 - Mute a member via vote
 - Everything is saved on IPFS
 - Everything is customizable via a command on the Discord

## Installation

### Self-hosted(! Recommended !)

I designed the bot with a best-effort vision to reduce to the maximum the required maintenance.  
For example, there is no database, regularly the local data are simply saved on IPFS(and one day on StarkNet ^.^ ).

To host the bot, you can simply [create a Discord application](https://discord.com/developers/applications), then in `Bot` activate all `Intent`, create an environment variable `DISCORD_TOKEN` with your Discord secret token.  
To add the bot to your Discord, you can generate the link in `OAuth2`, then `URL generator`, select `Bot` with administrator permissions and `applications.commands`.

To save the data, we use [web3.storage](https://web3.storage), you can create a free account on it, generate an API key and put it in an environment variable `WEB3_TOKEN`

And that's it! All that's left to do is `yarn install` and `yarn run bot`

### Hosted by [Nolan Vanmoortel](https://twitter.com/NolanVanmoortel) (Please don't...)

[Click here](https://discord.com/api/oauth2/authorize?client_id=911985596950540338&permissions=8&scope=bot%20applications.commands)

### First round

When you just added the bot to the server, no round starts, which means that nothing is running.  
Before launching the first round, you can set the default configurations, the next rounds and the new users will inherit them.

All the configurations are explained below. Once you've done that, you have two choices.

You can load the history of the Discord since a given date.  
`/reputation fetch-history start-date:31/01/2021` will delete all the rounds and re-generate them since that date. The users already created will keep their configuration.  
This can take several hours if there are many messages to fetch.

You can use `/round start-first` if you want to start the first round now.

## Reputation

Demeter is a Discord bot that allows you to have a self-managed community via a reputation system, meaning that each member can earn or help someone to earn reputation points.

These reputation points represent your involvement in the community.  
They are used, for example, to assign you roles, vote on proposals, and for the moderation of the Discord, such as moving an off-topic message or censoring a member.

You gain reputation automatically when you receive a reaction or response to your message.  
Hence, it is crucial to react to messages you like to reward the author.

When you react to a message, the author will only gain reputation at the end of the current round(14 days).

### Reputation decay

At the end of a round, each member will lose between 5% and 20% of his reputation.  
The more he has, the more he loses to avoid a gap between the most active and the others.

To avoid bots attacks, the reputation you can offer equals 5% of your total reputation.  
The system will automatically bring the total back to 5% if you help others earn more than 5% of your current reputation.

x = reputation  
m = min reputation decay(0.05)  
M = max reputation decay(0.25)  
s = standard deviation of active members(reputation > min reputation)  
![Formula reputation decay](decay-formula.png?raw=true "Formula reputation decay")  
![Formula reputation chart](decay-chart.png?raw=true "Formula reputation chart")  
Example with a standard deviation of 50  


### Discord Quadratic Funding

In addition to this direct reputation gain, we use Quadratic Funding, which allows us to distribute a given amount of reputation by favoring the diversity of authors instead of simply taking into account the amount of reputation received.  
Thus a person who has earned 1 reputation point from 100 people will receive more than a person who has received 100 reputation points from one person.

The amount allocated to Quadratic Funding is 100 reputation points in addition to the total amount that was burned at the end of the round.  
This grant is weighted by the person's role and seniority who helps you gain this reputation to avoid bot attacks again.  
A person who has just arrived will make you earn less than a member who has been active for 3 months.

![Formula seniority](seniority.png?raw=true "Formula seniority")  
Example of seniority computation

### Visualization

You can [visualize](https://demeter-visualization.herokuapp.com/) directly in 3D the community engagement, you will need the link of the database `/guild db-url`.  
The switch "manual/auto" will automatically jump to the next round.  
The switch "all/active" allows to hide the members who were not active during the round.  
The switch "animation/static" allows to activate or not the animations.  
The switch "received/sent" allows to see the reputation received or given during the round by passing the mouse over the members.  
![Vizualize](visualize.gif?raw=true "Captcha")

## Captcha

The bot provides a captcha without DM to reduce the risk of scams impersonating the bot.  
You can type `/button captcha` to display the button that will offer the user to solve the Captcha.  
The user will then have to find 3 times successively the emoji hidden in the image, he will be granted the captcha-role(`/guild config captcha-role:@🥚Humain.e`).  
![Captcha](captcha.png?raw=true "Captcha")

## Role based on reputation

You can choose to add a role based on accumulated reputation automatically.  
`/guild config reputation-role-role:@🧙sage reputation-role-min:300` will add the role "🧙sage" to all members with over 300 reputation points(0=disabled).  

## Move off-topic messages

By creating custom emoji you can allow your members to move off-topic messages to the appropriate channel.  
You must first define how many reputations are needed to move a message, for example, 200 `/guild config reaction-transfer-reputation:200`(0=disabled)  
Then for each channel you can create a custom emoji that members will use to redirect messages, for example:  
`/guild config reaction-transfer-reputation::hs_bar: reaction-transfer-channel:#🍹-bar` this emoji will redirect a message in the channel bar, with a custom emoji "hs_bar" like the one below.  
![hs_bar](hs_bar.png?raw=true "hs_bar")  
As soon as 200 reputations have reacted with this emoji to the message, it will be transferred.  

## Reputation-weighted proposals

You can allow your members to start proposals.  
For that, define the minimum quantity to start a proposal and the minimum amount for the vote to be valid and where to put the proposals with `/guild config-2 min-rep-start-proposal:500 min-rep-confirm-proposal:2000 channel-proposal:#📜-proposition`(0=disabled)  
Start a vote with the following command:  
`/proposal start message:https://discord.com/channels/745336259194650788/834365660293365821/924067576743616574 duration:5`  
If you get 500 reputation points, a vote will be launched in 📜-proposition, it will then be necessary that this proposal gets 2000 reputation points within the 5 days for the vote to be considered valid.

It is also possible to offer reputation via a proposal by adding `mint-user:@Charles mint-qty:500` to the previous command.

## Pantheon

To reward a member who has made a significant contribution, it is possible by mentioning his work in the channel configured as the pantheon with the command `/guild config channel-pantheon:#🏅-panthéon channel-pantheon-enable:True`.  
People reacting with an emoji to this message will help the people mentioned earn reputation points instead of the message's author.

## Mute

You can offer to your community to censor a user, just choose the amount of reputation needed via the command `/guild config-2 min-rep-mute:100`(0=disabled)  
Then anyone can start a vote to mute for x minutes via the following command `/proposal mute user:@Charles duration:5`

## Commands

## Guild

`/guild config admin-role:@🇫🇷 DF-Admin`  
Users with this role can perform specific privileged actions such as changing the bot configuration or granting reputation to a member.  
If no role is defined only Discord administrator this permission  

`/guild config captcha-role:@🥚Humain.e`  
This role is added when the user has passed the captcha verification.

`/guild config default-reputation:1`  
Each new user will receive 1 reputation and can't go bellow this amount.  
This configuration will be applied to new rounds.

`/guild config discord-matching:100`  
At the end of each period, we will distribute 100 reputation in addition to the total reputation burn during this round via a Quadratic Funding formula.  
This configuration will be applied to new rounds.

`/guild config duration:14`  
Each round has a duration of 14 days, reputation is distributed at the end of each round.  
This configuration will be applied to new rounds.

`/guild config min-decay:0.05`  
At the end of each round, all members will  grant 5% of their total reputation.  
If you grant less during a round, we will burn the difference.  
This configuration will be applied to new rounds.

`/guild config max-decay:0.2`  
The further the user moves away from the standard deviation of reputation, the more reputation he will lose at the end of each round, at most 20%.  
This configuration will be applied to new rounds.

`/guild config role:@🧙sage role-multiplier:2`  
When we compute the reputation matching(Quadratic funding) at the end of each round, we take several parameters to determine the amount of reputation granted to you.  
The diversity and amount of reputation received, the seniority of the donator but also the role of the donator.  
This configuration will be applied to new rounds.

`/guild config channel:#🍹-bar channel-multiplier:2`  
Based on the channel, you can apply a multiplier to your reaction and reply grant.  
This configuration will be applied to new members and rounds.

`/guild config reaction:😍 reaction-grant:1`  
When you react to a message, you will automatically grant a determined amount of reputation based on the emoji you choose.  
This configuration will be applied to new members and rounds.

`/guild config reply-grant:2`  
When you reply to a message, you will automatically offer 2 reputations to the message's author.  
This configuration will be applied to new members and rounds.

`/guild config channel-pantheon:#🏅-panthéon channel-pantheon-enable:True`  
When a channel is set up as a pantheon, reactions will offer grants to the people mentioned instead of the author

`/guild config reaction-role-message:https://discord.com/....415234428958 reaction-role-reaction:😍 reaction-role-role:@🐣Apprenti.e`  
When you react with 😍 to the message url you provide, you will automatically be assigned to this discord role.

`/guild config reputation-role-role:@🧙sage reputation-role-min:100`  
Set a discord role based on your reputation

`/guild config reaction-transfer-reputation:200`  
Allow your member to transfer a message to a different channel by using a custom emoji(0 = disabled)

`/guild config reaction-transfer-reputation::hs_bar: reaction-transfer-channel:#🍹-bar`  
Transfer a message if more than X reputation use this emoji  
![hs_bar](hs_bar.png?raw=true "hs_bar")

`/guild config-2 min-rep-start-proposal:500 min-rep-confirm-proposal:2000 channel-proposal:#📜-proposition`  
To propose a vote, you need to gather 500 reputations(0=disabled).  
Once having collected the minimum reputation required, the proposals will be proposed to the vote in this channel.  
For a proposal to be considered valid, 2000 reputations must be collected(0=disabled). 

`/guild config-2 min-rep-mute:100`  
To mute someone, you need to gather 100 reputations.(0=disabled)

`/guild db-url`  
Print the database URL for this guild

### Round

`/round config round-shift:1 apply-guild-default:True`  
Apply the current default guild config to 1 round in the past(by default = 0, 0=now)

`/round config round-shift:0 default-reputation:1`  
Each new user will receive 1 reputation and can't go bellow this amount.

`/round config round-shift:0 discord-matching:100`  
At the end of each period, we will distribute 100 reputation in addition to the total reputation burn during this round via a Quadratic Funding formula.

`/round config round-shift:0 duration:14`  
Each round has a duration of 14 days, reputation is distributed at the end of each round.

`/round config round-shift:0 min-decay:0.05`  
At the end of each round, all members will  grant 5% of their total reputation.  
If you grant less during a round, we will burn the difference.

`/round config round-shift:0 max-decay:0.2`  
The further the user moves away from the standard deviation of reputation, the more reputation he will lose at the end of each round, at most 20%.

`/round config round-shift:0 role:@🧙sage role-multiplier:2`  
When we compute the reputation matching(Quadratic funding) at the end of each round, we take several parameters to determine the amount of reputation granted to you.  
The diversity and amount of reputation received, the seniority of the donator but also the role of the donator.

`/round config round-shift:0 channel:#🍹-bar channel-multiplier:2`  
Based on the channel, you can apply a multiplier to your reaction and reply grant.  
This configuration will be applied to new members.

`/round config round-shift:0 reaction:😍 reaction-grant:1`  
When you react to a message, you will automatically grant a determined amount of reputation based on the emoji you choose.  
This configuration will be applied to new members.

`/round config round-shift:0 reply-grant:2`  
When you reply to a message, you will automatically offer 2 reputations to the message's author.  
This configuration will be applied to new members.

`/round start-first`  
Start the first round(Please read installation section !)

### User

`/user config apply-guild-default:True`  
Apply the current default guild config to you

`/user config channel:#🍹-bar channel-multiplier:2`  
Based on the channel, you can apply a multiplier to your reaction and reply grant.  
This configuration will be applied to new members and rounds.

`/user config reaction:😍 reaction-grant:1`  
When you react to a message, you will automatically grant a determined amount of reputation based on the emoji you choose.  
This configuration will be applied to new members and rounds.

`/user config reply-grant:2`  
When you reply to a message, you will automatically offer 2 reputations to the message's author.  
This configuration will be applied to new members and rounds.

`/user unmute user:@Nolan`  
Unmute someone (admin only)

### Reputation

`/reputation top start:0`  
Print the top 20 member by their reputation from the start position

`/reputation grant-list user:@vitalik round:0`  
Print for one user their grant received/sent during x round in the past(0=now)

`/reputation grant-add user:@vitalik amount:2`  
Grant a determined amount of reputation to this user

`/reputation grant-set user:@vitalik amount:666`  
Update the amount of reputation granted to this user

`/reputation fetch-history start-date:31/01/2021`  
Fetch the discord round history, this will erase all rounds !(Please read Installation section !)

`/reputation recompute-reputation use-guild-config:True`  
Recompute the reputation without reloading grants, you can use the guild settings instead of each round settings.  
You can use this command to fine tune discord matching, decay, default reputation etc. 

### Button

`/button captcha`  
Print the captcha button

`/button guild-info`  
Print the button to show the guild configuration

`/button user-info`  
Print the button to show the user configuration and grants

### Proposal

`/proposal start message:https://discord.com/channels/745336259194650788/834365660293365821/924067576743616574 duration:5`  
Start a proposal (Please read the Proposal section)

`/proposal start message:https://discord.com/channels/745336259194650788/834365660293365821/924067576743616574 duration:5 mint-user:@Charles mint-qty:500`  
Start a proposal to mint reputation to a user (Please read the Proposal section)

`/proposal mute user:@Charles duration:5`  
Start a vote to mute someone(Please read the mute section) 