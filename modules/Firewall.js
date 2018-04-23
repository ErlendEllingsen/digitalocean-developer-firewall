const request = require('request');
const publicIp = require('public-ip');

module.exports = function(config, fwObj, fwName) {
    const self = this;

    this.hi = function() {
        console.log('hello!');
    }

    this.IPV4 = false;
    this.IPV6 = false;

    this.refresh = function() {
        return new Promise((resolve, reject) => {
            request.get(
                `https://api.digitalocean.com/v2/firewalls/${fwObj.id}`,
                {
                    auth: {
                        bearer: config.getBearerToken()
                    }
                },
            function(err, res, body){
                
                if (err !== null) reject('request_failed');
                
                try {
                    body = JSON.parse(body);
                    body = body.firewall;

                    fwObj = body;

                } catch (err) {
                    return reject('json_invalid');
                }

                resolve(body);
                
            });
        });
    }

    
    this.findIP = function(preSet4, preSet6) {
        return new Promise((resolve, reject) => {

            if (preSet4 != undefined || preSet6 != undefined) {
                if (preSet4 != undefined) self.IPV4 = preSet4;
                if (preSet6 != undefined) self.IPV6 = preSet6;
                resolve(true);
            }
            
            let foundV4 = false;
    
            let prom1 = publicIp.v4().then(ip => {
                foundV4 = ip;
            }).catch(err => {
                foundV4 = false;
            });
             
    
            let foundV6 = false;
    
            let prom2 = publicIp.v6().then(ip => {
                foundV6 = ip;
            }).catch(err => {
                foundV6 = false;
            });
    
            // -- Fetch all -- 
            Promise.all([prom1, prom2]).then(values => {
                
                if (foundV4 === false && foundV6 === false) {
                    throw 'Unable to fetch IP address and no pre defined IP set.';
                }
    
                self.IPV4 = foundV4;
                self.IPV6 = foundV6;
                
                resolve(true);
                return true;            
            }).catch(reason => {
                reject('missing_sub_promises');
            });

        });

        // end findIP
    }

    this.deleteOutdatedRules = function() {
        return new Promise((resolve, reject) => {

        let rules = fwObj.inbound_rules; 

        let protectedIps = config.getWhiteList().getWhiteList(fwName);

        let foundRules = rules.filter(elem => {
            return (elem.sources.addresses.length > 0 && elem.sources.addresses[0] != '127.0.0.1');
        });

        // Iterate through foundRules and remove rules that are whitelisted... 
        let defRules = config.getDefaultRules();
        let rulesForDeletion = [];

        // Iterate through existing routes and check them amongst the whitelist 
        for (let rule of foundRules) {
           
            // check that the rules protocol and port matches
            let matchingRule = defRules.find(function(el){
                let matchProtocol = el.protocol.toLowerCase() == rule.protocol.toLowerCase();
                let matchPorts = el.ports.toLowerCase() == rule.ports.toLowerCase();
                return (matchProtocol && matchPorts);
            });

            if (matchingRule == undefined) {
                // The rules protocol and ports doesn't event match configs default_rules -- 
                // Queue for deletion
                rulesForDeletion.push(rule);
                continue;
            }

            if (rule.sources.addresses == undefined) continue; // e.g. tag or droplet.. ignore 

            let deleteIps = [];

            // Check if any of the addresses aren't represented in the whitelist 
            for (let ip of rule.sources.addresses) {
                if (!protectedIps.includes(ip)) {
                    console.log(`[${new Date().toLocaleString()}] Marked for deletion: Ip [${ip}], port [${rule.ports}], protocol [${rule.protocol}] not protected in whitelist -- delete`);
                    deleteIps.push(ip);
                }
            }

            // Push for deletion if IP's were found
            if (deleteIps.length > 0) {
                rulesForDeletion.push({
                    protocol: rule.protocol,
                    ports: rule.ports,
                    sources: {
                        addresses: deleteIps
                    }
                });
            }


        }

        console.log(`[${new Date().toLocaleString()}] Found ${rulesForDeletion.length} rules for deletion..`);

        if (rulesForDeletion.length <= 0) {
            console.log(`[${new Date().toLocaleString()}] Skipping deletion of rules (since zero)..`);
            return resolve(true);
        }

        let deleteObj = {
            inbound_rules: rulesForDeletion
        };

        request(
            {
                'uri': `https://api.digitalocean.com/v2/firewalls/${fwObj.id}/rules`,
                'method': 'DELETE',
                'auth': {
                    bearer: config.getBearerToken()
                }, 
                'Content-Type': 'Application/json',
                'json': deleteObj 
            },
            function(err, res, body){
                
                // Internal req err
                if (err !== null) {
                    console.log(err);
                    reject('delete_request_failed');
                }

                // Response err
                if (res.statusCode != 204) {
                    console.log(body);
                    reject('delete_request_api_reject');
                }
                
                resolve(true);
                
            });

            
        });

        // end deleteOutdatedRules
    }

    this.createRules = function() {
        return new Promise((resolve, reject) => {

            let newRules = [];

            let defaultRules = config.getDefaultRules();
            let validAddresses = [];
            if (self.IPV4 !== false) validAddresses.push(self.IPV4);
            if (self.IPV6 !== false) validAddresses.push(self.IPV6);

            // Prepend protected ips from whitelist into -> validAddresses
            let protectedIps = config.getWhiteList().getWhiteList(fwName);
            for (let ip of protectedIps) {
                if (!validAddresses.includes(ip)) validAddresses.push(ip);
            }

            // Iterate through existing rules, ensure that we do not create double rules
            // This can cause errors with the fw. (has happened before, had to delete entire fw)
            let existingRules = fwObj.inbound_rules;

            let rulesForCreation = [];
            
            for (let newRule of defaultRules) {

                let eligibleIps = []; //array of ip's that do not already exist 

                for (let ip of validAddresses) {

                    let ruleExists = (existingRules.find(function(el){
                        let matchPorts = el.ports == newRule.ports;
                        let matchProtocol = el.protocol == newRule.protocol;
                        let matchIp = (el.sources.addresses != undefined && el.sources.addresses.includes(ip));
                        return (matchPorts && matchProtocol && matchIp);
                    })) != undefined;

                    if (ruleExists) {
                        console.log(`[${new Date().toLocaleString()}] Already exists: Ip [${ip}], port [${newRule.ports}], protocol [${newRule.protocol}] -- skipping`);                        
                    } else {
                        console.log(`[${new Date().toLocaleString()}] Eligible rule: Ip [${ip}], port [${newRule.ports}], protocol [${newRule.protocol}] -- preparing for create`);                        
                        eligibleIps.push(ip);
                    }

                }

                if (eligibleIps.length <= 0) {
                    console.log(`[${new Date().toLocaleString()}] No eligible ips for port [${newRule.ports}], protocol [${newRule.protocol}] -- skipping`);                    
                    continue;
                } 

                console.log(`[${new Date().toLocaleString()}] ${eligibleIps.length} eligible ips for port [${newRule.ports}], protocol [${newRule.protocol}] -- queueing`);                                        
                rulesForCreation.push({
                    protocol: newRule.protocol,
                    ports: newRule.ports,
                    sources: {
                        "addresses": eligibleIps
                    }
                });
                
                // end newRule loop
            }

            console.log(`[${new Date().toLocaleString()}] Creating a total of ${rulesForCreation.length} rules`);                            

            if (rulesForCreation.length <= 0) {
                console.log(`[${new Date().toLocaleString()}] Skipping creation of rules (since zero)..`);
                return resolve(true);
            }

            // Build final req object to match API spec and send request
            let createRulesObj = {
                inbound_rules: rulesForCreation
            };

            // Create rules request
            request(
                {
                    'uri': `https://api.digitalocean.com/v2/firewalls/${fwObj.id}/rules`,
                    'method': 'POST',
                    'auth': {
                        bearer: config.getBearerToken()
                    }, 
                    'Content-Type': 'Application/json',
                    'json': createRulesObj 
                },
                function(err, res, body){
                    
                    // Response err
                    if (res.statusCode != 204) {
                        console.log(body);
                        reject('create_request_api_reject');
                    }
                    
                    return resolve(true);
                    
                }
            );
    

        });            

        // end createRules
    }

    this.updateFirewall = function(rules) {

        self.refresh().then(() => {
            console.log(`[${new Date().toLocaleString()}] Initial refresh.`);            
            return self.deleteOutdatedRules();
        }).then(() => {
            console.log(`[${new Date().toLocaleString()}] Step: Delete rules finished.`);            
            return self.refresh();
        }).then(() => {
            console.log(`[${new Date().toLocaleString()}] Firewall refreshed.`);            
            return self.createRules();
        }).then(() => {
            console.log(`[${new Date().toLocaleString()}] Step: New rules finished.`);                        
        }).catch(reason => {
            console.log('Firewall createRules failed.');
            console.log(reason);
            process.exit(1);
        });

        return;



        // end updateFirewall
    }

}