# code-builder
[![Build Status](https://travis-ci.org/bninni/code-builder.svg?branch=master)](https://travis-ci.org/bninni/code-builder)

Anonymously execute external functions from another script

## Install
```
npm install code-builder
```
or
```
npm install -g code-builder
```

Then import the module into your program:

```javascript
var CodeBuilder = require('code-builder');
```

## Background

CodeBuilder allows you to build a script which runs in a separate context while also executing external code at specified locations.

The external code is inaccessible from anywhere else within the script

## Usage

**CodeBuilder( _fn_ )**
  * _fn_ (**Function**) - _Optional_ - The function used to create the Script

The input function is run a context of object containing three methods:

To append raw Javascript code to the Script:

**this.addString( _str_ )**
  * _str_ (**String**) - The string representation of raw Javascript code to append to the Script
  
To append an external function call to the Script:
  
**this.addFunction( _fn, str_ )**
  * _fn_ (**Function**) - The external function to call at the current location in the Script
  * _str_ (**String**) - _Optional_ - The string representation of raw Javascript code to place inside the call parenthesis
  
To append an external Script execution to the Script:
  
**this.addScript( _fn, str_ )**
  * _fn_ (**Function**) - The function used to create the new Script, whhich will be placed at the current Location in the Script
  * _str_ (**String**) - _Optional_ - The string representation of raw Javascript code to place inside the call parenthesis

It will return an Object with the following properties:

**Builder** - Object containing the above three methods
  * **Builder.addString( _str _)**
  * **Builder.addFunction( _fn, str_ )**
  * **Builder.addScript( _fn, str_ )**

To run the Script in a certain context:
  
**run( _context_ )**
  * _context_ (**Object**) - _Optional_ - An objecting containing any values you want to assign as global variables within the Script
  * **Returns** the result of the last statement in the Script
  

## Examples

**Executing a Script**

```javascript
var fn = function(){
  this.addString('arr = [1,2,3]')
}

CodeBuilder( fn ).run() == [1,2,3]
```

```javascript
var fn = function(){
  this.addString('function go(){ return [1,2,3] }')
  this.addString('go()')
}

CodeBuilder( fn ).run() == [1,2,3]
```

**Executing a Script with a Context**

```javascript
var fn = function(){
    this.addString('function go(){ return [a,b,c] }')
    this.addString('go()')
  },
  context = {
    a : 1,
    b : 2,
    c : 3
  }

CodeBuilder( fn ).run( context ) == [1,2,3]
```

**Executing an External Function**
```javascript
var result,
  setResult = function( value ){
    result = value;
  },
  fn = function(){
    this.addString('function go(){ return [1,2,3] }')
    this.addFunction( setResult, 'go()' );
  }

CodeBuilder( fn ).run()

result == [1,2,3,4]
```

**Externally Manipulating Script Objects**

```javascript
var updateArray = function( arr ){
    arr.push(4)
  },
  fn = function(){
    this.addString('function go(){ return [1,2,3] }')
    this.addString('arr = go()')
    this.addFunction( updateArray, 'arr' );
    this.addString('arr')
  }

CodeBuilder( fn ).run() == [1,2,3,4]
```

**Executing External Scripts**

```javascript
var fn1 = function(){
    this.addString('var result;');
    this.addString('function double( str ){ return str + str }')
    this.addScript( fn2, 'double( name )' );
    this.addString('result;');
  },
  fn2 = function( str ){
    this.addString('result = "That name is ');
    
    if( str.length > 15 ){
      this.addString('Long"')
    }
    else{
      this.addString('Short"')
    }
  },
  code = CodeBuilder( fn );
  
code.run({ name : 'Veronica' }) == 'That name is Long'
code.run({ name : 'Fred' }) == 'That name is Short'
```

# License

## MIT