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

## Version 1.0 Release Notes
### New Software Features
###### Account Management
When a user downloads the Meet 'n' Fit app or visits the website for the first time, he must first create an account. An account requires a first name, last name, unique username, email, and password. It's perfectly okay for users to share duplicate first names, last names, or emails, because they can be identified by their unique username.
When the user returns to the app after creating an account, he will use his username and password to log in. If he chooses the 'remember me' option, he will be logged in automatically on subsequent visits to the app or site.
If the user wants to change his password, once logged in he can visit his Profile (described in the Profiles section) and clicking 'Settings' to view the Settings Page. This page will have a 'Change Password' option.
###### Profiles
Once a user has created an account and logged in, he can edit his profile to set himself apart from other Meet 'n' Fit users. There are two elements of a user's profile: **Bio** and **Fitness Preference**. 
The **Bio** is simply a short blurb which can include anything that will help other users get to know him better. 
**Fitness Preference** is the primary way for users to communicate their fitness interests. A user is given 10 tokens to allocate in any combination into five categories: Strength, Outdoors, Flexibility, Nutrition, and Endurance. For example, if a user has joined Meet 'n' Fit primarily to find hiking buddies, he might put all 10 of his tokens into the 'Outdoors' category. If he is more interested in all-around fitness, he might put 2 tokens into each category.
A user can visit the Settings Page by viewing his own profile and clicking 'Settings'. This page allows him to log out or change his password, and contains placeholder links for several future features such as editing account name and email and toggling the messaging feature.
A user can visit his friend's profiles from the Friends Page (described in the Friend Management section). On his friend's profiles he will see an additional option to send a message to that friend.
###### Discover Page
The primary feature of Meet 'n' Fit is the Discover Page. This is the first page a user sees when he logs into the app (or when he opens the app, if he has already logged in and used the remember me feature). This page shows a list of all of the nearby Meet 'n' Fit users. These users are labelled with their username, their fitness preference, and their distance. This allows a user to quickly evaluate which nearby users share similar fitness interests, while maintaining some anonymity until both users have agreed to be friends. If a user sees someone whose fitness preferences align with his own, he can send that user friend request. This feature will be discussed in more detail in the Friend Management section.
A user also has the option to view nearby users in a Map view, in order to see more clearly where they are located relative to him. In this view, users are marked with pins which display the relevant username when tapped or hovered over.

###### Friend Management
###### Messaging
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

1. **Installing Running Environment:** The code runs on node.js. To install node.js. Go to [nodejs.org](https://nodejs.org/en/) to download and install the latest version of node.js(7.9.0 when this document is written). Follow the prompt of the installer to install

2. **Download the source code:** The source code should be provided in a zip file. Just unzip the folder. Or you can download it from our repository. Open a terminal, `cd [your desired saving location]` , run `git clone https://github.com/yhzhao343/Meet-n-FIT-Server.git`. You should see a Meet-n-FIT-Server folder. Also, copy the provided `config` folder into the `Meet-n-FIT-Server` folder. 

3. **Change the config file to point to the new dataase:** In the config folder, in the file `config.js`, you will see a json object that contains the database connection string. Change the field 'db_connect_string' and 'oplog_connect_string' to reflect your current database address:

```js
{
    'db_connect_string': 'mongodb://[user_name]:[password]@[EC2 instance DNS address]/[db_name]',
    'oplog_connect_string': 'mongodb://[EC2 instance DNS address]/local'
}
```

for instance:

```js
{
    'db_connect_string': 'mongodb://FIT:7FITpassword@ec2-54-202-16-150.us-west-2.compute.amazonaws.com/team_fit_test',
    'oplog_connect_string': 'mongodb://ec2-54-202-16-150.us-west-2.compute.amazonaws.com/local',
}
```

4. **Installing library dependencies** `cd` into the `Meet-n-FIT-Server` folder

### Setting up Client Code







