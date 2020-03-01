const { UpdateDailyHoney, UpdateDailyPoo, UpdateTotalHoney, UpdateTotalPoo } = require("./server/dataAccess");

/**
 * A Bot for Slack!
 */


/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}


/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: ((process.env.TOKEN)?'./db_slack_bot_ci/':'./db_slack_bot_a/'), //use a different name if an app or CI
    };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    //Treat this as a custom integration
    var customIntegration = require('./server/lib/custom_integrations');
    var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
    var controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    //Treat this as an app
    var app = require('./server/lib/apps');
    var controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
    process.exit(1);
}


/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});


/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I'm here!")
});

// controller.on('message_received', function(bot, message) {
//     // console.log(message);
//     bot.reply(message, `I heard ${message.content}`);
// })

controller.hears('send (.*)', ['direct_mention', 'mention', 'direct_message'], function(bot, message) {
    let item = message.match[1].split(" ");
    
    if ((item[1].indexOf("<@") === 0) && (item[1].lastIndexOf(">") === (item[1].length - 1))) {
        let user = item[1].substring(2, item[1].length - 1);
        
        switch (item[0]) {
            //  Updates the honey sent between users.
            case "honey":
            case ":honey_pot:":
            case ":poohhoney:":
                bot.reply(message, `Pooh sent :poohhoney: to ${item[1]}`);
                UpdateDailyHoney(message.user);
                UpdateTotalHoney(user);
                break;

            //  Updates the poo sent between users
            case "poo":
            case "poop":
            case ":poop:":
            case ":poohpoop:":
                bot.reply(message, `Pooh sent :poohpoop: to ${item[1]}`);
                UpdateDailyPoo(message.user);
                UpdateTotalPoo(user);
                break;

            //  Pooh doesn't know what to do
            default:
                bot.reply(message, `Pooh doesn't know how to send ${item[0]} to ${item[1]}`);
        }
    } else {
        bot.reply(message, "Pooh doesn't know what you want");
    }
    
    // bot.reply(message, `Pooh Bot sent ${item.join(" ")}`);
    
});

controller.hears(['hello', 'hi', 'greetings'], ['direct_mention', 'mention', 'direct_message'], function(bot,message) {
    bot.reply(message, 'I AM POOHBOT! HEAR ME ROAR!!!');
});

controller.hears('.*', ['direct_mention', 'mention', 'direct_message'], function(bot,message) {
    bot.reply(message, 'I AM POOHBOT! HEAR ME ROAR!!!');
});

controller.hears([':honey_pot:', 'honey'], ['direct_mention', 'mention', 'direct_message'], function(bot,message) {
    bot.reply(message, 'I AM POOHBOT! HEAR ME ROAR!!!');
});

/**
 * AN example of what could be:
 * Any un-handled direct mention gets a reaction and a pat response!
 */
//controller.on('direct_message,mention,direct_mention', function (bot, message) {
//    bot.api.reactions.add({
//        timestamp: message.ts,
//        channel: message.channel,
//        name: 'robot_face',
//    }, function (err) {
//        if (err) {
//            console.log(err)
//        }
//        bot.reply(message, 'I heard you loud and clear boss.');
//    });
//});
