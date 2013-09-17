//add prepend ability
Element.prototype.prependChild = function(child) { this.insertBefore(child, this.firstChild); };

Date.setLocale('en');

BAR_MARGIN_PER_CHAR = 8

//A default configuration 
//Should change to more d3esque methods e.g. http://bost.ocks.org/mike/chart/
var defaultGneissChartConfig = {
	container: '#chartContainer', //css id of target chart container
	editable: true, // reserved for enabling or dissabling on chart editing
	legend: true, // whether or not there should be a legend
	title: '', // the chart title 
	colors: ['#ff4cf4','#ffb3ff','#e69ce6','#cc87cc','#b373b3','#995f99','#804c80','#665266','#158eff','#99cdff','#9cc2e6','#87abcc','#7394b3','#5f7d99','#466780','#525c66'], //this is the order of colors that the 
    type: 'line',
	padding :{
		top: 40,
		bottom: 40,
		left: 10,
		right: 10
	},
	xAxis: {
		domain: [null, null],
		prefix: '',
		suffix: '',
		ticks: 5
	},
	yAxis: {
        domain: [null, null],
        tickValues: null,
        prefix: '',
        suffix: '', 
        ticks: 4
    },
	series: [
		/*{
			name: 'Apples',
			data: [5.5,10.2,6.1,3.8],
			color: null
		},
		{
			name: 'Oranges',
			data: [23,10,13,7],
			color: null
		}*/
	],
	xAxisRef: []
}

