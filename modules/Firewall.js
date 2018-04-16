const request = require('request');
const publicIp = require('public-ip');

module.exports = function(config, fwObj) {
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
                } catch (err) {
                    reject('json_invalid');
                }

                fwObj = body;
                resolve(body);
                
            });
        });
    }

    
    this.findIP = function(preSet4, preset6) {
        return new Promise((resolve, reject) => {

            if (preSet4 != undefined || preset6 != undefined) {
                if (preset4 != undefined) self.IPV4 = preSet4;
                if (preset6 != undefined) self.IPV6 = preset6;
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
        let foundRules = rules.filter(elem => {
            return (elem.sources.addresses.length > 0 && elem.sources.addresses[0] != '127.0.0.1');
        });

        console.log(`[${new Date().toLocaleString()}] Found ${foundRules.length} rules for deletion..`);

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
                
                console.log(body);

                if (err !== null) {
                    console.log(err);
                    console.log(body);
                    reject('delete_request_failed');
                }
                
                console.log('delete res: ' + res.statusCode);

                resolve(true);
                
            });

            
        });

    }

    this.createRules = function(rules) {

        self.deleteOutdatedRules().then(() => {
            console.log('ok!');            
        }).catch(reason => {
            console.log(reason);
        });
        return;

        self.refresh().then((body) => {
            console.log('oki');
            console.log(body);
        }).catch(reason => {
            console.log(reason);
        });

        if (rules == undefined) {
            rules = config.getDefaultRules();
        }

        return;

        console.log(rules);

        console.log(fwObj);

        // end createRules
    }

}