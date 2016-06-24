/*
Copyright 2016 Brian Ninni

TODO - need to fix bug where __codeBuilder gets reassigned from outside of the global context (i.e. inside a function)

*/
var vm = require('vm'),
	trace = require('stack-tracer'),
	name = '__codeBuilder';

/*
	To add javascript code (as a String) to this Script
	- str	(String)	The javscript code (as a String) to append to the Script
*/
function addString( str ){
	//Add to the current Script
	this.Script += str;
	//Increase the current line of the script based by the number of line breaks in the string
	this.line += str.split(/\r\n?|\n/).length-1;
}

/*
	To add an external function call to this Script
	- fn	(Function)	The function to call
	- args	(String) 	The javascript code (as a String) to place between the call parenthesis
*/
function addFunction( fn, args ){
	//Store the function to the Map based on the current line of the Script
	this.FunctionMap[ this.line ] = fn;
	
	//Replace undefined with empty string
	if( typeof args === 'undefined' ) args = '';
	
	//Always add a new Line before and after the name of the script so each appearance will be on a separate line
	//To get the global object:
	//	- if not in strict mode, then 'this' is the global object
	//	- if in strict mode, then 'this' is undefined, but eval cannot be overwritten
	//		- so run an indirect eval call to 'this' in global scope
	this.Builder.addString( '\neval( function(e){ return (this || e("this") ).' + name + '(\n' + args + ') }(eval) )\n' );	
}

/*
	To execute another script from within this Script
	- fn	(Function)	The script builder function to execute
	- args	(String)	The javascript code (as a String) to place between the call parenthesis
*/
function addScript( fn, args ){
	var ScriptList = this.ScriptList,
		//Create a function which will build a new Script and return the String
		script = function(){
			//Create a new Script
			var Code = new CodeObject( fn, ScriptList, arguments ),
				//Get the index of the Script in the ScriptList
				index = ScriptList.push( Code )-1;
			
			//Assign the index to the sourceURL to the Script can be identified by accessing the 'evalOrigin' property
			//This is so external function calls from within this script can be correctly mapped to the corresponding function
			Code.Builder.addString( '\n//@ sourceURL=' + index );
			
			//Return the Script string
			return Code.Script;
		};
	
	//Add this function to the Script
	this.Builder.addFunction( script, args );
}

/*
	To handle an external function when the Script is executed
	
	Finds the corresponding 'script' that the call came from, and executes the corresponding function based on the line the call occured
	
	If there is no matching script or function, then the call was not placed there by this module, so do nothing
*/
function getter(){
	var fn,
		evalTrace = __caller,
		script = this;
	
	//If the caller is native, then keep traversing until the first non-native caller is reached
	while( evalTrace.isNative ){
		evalTrace = evalTrace.caller;
	}
	
	//If the caller is within an 'eval' script, then it came from a nested script
	//so get the corresponding Script based on the 'evalOrigin'
	if( evalTrace.isEval ){
		script = this.ScriptList[ evalTrace.evalOrigin ];
		if( !script ) return this.valueInContext;
	}
	
	//Get the corresponding Function
	fn = script.FunctionMap[ evalTrace.line ];
	
	return fn || this.valueInContext;
}

/*
	To assign the given value as the current value in the context
*/
function setter( value ){
	this.valueInContext = value;
}

/*
	The CodeObject constructor 
*/
function CodeObject( fn, ScriptList, args ){
	
	//Initialize a ScriptList if one was not provided
	this.ScriptList = ScriptList;
	
	//Initialize the Script
	this.Script = '';
	
	//Offset the line count by 1 because a line break is always added before the function call
	this.line = 2;
	
	//Initialize the Function Map
	this.FunctionMap = [];
	
	//Create the Builder object and explicitly bind to this Object
	this.Builder = {	
		addString : addString.bind(this),
		addScript : addScript.bind(this),
		addFunction : addFunction.bind(this)
	}
	
	//Explicitly bind the getter/setter functions to this Object
	//Otherwise, it gets stripped of context when the Script is executed
	this.getter = getter.bind(this);
	this.setter = setter.bind(this)
	
	//If a function was provided, then execute in the context of the Builder with the given args
	if( typeof fn === 'function' ) fn.apply( this.Builder, args );
}

/*
	To run this Code in the given context
*/
CodeObject.prototype.execute = function( context ){

	//Initialize the value to be undefined
	this.valueInContext = void 0;
	
	//If the context was not provided as an object, then create as an Object
	if( typeof context !== 'object' ) context = {};
	
	//If the context is not already a vm Context, then convert to one
	if( !vm.isContext( context ) ) context = vm.createContext( context );
	
	Object.defineProperty( context, name, {
		get : this.getter,
		set : this.setter
	});
	
	//Execute the Scipt in the given context
	return vm.runInContext( this.Script, context );
}


/*
	The public class to create a Script
*/
function CodeWrapper( fn ){
	var Code = new CodeObject( fn, [], [] );
	
	return {
		Builder : Code.Builder,
		run : function( context ){
			return  Code.execute( context );
		}
	}
}

module.exports = CodeWrapper;