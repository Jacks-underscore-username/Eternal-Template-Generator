### Get mixins working (again)
* ~~They seem to work on fabric but not neo/forge now???~~
* They were disabled for > 1.20.4 for some reason...
### Create a gradle task to launch each version in order
* I might have to spawn new gradle instances???
* Save the logs of each version as files for bulk testing.
### Make gametests work
* What are these?
### Auto remap the template for each mapper
### Create the companion mod (Eternal)
* ...
### Make AWs / ATs work
* Are they the same?
* Can I make yet another format that will get compiled down to both AWs and ATs?
### Fix the github action
### Make a module system for the template
* (Bad idea)
* Have a basic dependency system so modules can build off of other modules.
* For sure have a search system.
* And a tag system(?)
# Create automated tests for lots of versions for the template to see if they actually work
* (Worse idea)
* Expand it to also try all the module variations.
* (Even WORSE idea)
# See if I can run mc in a vm in a browser(?)
* (Obscenely bad idea)
* So the gradle tests can run in the browser.
* And so it can do brute force testing to fix some bugs before downloading the template.

1.16 fabric