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

// Check for initial functionality
if (startupArgs.help != undefined || startupArgs.h != undefined) {
    new (require('./modules/Helper'))().print();
    process.exit(0);
}

// Init functionality: whitelist
let whiteList = new(require('./modules/Whitelist'))(config, startupArgs);
whiteList.init();
config.setWhiteList(whiteList);

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
        throw "Unexpected response format from DigitalOcean Firewall API. Error occurred trying to parse JSON.";
    }

    if (body.firewalls == undefined) {
        throw "Unable to find firewalls. Are you sure credentials are right?";
    }

    // Figure out which fw to fetch
    let fwName = 'allow-developer';
    if (startupArgs['firewall-name'] != undefined) {
        fwName = startupArgs['firewall-name'];
    } else if ((storedFWName = config.getStoredFirewallName()) != null) {
        fwName = storedFWName;
    }

    console.log(`[${new Date().toLocaleString()}] Using firewall: "${fwName}"`);        

    // Fetch correct fw
    let firewalls = body.firewalls;

    let devWall = firewalls.find(function(e){return e.name == fwName;});
    if (devWall == undefined) {
        throw `Unable to find "${fwName}" firewall.`;
    }

    fw = new (require('./modules/Firewall'))(config, devWall, fwName);

    console.log(`[${new Date().toLocaleString()}] Finding IP addresses...`);    

    // Check if IP-address is pre-set as parameter
    fw.findIP(startupArgs.IPv4, startupArgs.IPv6).then(() => {
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