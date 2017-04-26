# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.5.1] - 2017-04-26

### Improvements
- 'onNavigation' and 'navigate' function callbacks are now passed an event object that includes the error reason.
- White listed urls are now automatically added to Windows 8.1 and Windows Phone 8.1 builds.

### Fixes
- Fixed onNavigation function not being callable.

## Implemented before 0.5.1
- Navigation
- Plugin proxying
- SSL certificate checking
- Permission handling