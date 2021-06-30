(function(g){

	var OreoreLangage = function(){
		//standard output
		var _output_func = function(output){ console.log(output); };
		this.set_stdout_func = function(output_func){
			_output_func = output_func;
		};
		this.set_stdout_func(_output_func);
		this.stdout = function(output){
			_output_func.call(this, output);
		};
		//runtime valiables
		var _valiable = {};
		this.clear_valiable = function(){ _valiable = {}; };
		this.set_valiable = function(name, value){ _valiable[name] = value; };
		this.get_valiable = function(name){ return _valiable[name]; };
		//builtin functions
		var _funcs = {};
		this.clear_func = function(){ _funcs = {}; };
		this.set_func = function(name, func){
			if(_funcs[name])
			{ throw new Error("[RUNTIME]set_func: func " + name + " is already set."); }
			_funcs[name] = func;
		};
		this.exec_func = function(name, args){
			if(!_funcs[name])
			{ throw new Error("[RUNTIME]exec_func: func " + name + " is not set."); }
			try{ return _funcs[name].call(this, args); }
			catch(e){
				this.stdout(e);
				throw new Error("[RUNTIME]exec_func: function " + name + " raised an error.");
			}
		};
		this.set_alias = function(name, alias){
			if(!_funcs[name])
			{ throw new Error("[RUNTIME]set_alias: func " + name + " is not set."); }
			if(_funcs[alias])
			{ throw new Error("[RUNTIME]set_alias: func " + name + " is already set."); }
			_funcs[alias] = _funcs[name];
		};
		this.get_func_names = function(){ return Object.keys(_funcs); };
	};
	var ol = OreoreLangage;

	ol.prototype.parse = function parse(code){
		var _blocks = code.split('"'), blocks = [], _part = "";
		for(var i=0; i<_blocks.length; i++){
			_part += _blocks[i];
			if(_part.substr(-1)!=="\\"){
				blocks.push(_part);
				_part = "";
			}else{
				_part += '"';
			}
		}
		if(_part){ blocks.push(_part); }

		var names = this.get_func_names();
		names.sort(function(a, b){
			return  b.length - a.length;
		});
		var funcs=[
			function(code_part){
				_code = code_part.replace(/\(/g, "[").replace(/\)/g, "]").replace(/(\$\w+)/g, '"$1"');
				for(var i=0; i< names.length; i++){
					var name = names[i];
					_code = _code.split(name).join('"' + name + '"');
				}
				return _code;
			},
			function(str_block){
				return '"\\"' + str_block + '\\""';
			},
		], json = "", stree=[];
		for(var i=0; i<blocks.length; i++){
			json += funcs[i%2](blocks[i]);
		}

		json = "[" + json + "]";
		try{
			stree = JSON.parse(json);
			while(stree[0].length<=1){
				stree = stree[0];
			}
			return stree;
		}catch(e){
			this.stdout(json);
			this.stdout(e);
			throw new Error("[PARSE]exception is raised.");
		}
	};
	ol.prototype.proc_statement = function proc_statement(snode){
		if(snode instanceof Array){
			var _node = snode.concat();
			if(typeof(_node[0])=="string" && _node[0].match(/^:/)){
				var func = _node.shift();
				var args = _node;
				return this.exec_func(func, args);
			}else{
				var result = [];
				for(var i=0; i<_node.length; i++){
					result.push(this.proc_statement(_node[i]));
				}
				return result;
			}
		}else if(typeof(snode) == "string"){
			switch(snode.substring(0,1)){
			case "$"://valiable
				return this.get_valiable(snode);
			case '"'://string
				return snode.substring(1, snode.length-1);
			default:
				this.stdout(snode);
				throw new Error("[RUNTIME]unkown snode sentense.");
			}
		}else{
			return snode;//number?
		}
	};

	g.OreoreLangage = {
		class: OreoreLangage
	}

})(window);
(function(g){
	g.OreoreLangage = g.OreoreLangage || {};
	g.OreoreLangage.interpreter = function(instance){
		var ol = instance;
		ol.set_func(":out", function(args){
			var _value = this.proc_statement(args.shift());
			this.stdout(_value);
			return null;
		});
		ol.set_func(":let", function(args){
			var _name = args.shift();
			var _value = this.proc_statement(args.shift());
			this.set_valiable(_name, _value);
			return null;
		});
		ol.set_func(":true", function(args){
			return true;
		});
		ol.set_func(":false", function(args){
			return false;
		});
		ol.set_func(":loop", function(args){
			var running = args.shift();
			var execution = args.shift();
			while(!this.proc_statement(running)){
				this.proc_statement(execution);
			}
			return null;
		});
		ol.set_func(":eq", function(args){
			var a = this.proc_statement(args.shift());
			var b = this.proc_statement(args.shift());
			return a == b ? true : false;
		});
		ol.set_alias(":eq", ":=");
		ol.set_func(":lt", function(args){
			var a = this.proc_statement(args.shift());
			var b = this.proc_statement(args.shift());
			return a < b ? true : false;
		});
		ol.set_alias(":lt", ":<");
		ol.set_func(":gt", function(args){
			var a = this.proc_statement(args.shift());
			var b = this.proc_statement(args.shift());
			return a > b ? true : false;
		});
		ol.set_alias(":gt", ":>");
		ol.set_func(":add", function(args){
			var a = this.proc_statement(args.shift()) * 1;
			var b = this.proc_statement(args.shift()) * 1;
			return a + b;
		});
		ol.set_alias(":add", ":+");
		ol.set_func(":sub", function(args){
			var a = this.proc_statement(args.shift()) * 1;
			var b = this.proc_statement(args.shift()) * 1;
			return a - b;
		});
		ol.set_alias(":sub", ":-");
		ol.set_func(":mul", function(args){
			var a = this.proc_statement(args.shift()) * 1;
			var b = this.proc_statement(args.shift()) * 1;
			return a * b;
		});
		ol.set_alias(":mul", ":*");
		ol.set_func(":div", function(args){
			var a = this.proc_statement(args.shift()) * 1;
			var b = this.proc_statement(args.shift()) * 1;
			return a / b;
		});
		ol.set_alias(":div", ":/");
		ol.set_func(":sur", function(args){
			var a = this.proc_statement(args.shift()) * 1;
			var b = this.proc_statement(args.shift()) * 1;
			return a % b;
		});
		ol.set_alias(":sur", ":%");
		ol.set_func(":pow", function(args){
			var a = this.proc_statement(args.shift()) * 1;
			var b = this.proc_statement(args.shift()) * 1;
			return Math.pow(a, b);
		});
		ol.set_alias(":pow", ":^");
		ol.set_func(":fork", function(args){
			while(args.length >= 2){
				if(this.proc_statement(args.shift()))
				{ return this.proc_statement(args.shift()); }
				else{ args.shift(); }
			}
		});
		ol.set_alias(":fork", ":if");
		ol.set_func(":and", function(args){
			var a = this.proc_statement(args.shift());
			var b = this.proc_statement(args.shift());
			return a && b ? true : false;
		});
		ol.set_alias(":and", ":&");
		ol.set_func(":or", function(args){
			var a = this.proc_statement(args.shift());
			var b = this.proc_statement(args.shift());
			return a || b ? true : false;
		});
		ol.set_alias(":or", ":|");

		ol.run = function run(code){//TODO: additional valiable, functions
			var stree = this.parse(code);
			this.clear_valiable();
			//this.clear_func();
			return this.proc_statement(stree);
		};
		return ol;
	};
})(window);
/*
var ol = window.OreoreLangage.interpriter(new window.OreoreLangage.class);
//test for :out, expects "hello, world."
ol.run('(:out, "hello, world.")');//OK
//test for :let, expects "hello, world."
ol.run('((:let, $a, "hello, world."),(:out, $a))');//OK
//test for :true, expects true
ol.run('((:let, $a, (:true)),(:out, $a))');//OK
try{
	ol.run('((:let, $a, :true),(:out, $a))');//NG
}catch(e){
	console.log(e);
}
//test for :false, expects false
ol.run('((:let, $a, (:false)),(:out, $a))');//OK
try{
	ol.run('((:let, $a, :false),(:out, $a))');//NG
}catch(e){
	console.log(e);
}

//test for :add, expects 3
ol.run('((:out, (:add, 1, 2)))');//OK
ol.run('((:let, $a, 1),(:let, $b, 2),(:out, (:add, $a, $b)))');//OK
//test for :sub, expects 9
ol.run('((:out, (:sub, 10, 1)))');//OK
ol.run('((:let, $a, 10),(:let, $b, 1),(:out, (:sub, $a, $b)))');//OK
//test for :mul, expects 56
ol.run('((:out, (:mul, 8, 7)))');//OK
ol.run('((:let, $a, 8),(:let, $b, 7),(:out, (:mul, $a, $b)))');//OK
//test for :div, expects 8
ol.run('((:out, (:div, 16, 2)))');//OK
ol.run('((:let, $a, 16),(:let, $b, 2),(:out, (:div, $a, $b)))');//OK
//test for :pow, expects 256
ol.run('((:out, (:pow, 16, 2)))');//OK
ol.run('((:let, $a, 16),(:let, $b, 2),(:out, (:pow, $a, $b)))');//OK
//test for :sur, expects 1
ol.run('((:out, (:sur, 7, 3)))');//OK
ol.run('((:let, $a, 7),(:let, $b, 3),(:out, (:sur, $a, $b)))');//OK

//test for :eq, :lt, :gt expects true
ol.run('((:let, $a, 5),(:let, $b, 5),(:out, (:eq, $a, $b)))');//OK
ol.run('((:let, $a, 1),(:let, $b, 2),(:out, (:lt, $a, $b)))');//OK
ol.run('((:let, $a, 4),(:let, $b, 2),(:out, (:gt, $a, $b)))');//OK
//test for :eq, :lt, :gt, expects false
ol.run('((:let, $a, 1),(:let, $b, 2),(:out, (:eq, $a, $b)))');//OK
ol.run('((:let, $a, 2),(:let, $b, 1),(:out, (:lt, $a, $b)))');//OK
ol.run('((:let, $a, 1),(:let, $b, 2),(:out, (:gt, $a, $b)))');//OK

//test for :loop, expects 1,2,3,4,5,6,7,8,9,10
ol.run('((:let, $i, 1),(:loop,(:gt, $i, 10),((:out, $i),(:let, $i, (:add, $i, 1)))))');//OK

//test for :fork, expects "1 lt 2"
ol.run('((:fork, (:lt, 1, 2), (:out, "1 lt 2")))');//OK
//test for :fork, expects nothing
console.log("write_noting?{")
ol.run('((:fork, (:lt, 2, 1), (:out, "2 lt 1")))');//OK
console.log("}write_noting?")
//test for :fork, expects "2 sur 2 is 0"
ol.run('((:let, $a, (:sur, 2, 2)),(:fork, (:eq, $a, 0), (:out, "2 sur 2 is 0"), (:eq, $a, 1), (:out, "2 sur 2 is 1")))');//OK
//test for :fork, expects "3 sur 2 is 0"
ol.run('((:let, $a, (:sur, 3, 2)),(:fork, (:eq, $a, 0), (:out, "3 sur 2 is 0"), (:eq, $a, 1), (:out, "3 sur 2 is 1")))');//OK

//test :and, :or expects true
ol.run('((:out, (:and, (:true), (:true))))');//OK
ol.run('((:out, (:and, 1, 1)))');//OK
ol.run('((:out, (:and, "a", "a")))');//OK
ol.run('((:out, (:or, (:true), (:false))))');//OK
ol.run('((:out, (:or, 0, 1)))');//OK
ol.run('((:out, (:or, "a", "")))');//OK

//test :and, :or, expects false
ol.run('((:out, (:and, (:true), (:false))))');//OK
ol.run('((:out, (:and, 1, 0)))');//OK
ol.run('((:out, (:and, "a", "b")))');//OK
ol.run('((:out, (:or, (:false), (:false))))');//OK
ol.run('((:out, (:or, 0, 0)))');//OK
ol.run('((:out, (:or, "", "")))');//OK

//test alias by FizzBuzz expects 1,2,Fizz,4,Buzz,Fizz,7,8,Fizz,Buzz,11,Fizz,13,14,FizzBuzz
ol.run('((:let, $i, 1),(:loop,(:>, $i, 15),((:let, $e, (:%, $i, 3)),(:let, $f, (:%, $i, 5)),(:if,(:and, (:=, $e, 0), (:=, $f, 0)),(:out, "FizzBuzz"),(:=, $e, 0),(:out, "Fizz"),(:=, $f, 0),(:out, "Buzz"),(:true),(:out, $i)),(:let, $i, (:+, $i, 1)))))');//OK
*/

