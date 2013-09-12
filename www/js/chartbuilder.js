var COMMA = ',';
var TAB = String.fromCharCode(9);

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
	paletteOpen: false,
	getNewData: function(csv) {
        var separator = COMMA;

        var comma_count = csv.split(COMMA).length - 1;
        var tab_count = csv.split(TAB).length - 1;

        if (tab_count >= comma_count) {
            separator = TAB;
        }

        var reader = new CSVKit.Reader({
            separator: separator,
            columns_from_header: false
        });

        reader.parse(csv);

		// If there aren't at least two columns, return null
		if(reader.rows[0].length < 2) {
            throw 'At least two columns are required.';
        }

		// If there aren't at least two non empty rows, return null
		if(reader.rows.length < 2) {
            throw 'At least two rows are required.';
		}

        // Too many columns?
        if (reader.rows[0].length > 10) {
            alert('Your data has more than 10 columns. This probably won\'t work well with this tool.');
        // Too many rows?
        } else if (reader.rows.length > 10) {
            alert('Your data has more than 10 rows. This probably won\'t work well with this tool.');
        }

        return reader.rows;
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
				// If it is the first column, containing the names
				if(i == 0) {
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

		return {data: data};
	},
	parseData: function(a) {
		var d = []
		var parseFunc;
		for (var i=0; i < a.length; i++) {
			if (i == 0) {
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
					.appendTo($table)
			}				
		};
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
		var seriesContainer = $("#seriesItems")
		window.palette_open = false
			
		for (var i=0; i < g.series.length; i++) {
			s = g.series[i]
			seriesItem = $('<div class="seriesItemGroup">\
				<label for="'+this.idSafe(s.name)+'_color">'+s.name+'</label>\
				<input id="'+this.idSafe(s.name)+'_color" name="'+this.idSafe(s.name)+'" type="text" />\
				<div class="clearfix"></div>\
			</div>');

			seriesItem.find('label').on('click', function(e){
				if ( ChartBuilder.paletteOpen === false ){
					$(this).siblings('.colorPicker-picker').trigger('click');
					ChartBuilder.paletteOpen = true;
				} else {
					ChartBuilder.paletteOpen = false;
				}
			})
			
            var color = s.color ? s.color.replace("#","") : g.colors[i].replace("#","")
			
			seriesContainer.append(seriesItem);
			var picker = seriesItem.find("#"+this.idSafe(s.name)+"_color").colorPicker({pickerDefault: color, colors:this.allColors});

			seriesItem.data("index",i)
			picker.change(function() {
				chart.g.series[$(this).parent().data().index].color = $(this).val()
				ChartBuilder.redraw()
			})
			
			chart.redraw()
		}

        $('#typePicker').off('change').on('change', function() {
            var val = $(this).val();

            chart.g.type = val;

            chart.setPadding();
            ChartBuilder.setChartArea()
            chart.setXScales()
                .resize()
            ChartBuilder.redraw()
        });
		
		
		chart.g = g;
		ChartBuilder.inlineAllStyles();
	},
	setChartArea: function() {
		$("#chartContainer").css("height", 480)
	},
	getAllInputData: function() {
		var d = {}, $el;
		var elems = $("input:not([id^=colorPicker]), textarea, select:not(#previous_charts)").each(function() {
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
			}
		}
		$("input:not([id^=colorPicker]), textarea, select:not(#previous_charts)").keyup().change();
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
			chart.g.yAxis.prefix.value = $(that).val()
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_suffix_change: function(index,that) {
			chart.g.yAxis.suffix.value = $(that).val()
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_tick_num_change: function(index,that) {
			chart.g.yAxis.ticks = parseInt($(that).val())
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_max_change: function(index,that) {
			var val = parseFloat($(that).val())
			if(isNaN(val)) {
				val = null
			}
			chart.g.yAxis.domain[1] = val;
			chart.setYScales();
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_min_change: function(index,that) {
			var val = parseFloat($(that).val())
			if(isNaN(val)) {
				val = null
			}
			chart.g.yAxis.domain[0] = val;
			chart.setYScales();
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
			chart.g.yAxis.tickValues = val
			chart.setYScales();
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		}
	},
	showInvalidData: function(e) {
        e = e || 'Data could not be parsed.';

        $("#invalidDataSpan").text(e);
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
				.attr("fill",i==0?"#666666":g.yAxis.color)
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

    $("#previous_charts").trigger("chosen:updated");
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
 
    var chartSelect = $("#previous_charts").chosen()
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
  			
  			chart.g.yAxis.domain = [null,null];
  			
  			var csv = $("#csvInput").val();

            try {
  			    var newData = ChartBuilder.getNewData(csv);
            } catch(e) {
				ChartBuilder.showInvalidData(e);
  				return;
            }
  
  			dataObj = ChartBuilder.makeDataObj(newData);
  			if(dataObj == null) {
				ChartBuilder.showInvalidData();
  				return;
  			}
			ChartBuilder.hideInvalidData();
  
  			ChartBuilder.createTable(newData);
  			
  			chart.g.series.unshift(chart.g.xAxisRef)
  			dataObj = ChartBuilder.mergeData(dataObj)
  			
  			chart.g.xAxis.type = "ordinal";
  			chart.g.xAxisRef = [dataObj.data.shift()]
            chart.g.yAxis.domain[0] = 0;

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

    $("#right_axis_max").keyup(function() {
  		ChartBuilder.actions.axis_max_change(0,this)
  	})
  	
  	$("#right_axis_min").keyup(function() {
  		ChartBuilder.actions.axis_min_change(0,this)
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
  		
  		chart.g.titleLine.text(chart.g.title)
  	}).keyup();
  	
  })
};
