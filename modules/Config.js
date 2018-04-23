module.exports = function(authObj, configObj) {
    const self = this;

    this.whitelist = null;

    this.getBearerToken = function() {
        return authObj['bearer-token'];
    }

    this.getDefaultRules = function() {
        return configObj.default_rules;
    }

    this.getStoredFirewallName = function() {
        if (configObj.firewall_name != undefined) return configObj.firewall_name;
        return null;
    }

    this.getWhiteList = function() {
        return this.whitelist;
    }

    this.setWhiteList = function(whitelist) {
        this.whitelist = whitelist;
    }
}   