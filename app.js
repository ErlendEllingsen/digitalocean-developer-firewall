const fs = require('fs');
const request = require('request');

// Startup arguments
let startupArgs = require('minimist')(process.argv.slice(2));

// Validate that auth configuration file exists
if (!fs.existsSync('./config.auth.json')) {
    throw './config.auth.json file does not exist and is required. Please see README.';
}

// Fetch auth data from config file
let authObj = JSON.parse(fs.readFileSync('./config.auth.json').toString());
let configObj = JSON.parse(fs.readFileSync('./config.json').toString());


let token = authObj['bearer-token'];

const config = new (require('./modules/Config'))(authObj, configObj);


let fw = null;

request.get(
'https://api.digitalocean.com/v2/firewalls',
{
    auth: {
        bearer: config.getBearerToken()
    }
}, function(err, res, body){
    
    // Validate data
    try {
        body = JSON.parse(body);
    } catch (err) {
        throw "Unexpected response format. Error occurred trying to parse JSON.";
    }

    if (body.firewalls == undefined) {
        throw "Unable to find firewalls. Are you sure credentials are right?";
    }

    // Fetch correct fw
    let firewalls = body.firewalls;

    let devWall = firewalls.find(function(e){return e.name == 'allow-developer';});
    if (devWall == undefined) {
        throw 'Unable to find "allow-developer" firewall.';
    }

    fw = new (require('./modules/Firewall'))(config, devWall);

    console.log(`[${new Date().toLocaleString()}] Finding IP addresses...`);    

    fw.findIP().then(() => {
        console.log(`[${new Date().toLocaleString()}] Found Ips: `, fw.IPV4, fw.IPV6);
        fw.updateFirewall();
    }).catch(reason => {
        console.log(`[${new Date().toLocaleString()}] ERR Unable to fetch IPS`);        
    });
    

    // console.log(fw.hi());

    // let rules_in = body.firewalls.inbound_rules;
    // let rules_out = body.firewalls.outbound_rules;

    // console.log(rules_in);

});