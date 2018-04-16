module.exports = function(authObj, configObj) {
    const self = this;

    this.getBearerToken = function() {
        return authObj['bearer-token'];
    }

    this.getDefaultRules = function() {
        return configObj.default_rules;
    }

}   