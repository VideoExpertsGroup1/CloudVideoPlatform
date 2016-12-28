# VXGServiceProvider

## How to build:
	
Please use gradle from command line:
	
		$ ./gradlew makeJar
		
After build you can find jar file in `library/build/VXGAccountProvider-0.0.1.jar`

Include in you prject:

* copy jar file to libs 
* add line to dependencies `compile fileTree(dir: 'libs', include: ['*.jar'])`
* Requariments VXGServiceProvider same version
