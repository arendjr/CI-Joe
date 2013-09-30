C.I. Joe
========

C.I. Joe - Because knowing is half the battle!

 * **[Goals](#goals)**
 * **[Roadmap](#roadmap)**
 * **[FAQ](#faq)**
 * **[License](#license)**


Goals
-----

C.I. Joe attempts to make
[Continuous Integration](http://en.wikipedia.org/wiki/Continuous_integration) a
satisfying and manageable process, rather than a painful, necessary evil which
takes days to properly set up. To achieve this, two design goals have been set:

 * C.I. Joe should come in an __easy-to-use package which takes zero
   configuration to set up__ in its basic form. No additional plugins should be
   necessary to enable such core features as checking out a project from version
   control. Sane defaults should be chosen to make sure anyone can get a basic
   project building without wasting hours on obscure settings.

 * C.I. Joe will sport a clean, no-nonsense user interface which focusses on
   what really matters while still leaving advanced configuration easily
   accessible. __Simplicity is better than complexity.__ C.I. Joe will assume
   that whoever is setting up a project knows best how to build his or her own
   project and will not try to offer complex build rules just to trigger a
   build which can easily be started by whatever build system the project is
   already using.

Finally, while the above may sound great to the rookies, C.I. Joe should also
accomodate the veterans:

 * While C.I. Joe may not specifically cater to every workflow possible, it is
   designed to __grow with the experience of its user__. Under the hood it
   features a complete master-slave architecture that allows for advanced
   features like parallel builds and even inter-build dependencies. Users do not
   require any knowledge of these features to get up and running, but they are
   there for the taking when that extra flexibility is required.


Roadmap
-------

Because C.I. Joe is currently in planning/pre-alpha phase, all its upcoming
features are still on the roadmap:

 * **Master-slave architecture.** This allows for running jobs in parallel,
   optionally on multiple build machines.
 * **Configurable pre-conditions.** When a job requires certain pre-conditions
   to be met before it can be run (a Selenium server should be running, a
   Vagrant machine should be up, ...) this should be easily configurable.
   Optionallty, you can configure the command to execute to satisfy the
   pre-condition.
 * **Excellent console support.** Jobs are run by triggering one or more console
   commands. This means C.I. Joe will be able to properly display console
   output, including ANSI colors. An interactive console is provided for
   on-the-spot debugging of jobs.
 * **Real-time updates.** Other Continuous Integration solutions tend to think
   it's acceptable to have to refresh the whole page in order to get updates
   about job statusses. C.I. Joe doesn't think so.
 * **Dashboard.** Having a properly running Continuous Integration server is
   something to be proud of. More than just an overview of job statusses, C.I.
   Joe will provide a good-looking (customizable) dashboard that makes for a
   nice and informative wall decoration in the office.
 * **Git and Subversion support.** Other version control systems may be added
   later, but C.I. Joe 1.0 will come with full support for Git and Subversion
   out of the box.
 * **All or nothing security.** C.I. Joe will feature a simple and plain
   security model with no advanced role management. Users will either have full
   access, including administration rights, or no access at all. The only step
   in between is choosing whether people may or may not view the dashboard
   without logging in.


F.A.Q.
------

__Q.__ Isn't there some other continuous integration project called CI Joe?

__A.__ Yes, [there is](https://github.com/defunkt/cijoe). When I came up with
the name C.I. Joe, I did a little research to see if the name was already used
or not and stumbled upon Chris Wanstrath's project. But as it happens, that
project has not seen any maintenance in the past 2 years. I've reached out to
Chris to ask if I could use the name, but got no response. Now, given that there
are no trademark issues, the old project had been abandoned and had never been a
household name to begin with, I figured the name could be reused without too
much confusion or too many feelings hurt. CI Joe is dead, long live C.I. Joe!


License
-------

This software is licensed under GPLv3.

For details, see LICENSE.GPL.txt.
