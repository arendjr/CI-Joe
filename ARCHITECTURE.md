C.I. Joe Architecture
=====================

The C.I. Joe project consists of 3 parts working closely together to provide the "C.I. Joe application":

 * __Master__. Whenever you run the joe.sh script, it starts the master process. This process hosts the web client and the REST API and manages the slaves.
 * __Slaves__. Zero or more slaves may be running which provide the ability of running actual jobs. Slave processes can be started automatically by the master, or started manually by running the slave.sh script. The default configuration provides for a single local slave which is started automatically when you start the master.
 * __Web client__. The actual user-interface of C.I. joe is provided by a single-page HTML5 web client, which is started when you navigate your browser to the hostname and port on which the master process is listening (http://localhost:8080, by default).

Communication
-------------

The master and its slaves communicate through a persistent Socket.io connection. The master issues which jobs should be run by the slaves, while the latter do the actual work and report back the results.

The web client consumes the REST API provided by the master in order to query information, start jobs, etc.. In addition, the web client also maintains a Socket.io connection to the master which the master uses to inform the client of real-time status updates about running jobs.

Source directories
------------------

Both master and slave are in the same source directories in app/ and lib/. This allows for easy code sharing between the two, though it sometimes requires a bit of consciousness about whether the code you're working with is being used from the master or slave perspective. For example, both master and slave use the file lib/slave.js to represent a slave, but each follow their own code path for establishing a connection depending on whether it's used from the master or the slave process. Both master and slave have their respective entry point in the app/ directory.

The web client is entirely separated into the www/ directory.
