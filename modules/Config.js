module.exports = function(authObj, configObj) {
    const self = this;


    this.getDefaultRules = function() {
        return configObj.default_rules;
    }

}   