var COMMA = ',';
var TAB = String.fromCharCode(9);

var chart;

var SAMPLE_CHART = {
    typePicker: 'bar',
    chart_title: 'Unemployment (seasonally adjusted)',
    right_axis_max: 10,
    right_axis_min: 0,
    right_axis_tick_num: 6,
    name: 'Unemployment (seasonally adjusted)',
    created: 1378850793427,
    csvInput: "\
Name,Unemployment\n\
'03,5.8\n\
'04,5.7\n\
'05,5.3\n\
'06,4.7\n\
'07,4.6\n\
'08,5.0\n\
'09,7.8\n\
'10,9.8\n\
'11,9.1\n\
'12,8.3\n\
'13,7.9"
}

ChartBuilder = {
	allColors: ['db4730','e58d3c','f0c74f','04807e','4da9da',
				'6d2217','72461d','776326','04403e','26546d',
				'a43424','ab6a2d','b3943a','04605d','3a7ea3',
				'db4730','e58d3c','f0c74f','04807e','4da9da',
				'e47563','ebaa69','f3d576','4ca09e','7bbfe3',
				'eea397','f2c69b','f7e3a2','88c0bf','7bbfe3',
				'f6d1cb','f9e2cc','fbf1d0','c4dfdf','d2eaf6'],
	rawData: '',
	parseData: function(csv) {
        /*
         * Parse  data from CSV/TSV.
         *
         * Returns a list of rows.
         */
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

        return reader.rows;
	},
	makeDataSeries: function(rows) {
        /*
         * Convert rows from CSV/TSV to data series for gneiss.
         */
		var data = [];

		for(var i = 0; i < rows[0].length; i++) {
			var obj = {
                name: rows[0][i],
                data: []
            };

			for(var j = 1; j < rows.length; j++) {
				// If it is the first column, containing the names
				if(i == 0) {
					obj.data.push(rows[j][i]);
				}
				// If it's a data point
				else {
					var value = rows[j][i];
					if (value == 'null' || value == '') {
						// allow for nulls or blank cells
						value = null
					}
					else if (isNaN(value)){
						// data isn't valid
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

		return data;
	},
	createTable: function(rows) {
        /*
         * Render an HTML table from data rows, for validation.
         */
		$table = $('#dataTable table')
		$table.text('')

		$table.append('<tr><th>' + rows[0].join('</th><th>') + '</th></tr>')
        
		for (var i = 1; i < rows.length; i++) {
			if (rows[i]) {
				for (var j = 0; j < rows[i].length; j++) {
					rows[i][j] = ChartBuilder.addCommas(rows[i][j])
				};

				$('<tr><td>' + rows[i].join('</td><td>') + '</td></tr>')
					.appendTo($table)
			}				
		};
    },
	inlineAllStyles: function() {
		var chartStyle, selector, cssText;
		
		for (var i = document.styleSheets.length - 1; i >= 0; i--){
			if(document.styleSheets[i].href && document.styleSheets[i].href.indexOf('gneisschart.css') != -1) {
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
					d3.selectAll(selector).attr('style',cssText)
				}
			};
		}
	},
	createChartImage: function() {
        /*
         * Create PNG and SVG versions of the chart.
         */
		// Create PNG image
		var canvas = document.getElementById('canvas')
		canvas.width = $('#chartContainer').width() * 2
		canvas.height = $('#chartContainer').height() *2

		var canvasContext = canvas.getContext('2d')
		var svg = $.trim(document.getElementById('chartContainer').innerHTML)
		canvasContext.drawSvg(svg,0,0)
		
		
		var filename = [];
		
		if(chart.g.title.length > 0) {
			filename.unshift(chart.g.title)
		}
		
		filename = filename.join('-').replace(/[^\w\d]+/gi, '-');
		
		
		$('#downloadImageLink')
			.attr('href',canvas.toDataURL('png'))
			.attr('download', function() { 
				return filename + '_chartbuilder.png'
		    });

        // Create SVG image
		var svgString = $("#chartContainer").html()
		svgString = '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg ' + svgString.split("<svg ")[1]

	    $("#downloadSVGLink")
            .attr("href", "data:text/svg," + encodeURI(svgString.split("PTSerif").join("PT Serif")) )
		    .attr("download", function() { return filename + "_chartbuilder.svg" })

		ChartBuilder.saveCurrentChart(filename);	

        var charts = ChartBuilder.getSavedCharts().reverse();
        ChartBuilder.setSavedChartList(charts);
		
	},
	render: function() {
        /*
         * Redraw the chart and update series options as appropriate.
         */
		$('.seriesItemGroup').detach()
		var g = chart.g, s, picker;
		ChartBuilder.customLegendLocaion = false;
		var seriesContainer = $('#seriesItems')
			
		for (var i=0; i < g.series.length; i++) {
			s = g.series[i]
			seriesItem = $('<div class="seriesItemGroup">\
				<label for="'+ChartBuilder.idSafe(s.name)+'_color">'+s.name+'</label>\
				<input id="'+ChartBuilder.idSafe(s.name)+'_color" name="'+ChartBuilder.idSafe(s.name)+'" type="text" />\
			</div>');
			
            var color = s.color ? s.color.replace('#','') : g.colors[i].replace('#','')
			
			seriesContainer.append(seriesItem);
			var picker = seriesItem.find('#'+ChartBuilder.idSafe(s.name)+'_color').colorPicker({pickerDefault: color, colors:ChartBuilder.allColors});

			seriesItem.data('index',i)
			picker.change(function() {
				chart.g.series[$(this).parent().data().index].color = $(this).val()
				ChartBuilder.render()
			})
			
			chart.render()
		}

        $('#typePicker').off('change').on('change', function() {
            var val = $(this).val();

            chart.g.type = val;

            // Regenerate axes from data or min/max
            chart.g.yAxis.domain = [null, null];
            $("#right_axis_max").keyup();
            $("#right_axis_min").keyup();

            ChartBuilder.render();
        });		
		
		chart.g = g;
		ChartBuilder.inlineAllStyles();
	},
	getAllInputData: function() {
		var d = {}, $el;
		var elems = $('input:not([id^=colorPicker]), textarea, select:not(#previous_charts)').each(function() {
			$el = $(this)
			d[$el.attr('id')] = $el.val()
		})
		return d
	},
	idSafe: function(s) {
		s = s.replace(/[^\w\d]+/gi,'-')
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
    axis_prefix_change: function(that) {
        chart.g.yAxis.prefix = $(that).val()
        ChartBuilder.render()
        ChartBuilder.inlineAllStyles();
    },
    axis_suffix_change: function(that) {
        chart.g.yAxis.suffix = $(that).val()
        ChartBuilder.render()
        ChartBuilder.inlineAllStyles();
    },
    axis_tick_num_change: function(that) {
        chart.g.yAxis.ticks = parseInt($(that).val())
        ChartBuilder.render()
        ChartBuilder.inlineAllStyles();
    },
    axis_max_change: function(that) {
        var val = parseFloat($(that).val())
        
        if (isNaN(val)) {
            val = null
        }

        if (chart.g.yAxis.domain[0] !== null && chart.g.yAxis.domain[0] >= val) {
            chart.g.yAxis.domain[1] = null;
        } else {
            chart.g.yAxis.domain[1] = val;
        }

        ChartBuilder.render()
        ChartBuilder.inlineAllStyles();
    },
    axis_min_change: function(that) {
        var val = parseFloat($(that).val())
        if(isNaN(val)) {
            val = null
        }

        if (chart.g.yAxis.domain[1] !== null && chart.g.yAxis.domain[1] <= val) {
            chart.g.yAxis.domain[0] = null;
        } else {
            chart.g.yAxis.domain[0] = val;
        }

        ChartBuilder.render()
        ChartBuilder.inlineAllStyles();
    },
    axis_tick_override_change: function(that) {
        var val = $(that).val()
        val = val.split(',')
        if(val.length > 1) {
            for (var i = val.length - 1; i >= 0; i--){
                val[i] = parseFloat(val[i])
            };
        }
        else {
            val = null
        }
        
        chart.g.yAxis.tickValues = val

        ChartBuilder.render()
        ChartBuilder.inlineAllStyles();
    },
	showInvalidData: function(e) {
        e = e || 'Data could not be parsed.';

        $('#invalidDataSpan').text(e);
		$('#inputDataHeading').addClass('inputDataHInvData');
		$('#invalidDataSpan').removeClass('hide');
	},
	hideInvalidData: function() {
		$('#inputDataHeading').removeClass('inputDataHInvData');
		$('#invalidDataSpan').addClass('hide');
	},
    getDefaultConfig: function() {
        var chartConfig = {};

        chartConfig.colors = ['#db4730','#e58d3c','#f0c74f','#04807e','#4da9da',
                            '#6d2217','#72461d','#776326','#04403e','#26546d',
                            '#a43424','#ab6a2d','#b3943a','#04605d','#3a7ea3',
                            '#db4730','#e58d3c','#f0c74f','#04807e','#4da9da',
                            '#e47563','#ebaa69','#f3d576','#4ca09e','#7bbfe3',
                            '#eea397','#f2c69b','#f7e3a2','#88c0bf','#7bbfe3',
                            '#f6d1cb','#f9e2cc','#fbf1d0','#c4dfdf','#d2eaf6'];

        return chartConfig;
    },
    formatDate: function(d) {
        /*
         * Format a date for display in the chart list.
         */
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
    },
	saveCurrentChart: function(name) {
        /*
         * Save the current chart state to local storage as JSON.
         */
		try {
			localStorage['savedCharts'][0]
		}
		catch(e) {
			localStorage['savedCharts'] = JSON.stringify([])
		}
		
		var allcharts = JSON.parse(localStorage['savedCharts'])

		var newChart = ChartBuilder.getAllInputData()
		newChart.name = name
        newChart.created = (new Date()).valueOf();
        
		allcharts.push(newChart)
		localStorage['savedCharts'] = JSON.stringify(allcharts);
	},
	loadChart: function(d) {
        /*
         * Load a chart from JSON representation.
         */
		for (var key in d) {
			if(key != 'name' && key != 'created') {
				$('#'+key).val(d[key])
			}
		}
		$('input:not([id^=colorPicker]), textarea, select:not(#previous_charts)').keyup().change();
	},
	getSavedCharts: function() {
        /*
         * Get a list of saved charts from local storage.
         *
         * Will create a sample chart if none exist.
         */
		var charts = []

		try {
			charts = JSON.parse(localStorage['savedCharts'])
		}
		catch(e) {
            // If no charts exist, store demo chart
            charts = JSON.stringify([SAMPLE_CHART]);
            localStorage['savedCharts'] = charts;
        }
		
		return charts
	},
    setSavedChartList: function(charts) {
        /*
         * Set the list of saved charts.
         */
        var chartSelect = d3.select('#previous_charts');

        chartSelect.selectAll('option').remove();
        
        chartSelect.selectAll('option')
            .data(charts)
            .enter()
            .append('option')
            .text(function(d) {
                var created = ChartBuilder.formatDate(new Date(d.created));
                return d.name ? d.name + ' (' + created  + ')' : 'Untitled Chart (' + created + ')'
            })

        $('#previous_charts').trigger('chosen:updated');
    },
    start: function(config) {
        /*
         * Go! 
         */
        var chartbuilderDefaultConfig = ChartBuilder.getDefaultConfig();
        var chartConfig = $.extend(defaultGneissChartConfig, chartbuilderDefaultConfig, config);

        $('#chartContainer').css('height', 480)
        chart = Gneiss.setup(chartConfig)

        var chartSelect = $('#previous_charts').chosen()
            .on('change', function() {
                ChartBuilder.loadChart(d3.select(this.selectedOptions[0]).data()[0])
            });
                
        $('#createImageButton').click(function() {
            if(!$('#download-modal').hasClass('in')) {
                if ($('#chart_title').val() == '') {
                    alert('You must supply a chart title.');
                    return false;
                }

                $('#createImageButton p').text('Reset');

                ChartBuilder.inlineAllStyles();
                ChartBuilder.createChartImage();
            } else {
                $('#createImageButton p').text('Create Image of Chart');
            }
        })

        $('#right_axis_prefix').keyup(function() {
            ChartBuilder.axis_prefix_change(this)
        })

        $('#right_axis_suffix').keyup(function() {
            ChartBuilder.axis_suffix_change(this)
        })

        $('#right_axis_tick_num').change(function() {
            ChartBuilder.axis_tick_num_change(this)
        })

        $('#right_axis_max').keyup(function() {
            ChartBuilder.axis_max_change(this)
        })

        $('#right_axis_min').keyup(function() {
            ChartBuilder.axis_min_change(this)
        })

        $('#right_axis_tick_override').keyup(function() {
            ChartBuilder.axis_tick_override_change(this)
        })

        $('#csvInput').keyup(function() {
            if ($(this).val() == ChartBuilder.rawData) {
                return false;
            }

            ChartBuilder.rawData = $(this).val()
            
            var csv = $('#csvInput').val();

            try {
                var rows = ChartBuilder.parseData(csv);
            } catch(e) {
                ChartBuilder.showInvalidData(e);
                return false;
            }

            dataSeries = ChartBuilder.makeDataSeries(rows);

            if (dataSeries == null) {
                ChartBuilder.showInvalidData();
                return;
            }

            ChartBuilder.hideInvalidData();
            ChartBuilder.createTable(rows);

            // First row is x axis, the rest is data
            chart.g.xAxisRef = dataSeries.shift().data;
            chart.g.series = dataSeries;

            // Regenerate axes from data or min/max
            chart.g.yAxis.domain = [null, null];
            $("#right_axis_max").keyup();
            $("#right_axis_min").keyup();

            ChartBuilder.render();
            ChartBuilder.inlineAllStyles();
        }); 

        $('#chart_title').keyup(function() {
            var val = $(this).val()

            chart.g.title = val;
            
            chart.render();
            
            chart.g.titleLine.text(chart.g.title)
        });

        // Clicking download closes the download modal
        $('#downloadImageLink').on('click', function(){
            $('#download-modal').modal('hide');
        });

        // Get the list of saved charts and load the last one
        var charts = ChartBuilder.getSavedCharts().reverse();
        ChartBuilder.setSavedChartList(charts); 
        ChartBuilder.loadChart(charts[0]);
    }
};

$(document).ready(function() {
    ChartBuilder.start();
});
