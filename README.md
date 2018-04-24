# DigitalOcean Developer Firewall


**A tool for developers to easily configure firewalls and gain access to their servers when using DigitalOcean cloud firewalls.**

<img src="https://i.imgur.com/XggRPgd.png">

## Abstract

#### Background

Droplets and cloud servers are often targeted by hackers. As long as you have been running a server with a publicly accessible SSH daemon, a MySQL database server or similar software, you've probably already have been targeted.

#### The problem

Hackers have gotten more sophisticated tools over the years, enforcing developers and system administrators to enforce stricter security policies. Running a firewall where you restrict access to only certain IP's is a solution to many of these issues, but can often be a hassle to manage and update - especially for developers who are *on the fly* and switching IP address every few hours. 

The issue for probably many (speaking of personal experience) is that security is often compromised to enhance comfort (e.g. leaving a firewall open from all addresses).

#### The solution

DigitalOcean offers a Cloud Firewall that acts as a firewall outside your server, and can be fully configured using their [API](https://developers.digitalocean.com/documentation/v2/). This tool utilizes this API to automatically configure the cloud firewalls to accept connections from your current IP address (both IPv4 and IPv6). It will automatically remove old IP addresses from the firewall as well to improve security. 

The goal of this tool is to **encourage better security** by making the process of managing firewalls and server access management a less of an inconvenience.

## Software state

⚠️ Please note that the software is currently not in final form and will most likely be subject to changes in a short time frame (*see roadmap*).

## Installation

You can get started by cloning the repository or downloading it in ZIP-form.


## Usage

### 1. Prepare your DigitalOcean-account

Go to [DO Firewalls](https://cloud.digitalocean.com/networking/firewalls). Create a firewall called `allow-developer`. You can also use other names, but then you have to specify the name either in `./config.json` or as a argument option. See below for the argument options. 

 Add it to your tags or droplets. Make sure that there are at least 1 outbound rule and 1 that matches 127.0.0.1. *(This is done because firewalls needs at least one active rule, and this tool would delete all entries causing an error).*

It should look something like this:

<img src="https://i.imgur.com/EGYSjeT.png" style="max-height: 200px;"> 

Once you have created a firewall, assigned it to your tags and/or droplets and created the "base-rule" for 127.0.0.1, you're done on the server side.

**NB**: This firewall should only be used as a "developer firewall". Your droplets can have multiple firewalls assigned and this program is designed to utilize this design pattern. **This program therefore deletes all rules that do not match the current IP-address(!)**. 

### 2. Configure the program

1. Create `./config.auth.json` file with the following content:

	``` JSON
	{
	    "bearer-token": "YOUR-DIGITALOCEAN-BEARER-TOKEN-HERE"
	}
	```

2. Configure `./config.json` to reflect the rules your firewall should have. You can use port ranges as well as ports. See the DigitalOcean API for details. (Default are SSH, 22 and MySQL, 3306). 

### 3. Run 

Run `node app.js`

or e.g:

Run `node app.js --firewall-name="your-personal-firewall"`

The program should now delete records in the firewall that do not match your current IPV4/IPV6 address (or 127.0.0.1) and create new ones for your current address.

**Your output should look like this:**

<img src="https://i.imgur.com/jE8sBGm.png" style="max-height: 200px;">

### Argument Options
The following argument options can be used. Please note that argument options are case sensitive.

|Argument|Description|Default value|
|:--------|:-----------|:-------------|
|`--firewall-name`|Specifices which firewall should be used. This could be useful when multiple developers are working on the same server from different locations (ie. using one fw each).|Will fall back to firewall_name property in `./config.json`<br><br>If no property is found default value will be `allow-developer`|
|`--IPv4`|Specifies IPv4 address to be used.|Will automatically try to resolve using [public-ip](https://www.npmjs.com/package/public-ip) which uses DNS lookups (might not be suitable for all public networks such as airports).|
|`--IPv6`|Specifies IPv4 address to be used.|Will automatically try to resolve using [public-ip](https://www.npmjs.com/package/public-ip) which uses DNS lookups (might not be suitable for all public networks such as airports).|

### Whitelist Argument Options
These arguments aren't required for the usage for the program itself, but are used to configure a whitelist of IP's that always will be kept on the firewall. This is useful if multiple developers are using the same firewall or e.g. you always want your home and office network connections to be whitelisted.

You can always make adjustments directly to the `./whitelist.json` file as well (these options are simply an interface for the json-file). 

|Argument|`--ip` flag|`--fw-name` flag|Description|
|:--------|:-----------|:-----------|:-----------|
|`--wh-add`|Required|Optional|Adds an IP to the whitelist. If no `fw-name` is supplied the IP will be added to global whitelist.|
|`--wh-remove`|Required|Optional|Removes an IP from the whitelist. If no `fw-name` is supplied the IP will be removed from the global whitelist.|
|`--wh-clear`|No|Optional|If `fw-name` is specified, the supplied firewall whitelist will be cleared. If not, the entire whitelist will be cleared.|
|`--wh-list`|No|Optional|If `fw-name` is specified, the supplied firewall whitelist will be listed. If not, the entire whitelist will be listed.|

#### NB: About `./whitelist.json`
The file should be created automatically upon using any of the above arguments. If you wish to create or modify it manually, be sure to use the following format:

```
{
    "global": [ip1, ip2, ...],
    "firewalls": {
    	"fw1": [ip1, ip2, ...],
    	"fw2": [ip1, ip2, ...]
    }
}
```

Default file:

````JSON
{
    "global": [],
    "firewalls": {}
}
````



## Roadmap 

* <strike>Add support for custom firewall name</strike> Done
* <strike>Add "whitelist" of IP's that should not be deleted </strike> Done
* Update help screen to include whitelist info. (./modules/Helper)
* Make the tool available from terminal
* Either add bearer token as a argument/flag or through environment variables. (Or something like that)
* Support different sets of rules (different rules for different firewalls)
* <strike>Support multiple firewalls.</strike> Done (See `--fw-name` and whitelist)



## Contribution

Feel free to contribute. A contribution guideline will be developed at some point when I have time.. Contributors are more than welcome at any time. 

## License
MIT Copyright Erlend Ellingsen 2018. See LICENSE.
