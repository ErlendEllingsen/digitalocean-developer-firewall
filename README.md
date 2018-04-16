# DigitalOcean Developer Firewall

## Abstract

#### Background

Droplets and cloud servers are often targeted by hackers. As long as you have been running a server with a publicly accessible SSH daemon, a MySQL database server or similar software, you've probably already have been targeted.

#### The problem

Hackers have gotten more sophisticated tools over the years, enforcing developers and system administrators to enforce stricter security policies. Running a firewall where you restrict access to only certain IP's is a solution to many of these issues, but can often be a hassle to manage and update - especially for developers who are *on the fly* and switching IP address every few hours. 

The issue for probably many (speaking of personal experience) is that securiy often compromised to enhance comfort (e.g. leaving a firewall open from all addresses).

#### The solution

DigitalOcean offers a Cloud Firewall that acts as a firewall outside your server, and can be fully configured using their [API](https://developers.digitalocean.com/documentation/v2/). This tool utilizes this API to automatically configure the cloud firewalls to accept connections from your current IP address (both IPv4 and IPv6). It will automatically remove old IP addresses from the firewall as well to improve security. 

The goal of this tool is to **encourage better security** by making the process of managing firewalls and server access management a less of an inconvencience.



## Installation


## License
MIT Copyright Erlend Ellingsen 2018. See LICENSE.