(function(g){
	g.OreoreLangage = g.OreoreLangage || {};
	g.OreoreLangage.generator = function(instance){
		var ol = instance;
		var SHAPE_TERMINATOR="circle";
		var SHAPE_STATEMENT="box";
		var SHAPE_OUTPUT="cds";
		var SHAPE_EXPRESSION="diamond";
		var SHAPE_LOOPSTART="trapezium";
		var SHAPE_LOOPEND="invtrapezium";
		
		ol.get_as_label = function get_as_label(stree){
			var _context = this.context;
			this.context = this.LABEL;
			var label = "";
			if(typeof(stree) == "string" && stree.match(/^\$/)){
				label = stree;
			}else{
				label = this.proc_statement(stree).toString();
			}
			this.context = _context;
			return label;
		};
		ol.set_connector = function set_connector(obj){
			while(this.stack.length > 0){
				var pre = this.stack.pop();
				this.connects.push({ from: pre.id, to: obj.id });
			}
		};
		ol.proc_flow = function proc_flow(label, type){
			if(this.context == this.BLOCK){
				var obj = { id: this.get_id(), type: type, label: label, };
				this.set_connector(obj);
				this.objects.push(obj);
				this.stack.push(obj);
				return null;
			}else if(this.context == this.LABEL){
				return label;
			}
		};
		ol.set_func(":out", function(args){
			var _value = this.get_as_label(args.shift());
			var label = 'Out: "' + _value + '"';
			return this.proc_flow(label, SHAPE_OUTPUT);
		});
		ol.set_func(":let", function(args){
			var _name = this.get_as_label(args.shift());
			var _value = this.get_as_label(args.shift());
			var label = _name + " <- " + _value;
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_func(":true", function(args){
			return this.proc_flow("TRUE", SHAPE_STATEMENT);
		});
		ol.set_func(":false", function(args){
			return this.proc_flow("FALSE", SHAPE_STATEMENT);
		});
		ol.set_func(":loop", function(args){
			var running = args.shift();
			var execution = args.shift();

			var label = this.get_as_label(running);
			var start = { id: this.get_id(), type: SHAPE_LOOPSTART, label: label, };
			var pre = this.stack.pop();
			this.connects.push({ from: pre.id, to: start.id });
			this.objects.push(start);
			this.stack.push(start);

			this.proc_statement(execution);

			var end = { id: this.get_id(), type: SHAPE_LOOPEND, label: label, };
			var pre = this.stack.pop();
			this.connects.push({ from: pre.id, to: end.id });
			this.objects.push(end);
			this.stack.push(end);

			return null;
		});
		ol.set_func(":eq", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = a + " = " + b;
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":eq", ":=");
		ol.set_func(":lt", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = a + " < " + b;
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":lt", ":<");
		ol.set_func(":gt", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = a + " > " + b;
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":gt", ":>");
		ol.set_func(":add", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = a + " + " + b;
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":add", ":+");
		ol.set_func(":sub", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = a + " - " + b;
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":sub", ":-");
		ol.set_func(":mul", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = a + " * " + b;
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":mul", ":*");
		ol.set_func(":div", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = a + " / " + b;
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":div", ":/");
		ol.set_func(":sur", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = a + " % " + b;
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":sur", ":%");
		ol.set_func(":pow", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = a + " ^" + b;
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":pow", ":^");
		ol.set_func(":fork", function(args){
			var endpoints = [];
			while(args.length >= 2){
				//TODO: want to hide "expression :true"
				var label = this.get_as_label(args.shift());
				this.proc_flow(label, SHAPE_EXPRESSION);
				var preblock = this.stack[this.stack.length - 1];
				this.proc_statement(args.shift());
				endpoints.push(this.stack.pop());
				this.stack.push(preblock);
			}
			//this.stack.pop();
			while(endpoints.length > 0){
				this.stack.push(endpoints.pop());
			}
		});
		ol.set_alias(":fork", ":if");
		ol.set_func(":and", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = "(" + a + ") and (" + b + ")";
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":and", ":&");
		ol.set_func(":or", function(args){
			var a = this.get_as_label(args.shift());
			var b = this.get_as_label(args.shift());
			var label = "(" + a + ") or (" + b + ")";
			return this.proc_flow(label, SHAPE_STATEMENT);
		});
		ol.set_alias(":or", ":|");

		var _to_dot = function _to_dot(objects, connects){
			var dots = [], indent = "    ";
			for(var i=0; i<objects.length; i++){
				var obj = objects[i];
				var reg = new RegExp('"', "g");
				var dot = obj.id + '[label="'+obj.label.replace(reg, '\\"')+'", shape='+obj.type+'];';
				dots.push(indent + dot);
			}
			for(var i=0; i<connects.length; i++){
				var conn = connects[i];
				var dot = conn.from + ' -> ' + conn.to + ';';
				dots.push(indent + dot);
			}
			dots.unshift("digraph Flow {");
			dots.push("}");
			return dots.join("\n");
		};
		var id_counter = 0;
		ol.get_id = function get_id(){
			return "Object" + id_counter++;
		};
		ol.relation = function run(code){//TODO: additional valiable, functions
			var stree = this.parse(code);
			this.clear_valiable();
			this.objects = [];//{ id, type, label }
			this.connects = [];//{ from, to }
			this.stack = [];//object that wait to connect
			this.BLOCK = "BLOCK"; this.LABEL = "LABEL";
			var start = { id: this.get_id(), type: SHAPE_TERMINATOR, label: "start", };

			this.objects.push(start);
			this.stack.push(start);
			this.context = this.BLOCK;
			this.proc_statement(stree);

			var end = { id: this.get_id(), type: SHAPE_TERMINATOR, label: "end", };
			this.set_connector(end);
			this.objects.push(end);
			var dot = _to_dot(this.objects, this.connects);
			console.log(dot);
			return dot;
		};
		return ol;
	};
})(window);

/*
//	test with below.
//	http://mdaines.github.io/viz.js/
var ol = window.OreoreLangage.generator(new window.OreoreLangage.class);
//test for :out, expects "hello, world."
ol.relation('(:out, "hello, world.")');//OK
//test for :let, expects "hello, world."
ol.relation('((:let, $a, "hello, world."),(:out, $a))');//OK
//test for :true, expects true
ol.relation('((:let, $a, (:true)),(:out, $a))');//OK
//test for :fork, expects "1 lt 2"
ol.relation('((:fork, (:lt, 1, 2), (:out, "1 lt 2")))');//OK
//test for :fork, expects nothing
ol.relation('((:fork, (:lt, 2, 1), (:out, "2 lt 1")))');//OK
//test alias by FizzBuzz expects 1,2,Fizz,4,Buzz,Fizz,7,8,Fizz,Buzz,11,Fizz,13,14,FizzBuzz
ol.relation('((:let, $i, 1),(:loop,(:>, $i, 15),((:let, $e, (:%, $i, 3)),(:let, $f, (:%, $i, 5)),(:if,(:and, (:=, $e, 0), (:=, $f, 0)),(:out, "FizzBuzz"),(:=, $e, 0),(:out, "Fizz"),(:=, $f, 0),(:out, "Buzz"),(:true),(:out, $i)),(:let, $i, (:+, $i, 1)))))');//OK
*/
