# MONARC Backoffice Angular Module

## Installing
In order to install the frontend part of the backoffice module, run the following commands in your MONARC skeleton root path:
```
npm install --save git+ssh://gogs@rhea.netlor.fr:2222/monarc/ng_backoffice.git
./scripts/link_modules_resources.sh
```

This module has a dependency with the MONARC Backoffice Zend Module and may not work without it.

## Updating
Simply run ```npm update``` to update the existing modules to the latest versions.

