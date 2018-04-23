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

        // --- TODO: Implement whitelist logic here ----

        console.log(`[${new Date().toLocaleString()}] Found ${foundRules.length} rules for deletion..`);

        if (foundRules.length <= 0) {
            console.log(`[${new Date().toLocaleString()}] Skipping deletion of rules (since zero)..`);
            return resolve(true);
        }

        let deleteObj = {
            inbound_rules: foundRules
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

            // --- TODO: Implement whitelist logic here ----

            // Iterate through defaultRules and build new rules request obj.
            for (let index in defaultRules) {
                let df = defaultRules[index];
                newRules.push({
                    protocol: df.protocol,
                    ports: df.ports,
                    sources: {
                        "addresses": validAddresses
                    }
                });
            }

            // Build final req object to match API spec and send request
            let createRulesObj = {
                inbound_rules: newRules
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
            console.log(`[${new Date().toLocaleString()}] Rules deleted.`);            
            return self.refresh();
        }).then(() => {
            console.log(`[${new Date().toLocaleString()}] Firewall refreshed.`);            
            return self.createRules();
        }).then(() => {
            console.log(`[${new Date().toLocaleString()}] New rules created.`);                        
        }).catch(reason => {
            console.log('Firewall createRules failed.');
            console.log(reason);
            process.exit(1);
        });

        return;



        // end updateFirewall
    }

}