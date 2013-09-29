C.I. Joe
========

C.I. Joe - Continuous Integration never looked so good!

 * **[Goals](#goals)**
 * **[FAQ](#faq)**
 * **[License](#license)**


Goals
-----

C.I. Joe attempts to make
[Continuous Integration](http://en.wikipedia.org/wiki/Continuous_integration) a
satisfying and manageable process, rather than a painful, necessary evil which
takes days to properly set up. To achieve this, I've set two design goals:

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
