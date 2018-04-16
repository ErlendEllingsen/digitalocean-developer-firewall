const publicIp = require('public-ip');

module.exports = function(config, fwObj) {
    const self = this;

    this.hi = function() {
        console.log('hello!');
    }

    this.IPV4 = false;
    this.IPV6 = false;

    
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

    this.createRules = function(rules) {

        if (rules == undefined) {
            rules = config.getDefaultRules();
        }

        console.log(rules);

        console.log(fwObj);

        // end createRules
    }

}