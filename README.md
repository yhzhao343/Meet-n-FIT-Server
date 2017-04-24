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
    * [Setting up Server Code](#setting-up-server-code)
    * [Setting up Client Code](#setting-up-client-code)

## Release Notes
### New Software Features
### Known Bugs and Defects

## Install Guide
The application consists of three part: database, server side and client side. This install guide will cover setting up the database, setting up and running the server side code and running the client side code in a web browser mobile simulator. NOTE: This install guide aims for setting up the environment for futher developing. Not for production deployment. This guide will primarily target macOS and Linux but should work on Windows with some modification. This guide aims to guide people with limited coding experience to set up the projec

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
    4. In the terminal, run the line below to ssh remote login to the EC2 instance:
        ```sh
        ssh -i ~/.ssh/fit.pem ubuntu@[your EC2 Public DNS (IPv4)]
        ```

        You can copy your EC2 public DNS from the EC2 console. It should look like something like this: ec2-54-202-16-150.us-west-2.compute.amazonaws.com.
        Choose okay if you see warning

        *Further readings/guide to refer o if you have trouble*:
            [Accessing linux instances](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstancesLinux.html)
* Install MongoDB on the EC2 instance
    After you ssh into the EC2 instance run each of the lines below one by one:

    1. Import the public key used by the package management system
        ```sh
        sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
        ```

    2. Create a list file for MongoDB
        ```sh
        echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
        ```

    3. Reload local package database
        ```sh
        sudo apt-get install -y mongodb-org
        ```

    4. Start the mongoDB server
        ```sh
        sudo service mongod start
        ```

        *Further readings/guide to refer o if you have trouble*:
            [install mongoDB on Ubuntu](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)

* Configure the database
    After ssh remote log in to the EC2 instance

    1. log in to the database by running:
        ```
        mongo
        ```

    2. Create a new database:
        ```
        use team_fit_test
        ```
        you should see the prompt `swiched to db team_fit_test`

    3. Create a new db user with user name: "FIT" and password:"7FITpassword" :
        ```js
        db.createUser(
            {
                user: "FIT",
                pwd: "7FITpassword",
                roles: ["readWrite"]
            }
        )
        ```

    4. exit mongo by pressing `ctrl+c`
    5. Enable oplog of the database. Run `sudo nano /etc/mongod.conf` to change the setting of mongoDB. Find the line `#replication` and change it to:
        ```
        replication:
          replSetName: rs0
          oplogSizeMB: 4096
        ```

    6. Restart mongoDB:
        ```
        sudo service mongod restart
        ```

    7. Log out the remote ssh session by running `exit`
    
### Setting up Server Code:
    1. Install node.js. Go to [nodejs.org](https://nodejs.org/en/) to download and install the latest version of node.js(7.9.0 when this document is written). Follow the prompt of the installer to install

    2. 

### Setting up Client Code







