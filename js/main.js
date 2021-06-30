$(function(){
	var OL=window.OreoreLangage;
	var interpreter = OL.interpreter(new window.OreoreLangage.class);
	var generator = OL.generator(new window.OreoreLangage.class);
	var $stdout_container = $("#stdout");
	var $flow_container = $("#flow");
	var $code_editor = $("#code");
	var $sample_container = $("#sample");

	interpreter.set_stdout_func(function(out){
		var _out = (out===null) ? "NULL" : out.toString();
		var $output = $(["<p>", _out, "</p>"].join(""));
		$stdout_container.append($output).parent().animate({
			scrollTop: $stdout_container.height()
		},500);
	});
	var samples=[
		{ name:'test for :out, expects "hello, world."',
		  code:'(:out, "hello, world.")'},
		{ name:'test for :fork, expects "1 lt 2"',
		  code:[
		  	'(:fork,',
		  	'  (:lt, 1, 2),',
		  	'  (:out, "1 lt 2")',
		  	')'].join("\n")},
		{ name:'test for :loop, expects 1,2,3,4,5,6,7,8,9,10',
		  code:[
		  	'(:let, $i, 1),',
		  	'(:loop,',
		  	'  (:gt, $i, 10),',
		  	'  (',
		  	'    (:out, $i),',
		  	'    (:let, $i, (:add, $i, 1))',
		  	'  )',
		  	')'
		  ].join("\n")},
		{ name:'test alias by FizzBuzz expects',
		  code:[
		  	'(:let, $i, 1),',
		  	'(:loop,',
		  	'  (:>, $i, 15),',
		  	'  (',
		  	'    (:let, $e, (:%, $i, 3)),',
		  	'    (:let, $f, (:%, $i, 5)),',
		  	'    (:if,',
		  	'      (:and, (:=, $e, 0), (:=, $f, 0)),',
		  	'      (:out, "FizzBuzz"),',
		  	'      (:=, $e, 0),',
		  	'      (:out, "Fizz"),',
		  	'      (:=, $f, 0),',
		  	'      (:out, "Buzz"),',
		  	'      (:true),',
		  	'      (:out, $i)',
		  	'    ),',
		  	'    (:let, $i, (:+, $i, 1))',
		  	'  )',
		  	')'
		  ].join("\n")},
	];
	for(var i=0; i<samples.length; i++){
		var sample = samples[i];
		var name = sample.name, code = sample.code;
		var $li=$(["<li><a>",name,"</a></li>"].join(""));
		$sample_container.append($li);
	}
	$sample_container.on("click", "a", function(){
		var name=$(this).text();
		var sample=samples.filter(function(e){
			return e.name==name ? true : false;
		}).pop();
		$code_editor.text(sample.code);
	});
	$("#exec").click(function(){
		var code=$code_editor.val();
		if(!code){ alert("Code is empty!"); }
		else{ interpreter.run(code); }
	});
	$("#draw").click(function(){
		var code=$code_editor.val();
		if(!code){ alert("Code is empty!"); }
		else{
			var dot = generator.relation(code);
			$flow_container.html(Viz(dot));
		}
	});
});
