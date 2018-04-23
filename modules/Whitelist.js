const fs = require('fs');

module.exports = function(config, startupArgs) {
    const self = this;

    this.whitelist = {
        global: [],
        firewalls: {}
    };

    this.load = function() {
        if (fs.existsSync('./whitelist.json')) {
            self.whitelist = JSON.parse(fs.readFileSync('./whitelist.json').toString());
            console.log(`[${new Date().toLocaleString()}] Loaded whitelist.`);
        }
        console.log(`[${new Date().toLocaleString()}] No whitelist present -- ignoring.`);
    }
    
    this.save = function() {
        fs.writeFileSync('./whitelist.json', JSON.stringify(self.whitelist));
    }

    this.addIp = function(ip, firewall) {
        // if firewall is undefined, assume global 
        console.log(ip, firewall);
    }

    /**
     * 
     * @param string ip 
     * @param string firewall 
     */
    this.removeIp = function(ip, firewall) {
        // if firewall is undefined, assume global 

    }

    /**
     * Clears a single firewall
     */
    this.clearSingleFirewall = function() {

    }

    /**
     * Clears globals
     */
    this.clearGlobals = function() {

    }

    /**
     * Clears entire whitelist
     */
    this.clear = function() {

    }


    this.init = function() {

        if (startupArgs['wh-add'] != undefined) {
            self.addIp(startupArgs['ip'], startupArgs['fw-name']);
            process.exit(0);
        }
        
    }

    // Always load the wh 
    self.load();
}