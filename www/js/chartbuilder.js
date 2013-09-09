var chart;
ChartBuilder = {
	allColors: ["db4730","e58d3c","f0c74f","04807e","4da9da",
				"6d2217","72461d","776326","04403e","26546d",
				"a43424","ab6a2d","b3943a","04605d","3a7ea3",
				"db4730","e58d3c","f0c74f","04807e","4da9da",
				"e47563","ebaa69","f3d576","4ca09e","7bbfe3",
				"eea397","f2c69b","f7e3a2","88c0bf","7bbfe3",
				"f6d1cb","f9e2cc","fbf1d0","c4dfdf","d2eaf6"],
	curRaw: "",
	getNewData: function(csv) {
		// Split the csv information by lines
		var csv_array = csv.split("\n");

        // Split the first element of the array by the designated separator
        // tab in this case
        var csv_matrix = [];
        var delim = String.fromCharCode(9);
        csv_matrix.push(csv_array[0].split(delim));

		// Get the number of columns
		var cols_num = csv_matrix[0].length;

		// If there aren't at least two columns, return null
		if(cols_num < 2) {
			return null;
		}

		// Knowing the number of columns that every line should have, split
		// those lines by the designated separator. While doing this, count
		// the number of rows
		var rows_num = 0;
		for(var i=1; i<csv_array.length; i++) {
			// If the row is empty, that is, if it is just an \n symbol, continue
			if(csv_array[i] == "") {
				continue;
			}

			// Split the row. If the row doesn't have the right amount of cols
			// then the csv is not well formated, therefore, return null
			var row = csv_array[i].split(delim);
			if(row.length != cols_num) {
				return null;
			}

			// Push row to matrix, increment row count, loop
			csv_matrix.push(row);
			rows_num++; 
		}

		// If there aren't at least two non empty rows, return null
		if(rows_num < 2) {
			return null;
		}

		return csv_matrix;
	},
	// Given the matrix containing the well formated csv, create the object that
	// is going to be used later
	makeDataObj: function(csv_matrix) {
		// Make the data array
		var data = [];
		for(var i=0; i<csv_matrix[0].length; i++) {
			// Object for a single column
			var obj = {name: csv_matrix[0][i], data: []};

			// Make the obj
			for(var j=1; j<csv_matrix.length; j++) {
				// If this is a date column
				if((/date/gi).test(obj.name)) {
					var value = Date.create(csv_matrix[j][i]);
					if(value == "Invalid Date") {
						return null;
					}
					obj.data.push(value);
				}
				// If it is the first column, containing the names
				else if(i == 0) {
					obj.data.push(csv_matrix[j][i]);
				}
				// If it's a data point
				else {
					var value = csv_matrix[j][i];
					if(value == "null" || value == "") {
						//allow for nulls or blank cells
						value = null
					}
					else if (isNaN(value)){
						//data isn't valid
						return null;
					}
					else {
						value = parseFloat(value);
					}
					
					obj.data.push(value);
				}
			}

			data.push(obj);
		}

		return {data: data, datetime: (/date/gi).test(data[0].name)};
	},
	parseData: function(a) {
		var d = []
		var parseFunc;
		for (var i=0; i < a.length; i++) {
			if((/date/gi).test(a[i][0])){ //relies on the word date 
				parseFunc = this.dateAll
			}
			else if (i == 0) {
				parseFunc = this.doNothing
			}
			else {
				parseFunc = this.floatAll
			}
			
			d.push({
				"name": a[i].shift().split("..").join("\n"),
				"data":parseFunc(a[i]),
			});
			
		};
		for (var i = d.length - 1; i >= 0; i--){
			for (var j = d[i].length - 1; j >= 0; j--){
				if(d[i][j] == "" || d[i][j]==" ") {
					d[i][j] = null
				}
			};
		};
		return d
	},
	mergeData: function(a) {
		var d
		for (var i=0; i < a.data.length; i++) {
			d = a.data[i]
			if(i < chart.g.series.length) {
				a.data[i] = $.extend({},chart.g.series[i],d)
			}
			else {
				//defaults for new series
				a.data[i].type = "line"
			}
			
		};
		
		return a
	},
	pivotData: function(a){
		var o = []
		for (var i=0; i < a.length; i++) {
			if(a[i]) {
				for (var j=0; j < a[i].length; j++) {
					if(i == 0) {
						o.push([])
					}
					if(a[i][j] != "") {
						o[j][i] = a[i][j]
					}
				};
			}
			
		}
		return o
	},
	createTable: function(r,d){
		$table = $("#dataTable table")
		$table.text("")


		$table.append("<tr><th>"+r[0].join("</th><th>")+"</th></tr>")
		for (var i=1; i < r.length; i++) {
			if(r[i]) {
				if(d) {
					r[i][0] = Date.create(r[i][0]).format("{M}/{d}/{yy} {hh}:{mm}")
				}
				
				//add commas to the numbers
				for (var j = 0; j < r[i].length; j++) {
					r[i][j] = this.addCommas(r[i][j])
				};

				$("<tr><td>"+r[i].join("</td><td>")+"</td></tr>")
					.addClass(i%2 == 0? "otherrow":"row")
					.appendTo($table)
			}				
		};

		// append to 
		this.outputTableAsHtml($table);
	},


	// table_el is a jQuery element
	outputTableAsHtml: function(table_el){
		var html_str = table_el.parent().html();
		// throw in some sloppy newline subbing
		html_str = html_str.replace(/(<(?:tbody|thead))/g, "\n$1");
		html_str = html_str.replace(/(<\/(?:tr|tbody|thead)>)/g, "$1\n");
		html_str = html_str.split("<tbody><tr>").join("<tbody>\n<tr>")
		html_str = $.trim(html_str)
		$('#table-html').val(html_str);
	},



	floatAll: function(a) {
		for (var i=0; i < a.length; i++) {
			if(a[i] && a[i].length > 0 && (/[\d\.]+/).test(a[i])) {
				a[i] = parseFloat(a[i])
			}
			else {
				a[i] = null
			}
		};
		return a
	},
	dateAll: function(a) {
		for (var i=0; i < a.length; i++) {
			a[i] = Date.create(a[i])
		};
		return a
	},
	doNothing: function(a) {
		return a
	},
	inlineAllStyles: function() {
		var chartStyle, selector, cssText;
		
		for (var i = document.styleSheets.length - 1; i >= 0; i--){
			if(document.styleSheets[i].href && document.styleSheets[i].href.indexOf("gneisschart.css") != -1) {
				if (document.styleSheets[i].rules != undefined) {
					chartStyle = document.styleSheets[i].rules 
				}
				else {
					chartStyle = document.styleSheets[i].cssRules
				}
			}
		}
		if(chartStyle != null && chartStyle != undefined)
		{
			for (var i=0; i < chartStyle.length; i++) {
				if(chartStyle[i].type == 1) {
					//cssRule is a style rule
					selector = chartStyle[i].selectorText;
					cssText = chartStyle[i].style.cssText;
					d3.selectAll(selector).attr("style",cssText)
				}
			};
		}
	},
	createChartImage: function() {
		// Create PNG image
		var canvas = document.getElementById("canvas")
		canvas.width = $("#chartContainer").width() * 2
		canvas.height = $("#chartContainer").height() *2

		var canvasContext = canvas.getContext("2d")
		var svg = $.trim(document.getElementById("chartContainer").innerHTML)
		canvasContext.drawSvg(svg,0,0)
		
		
		var filename = [];
		
		if(chart.g.title.length > 0) {
			filename.unshift(chart.g.title)
		}
		
		filename = filename.join("-").replace(/[^\w\d]+/gi, '-');
		
		
		$("#downloadImageLink").attr("href",canvas.toDataURL("png"))
			.attr("download", function() { return filename + "_chartbuilder.png"
		    });

			
		// Create SVG image
		/*var svgString = $("#chartContainer").html()
		//add in all the things that validate SVG
		svgString = '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg ' + svgString.split("<svg ")[1]
		
	$("#downloadSVGLink").attr("href","data:text/svg,"+ encodeURI(svgString.split("PTSerif").join("PT Serif")) )
		.attr("download",function(){ return filename + "_chartbuilder.svg"
		})

		var icon = this.setFavicon()*/
		this.storeLocalChart(filename);	
        this.loadStoredCharts();
		
	},
	redraw: function() {
		$(".seriesItemGroup").detach()
		var g = chart.g, s, picker;
		this.customLegendLocaion = false;
		var colIndex = g.sbt.line.length, lineIndex = 0, bargridIndex = 0, scatterIndex = 0;
		var seriesContainer = $("#seriesItems")
		for (var i=0; i < g.series.length; i++) {
			s = g.series[i]
			seriesItem = $('<div class="seriesItemGroup">\
				<label for="'+this.idSafe(s.name)+'_color">'+s.name+'</label>\
				<input id="'+this.idSafe(s.name)+'_color" name="'+this.idSafe(s.name)+'" type="text" />\
				<select class="typePicker" id="'+this.idSafe(s.name)+'_type">\
					<option '+(s.type=="line"?"selected":"")+' value="line">Line</option>\
					<option '+(s.type=="column"?"selected":"")+' value="column">Column</option>\
					<option '+(s.type=="bargrid"?"selected":"")+' '+(g.xAxis.type == "date"?"disabled":"")+' value="bargrid">Bar Grid</option>\
					<option '+(s.type=="scatter"?"selected":"")+' value="scatter">Scatter</option>\
				</select>\
				<div class="clearfix"></div>\
			</div>');
			
			var color = ""
			
			if(s.type == "line") {
				color = s.color ? s.color.replace("#","") : g.colors[lineIndex].replace("#","")
				lineIndex++
			}
			else if(s.type == "column") {
				color = s.color ? s.color.replace("#","") : g.colors[colIndex].replace("#","")
				colIndex++
			}
			else if(s.type =="bargrid") {
				color = s.color ? s.color.replace("#","") : g.colors[bargridIndex].replace("#","")
				bargridIndex++
			}
			else if(s.type =="scatter") {
				color = s.color ? s.color.replace("#","") : g.colors[scatterIndex].replace("#","")
				scatterIndex++
			}
			
			seriesContainer.append(seriesItem);
			var picker = seriesItem.find("#"+this.idSafe(s.name)+"_color").colorPicker({pickerDefault: color, colors:this.allColors});
			var typer = seriesItem.find("#"+this.idSafe(s.name)+"_type")
												
			seriesItem.data("index",i)
			picker.change(function() {
				chart.g.series[$(this).parent().data().index].color = $(this).val()
				ChartBuilder.redraw()
			})
			
			typer.change(function() {
				var val = $(this).val(),
				index = $(this).parent().data().index;
				chart.g.series[index].type = val
				var hasBargrid = false;
				chart.setPadding();
				ChartBuilder.setChartArea()
				chart.setXScales()
					.resize()
				ChartBuilder.redraw()
			})
			
			chart.redraw()
			this.makeLegendAdjustable()
		}
		
		
		var yAxisObj = []
		for (var i = g.yAxis.length - 1; i >= 0; i--){
			var cur = g.yAxis[i]
			yAxisObj[i] = {
				domain: cur.domain,
				tickValues: cur.tickValues,
				prefix: cur.prefix,
				suffix: cur.suffix,
				ticks: cur.ticks,
				formatter: cur.formatter
			}
		};
		
		var xAxisObj = {
			domain: g.xAxis.domain,
			prefix: g.xAxis.prefix,
			suffix: g.xAxis.suffix,
			type: g.xAxis.type,
			formatter: g.xAxis.formatter
		}
		
		var state = {
			container: g.container,
			colors: g.colors,
			title: g.title,
			padding : g.padding,
			xAxis: xAxisObj,
			yAxis: yAxisObj,
			series: g.series,
			xAxisRef: g.xAxisRef,
			sourceline: g.sourceline,
			creditline: g.creditline
		}

		
		chart.g = g;
		ChartBuilder.inlineAllStyles();
	},
	setChartArea: function() {
		var hasBargrid = false;
		for (var i = chart.g.series.length - 1; i >= 0; i--){
			if(chart.g.series[i].type == "bargrid") {
				hasBargrid = true;
				break;
			}
		};
		
		if(hasBargrid) {
			$("#chartContainer").css("height",
				chart.g.series[0].data.length*22 + 
				chart.g.padding.top + 
				chart.g.padding.bottom
				)
		}
		else {
			$("#chartContainer").css("height", 480)
		}
	},
	makeLegendAdjustable: function() {
		
		var legendLabelDrag = d3.behavior.drag()
			.origin(Object)
			.on("dragstart",function(d){
				elem = d3.select(this)
				d3.select(elem[0][0].parentElement).selectAll("rect").style("display","none")
				if(!ChartBuilder.customLegendLocaion) {
					chart.g.legend = false;
					chart.redraw()
					ChartBuilder.inlineAllStyles()
					ChartBuilder.makeLegendAdjustable()
					ChartBuilder.customLegendLocaion = true;
				}
				
			})
			.on("drag", function(d){
				elem = d3.select(this)
				elem.attr("x", Number(elem.attr("x")) + d3.event.dx)
					.attr("y", Number(elem.attr("y")) + d3.event.dy);
					
				
		});
		d3.selectAll("text.legendLabel").call(legendLabelDrag);
		
		
	},
	getAllInputData: function() {
		var d = {}, $el;
		var elems = $("input, textarea, select:not(#previous_charts)").each(function() {
			$el = $(this)
			d[$el.attr("id")] = $el.val()
		})
		return d
	},
	storeLocalChart: function(name) {
		try {
			localStorage["savedCharts"][0]
		}
		catch(e) {
			localStorage["savedCharts"] = JSON.stringify([])
		}
		
		var allcharts = JSON.parse(localStorage["savedCharts"])
		newChart = this.getAllInputData()
		newChart.name = name
        newChart.created = (new Date()).valueOf();
        
		allcharts.push(newChart)
		localStorage["savedCharts"] = JSON.stringify(allcharts);
	},
	getLocalCharts: function() {
		var charts = []
		try {
			charts = JSON.parse(localStorage["savedCharts"])
		}
		catch(e){ /* Fail Silently */}
		
		return charts
	},
	loadLocalChart: function(d) {
		for (var key in d) {
			if(key != "name" && key != "created") {
				$("#"+key).val(d[key])
				//$("#"+key).text(d[key])
			}
		}
		$("input, textarea, select:not(#previous_charts)").keyup().change()
	},
	idSafe: function(s) {
		s = s.replace(/[^\w\d]+/gi,"-")
		return s
	},
	addCommas: function(nStr)
	{
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2'); //TODO localize this
		}
		return x1 + x2;
	},
	actions: {
		axis_prefix_change: function(index,that) {
			chart.g.yAxis[index].prefix.value = $(that).val()
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_suffix_change: function(index,that) {
			chart.g.yAxis[index].suffix.value = $(that).val()
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_tick_num_change: function(index,that) {
			chart.g.yAxis[index].ticks = parseInt($(that).val())
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_tick_override_change: function(index,that) {
			var val = $(that).val()
			val = val.split(",")
			if(val.length > 1) {
				for (var i = val.length - 1; i >= 0; i--){
					val[i] = parseFloat(val[i])
				};
			}
			else {
				val = null
			}
			chart.g.yAxis[index].tickValues = val
			chart.setYScales();
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		}
	},
	showInvalidData: function() {
		$("#inputDataHeading").addClass("inputDataHInvData");
		$("#invalidDataSpan").removeClass("hide");
	},
	hideInvalidData: function() {
		$("#inputDataHeading").removeClass("inputDataHInvData");
		$("#invalidDataSpan").addClass("hide");
	}
}

// Overwrite Gneiss yaxis formating
/*
  Presently removing this will push your y-axis
  labels off the edge of the chart
*/
Gneiss.customYAxisFormat = function(axisGroup,i) {
	var g = this.g
	axisGroup.selectAll("g")
		.each(function(d,j) {
			//create an object to store axisItem info
			var axisItem = {}
			
			//store the position of the axisItem
			//(figure it out by parsing the transfrom attribute)
			axisItem.y = parseFloat(d3.select(this)
				.attr("transform")
					.split(")")[0]
						.split(",")[1]
				)
			
			//store the text element of the axisItem
			//align the text right position it on top of the line
			axisItem.text = d3.select(this).select("text")
				.attr("text-anchor",i==0?"end":"start")
				.attr("fill",i==0?"#666666":g.yAxis[i].color)
				.attr("x",function(){var elemx = Number(d3.select(this).attr("x")); return i==0?elemx:elemx+4})
				.attr("y",-9)
			})
	this.g = g;
}

// Create default config for chartbuilder
ChartBuilder.getDefaultConfig = function() {
  var chartConfig = {};
  
  chartConfig.colors = ["#db4730","#e58d3c","#f0c74f","#04807e","#4da9da",
  						"#6d2217","#72461d","#776326","#04403e","#26546d",
						"#a43424","#ab6a2d","#b3943a","#04605d","#3a7ea3",
						"#db4730","#e58d3c","#f0c74f","#04807e","#4da9da",
						"#e47563","#ebaa69","#f3d576","#4ca09e","#7bbfe3",
						"#eea397","#f2c69b","#f7e3a2","#88c0bf","#7bbfe3",
						"#f6d1cb","#f9e2cc","#fbf1d0","#c4dfdf","#d2eaf6"];
  
  return chartConfig;
}

ChartBuilder.formatDate = function(d) {
    var date = (d.getMonth() + 1) +
        '-' + (d.getDate() + 1) +
        '-' + (d.getFullYear());

    var hours = d.getHours();
    var minutes = d.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var time = hours + ':' + minutes + ' ' + ampm;

    return date + ' ' + time;
}

ChartBuilder.loadStoredCharts = function() {
  	var savedCharts = ChartBuilder.getLocalCharts().reverse();
  	var chartSelect = d3.select("#previous_charts");

    chartSelect.selectAll("option").remove();
  	
  	chartSelect.selectAll("option")
  		.data(savedCharts)
  		.enter()
  		.append("option")
  		.text(function(d) {
            var created = ChartBuilder.formatDate(new Date(d.created));
            return d.name ? d.name + ' (' + created  + ')' : "Untitled Chart (" + created + ')'
        })
}

// Starts applicatoin given config object
ChartBuilder.start = function(config) {

  // Create config
  var chartbuilderDefaultConfig = ChartBuilder.getDefaultConfig();
  var chartConfig = $.extend(defaultGneissChartConfig, chartbuilderDefaultConfig, config);
  
  $(document).ready(function() {

  	//construct a Gneisschart using default data
  	//this should change to be more like this http://bost.ocks.org/mike/chart/
  	chart = Gneiss.build(chartConfig)
  	
  	//scale it up so it looks good on retina displays
  	$("#chart").attr("transform","scale(2)")
  	
  	//populate the input with the data that is in the chart
  	$("#csvInput").val(function() {
  		var data = []
  		var val = ""
  
  		data[0] = chart.g.xAxisRef[0].data
  		data[0].unshift(chart.g.xAxisRef[0].name)
  
  		for (var i = 0; i < chart.g.series.length; i++) {
  			data[i+1] = chart.g.series[i].data
  			data[i+1].unshift(chart.g.series[i].name)
  		};
  
  		data = ChartBuilder.pivotData(data)
  
  		for (var i = 0; i < data.length; i++) {
  			data[i] = data[i].join("\t")
  		}; 
  		return data.join("\n")
  	})
 
    var chartSelect = d3.select("#previous_charts")
        .on("change",function() {
            ChartBuilder.loadLocalChart(d3.select(this.selectedOptions[0]).data()[0])
  		});
 
    ChartBuilder.loadStoredCharts(); 
  			
  	$("#createImageButton").click(function() {
		if($("#downloadLinksDiv").hasClass("hide")) {
            if ($("#chart_title").val() == "") {
                alert("You must supply a chart title.");
                return false;
            }

            if ($("#credit").val() == "") {
                alert("You must supply a credit.");
                return false;
            }

            if ($("#chart_source").val() == "") {
                alert("You must supply a source.");
                return false;
            }

            $("#createImageButton p").text("Reset");

  		    ChartBuilder.inlineAllStyles();
			ChartBuilder.createChartImage();
		} else {
            $("#createImageButton p").text("Create Image of Chart");
        }

		$("#downloadLinksDiv").toggleClass("hide");
  	})
  	
  	$("#csvInput").bind("paste", function(e) {
  		//do nothing special
  	})
  	
  	/*
  	//
  	// add interactions to chartbuilder interface
  	//
  	*/
  	
  	$("#csvInput").keyup(function() {
  		//check if the data is different
  		if( $(this).val() != ChartBuilder.curRaw) {
  			//cache the the raw textarea value
  			ChartBuilder.curRaw = $(this).val()
  			
  			chart.g.yAxis[0].domain = [null,null];
  			
  			if(chart.g.yAxis.length > 1) {
  				chart.g.yAxis[1].domain = [null,null];
  			}
  			
  			var csv = $("#csvInput").val();
  			var newData = ChartBuilder.getNewData(csv);
  			if(newData == null) {
				ChartBuilder.showInvalidData();
  				return;
  			}
  
  			dataObj = ChartBuilder.makeDataObj(newData);
  			if(dataObj == null) {
				ChartBuilder.showInvalidData();
  				return;
  			}
			ChartBuilder.hideInvalidData();
  
  			ChartBuilder.createTable(newData, dataObj.datetime);
  			
  			chart.g.series.unshift(chart.g.xAxisRef)
  			dataObj = ChartBuilder.mergeData(dataObj)
  			
  			if(dataObj.datetime) {
  				chart.g.xAxis.type = "date";
  				chart.g.xAxis.formatter = chart.g.xAxis.formatter?chart.g.xAxis.formatter:"Mdd";
  			}
  			else {
  				chart.g.xAxis.type = "ordinal";
  			}
  			chart.g.xAxisRef = [dataObj.data.shift()]
  			
  			chart.g.series=dataObj.data
  			chart.setPadding();
  			
  			ChartBuilder.setChartArea()
  			
  			chart.setYScales()
  				.setXScales()
  				.setLineMakers();
  				
  			ChartBuilder.redraw();
  			ChartBuilder.inlineAllStyles();
  		}
  
  	}).keyup() 
  	
  	$("#right_axis_prefix").keyup(function() {
  		ChartBuilder.actions.axis_prefix_change(0,this)
  	})
  	
  	$("#right_axis_suffix").keyup(function() {
  		ChartBuilder.actions.axis_suffix_change(0,this)
  	})
  	
  	$("#right_axis_tick_num").change(function() {
  		ChartBuilder.actions.axis_tick_num_change(0,this)
  	})
  	
  	$("#right_axis_tick_override").keyup(function() {
  		ChartBuilder.actions.axis_tick_override_change(0,this)
  	})
  	
  	$("#creditLine").keyup(function() {
  		var val = $(this).val()
  		chart.g.creditline = val
  		chart.g.creditLine.text(chart.g.creditline)
  	}).keyup();
  	
  	$("#sourceLine").keyup(function() {
  		var val = $(this).val()
  		chart.g.sourceline = val
  		chart.g.sourceLine.text(chart.g.sourceline)
  	}).keyup();
  	
  	$("#chart_title").keyup(function() {
  		var val = $(this).val()
  		chart.g.title = val
  		chart.resize()
  			.setPadding();
  		ChartBuilder.setChartArea()
  		chart.setYScales()
  			.redraw();
  		ChartBuilder.makeLegendAdjustable()
  		
  		chart.g.titleLine.text(chart.g.title)
  	}).keyup();
  	
  })
};
