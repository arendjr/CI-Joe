C.I. Joe Architecture
=====================

The C.I. Joe project consists of 3 parts working closely together to provide the
"C.I. Joe application":

 * __Master__. Whenever you run the ``joe.sh`` script, it starts the master
   process. This process hosts the web client and the REST API and manages the
   slaves.
 * __Slaves__. Zero or more slaves may be running which provide the ability of
   running actual jobs. Slave processes can be started automatically by the
   master, or started manually by running the ``slave.sh`` script. The default
   configuration provides for a single local slave which is started
   automatically when you start the master.
 * __Web client__. The actual user-interface of C.I. joe is provided by a
   single-page HTML5 web client, which is started when you navigate your browser
   to the hostname and port on which the master process is listening
   (http://localhost:8080, by default).


Communication
-------------

The master and its slaves communicate through a persistent Socket.io connection.
The master issues which jobs should be run by the slaves, while the latter do
the actual work and report back the results.

The web client consumes the REST API provided by the master in order to query
information, start jobs, etc.. In addition, the web client also maintains a
Socket.io connection to the master which the master uses to inform the client of
real-time status updates about running jobs.


Data model
----------

C.I. Joe uses a bit an unusual data model for defining the jobs that need to be
run. The idea behind this model is that it is flexible, easy to get started with
and easy to debug (from a user's perspective). However, this flexibility does
come with a bit of added complexity (and some required out-of-the-box thinking)
for the server's internals.

 * __Missions__ define a single unit of work for a job to execute. They specify
   a shell script to execute, and an optional timeout.
 * A __job__ is the single execution of a mission's script. It can be scheduled,
   and after execution it is archived with the results and output of the script.
 * __Workspaces__ provide a directory in which to execute jobs. The directory
   may be plain empty, or be a checkout from a version control system.
 * __Campaigns__ provide a way to execute multiple missions at once, either in
   serial fashion or in parallel. To do so, campaigns are divided into
   __phases__, with phases being executed serially, and each phase containing
   one or more missions to be executed in parallel.

Missions, campaigns and workspaces are all managed independently and have
various many-to-many relations among them. Missions and campaigns are managed
explicitly by the user, whereas workspaces are managed in a more implicit manner
as part of configuring missions and campaigns.

Missions can be created by the user as a stand-alone mission or as part of a
campaign. If the mission is created stand-alone, it may be assigned a default
workspace. If it is created as part of a campaign, the default workspace is left
empty, but an association is made between the mission and one of the campaign's
workspaces and the mission (by default, campaigns have only one workspace, and
the association is made transparently to the user).

When a mission is executed stand-alone, it is executed in its default workspace.
If there is no default workspace assigned, but the mission is only assigned with
a single campaign, it is executed in the workspace assigned by that campaign. If
there is no default workspace and there are zero or more than one campaigns
associated with the mission, the user is asked to choose or create a workspace
to execute in.

Campaigns are always created stand-alone, after which the user can create
multiple phases and each phase can be associated with one or more missions. For
every campaign, a single workspace is created automatically, but multiple can be
configured. Whenever a mission is associated with a campaign, it is associated
with this workspace, or the user is asked to choose a workspace if there are
multiple in the campaign.

Whenever a workspace is disassociated with a mission or campaign and no longer
referenced by any other mission or campaign, it is removed automatically.


Source directories
------------------

Both master and slave are in the same source directories in ``app/`` and
``lib/``. This allows for easy code sharing between the two, though it sometimes
requires a bit of awareness about whether the code you're working with is
being used from the master or slave perspective. For example, both master and
slave use the file ``lib/slave.js`` to represent a slave, but each follow their
own code path for establishing a connection depending on whether it's used from
the master or the slave process. Both master and slave have their respective
entry point in the ``app/`` directory.

The web client is entirely separated into the ``www/`` directory.
