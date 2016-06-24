var CodeBuilder = require('../index'),
	assert = require('assert'),
	vows = require('vows');

vows.describe('Test').addBatch({
	'Executes a Script' : function(){
		var fn = function(){
				this.addString('arr = [1,2,3];')
			},
			result = CodeBuilder( fn ).run(),
			expect = [1,2,3];
		
		assert.deepEqual( result, expect )
	},
	'Exectutes multiple statements' : function(){
		var fn = function(){
				this.addString('arr = [1,2,3];');
				this.addString('arr.concat( [4,5,6] );')
			},
			result = CodeBuilder( fn ).run(),
			expect = [1,2,3,4,5,6];
		
		assert.deepEqual( result, expect )
	},
	'Executes a Script with a context' : function(){
		var fn = function(){
				this.addString('arr = [a,b,c];')
			},
			result = CodeBuilder( fn ).run({a:1,b:2,c:3}),
			expect = [1,2,3];
		
		assert.deepEqual( result, expect )
	},
	'Exectutes external functions' : function(){
		var result,
			setResult = function( value ){
				result = value;
			},
			fn = function(){
				this.addFunction( setResult, '[1,2,3]' );
			},
			expect = [1,2,3];
		
		CodeBuilder( fn ).run()
		
		assert.deepEqual( result, expect )
	},
	'The name of the script is undefined' : function(){
		var expect,
			fn = function(){
				this.addString('__codeBuilder')
			},
			result = CodeBuilder( fn ).run();
		
		assert.deepEqual( result, expect )
	},
	'Redefining name of the script will not break anything' : function(){
		var result,
			setResult = function( value ){
				result = value;
			},
			fn = function(){
				this.addString('var __codeBuilder = 100')
				this.addFunction( setResult, '__codeBuilder' )
			};
			
		CodeBuilder( fn ).run();
		
		assert.deepEqual( result, 100 )
	},
	'Redefining name of the script will not break anything in strict mode' : function(){
		var result,
			setResult = function( value ){
				result = value;
			},
			fn = function(){
				this.addString('"use strict"; function go(){ var __codeBuilder = 100;')
				this.addFunction( setResult, '__codeBuilder' )
				this.addString('}; go()');
			};
			
		CodeBuilder( fn ).run();
		
		assert.deepEqual( result, 100 )
	},
	'Exectutes external functions in scripts context' : function(){
		var result,
			setResult = function( value ){
				result = value;
			},
			fn = function(){
				this.addString('arr = [1,2,3];');
				this.addFunction( setResult, 'arr' );
			},
			expect = [1,2,3];
		
		CodeBuilder( fn ).run();
		
		assert.deepEqual( result, expect )
	},
	'Can manipulate objects in that context' : function(){
		var number = 4,
			update = function( value ){
				value.push(number)
			},
			fn = function(){
				this.addString('arr = [1,2,3];');
				this.addFunction( update, 'arr' );
				this.addString('arr');
			},
			result = CodeBuilder( fn ).run(),
			expect = [1,2,3,4];
		
		assert.deepEqual( result, expect )
	},
	'Can run another script' : function(){
		var fn1 = function(){
				this.addString('var result, number = 1;');
				this.addScript( nestedFn, 'number' );
				this.addString('result;');
			},
			fn2 = function(){
				this.addString('var result, number = 2;');
				this.addScript( nestedFn, 'number' );
				this.addString('result;');
			},
			nestedFn = function( number ){
				if( number < 2 ){
					this.addString('result = "less than 2"')
				}
				else{
					this.addString('result = "greater than 1"')
				}
			},
			result1 = CodeBuilder( fn1 ).run(),
			result2 = CodeBuilder( fn2 ).run();
		
		assert.deepEqual( result1, 'less than 2' )
		assert.deepEqual( result2, 'greater than 1' )
	},
	'Nested Scripts and Functions' : function(){
		var add = function(a,b){ return a + b },
			mult = function(a,b){ return a * b },
			fn1 = function(){
				this.addString('var arr = [], hi = 10, lo = 5;')
				this.addString('function go(){ arr.push(');
				this.addFunction(add, 'hi,lo');
				this.addString('+');
				this.addFunction(mult, 'hi,lo');
				this.addString(')}');
				this.addString('go();')
				this.addScript( fn2, 'hi,lo' )
				this.addString('arr')
			},
			fn2 = function( hi, lo ){
				this.addString('arr.push(' + (hi-lo) + ');')
				this.addString('arr.push(');
				this.addFunction( add, 'hi,lo' );
				this.addString(');');
				this.addScript( fn3 )
			},
			fn3 = function(){
				this.addString('arr.push(');
				this.addFunction( mult, 'hi,lo' );
				this.addString(')');
			},
			result = CodeBuilder( fn1 ).run(),
			expect = [65, 5, 15, 50];
			
		assert.deepEqual( result, expect );
	}
}).exportTo(module)