var Gneiss = {
	build: function(config) {
		/*
			Initializes the chart from a config object
		*/
		var g = config
		this.g = config 

		g.$container = $(g.container);
		g.all = this;
		
		g.defaults =  {}
		g.defaults.padding = $.extend({}, config.padding); //change
		
		//append svg to container using svg
		g.chart = d3.select(g.container).append('svg')
			.attr('id','chart')
			.attr('width','100%') //set width to 100%
			.attr('height','100%') //set height to 100%
			
		g.width = g.$container.width() //save the width in pixels
		g.height = g.$container.height() //save the height in pixels
		
		//add rect, use as a background to prevent transparency
		g.chart.append('rect')
			.attr('id','ground')
			.attr('width',g.width)
			.attr('height',g.height)

        g.chart.append('g')
			.attr('class','axis')
			.attr('id','xAxis')

        g.chart.append('g')
            .attr('class', 'axis')
            .attr('id', 'yAxis')

		g.titleLine = g.chart.append('text')
			.attr('id','titleLine')
			.attr('transform','translate(' + g.padding.left + ',25)')
			.text(g.title);
		
        g.seriesContainer = g.chart.append('g')
            .attr('id','seriesContainer');
            
        g.legendItemContainer = g.chart.append('g')
            .attr('id','legendItemContainer');

        g.yAxis.scale = d3.scale.linear();
        g.xAxis.scale = d3.scale.ordinal();
        g.yAxis.axis = d3.svg.axis();
        g.xAxis.axis = d3.svg.axis();
        g.yAxis.line = d3.svg.line();

		this.g = g;
		return this;
	},
	resize: function(){
		/*
			Adjusts the size dependent stored variables
		*/
		var g = this.g
		
        g.width = g.$container.width()
		g.height = g.$container.height()

		d3.select('rect#ground')
			.attr('width',g.width)
			.attr('height',g.height)
			
		this.g = g;
		return this
	},
    calculateChartOffset: function() {
        /*
         * Calculate the left offset for a chart based on y-axis label width.
         */
        var g = this.g;

		g.yAxis.axis.scale(g.yAxis.scale)
			.orient('left')
            .tickValues(g.yAxis.tickValues ? g.yAxis.tickValues : this.helper.exactTicks(g.yAxis.scale.domain(), g.yAxis.ticks))
            .tickSize(0);

        // Find the widest label
        var width = 0;

        g.chart.selectAll('#yAxis text')
            .each(function() {
                width = Math.max(width, this.getBBox().width);
            });

        g.chartOffset = width + 5;

        this.g = g;
    },
    calculateBarOffset: function() {
        /*
         * Calculate the left offset of the bar chart based on label width.
         */
        var g = this.g;

        // Render the lates(0)t xAxis labels
		g.xAxis.axis.scale(g.xAxis.scale)
			.orient('left')
			.ticks(g.xAxis.ticks)
            .tickSize(0);

        // Find the widest label
        var width = 0;

        g.chart.selectAll('#xAxis text')
            .each(function() {
                width = Math.max(width, this.parentNode.getBBox().width);
            });

        g.barOffset = width;

        this.g = g;
    },
	setPadding: function() {
		/*
			calulates and stores the proper amount of extra padding beyond what the user specified (to account for axes, titles, legends, meta)
		*/
		var g = this.g
		
        var padding_top = g.defaults.padding.top;
		var padding_bottom = g.defaults.padding.bottom;
		
		if (!g.legend) {
			padding_top = 5;
		}

		padding_top += (g.title == '' || g.series.length == 1) ? 0 : 25
		
		g.padding.top = padding_top
		g.padding.bottom = padding_bottom
			
		this.g = g
		return this
	},
	setLineMakers: function() {
		var g = this.g;

        g.yAxis.line.y(function(d, j) {
            return d || d === 0 ? g.yAxis.scale(d) : null;
        });

        g.yAxis.line.x(function(d, j) {
            return d || d === 0 ? g.xAxis.scale(g.xAxisRef[j]) : null;
        });

		this.g = g;
        
		return this;
	},
	setYScales: function() {
		/*
			calculates and saves the y-scales from the existing data
		*/
		var g = this.g

		var extremes = [];

		for (var i = g.series.length - 1; i >= 0; i--){
			e = d3.extent(g.series[i].data)
			extremes.push(e[0])
			extremes.push(e[1])
		};

        var ex = d3.extent(extremes);

        if (g.yAxis.domain[0] == null) {
            g.yAxis.domain[0] = ex[0]
        }
        
        if (g.yAxis.domain[1] == null) {
            g.yAxis.domain[1] = ex[1]
        }

        // Column & bar charts must cross 0!
        if (g.type == 'column' || g.type == 'bar') {
            if (g.yAxis.domain[0] > 0) {
                g.yAxis.domain[0] = 0;
            } else if (g.yAxis.domain[1] < 0) {
                g.yAxis.domain[1] = 0;
            }
        }

        // Ensure scale includes all ticks
        if (g.yAxis.tickValues !== null) {
            g.yAxis.domain[0] = Math.min(g.yAxis.domain[0], g.yAxis.tickValues[0]);
            g.yAxis.domain[1] = Math.max(g.yAxis.domain[1], g.yAxis.tickValues[g.yAxis.tickValues.length - 1]);
        }

        g.yAxis.domain = d3.extent(g.yAxis.domain)
        g.yAxis.scale
            .domain(g.yAxis.domain)
            
        if (g.type == 'bar') {
            var leftOffset = 5;
            var rightOffset = (g.yAxis.prefix + g.yAxis.domain[1].toString() + g.yAxis.suffix).length * BAR_MARGIN_PER_CHAR;

            if (g.yAxis.domain[0] < 0) {
                leftOffset += (g.yAxis.prefix + g.yAxis.domain[0].toString() + g.yAxis.suffix).length * BAR_MARGIN_PER_CHAR;
            }

            g.yAxis.scale.range([
                g.padding.left + g.barOffset + leftOffset,
                g.width - (g.padding.right + rightOffset)
            ]).nice()
        } else {
            g.yAxis.scale.range([
                g.height - g.padding.bottom,
                g.padding.top + 10
            ]).nice()
        }
		
		this.g = g;
		return this
	},
	setXScales: function() {
		/*
         * Calculate x-axis scale.
		*/
		var g = this.g
        
        g.xAxis.scale.domain(g.xAxisRef)

        // Calculate extremes of axis
        var maxLength = 0;

        for (var i = g.series.length - 1; i >= 0; i--) {
            maxLength = Math.max(maxLength, g.series[i].data.length)
        };

        this.calculateColumnWidths(maxLength);
        this.calculateBarHeights(maxLength);

		//set the range of the x axis
		var rangeArray = []

		if (g.type == 'column') {
			g.xAxis.scale.rangePoints([
				g.padding.left + g.chartOffset + g.columnGroupWidth,
				g.width - (g.padding.right + g.columnGroupWidth)
			]);
		} else if (g.type == 'bar') {
            g.xAxis.scale.rangePoints([
                g.padding.top + (g.series.length > 1 ? 10 : 0) - g.barGroupHeight,
                g.height - (g.padding.top + g.padding.bottom + g.barGroupHeight) 
            ], 0.5);
        } else {
			g.xAxis.scale.rangePoints([
                g.padding.left + g.chartOffset,
                g.width - (g.padding.right)
            ]);
		};

		this.g = g;
		return this;
		
	},
	setYAxis: function() {
		/*
		*
		* Y-Axis Drawing Section
		*
		*/
		var g = this.g;

        var tickSize = (g.type == 'bar')
            ? g.height - (g.padding.top + g.padding.bottom)
            : -(g.width - (g.padding.left + g.padding.right + g.chartOffset));

        g.yAxis.axis.scale(g.yAxis.scale)
            .orient(g.type == 'bar' ? 'bottom' : 'left')
            .tickSize(tickSize)
            .tickValues(g.yAxis.tickValues ? g.yAxis.tickValues : this.helper.exactTicks(g.yAxis.scale.domain(), g.yAxis.ticks))

        var translate = (g.type == 'bar')
            ? 'translate(0,' + g.padding.top + ')'
            : 'translate(' + g.padding.left + ',0)';
                
        var axisGroup = g.chart.selectAll('#yAxis')
            .attr('transform', translate)
            .call(g.yAxis.axis)

        var translate = (g.type == 'bar')
            ? 'translate(0,0)'
            : 'translate(' + g.chartOffset + ',0)';
                
        g.chart.selectAll('#yAxis .tick')
            .attr('transform', translate)
				
        //adjust label position and add prefix and suffix
        var topAxisLabel = '';
        var minY = Infinity;
        
        axisGroup
            .selectAll('g')
            .each(function(d,j) {
                var y = parseFloat(d3.select(this)
                    .attr('transform')
                        .split(')')[0]
                        .split(',')[1]
                    )
                
                var text = d3.select(this).select('text')

                if(y < minY) {
                    topAxisLabel = text
                    minY = y
                }
                
                if(d == 0) {
                    //if the axisItem represents the zero line
                    //change it's class and make sure there's no decimal
                    d3.select(this).classed('zero', true)
                    text.text('0')
                }
            })

        //add the prefix and suffix to the top most label as appropriate
        topAxisLabel.text(g.yAxis.prefix + topAxisLabel.text() + g.yAxis.suffix)
		
        if (g.type != 'bar') {
            var width = 0;

            g.chart.selectAll('#yAxis text')
                .each(function() {
                    width = Math.max(width, this.getBBox().width);
                });

            g.chart.selectAll('#yAxis text')
                .attr('text-anchor', 'end')
                .each(function() {
                    this.setAttribute('x', width);
                })
        }

		d3.selectAll('#yAxis').each(function(){this.parentNode.prependChild(this);})
		d3.selectAll('#ground').each(function(){this.parentNode.prependChild(this);})

		this.g = g
		return this
	
	},
	setXAxis: function() {
		var g = this.g;

		g.xAxis.axis.scale(g.xAxis.scale)
			.orient(g.type == 'bar' ? 'left' : 'bottom')
			.ticks(g.xAxis.ticks)
            .tickSize(g.type == 'bar' ? 0 : 5);

        var translate = (g.type == 'bar')
            ? 'translate(' + g.padding.left + ',' + (g.padding.top + (g.series.length == 1 ? 15 : 0)) + ')'
            : 'translate(0,' + (g.height - g.padding.bottom) + ')';

		g.chart.selectAll('#xAxis')
			.attr('transform', translate)
			.call(g.xAxis.axis)

        g.chart.selectAll('#xAxis path')
            .attr('transform', 'translate(10,0)');

        if (g.type == 'bar') {
            var width = 0;

            g.chart.selectAll('#xAxis text')
                .each(function() {
                    width = Math.max(width, this.parentNode.getBBox().width);
                });

            g.chart.selectAll('#xAxis text')
                .attr('text-anchor', 'end')
                .each(function() {
                    this.setAttribute('x', width);
                })
        } else {
            g.chart.selectAll('#xAxis text')
                .attr('text-anchor', 'middle')
                .each(function() {
                    var labelWidth = this.parentNode.getBBox().width;
                    var halfLabelWidth = labelWidth / 2;
                    var transform = this.parentNode.getAttribute('transform');
                    var x = Number(transform.split('(')[1].split(',')[0]);

                    // Off right edge of chart
                    if (halfLabelWidth + x > g.width - g.padding.right) {
                        this.setAttribute('text-anchor', 'end');
                        this.setAttribute('x', (g.width - g.padding.right) - x);
                    }
                    // Off left edge of chart
                    else if (x - halfLabelWidth < g.padding.left + g.chartOffset) {
                        this.setAttribute('text-anchor', 'start');
                        this.setAttribute('x', (g.padding.left + g.chartOffset) - x);
                    }
                })
        }
		
		this.g = g;

		return this;
	},
	calculateColumnWidths: function(maxLength) {
        /*
         * Calculate column widths.
         */
		var g = this.g

        var chartWidth = g.width - (g.padding.right + g.padding.left);
		var columnWidth = Math.floor((chartWidth / maxLength) / g.series.length);

		columnWidth = Math.max(columnWidth, 1);
		columnWidth = Math.min(columnWidth, chartWidth * 0.075);
		
		g.columnWidth = columnWidth;
		g.columnGroupWidth = (columnWidth + 1) * g.series.length;
		g.columnGroupShift = columnWidth + 1;

        this.g = g;

		return this;
	},
    calculateBarHeights: function(maxLength) {
        /*
         * Calculate bar heights.
         */
		var g = this.g

        var chartHeight = g.height - (g.padding.top + g.padding.bottom);
		var barHeight = Math.floor((chartHeight / maxLength) / g.series.length);

		barHeight = Math.max(barHeight, 1);
		barHeight = Math.min(barHeight, chartHeight * 0.075);
		
		g.barHeight = barHeight;
		g.barGroupHeight = (barHeight + 1) * g.series.length;
		g.barGroupShift = barHeight + 1;

        this.g = g;

		return this;
    },
	drawSeries: function() {
		/*
		*
		* Series Drawing Section
		*
		*/
		var g = this.g;

        // Clear old elements
        g.seriesContainer.selectAll('g.seriesColumn').remove();
        g.seriesContainer.selectAll('g.seriesBar').remove();
        g.seriesContainer.selectAll('path').remove();
        g.seriesContainer.selectAll('g.seriesScatter').remove();
		
        // Draw new elements
        if (g.type == 'column') {
            this.drawColumns();
        } else if (g.type == 'bar') {
            this.drawBars();
        } else if (g.type == 'line') {
            this.drawLines();
        } else if (g.type == 'scatter') {
            this.drawScatter();
        }
			
		this.g = g;

		return this;
	},
    drawColumns: function() {
        /*
         * Draw series as columns.
         */
        var g = this.g;

		var columnWidth = this.g.columnWidth;
		var columnGroupShift = this.g.columnGroupShift;
		
        var columnGroups = g.seriesContainer.selectAll('g.seriesColumn')
            .data(g.series)
        
        columnGroups.enter()
            .append('g') 
                .attr('class', 'seriesColumn')
                .attr('fill', function(d,i) { return d.color })
                .attr('transform', function(d,i) {
                    return 'translate(' + (i * columnGroupShift - (columnGroupShift * (g.series.length - 1) / 2)) + ',0)' 
                })
            
        columnGroups.exit().remove()
    
        var columnRects = columnGroups.selectAll('rect')
            .data(function(d,i) { return d.data })
        
        columnRects.enter()
            .append('rect')
                .attr('width', columnWidth)
                .attr('height', function(d,i) {
                    return Math.abs(g.yAxis.scale(d) - g.yAxis.scale(Gneiss.helper.columnHeight(d, g.yAxis.scale.domain()))) 
                })
                .attr('x', function(d,i) {
                    return g.xAxis.scale(Gneiss.g.xAxisRef[i]) - (columnWidth / 2)
                })
                .attr('y', function(d,i) {
                    if (g.yAxis.scale(d) - g.yAxis.scale(Gneiss.helper.columnHeight(d, g.yAxis.scale.domain())) >= 0) {
                        return g.yAxis.scale(Gneiss.helper.columnHeight(d,g.yAxis.scale.domain()));
                    } else {
                        return g.yAxis.scale(d);
                    }
                })
    
        columnRects.exit().remove()

        this.g = g;
    },
    drawBars: function() {
        /*
         * Draw series as bars.
         */
        var g = this.g;

        var barHeight = this.g.barHeight;
		var barGroupShift = this.g.barGroupShift;

        var domain = g.yAxis.scale.domain();

        // Helper
        function barBase(d) {
            // Value greater than 0 and min greater than 0?
			if(d > 0 && domain[0] > 0) {
                // Start at min
				return domain[0]
			}
            // Value less than 0 and min less than 0?
            // Start at min
			else if (d < 0 && domain[1] < 0) {
				return domain[1]
			}
			
            // Start at 0
			return 0
        }

        var barSeries = g.seriesContainer.selectAll('g.seriesBar')
            .data(g.series)
        
        barSeries.enter()
            .append('g') 
                .attr('class', 'seriesBar')
                .attr('fill', function(d,i) { return d.color })
                .attr('transform', function(d,i) {
                    return 'translate(0,' + (g.padding.top + (i * barGroupShift) - barHeight / 2) + ')';
                })
            
        barSeries.exit().remove()
    
        var barGroups = barSeries.selectAll('g')
            .data(function(d, i) { return d.data; })
            .enter()
            .append('g')
            .attr('class', 'bar')
            .attr('transform', function(d, i) {
                var x = null;
                var y = g.xAxis.scale(i);

                if (d >= 0) {
                    x = g.yAxis.scale(barBase(d));
                } else {
                    x = g.yAxis.scale(d);
                }

                return 'translate(' + x + ',' + y + ')';
            });

        var barRects = barGroups.append('rect')
            .attr('width', function(d, i) {
                return Math.abs(g.yAxis.scale(d) - g.yAxis.scale(barBase(d)));
            })
            .attr('height', barHeight)

        var barLabels = barGroups.append('text')
            .text(function(d, i) { return g.yAxis.prefix + d + g.yAxis.suffix; } )
			.attr('text-anchor', function(d, i) { return d <= 0 ? 'end' : 'start' })
            .attr('fill', '#333')
            .attr('x', function(d, i) {
                if (d >= 0) {
                    return this.parentNode.getBBox().width + 5;
                } else {
                    return -5;
                }
            })
            .attr('y', function(d, i) {
                var parentHeight = barHeight;
                var thisHeight = this.getBBox().height;

                return thisHeight + (parentHeight - thisHeight) / 4;
            });

        this.g = g;

    },
    drawLines: function() {
        /*
         * Draw series as a line chart.
         */
        var g = this.g;

        var lineSeries = g.seriesContainer.selectAll('path')
            .data(g.series)
            .attr('stroke',function(d,i){return d.color});

        lineSeries.enter()
            .append('path')
                .attr('d',function(d,j) { pathString = g.yAxis.line(d.data).split('L0,0L').join('M0,0L'); return pathString;})
                .attr('class','seriesLine')
                .attr('stroke',function(d,i){return d.color})
                .attr('stroke-width',3)
                .attr('stroke-linejoin','round')
                .attr('stroke-linecap','round')
                .attr('fill','none');

        lineSeries.exit().remove()

        this.g = g;
    },
    drawScatter: function() {
        /*
         * Draw series as a scatter plot.
         */
        var g = this.g;

        var scatterGroups = g.seriesContainer.selectAll('g.seriesScatter')
            .data(g.series)
            .attr('fill', function(d,i){return d.color})
        
        scatterGroups.enter()
            .append('g')
            .attr('class','seriesScatter')
            .attr('fill',function(d,i){return d.color})
        
        scatterGroups.exit().remove()
        
        scatterDots = scatterGroups
            .selectAll('circle')
            .data(function(d){return d.data})
            
        scatterDots.enter()
                .append('circle')
                .attr('r',4)
                .attr('stroke','#fff')
                .attr('stroke-width','1')
                .attr('transform',function(d,i){
                    return 'translate('+g.xAxis.scale(Gneiss.g.xAxisRef[i]) + ',' + g.yAxis.scale(d) + ')'
                    })

        this.g = g;
    },
	drawLegend: function() {
		var g = this.g;
		var legendItemY;
		
		//remove current legends
		g.legendItemContainer.selectAll('g.legendItem').remove()
		
        //add legend to chart
        var legendGroups = g.legendItemContainer.selectAll('g')
            .data(g.series);

        var legItems = 	legendGroups.enter()
            .append('g')
            .attr('class', 'legendItem')
            .attr('transform', function(d,i) {
                return 'translate(' + g.padding.left + ',' + (g.padding.top - 25) + ')';
            });

        legendGroups.exit().remove()

        var legLabels = legItems.append('text')
                .filter(function(){return g.series.length > 1})
                .attr('class','legendLabel')
                .attr('x',15)
                .attr('y',10)
                .text(function(d,i){return d.name});
        
        //if there is more than one line
        if(g.series.length > 1) {
            legItems.append('rect')
                .attr('width',10)
                .attr('height',10)
                .attr('x',0)
                .attr('y',0)
                .attr('fill', function(d,i){return d.color})

            legendGroups.filter(function(d){return d != g.series[0]})
                .transition()
                .duration(50)
                .delay(function(d,i){return i * 50 + 50})
                .attr('transform',function(d,i) {
                    //label isn't for the first series
                    var prev = d3.select(legendGroups[0][i])
                    var prevWidth = parseFloat(prev.node().getBBox().width)
                    var prevCoords = g.all.helper.transformCoordOf(prev)

                    var cur = d3.select(this)
                    var curWidth = parseFloat(cur.node().getBBox().width)
                    var curCoords = g.all.helper.transformCoordOf(cur)

                    legendItemY = prevCoords.y;
                    var x = prevCoords.x + prevWidth + 15
                    if(x + curWidth > g.width) {
                        x = g.padding.left
                        legendItemY += 15;						
                    }
                    return 'translate('+x+','+legendItemY+')'
            })

			this.g = g;	
		}
		
		this.g = g
		return this
	},
	redraw: function() {
		/*
			Redraw the chart
		*/
		var g = this.g

        // Ensure colors are set for all series
        for (var i = 0; i < g.series.length; i++) {
            if (!g.series[i].color) {
                g.series[i].color = g.colors[i];
            }
        };
		
        this.calculateChartOffset();
        this.calculateBarOffset();

        this.setPadding();
		this.setYScales();
        this.setXScales();

        this.setLineMakers();

		this.setYAxis();
		this.setXAxis();

		this.drawSeries();
        this.drawLegend();

		return this
	},
	helper: {
		columnHeight: function(d, domain) {
			if(d > 0 && domain[0] > 0) {
				return domain[0]
			}
			else if (d < 0 && domain[1] < 0) {
				return domain[1]
			}
			
			return 0
		},
		exactTicks: function(domain,numticks) {
			numticks -= 1;
			var ticks = [];
			var delta = domain[1] - domain[0];
			
			for (var i=0; i < numticks; i++) {
				ticks.push(domain[0] + (delta/numticks)*i);
			};
			ticks.push(domain[1])
			
			if(domain[1]*domain[0] < 0) {
				//if the domain crosses zero, make sure there is a zero line
				var hasZero = false;
				for (var i = ticks.length - 1; i >= 0; i--){
					//check if there is already a zero line
					if(ticks[i] == 0) {
						hasZero = true;
					}
				};
				if(!hasZero) {
					ticks.push(0)
				}
			}
			
			return ticks;
		},
		transformCoordOf: function(elem){
			var trans = elem.attr('transform').split(',')
			return {x:parseFloat(trans[0].split('(')[1]) , y:parseFloat(trans[1].split(')')[0])}
		}
	},
	q: {}
}
