const colors = require('colors');

module.exports = function() {
    const self = this;

    this.print = function() {

        console.log(`
digitalocean-developer-firewall
-------------------------------
A tool for developers to easily configure firewalls and gain access to their servers when using DigitalOcean cloud firewalls.

See ${colors.bold('README.md')} for more descriptive guide. 

Available argument options: 

${colors.bold('Name')}                ${colors.bold('Comment')}
* ${colors.yellow('--firewall-name')}   Specifies which firewall should be used (by name). Useful when
                    multiple developers are working together from different locations. (Optional)
* ${colors.yellow('--IPv4')}            Specifies which IPv4 address to be used. Defaults to DNS resolve. (Optional)
* ${colors.yellow('--IPv6')}            Specifies which IPv6 address to be used. Defaults to DNS resolve. (Optional)
* ${colors.yellow('--help')}            This help screen.
* ${colors.yellow('--h')}               Alias for --help.
        `);

        // end print
    }
}