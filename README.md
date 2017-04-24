# Meet-n-FIT-Server
Meet ‘n’ Fit is a location-based service that allows fitness minded user to connect, talk, and meet up with workout partners with similar interests.

This repository contians the server side code of Meet-n-FIT. For the client side code, go to [Meet-n-FIT-Client](https://github.com/yhzhao343/Meet-n-FIT-Client). This repository also handles all the project management and releases of both the server side code and the client side code.
## Overview
* [Release Notes](#release-notes)
    * [New Software Features](#new-software-features)
    * [Known Bugs and Defects](#known-bugs-and-defects)
* [Install Guide](#install-guide)
    * [Prerequisite](#prerequisite)
    * [Setting up the Database](#setting-up-the-database)

## Release Notes
### New Software Features
### Known Bugs and Defects

## Install Guide
The application consists of three part: database, server side and client side. This install guide will cover setting up the database, setting up and running the server side code and running the client side code in a web browser mobile simulator. NOTE: This install guide aims for setting up the environment for futher developing. Not for production deployment. This guide will primarily target macOS and Linux but should work on Windows with some modification.

### Prerequisite:
* Basic linux command lines skills.
* An Amazon Web Services account.
* Latest OS (macOS or Linux is preferred).

### Setting up the database
For setting up the database, you need to first create an Amazon EC2 instance to host the database, then ssh remote login in to the instance, and then install mongoDB on the instance
* Starting an AWS EC2 Instance to host the database
    1. Login into your AWS account
    2. From the console dashboard, **choose Launch Instance**
    3. The **Choose an Amazon Machine Image (AMI)** page shows server OS options. Select **Ubuntu Server 16.04 LTS**. Click Select.
    4. The **Choose an Instance Type** page shows all the instances available. Select t2.micro. Then, click **Review and Launch**.
    5. On the **Review and Launch page**, under **Security Groups**, configure the security group. You can create a new one or use a default one.
    6. On the Review Instance Launch page, choose **Launch**.
    7. When prompted for a key pair, select **Create a new key pair**, enter a name for the key pair, and then choose Download Key Pair. For instance the name is 'fit' and the key pair file name should be 'fit.pem'. Download the file into your Download folder.
    8. A confirmation page lets you know that your instance is launching. Choose **View Instances** to close the confirmation page and return to the console.
    
    *Further readings/guide to refer to if you have trouble*:
        [get set up for amazon ec2](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/get-set-up-for-amazon-ec2.html) and [EC2 get started](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)

* logging into the EC2 instance
    1. In your AWS EC2 console, click **Running Instances** to go to the instance screen,  click **fit** to goto **security group settings**. Click **inbound** and then **edit** to change inbound rules
    2. Add a rule of protocol type ssh, port 22, source->Custom->My IP, click **save**
    3. Open a terminal window, cd into the Download folder. Run the following command to change the access permission of the file
        ```sh
        chmod 600 ./fit.pem
        ```

        And then copy the file to the ~/.ssh folder:

        ```sh
        cp ./fit.pem ~/.ssh
        ```
    4. In the terminal, run:
        ```sh
        ssh -i ~/.ssh/fit.pem ubuntu@[your EC2 Public DNS (IPv4)]
        ```

        You can copy your EC2 public DNS from the EC2 console. It should look like something like this: ec2-54-202-16-150.us-west-2.compute.amazonaws.com 
        Choose okay if you see warning

        *Further readings/guide to refer o if you have trouble*:
            [Accessing linux instances](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstancesLinux.html)







