const fs = require('fs');
const validateIP = require('validate-ip-node');
const colors = require('colors');

module.exports = function(config, startupArgs) {
    const self = this;

    this.whitelist = {
        global: [],
        firewalls: {}
    };

    this.load = function() {
        if (fs.existsSync('./whitelist.json')) {
            self.whitelist = JSON.parse(fs.readFileSync('./whitelist.json').toString());
            console.log(`[${new Date().toLocaleString()}] Loaded whitelist from file.`);
            return;
        }
        console.log(`[${new Date().toLocaleString()}] No whitelist present -- ignoring.`);
    }
    
    this.save = function() {
        fs.writeFileSync('./whitelist.json', JSON.stringify(self.whitelist));
        console.log(`[${new Date().toLocaleString()}] Whitelist saved to file.`);
        
    }

    this.getWhiteList = function(fwName) {
        let protectedList = ['127.0.0.1', '::1'];
        // fetch globals
        for (ip of self.whitelist.global) {
            protectedList.push(ip);
        }
        // fetch per fw
        if (self.whitelist.firewalls[fwName] != undefined) {
            for (ip of self.whitelist.firewalls[fwName]) {
                protectedList.push(ip);
            }
        }
        console.log(`[${new Date().toLocaleString()}] Whitelist export: ${protectedList.length} entries.`);        
        console.dir(protectedList);
        return protectedList;
    }

    this.forceCorrectIP = function(ip) {
        if (ip == undefined) throw `IP address required but undefined. Ensure --ip flag is set.`;
        if (!validateIP(ip)) throw `Invalid IP address (${ip}) specified.`;
    }

    this.addIp = function(ip, firewall) {
        try {

            self.forceCorrectIP(ip);   
            // if firewall is undefined, assume global 
            if (ip == undefined) {
                console.log(`[${new Date().toLocaleString()}] Loaded whitelist.`);
                process.exit(1);
            }

            // Global addition
            if (firewall == undefined) {
                if (self.whitelist.global.includes(ip)) throw `IP address ${ip} already exists in globals. Globals was assumed since --fw-name was not set.`;
                self.whitelist.global.push(ip);
                console.log(`[${new Date().toLocaleString()}] SUCCESS IP address ${ip} added to global whitelist.`);
                self.save();
                return;
            }

            // Local (single firewall) addition. 
            if (self.whitelist.firewalls[firewall] == undefined) {
                self.whitelist.firewalls[firewall] = [];
            }

            let fwWhitelist = self.whitelist.firewalls[firewall];
            if (fwWhitelist.includes(ip)) throw `IP address ${ip} already exists in firewall ${firewall}.`;
            
            fwWhitelist.push(ip);
            self.whitelist.firewalls[firewall] = fwWhitelist;

            console.log(`[${new Date().toLocaleString()}] SUCCESS IP address ${ip} added to whitelist for firewall ${firewall}.`);
            self.save();

        } catch (err) {
            console.error(`[${new Date().toLocaleString()}] ERROR exception occurred whilst adding ip. (Is --ip flag set?)`);
            console.error(`[${new Date().toLocaleString()}] ERROR ${err}`);            
            process.exit(1);
        }

    }

    /**
     * 
     * @param string ip 
     * @param string firewall 
     */
    this.removeIp = function(ip, firewall) {
        // if firewall is undefined, assume global 
        try {

            if (ip == undefined) throw "IP address must be specified. Use --fw-clear to clear all.";

            if (firewall == undefined) {
                if (!self.whitelist.global.includes(ip)) throw `IP address ${ip} does not exists in globals. Globals was assumed since --fw-name was not set.`;
                self.whitelist.global.splice(self.whitelist.global.indexOf(ip), 1);
                console.log(`[${new Date().toLocaleString()}] SUCCESS IP address ${ip} deleted from global whitelist.`);
                self.save();
                return;
            }

            if (self.whitelist.firewalls[firewall] == undefined) throw `Firewall ${firewall} does not exist.`;
            let fwWhitelist = self.whitelist.firewalls[firewall];
            if (!fwWhitelist.includes(ip)) throw `IP address ${ip} does not exist in firewall ${firewall}.`;

            fwWhitelist.splice(fwWhitelist.indexOf(ip), 1);
            self.whitelist.firewalls[firewall] = fwWhitelist;

            if (fwWhitelist.length <= 0) delete self.whitelist.firewalls[firewall];

            console.log(`[${new Date().toLocaleString()}] SUCCESS IP address ${ip} removed from whitelist for firewall ${firewall}.`);
            self.save();


        } catch (err) {
            console.error(`[${new Date().toLocaleString()}] ERROR exception occurred whilst deleting ip.`);
            console.error(`[${new Date().toLocaleString()}] ERROR ${err}`);            
            process.exit(1);
        }

    }


    /**
     * Clears entire whitelist
     */
    this.clear = function(firewall) {
        try {

            if (firewall == undefined) {
                // Clear everything
                self.whitelist = {
                    global: [],
                    firewalls: {}
                };
                console.log(`[${new Date().toLocaleString()}] SUCCESS Cleared everything.`);
                self.save();
                return;
            }

            if (self.whitelist.firewalls[firewall] == undefined) throw `Firewall ${firewall} does not exist.`;
            delete self.whitelist.firewalls[firewall];
            console.log(`[${new Date().toLocaleString()}] SUCCESS Cleared whitelist for firewall ${firewall}.`);
            self.save();

        } catch (err) {
            console.error(`[${new Date().toLocaleString()}] ERROR exception occurred whilst clearing whitelist.`);
            console.error(`[${new Date().toLocaleString()}] ERROR ${err}`);            
            process.exit(1);
        }
    }

    this.clearGlobals = function() {
        self.whitelist.global = [];
        console.log(`[${new Date().toLocaleString()}] SUCCESS Cleared globals.`);
        self.save();
    }

    this.list = function(firewall) {
        try {

            if (firewall == undefined) {
                //List everything...

                // First globals
                console.log(`${colors.bold('Globals')}: `);
                for (let globIp of self.whitelist.global) {
                    console.log(`   ${globIp}`);
                }

                // Then per firewall
                console.log(`${colors.bold('Per firewall')}: `);
                for (let firewall in self.whitelist.firewalls) {
                    let ips = self.whitelist.firewalls[firewall];
                    console.log(`   ${firewall}`);
                    for (let ip of ips) {
                        console.log(`       ${ip}`);  
                    }
                }
                return;                
            }

            

        } catch (err) {
            console.error(`[${new Date().toLocaleString()}] ERROR exception occurred whilst listing whitelist.`);
            console.error(`[${new Date().toLocaleString()}] ERROR ${err}`);            
            process.exit(1);
        }
    }

    this.init = function() {

        if (startupArgs['wh-add'] != undefined) {
            self.addIp(startupArgs['ip'], startupArgs['fw-name']);
            process.exit(0);
        } else if (startupArgs['wh-remove'] != undefined) {
            self.removeIp(startupArgs['ip'], startupArgs['fw-name']);
            process.exit(0);            
        } else if (startupArgs['wh-clear'] != undefined) {
            self.clear(startupArgs['fw-name']);
            process.exit(0);                        
        }
        else if (startupArgs['wh-clear-globals'] != undefined) {
            self.clearGlobals();
            process.exit(0);                        
        } else if (startupArgs['wh-list'] != undefined) {
            self.list(startupArgs['fw-name']);
            process.exit(0);            
        }
        
    }

    // Always load the wh 
    self.load();
}