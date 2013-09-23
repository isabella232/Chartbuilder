var COMMA = ',';
var TAB = String.fromCharCode(9);

var chart;

var SAMPLE_CHART = {
    typePicker: 'bar',
    chart_title: 'Unemployment (seasonally adjusted)',
    right_axis_tick_num: 5,
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

$.fn.fieldMessage = function(type, message){
    var formGroup = this.parent().parent();
    this.clearFieldMessage();
    formGroup.addClass(type);
    formGroup.find('.help-block').text(message);
}

$.fn.clearFieldMessage = function(){
    var formGroup = this.parent().parent();
    formGroup.removeClass('has-error has-warning has-success');
    formGroup.find('.help-block').text('');
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
				$('<tr><td>' + rows[i].join('</td><td>') + '</td></tr>')
					.appendTo($table)
			}				
		};
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
    updateConfigFromUI: function() {
        /*
         * Update the chart config from the latest UI state.
         */
        // Data
        var data = $("#csvInput").val();

        if (data !== ChartBuilder.rawData) {
            ChartBuilder.rawData = data;

            try {
                var rows = ChartBuilder.parseData(data);
            } catch(e) {
                ChartBuilder.showInvalidData(e);

                return false;
            }

            dataSeries = ChartBuilder.makeDataSeries(rows);

            if (dataSeries == null) {
                ChartBuilder.showInvalidData();
                
                return false;
            }

            ChartBuilder.hideInvalidData();
            ChartBuilder.createTable(rows);

            // First row is x axis, the rest is data
            chart.g.xAxisRef = dataSeries.shift().data;
            chart.g.series = dataSeries;
        }

        // Type
        chart.g.type = $("#typePicker").val();

        if (chart.g.type == 'bar'){
            $('#axis-title').text('Horizontal Axis Options');
        } else {
            $('#axis-title').text('Vertical Axis Options');
        }

        // Title
        chart.g.title = $("#chart_title").val();;
        chart.g.titleLine.text(chart.g.title)
        if (chart.g.title === ''){
            $('#chart_title').fieldMessage('has-error','The chart needs a title');
        } else {
            $('#chart_title').clearFieldMessage();
        }
        
        // Prefix/suffix
        chart.g.yAxis.prefix = $('#right_axis_prefix').val();
        chart.g.yAxis.suffix = $('#right_axis_suffix').val();

        // Precision
        var precision = $("#right_axis_precision").val();
        if (precision !== ''){
            precision = parseInt(precision);
            if (isNaN(precision)) {
                precision = null;
                $('#right_axis_precision').fieldMessage('has-error','Must be a number');
            } 
            chart.g.yAxis.precision = precision;
        } else {
            $('#right_axis_precision').clearFieldMessage();
            chart.g.yAxis.precision = null;
        }

        // Ticks
        chart.g.yAxis.numTicks = parseInt($("#right_axis_tick_num").val());

        // Min/max
        var min = $("#right_axis_min").val();

        if (min !== ''){
            min = parseFloat(min);
            if (isNaN(min)) {
                min = null;
                $('#right_axis_min').fieldMessage('has-error','Must be a number');
            } 
            chart.g.yAxis.min = min;
        } else {
            $('#right_axis_min').clearFieldMessage();
            chart.g.yAxis.min = null;
        }        

        var max = $("#right_axis_max").val();
        
        if (max !== ''){
            max = parseFloat(max);
            if (isNaN(max)) {
                max = null;
                $('#right_axis_max').fieldMessage('has-error','Must be a number');
            } else {
                if (!isNaN(min) && max < min){
                    $('#right_axis_max').fieldMessage('has-error','Maximum must be greater than minimum');
                } else {
                    $('#right_axis_max').clearFieldMessage();
                }
                chart.g.yAxis.max = max;
            }
        } else {
            $('#right_axis_max').clearFieldMessage();
            chart.g.yAxis.max = null;
        }

        

        // Tick override
        var val = $("#right_axis_tick_override").val().split(',');

        if(val.length > 1) {
            for (var i = val.length - 1; i >= 0; i--){
                val[i] = parseFloat(val[i]);
            };
        }
        else {
            val = null;
        }
        
        chart.g.yAxis.tickValues = val;

        return true;
    },
    colorPickerChanged: function() {
        /*
         * Update the chart when a color picker is changed.
         */
        chart.g.series[$(this).parent().data().index].color = $(this).val();

        ChartBuilder.render();
    },
	render: function() {
        /*
         * Redraw the chart and update series options as appropriate.
         */
		var g = chart.g;
        var valid = ChartBuilder.updateConfigFromUI();

        if (!valid) {
            return false;
        }
        
        $('.seriesItemGroup').detach();

		var seriesContainer = $('#seriesItems')
			
        // Generate series controls
		for (var i = 0; i < g.series.length; i++) {
			var s = g.series[i]
			seriesItem = $('<div class="seriesItemGroup">\
				<label for="' + ChartBuilder.idSafe(s.name) + '_color">' + s.name + '</label>\
				<input id="' + ChartBuilder.idSafe(s.name) + '_color" name="' + ChartBuilder.idSafe(s.name) + '" type="text" />\
			</div>');
			
			seriesContainer.append(seriesItem);

            var color = s.color ? s.color.replace('#','') : g.colors[i].replace('#','');
			var picker = seriesItem.find('#' + ChartBuilder.idSafe(s.name) + '_color').colorPicker({ pickerDefault: color, colors:ChartBuilder.allColors });

			seriesItem.data('index', i);

			picker.change(ChartBuilder.colorPickerChanged);
 		}
        
        // Render!
		chart.render()

		chart.g = g;
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
		s = s.replace(/[^\w\d]+/gi, '-');

		return s;
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
        // Set field values from JSON blog
		for (var key in d) {
			if(key != 'name' && key != 'created') {
				$('#' + key).val(d[key]);
			}
		}

        // Render the new chart
        ChartBuilder.render();
	},
	getSavedCharts: function() {
        /*
         * Get a list of saved charts from local storage.
         *
         * Will create a sample chart if none exist.
         */
		var charts = [];

		try {
			charts = JSON.parse(localStorage['savedCharts']);
		}
		catch(e) {
            // If no charts exist, store demo chart
            charts = [SAMPLE_CHART];
            localStorage['savedCharts'] = JSON.stringify(charts);
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

        $('#previous_charts').chosen()
            .on('change', function() {
                ChartBuilder.loadChart(d3.select(this.selectedOptions[0]).data()[0])
            });
                
        $('#createImageButton').click(function() {
            if(!$('#download-modal').hasClass('in')) {
                $('#createImageButton p').text('Reset');

                ChartBuilder.createChartImage();
            } else {
                $('#createImageButton p').text('Create Image of Chart');
            }
        })

        $('#right_axis_prefix').keyup(ChartBuilder.render);
        $('#right_axis_suffix').keyup(ChartBuilder.render);
        $('#right_axis_precision').keyup(ChartBuilder.render);
        $('#right_axis_tick_num').change(ChartBuilder.render);
        $('#right_axis_max').keyup(ChartBuilder.render);
        $('#right_axis_min').keyup(ChartBuilder.render);
        $('#right_axis_tick_override').keyup(ChartBuilder.render);
        $('#typePicker').on('change', ChartBuilder.render);		
        $('#chart_title').keyup(ChartBuilder.render);
        $('#csvInput').keyup(ChartBuilder.render); 

        // Clicking download closes the download modal
        $('#downloadImageLink').on('click', function(){
            $('#download-modal').modal('hide');
        });

        // Get the list of saved charts and load the last one
        var charts = ChartBuilder.getSavedCharts();
        charts.reverse();
        ChartBuilder.setSavedChartList(charts); 
        ChartBuilder.loadChart(charts[0]);

        // Hack so chosen doesn't stay open after we load our saved chart
        $('.navbar-brand').focus().blur();
    }
};

WebFont.load({
    monotype: {
        projectId: '65980087-55e2-40ca-85ae-729fca359467',
    },
    active: function(name) {
        $(document).ready(function() {
            ChartBuilder.start();
        });
    }
});
